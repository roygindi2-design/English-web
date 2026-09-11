import EnWord from '@/components/EnWord';
import type { RequiredWordsProgress } from '@/lib/core/requiredWords';

/**
 * מילות חובה — the three chips of the open message (T-192ⓒ · 39 § 7).
 * 🎯 Render: `docs/design/kol-C-14-mail-open.png`, drawn by
 * `docs/design/render_msgs_screens.py:98-109` — heading at y=336, chips h=32 r=16 at
 * y=354, 13 SemiBold; used ⇒ `success` fill α46 + `success` outline + a ✓; unused ⇒
 * transparent with a strong outline.
 *
 * ⚠️ The chips are INFORMATIONAL, ⛔ not tap targets ⇒ h=32 is ⛔ not a 44px Layer A gap.
 * ⛔ An unused chip is ⛔ not an error, so it carries ⛔ no error token and ⛔ no red — the
 * learner has simply not used that word yet. The source scan beside this file measures it.
 * ⛔ State is ⛔ never colour alone (Layer A): the ✓ is the second channel and the
 * `sr-only` text is the third.
 * ⛔ Draws only — `progress` and `labelHe` arrive computed from `lib/core/requiredWords.ts`.
 */
const HEADING_HE = 'מילות חובה';

export default function RequiredWordChips({
  progress,
  labelHe,
}: {
  readonly progress: RequiredWordsProgress;
  readonly labelHe: string;
}) {
  return (
    <section aria-label={HEADING_HE} className="mt-5">
      <h2 className="text-xs font-semibold text-ink">{HEADING_HE}</h2>
      <ul className="mt-2 flex flex-wrap gap-2">
        {progress.chips.map((c) => (
          <li
            key={c.word}
            className={
              c.used
                ? 'inline-flex h-8 items-center gap-1.5 rounded-2xl border-2 border-success bg-success/15 px-3 text-sm font-semibold text-success'
                : 'inline-flex h-8 items-center rounded-2xl border border-border-strong px-3 text-sm font-semibold text-ink-muted'
            }
          >
            {/*
              ⚠️ The ✓ is written AFTER the word and therefore paints to its LEFT: the `li`
              is an RTL flex row, and the render puts the mark on the chip's left edge
              (`render_msgs_screens.py:108` draws it at `x - w + 16`, 16px from the left,
              with the word nudged +9 to its right). Measured in the walk: written first,
              it landed on the right — ⛔ the mirror of the render.
            */}
            <EnWord>{c.word}</EnWord>
            {c.used ? (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7" />
              </svg>
            ) : null}
            <span className="sr-only">{c.used ? ' — נעשה בה שימוש' : ' — טרם נעשה בה שימוש'}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-ink-muted">{labelHe}</p>
    </section>
  );
}
