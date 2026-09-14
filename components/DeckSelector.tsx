'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';
import {
  DECK_ALL_EMPTY_ACTION_HE,
  DECK_ALL_EMPTY_BODY_HE,
  DECK_ALL_EMPTY_HREF,
  DECK_ALL_EMPTY_TITLE_HE,
  allTilesDead,
} from '@/lib/core/deckTiles';

/**
 * The «דרכים לתרגל» block of the כרטיסיות tab — the deck selector, T-065 part ג׳, plan
 * `2026-08-13-study-queue.md` task 7.
 *
 * ⛔ This component is NOT the screen. Since T-081 the screen is `<LevelMapScreen>` (§ 4.2ז),
 * and this block is its fourth row. It therefore carries ⛔ no `<h1>` of its own — the screen
 * owns the single `<h1>` («הרמה שלך») and hands this block an `<h2>`. Two `<h1>` on one screen
 * break the heading hierarchy for a screen reader.
 *
 * It replaces the shared empty state this screen used to render. That state was honest
 * while `/study` had no queue behind it; now that `GET /api/study/queue` answers, «אין
 * כרטיסיות» on this tab would be a claim about the whole product made from no measurement
 * at all — this screen never read a deck. The tab's job in § 4.2ו is to say what there is
 * to study and how much of it, and that is a number per deck.
 *
 * `/dev/tabs/cards` renders THIS component and not a copy of its markup: `/cards` is in
 * `PROTECTED_SCREENS` (proxy.ts) and answers 307 to `/login?expired=1` without Supabase
 * env, so the harness would otherwise measure the login screen while printing "ok /cards"
 * — F-027 cause 1, measured live in C-0075. A fixture that drifts from the screen it stands
 * for is cause 2.
 *
 * Four decisions here are the task's rules, not taste:
 *
 * 1. **`limit=1`, and the number read is `total`.** The contract fixes `total` as the count
 *    BEFORE the slice to `limit` (`docs/api-contract.md`), which is the only reason one row
 *    is enough — ⛔ a whole deck is never pulled for a number. Reading `cards.length`
 *    instead would print "1" for every non-empty deck: always wrong, never obviously wrong.
 *
 * 2. **Three cards, always three.** § 4.2ו: an empty deck is DISABLED WITH ITS NUMBER and
 *    ⛔ never hidden. A selector that grows and shrinks leaves a learner unable to tell
 *    whether the product changed or they did, and «לא ידעתי · 0» is itself information —
 *    it says the drill deck is clear.
 *
 * 3. **The sentences deck OPENS — `T-199ⓐ` · `D-169`.** It goes through `toEntry` like the
 *    other three: an empty band is DISABLED WITH ITS NUMBER (§ 4.2ו), ⛔ never locked.
 *
 * 4. **A failed read SAYS SO, in words — ⛔ and «—» no longer carries two meanings.**
 *    ⟦REPLACED by `T-295` · `D-214`, 12/09. The rule it replaces said «a failed read leaves
 *    all three disabled reading «—», ⛔ and shows no error screen», and it was measured
 *    wrong in a live walk (C-0530 · C-0535): on `/dev/tabs/cards` the `סינון מילים` tile
 *    read `314 מילים שעוד לא סוננו` while `חזרה` · `מנת היום` · `משפטים` all read «—».
 *    ⇒ a screen that looks intact with three dead tiles, and ⛔ no learner can tell that
 *    anything broke.⟧ Three states are now separate **in text** (layer A — ⛔ never colour):
 *      `ok`       the number was read. **`0` stays `0`** — an empty deck is not a failure.
 *      `failed`   the read came back `{ok:false}` or threw ⇒ the tile says so, in Hebrew.
 *      `unknown`  ⛔ no read was made at all here (`unseen` was not handed down) ⇒ «—».
 *    ⛔ «—» is still not `0`, and it is now also not «נכשל».
 *
 * ⛔ No `<ActionBar>` — D-028 forbids two bottom-anchored bars on one screen and this screen
 * carries the tab bar. ⚠️ **But there IS a way out of the failure now** (`T-295`ⓑ ·
 * `ui-ux-pro-max` § Feedback, «Error Recovery — ⛔ error without recovery path»): one
 * `טעינה מחדש` control, ≥44px, that re-runs the three reads in place. It is ⛔ not a fourth
 * deck and ⛔ not an error screen — the tiles stay, with their numbers, exactly as § 4.2ו
 * requires. ⛔ A page refresh is ⛔ not a way out: it is not a control, and a learner who
 * does not know something failed has no reason to perform it.
 */

