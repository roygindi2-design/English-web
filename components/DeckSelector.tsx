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
 * 3. **The sentences deck is locked with `href: null` and ⛔ no navigation** (D-035). T-066
 *    is blocked on two measurable conditions that are still open (F-033); the 806 sentences
 *    behind it were gated by `contentSchema.ts` before F-020 was fixed, and a "locked" card
 *    that navigates is not locked.
 *
 * 4. **A failed read leaves all three disabled reading «—», ⛔ and shows no error screen.**
 *    That is the state the task names, and it is also the state the harness measures: the
 *    fixture has no session, so without Supabase env the queue answers 503 for both decks.
 *    ⛔ «—» is not `0`: a read that failed and a deck that is empty look identical on screen
 *    and only one of them is true (the same rule `<MeScreen>` follows for `wordsLearned`).
 *
 * ⛔ No `<ActionBar>` — D-028 forbids two bottom-anchored bars on one screen and this screen
 * carries the tab bar. ⛔ No retry control either: the task fixes this failure state as
 * three disabled cards, and a fourth target would be Dev minting a control the UX decision
 * does not name. Recorded in `plan/30-architecture.md` rather than added here.
 */

/** ⛔ Not `0`. A count we do not have is not a count of zero. */
const UNKNOWN_COUNT_HE = '—';
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
  }, []);

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
      note: LEVEL_NOTE_HE(noteFor(unseen)),
    }),
    toEntry({
      key: 'unknown',
      label: PRACTICE_LABEL_HE,
      href: '/study?deck=unknown',
      count: counts.unknown,
      note: PRACTICE_NOTE_HE(noteFor(counts.unknown)),
    }),
    toEntry({
      key: 'due',
      label: DUE_LABEL_HE,
      href: '/study',
      count: counts.due,
      note: DUE_NOTE_HE(noteFor(counts.due)),
    }),
    // ⛔ **`href: null` and `locked: true` stay** — T-199ⓐ (the tile becoming navigable) is
    // ⛔ NOT this commit. Two homes claim this feature and neither has been chosen: `36 § 5`
    // fixes TWO decks and the render draws two, while `36 § 6` and the delivered ring
    // (`lib/core/worldRing.ts:78,138`) carry `sentences` as a `locked_infra` node. That is
    // **F-142**, a PM navigation decision. And the SCREEN itself has no render at all
    // (**F-143**). ⇒ ⛔ Do NOT flip this to an href before both close.
    //
    // ⚠️ What DID change (T-199ⓑ · D-096): the second line is the COUNT, ⛔ no longer
    // `«נעול»`. A disabled tile with no number is ⛔ not a legal state on this screen, and
    // this was the only tile in `36 § 5` whose second line was not a number.
    {
      key: 'sentences',
      label: SENTENCES_LABEL_HE,
      href: null,
      note: SENTENCES_NOTE_HE(noteFor(counts.sentences)),
      enabled: false,
      locked: true,
    },
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

  return (
    <section className="flex flex-col gap-4">
      {dead && (
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
                  className="flex min-h-touch flex-col items-start justify-center gap-1 rounded-2xl border border-border-strong px-5 py-3 text-ink active:opacity-90"
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
                  className="flex w-full min-h-touch flex-col items-start justify-center gap-1 rounded-2xl border border-border-subtle px-5 py-3 text-ink-muted"
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
