'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';

/**
 * The body of the כרטיסיות tab — the deck selector, T-065 part ג׳, plan
 * `2026-08-13-study-queue.md` task 7.
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

const HEADING_HE = 'כרטיסיות';
/** ⛔ Not `0`. A count we do not have is not a count of zero. */
const UNKNOWN_COUNT_HE = '—';
const LOCKED_HE = 'נעול';
const DUE_LABEL_HE = 'מנת היום';
const PRACTICE_LABEL_HE = 'לא ידעתי';
const SENTENCES_LABEL_HE = 'משפטים';

/** Written out rather than built from a template so the two requests are readable as what
 *  they are: one row each, because only `total` is wanted. */
const DUE_QUERY = '/api/study/queue?deck=due&limit=1';
const UNKNOWN_QUERY = '/api/study/queue?deck=unknown&limit=1';

type QueueResponse =
  | { readonly ok: true; readonly total: number }
  | { readonly ok: false; readonly code: string };

type DeckCounts = { readonly due: number | null; readonly unknown: number | null };

/**
 * `enabled: true` carries a non-null `href` in the type itself, so the enabled branch of the
 * render cannot be handed a card with nowhere to go — the lock is checked by the compiler
 * and not by a reader.
 */
type DeckEntry = {
  readonly key: string;
  readonly label: string;
  readonly note: string;
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

export default function CardsScreen(): React.JSX.Element {
  const [counts, setCounts] = useState<DeckCounts>({ due: null, unknown: null });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      // Both decks in parallel: they are two reads of the same table and neither depends on
      // the other, so serialising them would double the wait for no gain.
      const [due, unknown] = await Promise.all([readTotal(DUE_QUERY), readTotal(UNKNOWN_QUERY)]);
      if (cancelled) return;
      setCounts({ due, unknown });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const entries: readonly DeckEntry[] = [
    toEntry({ key: 'due', label: DUE_LABEL_HE, href: '/study', count: counts.due }),
    toEntry({
      key: 'unknown',
      label: PRACTICE_LABEL_HE,
      href: '/study?deck=unknown',
      count: counts.unknown,
    }),
    // ⛔ D-035: no destination, and the note is the lock rather than a number.
    { key: 'sentences', label: SENTENCES_LABEL_HE, href: null, note: LOCKED_HE, enabled: false },
  ];

  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* `aria-busy` and ⛔ not a spinner or a skeleton: the three cards are already in the
          DOM at their final size, so nothing shifts when the numbers land. */}
      <ul aria-busy={loading} data-deck-selector className="flex list-none flex-col gap-3 p-0">
        {entries.map((entry) => {
          // ONE body, shared by both branches. If each branch carried its own copy, the
          // disabled one could quietly lose its number — and «disabled WITH the number» is
          // the whole rule (§ 4.2ו).
          const body = (
            <>
              <span className="text-lg font-semibold">{entry.label}</span>
              {/* T-078: «נעול» gets the same mark the locked world tab wears, from the
                  same component. The word alone was the only signal here, and one
                  concept in two forms is constitution § 6 — and § 1, since a muted
                  grey word is a single channel. ⛔ The condition is the note the row
                  already carries, ⛔ not a new flag: `enabled: false` is also true of
                  an empty deck, which shows a NUMBER and is not locked (§ 4.2ו). */}
              <span className="inline-flex items-center gap-1 text-lg text-ink-muted">
                {entry.note === LOCKED_HE ? <LockIcon /> : null}
                {entry.note}
              </span>
            </>
          );

          return (
            <li key={entry.key}>
              {entry.enabled ? (
                <Link
                  href={entry.href}
                  data-primary-action={entry.key === 'due' ? 'true' : undefined}
                  className="flex min-h-touch items-center justify-between gap-3 rounded-lg border border-border-strong px-5 py-3 text-ink active:opacity-90"
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
                  data-primary-action={entry.key === 'due' ? 'true' : undefined}
                  className="flex w-full min-h-touch items-center justify-between gap-3 rounded-lg border border-border-subtle px-5 py-3 text-ink-muted"
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
