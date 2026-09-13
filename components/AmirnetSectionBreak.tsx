'use client';

import {
  AMIRNET_CHAPTERS,
  CARRY_OVER_NOTICE_HE,
  CLOCK_STARTS_ON_TAP_HE,
  START_CHAPTER_HE,
  chapterAt,
  chapterBudgetHe,
  chapterDotLabelHe,
  chapterDotState,
  chapterHeadingHe,
} from '@/lib/core/amirnetSimulation';
import { AMIRNET_TYPES } from '@/lib/core/amirnetPractice';

/**
 * The break between two simulation chapters — `T-316`. **המשך של: T-314**.
 *
 * 🎯 **There is ⛔ NO render for this screen, and that is the row's own starting point:** `41 § 7`
 * lists a run screen and a result screen and says ⛔ nothing about the moment between chapters,
 * so `docs/design/render_video_D.py` draws none. ⇒ ⛔ nothing is «taken from the render» here and
 * ⛔ nothing may claim to be. It is built in the product's own language instead: the tokens,
 * the type scale and the composition `AmirnetSimulation` already uses two screens either side of
 * it, so the learner meets ⛔ no new vocabulary in the middle of an exam.
 *
 * **What it answers, and it is exactly `T-316`ⓐ:** which chapter is next, what kind it is, and how
 * long it lasts — before the clock starts.
 *
 * ⛔ **DRAWS ONLY.** The chapter, its type, its budget and the dots all arrive from
 * `lib/core/amirnetSimulation.ts`; ⛔ nothing here counts, converts or re-derives one. The budget
 * in particular is `chapterBudgetHe()` and ⛔ never a number typed onto a screen.
 *
 * ⛔ **AND IT IS ⛔ NOT A REWARD SCREEN** (`T-316`ⓒ · `D-050`). ⛔ No score, ⛔ no «כל הכבוד»,
 * ⛔ no count of what was answered, ⛔ no comparison with the chapter just left. A learner mid-exam
 * is told a **fact about what comes next**, and the register is the same flat, factual Hebrew the
 * rest of the amirnet screens use (`taste-skill § 4.9`, copy self-audit).
 *
 * ⛔ **One action, and one intent** (`taste-skill § 4.5`, NO DUPLICATE CTA INTENT): `להתחיל את
 * הפרק`. ⛔ Not «התחל סימולציה» — that label is the entry screen's, and the same intent under two
 * names is what that section refuses.
 *
 * ⛔ **⛔ No animation, ⛔ nothing to reduce** (`T-316`ⓓ · `check:motion`): the slide is markup that
 * replaces markup. `prefers-reduced-motion` has ⛔ nothing to honour because there is ⛔ no
 * transition to honour it in — a slide that faded in would also be a slide that delays an exam.
 *
 * ⚠️ **The clock does ⛔ not run behind this screen, and that is ⛔ not enforced here.**
 * `remainingSeconds()` returns the chapter's full budget while `atChapterBreak` is true, so the
 * rule holds even if some future screen forgets to draw `CLOCK_STARTS_ON_TAP_HE`.
 */

export interface AmirnetSectionBreakProps {
  /** The chapter the learner is ABOUT to start. */
  readonly chapterIndex: number;
  readonly onStart: () => void;
}

function typeNameHe(type: string): string {
  return AMIRNET_TYPES.find((t) => t.type === type)?.nameHe ?? '';
}

export default function AmirnetSectionBreak({ chapterIndex, onStart }: AmirnetSectionBreakProps) {
  const chapter = chapterAt(chapterIndex);

  return (
    <section aria-labelledby="amirnet-section-break-heading" className="mt-6">
      {/* ⛔ ONE card, ⛔ not a card inside a card (skill § 15). The action sits OUTSIDE it. */}
      <div className="rounded-2xl border border-border-subtle bg-surface-raised p-5">
        <h2 id="amirnet-section-break-heading" className="text-2xl font-bold text-ink">
          {chapterHeadingHe(chapterIndex)}
        </h2>
        <p className="mt-1 text-base text-brand-surface">{typeNameHe(chapter?.type ?? '')}</p>

        <p className="mt-4 text-3xl font-black tabular-nums text-ink">
          {chapterBudgetHe(chapterIndex)}
        </p>
        <p className="mt-1 text-sm text-ink-muted">{CLOCK_STARTS_ON_TAP_HE}</p>

        {/* The same six dots as the run screen — «where am I» answered with ⛔ zero words. Each
            carries its own label, because the three states differ by shape and fill and layer A
            forbids state in colour alone.
            ⚠️ **Plain `flex`, ⛔ NOT `flex-row-reverse`**, and it is a MEASUREMENT (`F-236`): the
            document is already `dir="rtl"`, so the row's main axis already runs right-to-left and
            `flex-row-reverse` reverses it a SECOND time, back to LTR. Measured live at 375px on
            the run screen, which still carried it: chapter 1 at `x=24` and chapter 6 at `x=114`
            ⇒ progress ran left-to-right on an RTL screen. Plain `flex` puts chapter 1 rightmost,
            which is what `render_video_D.py:265-269` draws. */}
        <ul className="mt-5 flex items-center gap-2">
          {AMIRNET_CHAPTERS.map((c) => {
            const dot = chapterDotState(c.index, chapterIndex);
            return (
              <li
                key={c.index}
                aria-label={chapterDotLabelHe(dot, c.index)}
                className={
                  dot === 'done'
                    ? 'h-[10px] w-[10px] rounded-full bg-brand-surface/60'
                    : dot === 'current'
                      ? 'h-[10px] w-[10px] rounded-full bg-brand-surface ring-2 ring-brand-surface/35'
                      : 'h-[10px] w-[10px] rounded-full border border-border-subtle bg-surface-raised'
                }
              />
            );
          })}
        </ul>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-4 min-h-touch w-full rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
      >
        {START_CHAPTER_HE}
      </button>

      {/* `41 § 2` rule two — and this is the moment it is actually about. */}
      <p className="mt-4 text-center text-sm text-ink-muted">{CARRY_OVER_NOTICE_HE}</p>
    </section>
  );
}