/** ⛔ Not `0`. A count we do not have is not a count of zero. */
const UNKNOWN_COUNT_HE = '—';
/**
 * `T-295`ⓐ — **the word «—» stopped meaning two things.** A tile whose read FAILED says it
 * in a sentence; «—» is left to mean only «⛔ no read was made», which is what it says on
 * `/dev/tabs/probe` where `<DeckSelector />` gets no `unseen` at all.
 * ⛔ Text, ⛔ never colour — layer A, and `ui-ux-pro-max` § Accessibility, «Color is not the
 * only indicator».
 */
const READ_FAILED_NOTE_HE = 'הנתונים לא נטענו';
/**
 * `T-295`ⓑ — the way out. ⚠️ **Noun form, ⛔ not an imperative:** the product's own actions
 * are `פתיחת הכרטיסיות` · `שינוי רמה`, and an imperative in Hebrew carries a gender the
 * product does not know.
 */
const RETRY_ACTION_HE = 'טעינה מחדש';
const READ_FAILED_BODY_HE = 'חלק מהנתונים לא הגיעו מהשרת.';
/**
 * ⚠️ **C-0321 — «נעול» עברה משורת ההערה ל-`sr-only` ליד שם האריח, ⛔ והיא ⛔ לא נמחקה.**
 *
 * D-096 קובעת שאריח מושבת **בלי מספר** אינו מצב חוקי, ו-`render_video_A.py:290,296` מצייר
 * כל אריח כ-`<מספר> <צירוף שם>` ⇒ השורה השנייה של «משפטים» חייבת להיות המספר. אבל
 * `LockIcon` הוא `aria-hidden`, ולכן מחיקת המילה הייתה משאירה את **הנעילה** בלי שום ערוץ
 * שקורא מסך שומע — וזו בדיוק חוקה שכבה A. ⇒ המילה נשארת, במקום שאינו נראה ואינו נמדד
 * ברנדר, ו⛔ אינה גורעת פיקסל מהפריסה שהרנדר מחייב.
 *
 * ⛔ אותו טיפול חל על «סינון מילים», שנעילתה (F-140) הייתה חסרת מילה מאז C-0318.
 */
const LOCKED_HE = 'נעול';
const DUE_LABEL_HE = 'מנת היום';
/**
 * T-210 · `36 § 5`. ⚠️ **Renamed from «לא ידעתי», and the rename is the point:** since
 * T-210 the SAME two words are the middle COUNTER on this screen («ידעתי · לא ידעתי ·
 * לא סוננו»), and one phrase naming two different things on one screen is the constitution
 * § 6 failure. `36 § 5` calls the deck `חזרה`, so the deck is `חזרה`.
 */
const PRACTICE_LABEL_HE = 'חזרה';
const LEVEL_LABEL_HE = 'סינון מילים';
const SENTENCES_LABEL_HE = 'משפטים';

/**
 * The second line of each tile — `36 § 5` and `render_video_A.py:288-293` draw a tile as
 * a NAME and a sentence carrying the number, ⛔ not as a bare digit in the corner.
 * ⛔ «—» still travels when the count is unknown, in the sentence's place.
 */
