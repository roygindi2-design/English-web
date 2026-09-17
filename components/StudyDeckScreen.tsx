'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import type { TrackDestination } from '@/lib/core/studyTracks';
import CardDeck from '@/components/CardDeck';
import CardSkeleton from '@/components/CardSkeleton';
import StudyEmptyState from '@/components/StudyEmptyState';
import { ApiUnreachableError, apiGet, apiPost } from '@/lib/api/client';
import { isSentenceCard, type DeckCard, type DeckName, type QueueCardInput } from '@/lib/core/deck';
import { FAILURE_HE, RETRY_HE, SCHEMA_MISSING_HE } from '@/lib/core/failure';
import { SIGN_IN_AGAIN_HE, failureExit, isRetryable } from '@/lib/core/failureExit';
import type { CardGrade } from '@/lib/core/flashcard';
import { MAX_ELAPSED_MS } from '@/lib/core/reviewRequest';
import type { SentenceItem } from '@/lib/core/sentenceItem';

/**
 * The screen that owns the network for `/study` — T-065 part ב׳, plan
 * `2026-08-13-study-queue.md` task 6.
 *
 * `<CardDeck>` deliberately fetches nothing: it is renderable with no Supabase env at all,
 * which is what lets `/dev/deck` measure its geometry (task 8). Everything the deck cannot
 * know — which endpoint a grade goes to, what a 503 means, what the learner reads when the
 * request never left the phone — lives here.
 *
 * Four decisions here are measurements, not taste:
 *
 * 1. **The endpoint is chosen by the deck, and that choice IS D-033.** `unknown` grades go
 *    to `POST /api/practice`, which moves two counters and ⛔ never `next_review_at`; `due`
 *    grades go to `POST /api/review`, which is the only route in the product that
 *    schedules. The deck keeps «תרגול — לא משנה את מועד החזרה» on screen the entire time a
 *    learner is drilling. Crossing these two wires would not be a typo — it would make the
 *    product's own on-screen promise false, and `StudyDeckScreen.test.ts` measures the
 *    branch by brace containment rather than by proximity for exactly that reason.
 *
 * 2. **A grade that did not reach the server RE-THROWS.** `<CardDeck>` keeps a card in the
 *    DOM exactly when `onGraded` rejects. Catching the failure here and returning quietly
 *    would slide the card off screen as if it had been saved, and the learner would not see
 *    that word again today — ⛔ a swallowed grade is a lost answer. The message belongs
 *    here and not in the deck because only this layer knows whether it was the network
 *    (`ApiUnreachableError`) or the server.
 *
 * 3. **`schema_missing` gets its own sentence, ⛔ never the empty state.** «אין כרטיסיות»
 *    tells a learner they are done for today. An empty bank is a fault on our side, and
 *    reporting it as a finished session would send them away happy from a broken product.
 *    Same reasoning in the other direction: a genuinely empty queue is 200 with zero cards
 *    and ⛔ is not an error (the contract in `docs/api-contract.md` fixes both).
 *
 * 4. **Loading is a skeleton in the shape of a card and ⛔ not a spinner** (constitution
 *    § 5). A spinner says "something is happening"; a skeleton says what is about to
 *    arrive, and it does not shift the layout when it does.
 *
 * ⚠️ **`elapsed_ms` is an approximation, and it is labelled as one.** It is measured from
 * the previous grade (or from the moment the queue landed, for the first card), ⛔ not from
 * the moment the card entered the viewport — `<CardDeck>` does not report that today, and
 * with one card per screen and an immediate scroll after each grade the two differ by the
 * scroll. Recorded as TD-28 in `plan/30-architecture.md` rather than left as a silent
 * assumption inside a telemetry field D-010 depends on.
 */

const HEADING_HE = 'מנת היום';
const PRACTICE_HEADING_HE = 'לא ידעתי';
/** T-155 · `36 § 5` — שם החפיסה כלשונו במפרט. ⛔ לא «מנת היום»: זו חפיסה אחרת. */
const LEVEL_HEADING_HE = 'סינון מילים';
/** T-066 · D-169 — the fourth deck, by the label `DeckSelector.tsx` already carries. */
const SENTENCES_HEADING_HE = 'משפטים';
/**
 * One heading per deck, as a RECORD and ⛔ not a ternary chain: a fifth deck would fail to
 * compile here instead of silently inheriting the last branch's name (the C-0318 defect —
 * `level` once read «לא ידעתי» from a binary expression).
 */
