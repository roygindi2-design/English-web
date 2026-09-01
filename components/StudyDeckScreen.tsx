'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import ActionBar from '@/components/ActionBar';
import CardDeck from '@/components/CardDeck';
import CardSkeleton from '@/components/CardSkeleton';
import CloseIcon from '@/components/CloseIcon';
import StudyEmptyState from '@/components/StudyEmptyState';
import { ApiUnreachableError, apiGet, apiPost } from '@/lib/api/client';
import type { DeckName, QueueCardInput } from '@/lib/core/deck';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit, isRetryable } from '@/lib/core/failureExit';
import type { CardGrade } from '@/lib/core/flashcard';
import { MAX_ELAPSED_MS } from '@/lib/core/reviewRequest';

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
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const START_NEW_HE = 'אין מה לחזור היום — התחל מילים חדשות';
const BACK_TO_CARDS_HE = 'חזרה לכרטיסיות';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';

type QueueResponse =
  | {
      readonly ok: true;
      readonly deck: DeckName;
      readonly total: number;
      readonly cards: readonly QueueCardInput[];
    }
  | { readonly ok: false; readonly code: string };

type GradeResponse = { readonly ok: boolean };

type ScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'cards'; readonly cards: readonly QueueCardInput[] }
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
  card: QueueCardInput,
  grade: CardGrade,
  elapsedMs: number,
): Promise<void> {
  // T-155 · D-089 — `level` grades travel the SAME wire as `unknown`, and that is
  // T-155ⓒ verbatim: «⛔ אפס כתיבה ל-SM-2 — `attempts` בלבד». ⛔ The condition is written
  // as an explicit list and ⛔ not as `deck !== 'due'`: a fourth deck added later would
  // inherit the practice wire silently, and which endpoint a deck grades through is the
  // one decision on this screen that D-033 makes load-bearing.
  if (deck === 'unknown' || deck === 'level') {
    // D-033: two counters, ⛔ no scheduling fields. The route rejects a word with no
    // progress row with 404 rather than inventing one, so a failure here is real.
    // ⚠️ **T-225 (D-142, closes F-140):** for `level` a missing row is the COMMON case —
    // the route now opens one (⛔ zero SM-2), so the write path is defined and the
    // `סינון מילים` tile is unlocked.
    const practice = await apiPost<GradeResponse>('/api/practice', {
      word_id: card.word_id,
      grade,
      // T-225 — ⛔ המשתנה, ⛔ ולא מחרוזת: אותה קריאה משרתת `unknown` ו-`level`, ורק
      // `level` זכאית לפתוח שורה. מחרוזת קבועה כאן הייתה נותנת ל-`unknown` את
      // הזכות הזאת בשקט.
      deck,
    });
    if (!practice.ok) throw new Error('practice rejected');
    return;
  }

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

export default function StudyDeckScreen({ deck }: { readonly deck: DeckName }) {
  const [state, setState] = useState<ScreenState>({ kind: 'loading' });
  const [gradeError, setGradeError] = useState('');
  const shownAt = useRef(0);

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<QueueResponse>(`/api/study/queue?deck=${deck}`);
      shownAt.current = Date.now();
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      setState(body.cards.length === 0 ? { kind: 'empty' } : { kind: 'cards', cards: body.cards });
    } catch {
      // `apiGet` only rejects when the answer never arrived or was not JSON — either way
      // there is no code to act on, so this is the generic failure and not a lie about why.
      setState({ kind: 'error' });
    }
  }, [deck]);

  useEffect(() => {
    void load();
  }, [load]);

  const onGraded = useCallback(
    async (wordId: string, grade: CardGrade) => {
      if (state.kind !== 'cards') return;
      const card = state.cards.find((candidate) => candidate.word_id === wordId);
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
      // T-087 · § 4.2ח ⓒ — פעולת סגירה מעוגנת למעלה.
      //
      // שלוש הכרעות מדידות:
      // 1. `absolute` על `<section>` `relative` ⛔ ⛔ תוספת שורה בתוך `<CardDeck>`:
      //    `<CardDeck>` מחשב `h-[calc(100dvh-10rem)]` על chrome קבוע של `app/layout.tsx`
      //    (CardDeck.tsx:130-148), וכל תוספת גובה כאן שוברת את החישוב הזה בשקט
      //    ומפילה את T-086 (בדיקות ההארנס ב-`/dev/deck`).
      // 2. `start-2` וְ⛔ ⛔ `right-2` — CSS logical, נפתר תחת RTL לפינה הימנית העליונה
      //    (בעברית) ולפינה השמאלית העליונה בכיוון LTR.
      // 3. `aria-label="סגור"` על הקישור — `<CloseIcon>` נושא `aria-hidden` (שם נגיש
      //    כפול היה גורם לקורא-מסך להקריא «סגור סגור»). ⛔ ⛔ `data-primary-action`
      //    על הסגירה — /study הוא FLOW_ROUTE וסלקטור `main [data-primary-action]`
      //    דורש **סימון אחד בדיוק** (verify-mobile.mjs). הענף `cards` היום
      //    ⛔ ⛔ נושא סימון כזה (הכרעת T-065), והסגירה ⛔ ⛔ הופכת אותו לסימון־ראשי.
      <section className="relative">
        <Link
          href="/cards"
          data-close
          aria-label="סגור"
          className="absolute start-2 top-2 z-10 flex min-h-touch min-w-touch items-center justify-center rounded-lg text-ink active:opacity-90"
        >
          <CloseIcon />
        </Link>
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
        <CardDeck deck={deck} cards={state.cards} onGraded={onGraded} />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">
        {/* ⛔ שלוש חפיסות, שלוש כותרות. קודם לכן הביטוי היה בינארי, ולכן `level`
            היה מקבל «לא ידעתי» — שם של חפיסה אחרת על מסך שהלומד פתח בשם אחר. */}
        {deck === 'due' ? HEADING_HE : deck === 'level' ? LEVEL_HEADING_HE : PRACTICE_HEADING_HE}
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
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
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
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
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
            href={deck === 'due' ? '/study?deck=unknown' : '/cards'}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-base font-semibold text-brand-on active:opacity-90"
          >
            {deck === 'due' ? START_NEW_HE : BACK_TO_CARDS_HE}
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