const LEVEL_NOTE_HE = (n: string) => `${n} מילים שעוד לא סוננו`;
/**
 * T-199ⓑ · C-0321 — **המספר שמחליף את המנעול.**
 *
 * ⛔ ⛔ זו ⛔ אינה החלטת עיצוב: `render_video_A.py:290,296` מצייר כל אריח כ-`<מספר> <צירוף
 * שם>`, ואריח «משפטים» היה **האריח היחיד במסך** שהשורה השנייה שלו ⛔ אינה מספר. D-096 כבר
 * מדדה את המצב הזה כמצב לא חוקי ב-22/08, ו-D-097 מדדה ב-23/08 ששני תנאי השחרור של D-035
 * **מולאו**. ⇒ המספר קיים, והוא מוצג.
 *
 * ⛔ «—» עדיין נוסע במקום המספר כשהקריאה נכשלת — ⛔ הוא ⛔ אינו `0`.
 */
const SENTENCES_NOTE_HE = (n: string) => `${n} משפטים ברמה שלך`;
const PRACTICE_NOTE_HE = (n: string) => `${n} מילים שסימנת לא ידעתי`;
const DUE_NOTE_HE = (n: string) => `${n} כרטיסיות להיום`;

/** Written out rather than built from a template so the requests are readable as what
 *  they are: one row each, because only `total` is wanted. */
const DUE_QUERY = '/api/study/queue?deck=due&limit=1';
const UNKNOWN_QUERY = '/api/study/queue?deck=unknown&limit=1';
/**
 * ⚠️ `limit=1` ⛔ ואינו מקצץ את המונה: `total` נספר **לפני** החיתוך בכל ארבע החפיסות
 * (`docs/api-contract.md`), וזו הסיבה היחידה שאריח יכול לקרוא מספר בשורה אחת.
 */
const SENTENCES_QUERY = '/api/study/queue?deck=sentences&limit=1';

type QueueResponse =
  | { readonly ok: true; readonly total: number }
  | { readonly ok: false; readonly code: string };

type DeckCounts = {
  readonly due: number | null;
  readonly unknown: number | null;
  readonly sentences: number | null;
};

/**
 * `enabled: true` carries a non-null `href` in the type itself, so the enabled branch of the
 * render cannot be handed a card with nowhere to go — the lock is checked by the compiler
 * and not by a reader.
 */
type DeckEntry = {
  readonly key: string;
  readonly label: string;
  readonly note: string;
  /**
   * ⛔ **`locked` and `enabled: false` are ⛔ NOT the same fact.** An empty deck is disabled
   * WITH its number and is ⛔ not locked (§ 4.2ו); a locked deck is one the product has not
   * opened yet. The lock mark follows THIS flag — ⛔ never the note's text, which was the
   * coupling that made `«נעול»` a magic string.
   */
  readonly locked?: boolean;
} & (
  | { readonly enabled: true; readonly href: string }
  | { readonly enabled: false; readonly href: string | null }
);

/** `null` on every failure — including a server that answered `{ok:false}`. The screen does
 *  not act on WHY the number is missing (it shows «—» either way), so the code is not
 *  carried up where it would only invite an error screen the task forbids. */
async function readTotal(path: string): Promise<number | null> {
  try {
    const body = await apiGet<QueueResponse>(path);
    return body.ok ? body.total : null;
  } catch {
    return null;
  }
}

function noteFor(count: number | null): string {
  return count === null ? UNKNOWN_COUNT_HE : String(count);
}

/**
 * `T-295`ⓐⓒ — the three states of a tile's number, and they are ⛔ not two.
 * ⛔ `'failed'` is ⛔ never inferred from `count === null` alone: while the reads are still
 * in flight every count is `null` and nothing has failed yet (the D-064 rule — «אין מה
 * לתרגל» half a second early is a short lie, and so is «לא נטען»).
 */
type ReadState = 'ok' | 'failed' | 'unknown';

/**
 * `T-295`ⓒ — **a real zero stays `0`.** `state === 'ok'` with `count === 0` renders the
 * sentence with `0` in it, exactly as before; only `'failed'` swaps the sentence out.
 */
