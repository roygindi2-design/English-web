import EnWord from '@/components/EnWord';

/**
 * The closed bank of `/world/compose` — plan `2026-08-14-world-compose.md` task 8, § 4.2ה.
 *
 * Presentational on purpose: no state, no effect, no fetch, ⛔ and no `'use client'` of its
 * own. It receives the two groups already grouped and already ordered by
 * `GET /api/world/bank` (which de-duplicates by `headword` in the pure layer — § 4.2ה, the
 * 12 double-sense headwords measured in C-0092) and hands every tap straight back through
 * `onPick`. Anything it decided for itself — an order, a filter, a second copy of "the same
 * word" — would be a second definition of the bank, and the second one is the one that
 * drifts.
 *
 * ⚠️ **The group label is Hebrew TEXT inside a heading, ⛔ never a colour.** Constitution
 * § 1: colour is never the only channel. «מילות קישור» and «המילים שלך» are two different
 * kinds of word for the learner, and a reader who cannot separate two hues would otherwise
 * be looking at one undifferentiated pile.
 *
 * ⛔ No drag (§ 4.2ה — a drag on the scroll axis fights the scroll, and the vision forbids
 * it), ⛔ no input and ⛔ no keyboard anywhere: the bank being closed IS the feature.
 * ⛔ Nothing here grades anything (R-016) — these are words, not answers.
 */

export interface WordBankGroup {
  /** The group's own Hebrew label, rendered as text. ⛔ Never English, ⛔ never a colour. */
  readonly labelHe: string;
  /** Surface forms, already unique and already ordered by the route. */
  readonly words: readonly string[];
}

/** The 44px floor lives on the tapped element itself and ⛔ not on a wrapper — a padded
 *  parent around a 20px button is still a 20px button (`scripts/verify-mobile.mjs`). */
const CHIP_CLASS =
  'inline-flex min-h-touch min-w-touch items-center justify-center rounded-md border border-border-strong bg-surface-raised px-3 py-2 text-lg text-ink active:opacity-90';

export default function WordBank({
  groups,
  onPick,
}: {
  readonly groups: readonly WordBankGroup[];
  readonly onPick: (token: string) => void;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      {groups.map((group) => (
        <section key={group.labelHe} className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-ink-muted">{group.labelHe}</h2>
          <ul className="flex flex-row flex-wrap gap-2">
            {group.words.map((word) => (
              <li key={word}>
                <button type="button" className={CHIP_CLASS} onClick={() => onPick(word)}>
                  <EnWord>{word}</EnWord>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