const HEADINGS: Record<DeckName, string> = {
  due: HEADING_HE,
  unknown: PRACTICE_HEADING_HE,
  level: LEVEL_HEADING_HE,
  sentences: SENTENCES_HEADING_HE,
};
const START_NEW_HE = 'אין מה לחזור היום — התחל מילים חדשות';
const BACK_TO_CARDS_HE = 'חזרה לכרטיסיות';

type QueueResponse =
  | {
      readonly ok: true;
      readonly deck: DeckName;
      readonly total: number;
      /** The three word decks answer `cards`… */
      readonly cards?: readonly QueueCardInput[];
      /** …and `sentences` answers `items` (docs/api-contract.md) — T-066 · D-169. */
      readonly items?: readonly SentenceItem[];
      /**
       * `T-400` — «כמה מילים ברמה טרם נראו», on the `level` deck ALONE and only when the
       * route could count it honestly. ⛔ Optional on purpose: the other three decks are not
       * defined by a level, and a ceiling or a failed read omits the field rather than
       * sending a number that looks right (`readLevelUnseen`).
       */
      readonly unseen?: number;
    }
  | { readonly ok: false; readonly code: string };

type GradeResponse = { readonly ok: boolean };

type ScreenState =
  | { readonly kind: 'loading' }
  | {
      readonly kind: 'cards';
      readonly cards: readonly DeckCard[];
      /** `T-400` — carried beside the cards because it arrived in the SAME answer. */
      readonly unseenInLevel?: number;
    }
  | { readonly kind: 'empty' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

/**
 * The one function in the product that decides where a grade goes. Kept at module scope and
 * out of the component so the branch is a flat, readable pair of calls rather than a
 * closure that a later reader has to unwrap before they can check D-033 holds.
 *
 * It throws on every failure — including a server that answered `{ok:false}` — because its
 * caller is `<CardDeck>`'s `onGraded`, whose whole contract is that a rejection keeps the
 * card on screen.
 */
async function sendGrade(
  deck: DeckName,
  card: DeckCard,
  grade: CardGrade,
  elapsedMs: number,
): Promise<void> {
  // T-155 · D-089 — `level` grades travel the SAME wire as `unknown`, and that is
  // T-155ⓒ verbatim: «⛔ אפס כתיבה ל-SM-2 — `attempts` בלבד». ⛔ The condition is written
  // as an explicit list and ⛔ not as `deck !== 'due'`: a fourth deck added later would
  // inherit the practice wire silently, and which endpoint a deck grades through is the
  // one decision on this screen that D-033 makes load-bearing.
  // T-066 · D-156 ⓑ · § 4.2ו — `sentences` is that fourth deck, and it is listed HERE on
  // purpose: «`לא ידעתי` · `משפטים` ⇒ `POST /api/practice` — `attempts`/`correct_attempts`
  // בלבד». ⛔ Never `/api/review` — a cloze item is practice, not a scheduled exposure.
  if (deck === 'unknown' || deck === 'level' || deck === 'sentences') {
    // D-033: two counters, ⛔ no scheduling fields. The route rejects a word with no
    // progress row with 404 rather than inventing one, so a failure here is real.
    // ⚠️ **T-225 (D-142, closes F-140):** for `level` a missing row is the COMMON case —
    // the route now opens one (⛔ zero SM-2), so the write path is defined and the
    // `סינון מילים` tile is unlocked.
    const practice = await apiPost<GradeResponse>('/api/practice', {
      word_id: isSentenceCard(card) ? card.wordId : card.word_id,
      grade,
      // T-225 — ⛔ המשתנה, ⛔ ולא מחרוזת: אותה קריאה משרתת `unknown` ו-`level`, ורק
      // `level` זכאית לפתוח שורה. מחרוזת קבועה כאן הייתה נותנת ל-`unknown` את
      // הזכות הזאת בשקט.
      deck,
    });
    if (!practice.ok) throw new Error('practice rejected');
    return;
  }

  // Only `due` reaches here, and `due` never carries a sentence item — the route serves
  // `items` for `sentences` alone. The guard makes that a checked fact, ⛔ not a cast.
  if (isSentenceCard(card)) throw new Error('a sentence item grades through practice only');
  const review = await apiPost<GradeResponse>('/api/review', {
    word_id: card.word_id,
    grade,
    direction: card.direction,
    elapsed_ms: elapsedMs,
  });
  if (!review.ok) throw new Error('review rejected');
}

/**
 * `elapsed_ms` as the route will accept it: a non-negative INTEGER at or below the ceiling.
 * `Math.round` and not a raw difference because `checkReviewPayload` rejects a fractional
 * value with 400, and `Math.min` against the imported `MAX_ELAPSED_MS` because it rejects
 * anything above the ceiling too — ⛔ we do not send a value we know the server refuses,
 * and ⛔ we do not re-type the number here where it could drift from the route's copy.
 */
function boundElapsed(ms: number): number {
  if (!Number.isFinite(ms) || ms < 0) return 0;
  return Math.min(Math.round(ms), MAX_ELAPSED_MS);
}

/**
 * `T-408` — **הדרך חזרה היא של מי שפתח, ⛔ ולא של המסך.** עד היום היציאה
 * מהחפיסה הייתה `’/cards’` קבועה ⵒ לומד שנכנס מנתיב המודולים ב-`’/studies’`
 * היה נזרק ללשונית אחרת — בדיוק «מסך שאין ממנו דרך חזרה למסלול» ש-`T-408`
 * סוגרת, ובדיוק מה ש-`D-065` אוסר. ⛔ **והיעד ⛔ אינו מגיע מהכתובת כמות שהיא:**
 * `moduleReturnDestination` בונה אותו מעוגן שעבר שער, ⵒ ⛔ אי-אפשר להזריק לכאן כתובת.
 *
 * `band` — `T-408` · הרמה שהמודול הצהיר. ⛔ רלוונטית ל-`deck === 'level'` בלבד,
 * ו-`undefined` משאיר את הנתיב בדיוק כפי שהיה: הרמה מגיעה מ-`profiles.current_level`.
 */
export default function StudyDeckScreen({
  deck,
  band,
  returnTo,
}: {
  readonly deck: DeckName;
  readonly band?: string;
  readonly returnTo?: TrackDestination;
}) {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [gradeError, setGradeError] = useState('');
  const shownAt = useRef(0);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      // ⛔ `URLSearchParams` ו⛔ לא שרשור ידני: ערך שהגיע מכתובת נכנס לכאן
      // מקודד, ⛔ ולא כמות שהוא. השרת בודק אותו בכל מקרה (`parseLevel`).
      const query = new URLSearchParams({ deck });
      if (band !== undefined) query.set('band', band);
      const body = await apiGet<QueueResponse>(`/api/study/queue?${query.toString()}`);
      shownAt.current = Date.now();
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      // T-066 — `sentences` answers `items`, the word decks answer `cards`; both scroll in the
      // same `<CardDeck>`. ⛔ `??` and not a deck check: the SHAPE of the response is the
      // contract, and a deck that answered neither is an empty deck, ⛔ not a crash.
      const list: readonly DeckCard[] = body.items ?? body.cards ?? [];
      setState(
        list.length === 0
          ? { kind: 'empty' }
          : // `T-400` — ⛔ `typeof` and ⛔ not a truthiness check: `unseen: 0` is a real
            // answer («⛔ no word in this level is still unseen»), and `??`/`||` here would
            // drop exactly the one count the learner earned.
            {
              kind: 'cards',
              cards: list,
              ...(typeof body.unseen === 'number' ? { unseenInLevel: body.unseen } : {}),
            },
      );
    } catch {
      // `apiGet` only rejects when the answer never arrived or was not JSON — either way
      // there is no code to act on, so this is the generic failure and not a lie about why.
      setState({ kind: 'error' });
    }
  }, [deck, band]);

  useEffect(() => {
    void load();
  }, [load]);

  const onGraded = useCallback(
    async (wordId: string, grade: CardGrade) => {
      if (state.kind !== 'cards') return;
      // A sentence item is looked up by its WORD — two stems of one word grade the same row.
      const card = state.cards.find(
        (candidate) => (isSentenceCard(candidate) ? candidate.wordId : candidate.word_id) === wordId,
      );
      if (card === undefined) return;
      try {
        await sendGrade(deck, card, grade, boundElapsed(Date.now() - shownAt.current));
        shownAt.current = Date.now();
        setGradeError('');
      } catch (error) {
        setGradeError(
          error instanceof ApiUnreachableError ? FAILURE_HE.offline : FAILURE_HE.save,
        );
        // Re-thrown on purpose: this is the signal that keeps the card in the deck.
        throw error;
      }
    },
    [deck, state],
  );

  if (state.kind === 'cards') {
    return (
      // T-087 · § 4.2ח ⓒ → T-268 — the way out of the deck is WRITTEN, and it is the deck's.
      //
      // Measured C-0490 (07/09) on `/study?deck=level` at 375×780 with the queue mocked: the
      // T-087 close — `<Link absolute start-2 top-2>` with `<CloseIcon>` alone — sat ON
      // `<CardDeck>`'s own header row: icon box x=303..347 · y=60..104 against the notice
      // «תרגול — לא משנה את מועד החזרה» at x=140..355 · y=60..80, its glyph straddling the
      // header border at y=89. That is the broken card view Roy reported (T-268 ⓑ), and
      // `/dev/deck` never rendered the close, so no harness run had ever seen it.
      //
      // Two constraints survive from T-087 and both are kept:
      // 1. ⛔ No row inside this `<section>` before `<CardDeck>` — it computes
      //    `h-[calc(100dvh-10rem)]` on the root layout's fixed chrome (CardDeck.tsx), and a
      //    sibling row here pushes the grade buttons under the fold (T-086). ⇒ the exit is
      //    a slot `<CardDeck>` renders INSIDE its own column, absorbed by its scroller.
      // 2. ⛔ No `data-primary-action` on the exit — `/study` is a FLOW_ROUTE and
      //    `verify-mobile.mjs` counts exactly one per screen (F-027).
      // The wording is the product's own (D-187 §ג׳.1 · `LevelScan.tsx`): `חזרה ל<יעד>`,
      // the constant this file already prints on the empty practice deck.
      <section>
        {gradeError !== '' && (
          // Above the deck and ⛔ not a toast: the card the grade belongs to is still on
          // screen and still gradable, so the message has to stay until the retry lands.
          <p role="status" className="px-1 pb-2 text-base text-danger">
            {gradeError}
          </p>
        )}
        {/* ⛔ No <ActionBar> in this state: it is `fixed` to the bottom edge and would sit
            directly on top of the two grade buttons — the only controls this screen exists
            for. The way forward here IS grading. */}
        <CardDeck
          deck={deck}
          cards={state.cards}
          onGraded={onGraded}
          exit={returnTo ?? { href: '/cards', labelHe: BACK_TO_CARDS_HE }}
          // `T-400` · `F-272` — ⛔ no second request and ⛔ no lifted state: the number came
          // down with the queue this screen already asked for (`§ 4.2ז` forbids the second
          // `/api/levels/summary` read, and `<LevelMapScreen>` is a DIFFERENT screen).
          unseenInLevel={state.unseenInLevel}
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">
        {/* ⛔ ארבע חפיסות, ארבע כותרות — רשומה ⛔ ולא שרשרת תנאים. קודם לכן הביטוי היה
            בינארי, ולכן `level` היה מקבל «לא ידעתי» — שם של חפיסה אחרת על מסך שהלומד
            פתח בשם אחר (C-0318). `Record<DeckName, string>` הופך חפיסה חמישית בלי כותרת
            לשגיאת הידור. */}
        {HEADINGS[deck]}
      </h1>

      {/* The shape of what is coming, ⛔ not a spinner (constitution § 5). The markup lives
          in its own file so `/dev/deck/skeleton` can hold this state still while the harness
          measures it — this screen fetches on mount and would not stay in it. */}
      {state.kind === 'loading' && <CardSkeleton />}

      {state.kind === 'schema_missing' && (
        <p className="text-lg leading-relaxed text-ink">{SCHEMA_MISSING_HE}</p>
      )}

      {state.kind === 'error' && <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>}

      {state.kind === 'session_expired' && (
        <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
      )}

      {state.kind === 'empty' && <StudyEmptyState />}

      {/* 🟠 F-082 · `layout` is a MEASUREMENT and ⛔ not a style: only the
          `error` branch below puts two controls on two rows («נסה שוב» plus the
          way out that T-124 added), and that bar measures 135px against a 77px
          single-row one. The document reservation in `app/globals.css` keys off
          this value; without it the /sources link sits under the bar. */}
      <ActionBar layout={state.kind === 'error' ? 'stacked' : 'single'}>
        {state.kind === 'session_expired' ? (
          // A plain <a> and ⛔ not <Link>: the session is gone, so the next request has to
          // reach the server and be allowed to redirect — the client router may answer from
          // its cache. Same reasoning as the retry in <MeScreen>.
          <a
            href={failureExit('session_expired').href}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {SIGN_IN_AGAIN_HE}
          </a>
        ) : state.kind === 'schema_missing' ? (
          // T-124 · D-065 · ⓒ במשימה: ⛔ אין «נסה שוב» כאן. המיגרציה לא תרוץ
          // מפני שהלומד לחץ על כפתור, ולכן הכפתור ההוא לעולם לא היה מצליח —
          // הוא היה ענף ברירת המחדל שתפס גם את המצב הזה. יש ניווט ללשונית
          // שכן עובדת, ⛔ ולא ניסיון חוזר על תקלה שאינה חולפת מעצמה.
          <a
            href={failureExit('schema_missing').href}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {failureExit('schema_missing').labelHe}
          </a>
        ) : state.kind === 'empty' ? (
          // ⚠️ Deck-dependent, and the deviation is reported in the plan: the action the
          // task names («…התחל מילים חדשות») is the way out of an empty DUE deck. On the
          // practice deck it would be a link to the screen the learner is already looking
          // at, which is the dead end F-027 was opened for. The practice deck reuses the
          // deck's own existing way out rather than inventing a second wording.
          <Link
            // `T-408`ⓑ — הסיום מחזיר **לנתיב**, כשמשם הלומד הגיע. ⛔ הסדר
            // קודם לכל השאר: לומד שנכנס ממודול ⛔ אינו רוצה «התחל מילים
            // חדשות» ו⛔ אינו רוצה את מפת הרמות — הוא רוצה חזרה למסלול.
            href={returnTo?.href ?? (deck === 'due' ? '/study?deck=unknown' : '/cards')}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-base font-semibold text-brand-on active:opacity-90"
          >
            {returnTo?.labelHe ?? (deck === 'due' ? START_NEW_HE : BACK_TO_CARDS_HE)}
          </Link>
        ) : (
          // ⚠️ סטייה מוצהרת מנוסח הצעד בתוכנית, והכרעה 4 של אותה תוכנית היא
          // שכפתה אותה: «נסה שוב» לבדו הוא מסך ללא דרך החוצה כשהתקלה מתמידה.
          // ⇒ במצב `error` נוספת יציאה לצד הניסיון החוזר. ⛔ היא ⛔ אינה נושאת
          // `data-primary-action` — `/study` הוא FLOW_ROUTE, ו-`check:mobile`
          // סופר בדיוק סימון אחד למסך (F-027).
          <div className="flex flex-col gap-2">
            {isRetryable('unavailable') ? (
              <button
                type="button"
                onClick={() => void load()}
                data-primary-action="true"
                className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
              >
                {RETRY_HE}
              </button>
            ) : null}
            {state.kind === 'error' ? (
              <a
                href={failureExit('unavailable').href}
                className="flex w-full min-h-touch items-center justify-center rounded-lg px-5 py-3 text-base text-ink-muted active:opacity-90"
              >
                {failureExit('unavailable').labelHe}
              </a>
            ) : null}
          </div>
        )}
      </ActionBar>
    </section>
  );
}