function tileNote(
  state: ReadState,
  count: number | null,
  sentence: (n: string) => string,
): string {
  return state === 'failed' ? READ_FAILED_NOTE_HE : sentence(noteFor(count));
}

function toEntry(input: {
  readonly key: string;
  readonly label: string;
  readonly href: string | null;
  readonly count: number | null;
  readonly note?: string;
}): DeckEntry {
  const { key, label, href, count } = input;
  const note = input.note ?? noteFor(count);
  return href !== null && count !== null && count > 0
    ? { key, label, note, enabled: true, href }
    : { key, label, note, enabled: false, href };
}

/**
 * T-210 — `unseen` is the level's un-filtered count and it belongs to the SCREEN, not to
 * this block: `<LevelMapScreen>` already holds the level summary, and a second read here
 * would be a second definition of a number § 4.2ז fixes in one place. ⛔ Optional, so
 * `/dev/tabs/probe` still renders `<DeckSelector />` with no props and gets «—».
 */
export default function DeckSelector({
  unseen = null,
}: {
  readonly unseen?: number | null;
} = {}): React.JSX.Element {
  const [counts, setCounts] = useState<DeckCounts>({ due: null, unknown: null, sentences: null });
  const [loading, setLoading] = useState(true);
  /**
   * `T-295`ⓑ — the retry is a **re-read in place**, ⛔ not a navigation and ⛔ not a page
   * refresh: bumping `attempt` re-runs the effect below with the tiles already on screen,
   * so nothing unmounts and nothing shifts.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // The three counted decks in parallel: none depends on another, so serialising them
      // would multiply the wait for no gain. ⛔ `level` is ⛔ not among them — its number is
      // `unseen`, which the SCREEN already holds (§ 4.2ז), and a fourth read here would be
      // a second definition of it.
      const [due, unknown, sentences] = await Promise.all([
        readTotal(DUE_QUERY),
        readTotal(UNKNOWN_QUERY),
        readTotal(SENTENCES_QUERY),
      ]);
      if (cancelled) return;
      setCounts({ due, unknown, sentences });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  /**
   * `T-295`ⓐ — `null` AFTER the reads settled is a failure; `null` DURING them is not.
   * ⛔ `level` ⛔ never reaches this function: its number is `unseen`, which this component
   * ⛔ does not read, so its only two states are `'ok'` and `'unknown'`.
   */
  const deckState = (count: number | null): ReadState =>
    loading ? 'unknown' : count === null ? 'failed' : 'ok';

  /** ⛔ One failed deck out of three is already a screen that lies — ⛔ not «all three». */
  const readFailed =
    !loading && (counts.due === null || counts.unknown === null || counts.sentences === null);

  // ⛔ **The order is `36 § 5`'s order**, ⛔ not a preference: «סינון מילים» first, `חזרה`
  // second. `מנת היום` follows as the DECLARED deviation recorded in the UX plan (§ 4.2כ ד׳)
  // — it is the only entry to `/study` in the whole product — and `משפטים` stays last and
  // untouched.
  const entries: readonly DeckEntry[] = [
    // ⛔ **`F-140` נסגר ב-`D-142` (C-0348) ו-`T-225` בנה את נתיב הכתיבה.**
    // `/api/practice` פותח שורה — ורק — עבור `deck=level`: «ידעתי» ⇒
    // `self_marked_known: true`, «לא ידעתי» ⇒ `attempts: 1` ו-`next_review_at: null`.
    // ⛔ אפס SM-2 (`T-155ⓒ` · D-032). ⇒ האריח הוא CTA ראשי אמיתי.
    // ⚠️ `toEntry` עדיין מחזיר `enabled: false` **עם המספר** כשהרמה ריקה או כשהקריאה
    // נכשלה — «מושבת עם המספר» (§ 4.2ו) ⛔ אינו «נעול».
    toEntry({
      key: 'level',
      label: LEVEL_LABEL_HE,
      href: '/study?deck=level',
      count: unseen ?? null,
      // ⛔ `'unknown'` and ⛔ never `'failed'`: this component ⛔ did not read this number,
      // so it ⛔ cannot claim the read broke. «—» is exactly what that means.
      note: tileNote(unseen === null ? 'unknown' : 'ok', unseen, LEVEL_NOTE_HE),
    }),
    toEntry({
      key: 'unknown',
      label: PRACTICE_LABEL_HE,
      href: '/study?deck=unknown',
      count: counts.unknown,
      note: tileNote(deckState(counts.unknown), counts.unknown, PRACTICE_NOTE_HE),
    }),
    toEntry({
      key: 'due',
      label: DUE_LABEL_HE,
      href: '/study',
      count: counts.due,
      note: tileNote(deckState(counts.due), counts.due, DUE_NOTE_HE),
    }),
    // T-199ⓐ · D-169 — the tile OPENS: `/study?deck=sentences` draws the item on the existing
    // card (T-066). Through `toEntry` like the other three ⇒ an empty band or a failed read is
    // «disabled WITH the number» (§ 4.2ו), ⛔ not locked. The ring node stays `nav`'s (D-149 § ד׳).
    toEntry({
      key: 'sentences',
      label: SENTENCES_LABEL_HE,
      href: '/study?deck=sentences',
      count: counts.sentences,
      note: tileNote(deckState(counts.sentences), counts.sentences, SENTENCES_NOTE_HE),
    }),
  ];

  /**
   * ⛔ **ONE marker, and it is derived ⛔ rather than hard-coded to a key.** `check:mobile`
   * fails a screen carrying anything other than exactly one `[data-primary-action]`
   * (F-027), and the old rule — «`due` when enabled» — could not survive a second enabled
   * tile above it. The primary is the FIRST enabled tile in `36 § 5`'s own order, so the
   * count is one by construction whichever tiles happen to be live.
   */
  const primaryKey = entries.find((entry) => entry.enabled)?.key ?? null;

  // T-123 · D-064: ⛔ בזמן טעינה אין מצב ריק. שלושת האריחים מציגים «—» וזה
  // נכון; «אין מה לתרגל» חצי שנייה לפני שהמספרים נוחתים הוא שקר קצר.
  const dead = !loading && allTilesDead(entries);

  /* `T-349` — ⛔ **one block, ONE place, and the place is ⛔ above the list.**
     `T-295`ⓑ put the way out AFTER the list on a structural argument — the control sits
     under the thing that failed, and the tiles keep their numbers (`§ 4.2ו`) — held
     «⛔ only while some tile is still live and pressable». `T-321` then measured a TOTAL
     failure at `top=816 · bottom=870` on 375×780 (tab bar at `top=707`) and split the
     block in two: before the list when `primaryKey === null`, after it otherwise.
     🔬 **C-0608 measured the other half of the same failure, ⛔ and it did not survive:**
     a PARTIAL failure — «סינון מילים» live at `unseen = 314` ⇒ `primaryKey !== null` —
     put the only retry control at `top=783.5 · bottom=869.5` on the same 780 screen.
     ⇒ **`T-295`ⓑ's premise is false, ⛔ not its reasoning:** a live tile is a DIFFERENT
     deck, ⛔ not a retry. It cannot re-fetch what failed, so it is ⛔ not «an action the
     list carries» for this failure at all — and the learner refreshes the page, the one
     way out `T-295` itself wrote down as ⛔ not a way out.
     ⇒ **`readFailed` alone renders it, before the list.** `primaryKey` still decides
     whether it is the PRIMARY action (`F-027` — exactly one per screen), ⛔ and that is
     now the only thing `primaryKey` decides here. */
  const recoveryBlock = (
    <div data-deck-failed className="flex flex-col items-start gap-2">
      <p className="text-base text-ink-muted">{READ_FAILED_BODY_HE}</p>
      <button
        type="button"
        onClick={() => {
          setLoading(true);
          setAttempt((previous) => previous + 1);
        }}
        data-primary-action={primaryKey === null ? 'true' : undefined}
        className="flex min-h-touch items-center justify-center rounded-full border border-border-strong px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
      >
        {RETRY_ACTION_HE}
      </button>
    </div>
  );

  return (
    <section className="flex flex-col gap-4">
      {/* `T-322` — ⛔ **one status region, mounted ALWAYS, ⛔ and that is the whole row.**
          Until now the failure reached exactly one channel: the eye. `READ_FAILED_NOTE_HE`
          replaces each tile's sentence and `READ_FAILED_BODY_HE` sits inside
          `recoveryBlock` — both plain static text swapped into a subtree that re-renders
          AFTER the first paint, so ⛔ nothing is announced. A learner on VoiceOver taps
          «כרטיסיות», hears the tiles and their numbers, three reads fail inside a second,
          and the screen they were read ⛔ no longer exists.
          ⛔ **`role="status"` and ⛔ not `role="alert"`:** the learner ⛔ did not cause this,
          and `alert` is assertive — it interrupts whatever is being spoken.
          ⛔ **And the region is ⛔ never conditionally mounted.** A live region injected in
          the same commit as its text is ⛔ not reliably announced; it must already be in
          the accessibility tree when the text arrives. ⇒ it is always here, and ⛔ only its
          CONTENT changes.
          ⛔ **ⓑ — ⛔ three failed tiles are ⛔ not three announcements.** `readFailed` is
          already «one failed read out of three», the region is ONE node, and
          `aria-atomic` makes it speak as a single sentence
          (‏`ui-ux-pro-max` § Accessibility, «Contextual Live Badge Updates» — ⛔ Don't:
          «make every badge a competing live region», severity High).
          ⚠️ **Layer A:** `sr-only` ⇒ ⛔ the visible text ⛔ does not move and ⛔ no second
          copy of the sentence is painted. The sighted learner keeps exactly the screen
          `T-295` and `T-321` built. */}
      <div role="status" aria-atomic="true" className="sr-only" data-deck-status>
        {readFailed ? READ_FAILED_BODY_HE : ''}
      </div>
      {/* `T-349` — ⛔ **any failed read** ⇒ the way out goes above the fold, ⛔ before the
          tiles. ⛔ It is ⛔ not a new error screen (‏`T-295` forbade one) and ⛔ not a
          fourth tile — it is the same block, in the one place that is reachable without
          scrolling at 320 · 375 · 414. ⛔ And the tiles keep their numbers below it: the
          block is an ADDITION, ⛔ never a replacement (`§ 4.2ו`). */}
      {readFailed && recoveryBlock}
      {/* `T-295`ⓐ — ⛔ **`&& !readFailed` is the whole point of the row.** «אין מה לתרגל»
          is a claim about the BANK, and a read that never arrived measured nothing about
          the bank. Until today a total outage rendered exactly this block, and a learner
          was told their decks were empty on the strength of three 503s. */}
      {dead && !readFailed && (
        // ⛔ אינו מחליף את שלושת האריחים: «מושבת עם המספר» הוא מידע (§ 4.2ו),
        // ומחיקתו הופכת מסך שנראה זהה בשני מצבים שונים. זו פעולה נוספת,
        // ⛔ לא החלפה.
        <div data-deck-empty className="flex flex-col gap-2">
          <h3 className="text-xl font-semibold">{DECK_ALL_EMPTY_TITLE_HE}</h3>
          <p className="text-base text-ink-muted">{DECK_ALL_EMPTY_BODY_HE}</p>
          <Link
            href={DECK_ALL_EMPTY_HREF}
            data-primary-action="true"
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {DECK_ALL_EMPTY_ACTION_HE}
          </Link>
        </div>
      )}

      {/* `aria-busy` and ⛔ not a spinner or a skeleton: the three cards are already in the
          DOM at their final size, so nothing shifts when the numbers land. */}
      {/* T-228 · D-155: the tile box carries the RENDER's three values, ⛔ not the screen's.
          `render_video_A.py` draws each deck as `rr(24, y, LW-48, 62, 16)` ⇒ x=24 · w=327 ·
          h=62. ⚠️ T-285 · D-206 moved the global gutter to 24px, so `<main>` now pads the
          column to exactly x=24 · w=327 (`app/layout.tsx`) — the render's own numbers. ⇒ the
          `mx-1` that used to fake 24 out of 20 was DELETED: there is nothing left to
          compensate for, and keeping it would push this list to x=28.
          h=62 = 1+6 (border+`py-1.5`) + 28 (`text-lg` name) + 20 (`text-sm` note) + 6+1,
          with ⛔ no inner gap: name centre at 21 and note centre at 45 against the render's
          22/45 (`c.txt(…, 508/531, …)` on a box at 486). `min-h-touch` (44) still holds
          under it, so a wrapping note grows the box instead of clipping. Measured live
          before: x=20 · w=335 · h=78 (C-0321, unchanged at C-0499). */}
      <ul aria-busy={loading} data-deck-selector className="flex list-none flex-col gap-3 p-0">
        {entries.map((entry) => {
          // ONE body, shared by both branches. If each branch carried its own copy, the
          // disabled one could quietly lose its number — and «disabled WITH the number» is
          // the whole rule (§ 4.2ו).
          // ONE body, shared by both branches — `36 § 5` and the render draw a tile as a
          // NAME above a sentence that carries the number. If each branch carried its own
          // copy, the disabled one could quietly lose the number, and «disabled WITH the
          // number» is the whole rule (§ 4.2ו).
          const body = (
            <>
              <span className="inline-flex items-center gap-2 text-lg font-semibold">
                {/* T-078: the lock gets the same mark the locked world tab wears, from the
                    same component. The word alone was the only signal here, and one
                    concept in two forms is constitution § 6 — and § 1, since a muted grey
                    word is a single channel. ⚠️ **Keyed to `entry.locked` since C-0318**,
                    ⛔ no longer to the note's TEXT: the note is a sentence now, and a tile
                    can be locked while still showing its number (F-140 · «סינון מילים»). */}
                {entry.locked === true ? <LockIcon /> : null}
                {/* ⛔ הנעילה ⛔ אינה נשענת על האייקון בלבד: `LockIcon` הוא `aria-hidden`
                    (⛔ בכוונה — הוא קישוט), ולכן בלי המילה הזאת לומד שמשתמש בקורא מסך
                    שומע «מושבת» ⛔ ולא «נעול». ⛔ ואינה נראית ⇒ ⛔ אפס סטייה מהרנדר. */}
                {entry.locked === true ? <span className="sr-only">{LOCKED_HE}</span> : null}
                {entry.label}
              </span>
              <span className="text-sm text-ink-muted">{entry.note}</span>
            </>
          );

          return (
            <li key={entry.key}>
              {entry.enabled ? (
                <Link
                  href={entry.href}
                  data-primary-action={entry.key === primaryKey ? 'true' : undefined}
                  className="flex min-h-touch flex-col items-start justify-center rounded-2xl border border-border-strong px-5 py-1.5 text-ink active:opacity-90"
                >
                  {body}
                </Link>
              ) : (
                // A <button> with `type="button"` and NO handler: it cannot submit and it
                // cannot navigate, so "does nothing" is structural. It stays focusable
                // (⛔ not the `disabled` attribute) so a screen-reader learner can still
                // find the deck and hear that it is unavailable — `aria-disabled` is what
                // says so.
                <button
                  type="button"
                  aria-disabled="true"
                  className="flex w-full min-h-touch flex-col items-start justify-center rounded-2xl border border-border-subtle px-5 py-1.5 text-ink-muted"
                >
                  {body}
                </button>
              )}
            </li>
          );
        })}
      </ul>

    </section>
  );
}
