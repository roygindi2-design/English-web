'use client';

import { useEffect, useRef, useState } from 'react';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import EnWord from '@/components/EnWord';
import { AMIRNET_TYPES } from '@/lib/core/amirnetPractice';
import { questionCounterHe, type AmirnetServedItem } from '@/lib/core/amirnetQuestion';
import { BACK_TO_DASHBOARD_HE } from '@/lib/core/amirnetResult';
import {
  AMIRNET_CHAPTERS,
  CARRY_OVER_NOTICE_HE,
  CHAPTER_TIME_UP_HE,
  FINISH_RUN_HE,
  NEXT_CHAPTER_HE,
  NEXT_QUESTION_HE,
  REMAINING_LABEL_HE,
  SIMULATION_OVER_HE,
  advance,
  advanceChapter,
  chapterAt,
  chapterClock,
  chapterDotLabelHe,
  chapterDotState,
  chapterHeadingHe,
  isChapterExpired,
  isLastQuestionOfChapter,
  isLastQuestionOfRun,
  remainingSeconds,
  startSimulation,
  type AmirnetSimulationState,
} from '@/lib/core/amirnetSimulation';

/**
 * One amirnet simulation chapter, running under its OWN clock — `T-296` · `41 § 2` · `41 § 7` ·
 * `41 § 8` item 3. **המשך של: T-287**.
 * 🎯 Render: `docs/design/kol-D-06-simulation.png`, drawn by `docs/design/render_video_D.py`
 * `screen_sim` (:255-291). Every value below was grepped from that function, ⛔ not eyeballed.
 *
 * ⛔ DRAWS ONLY. Which chapter, how much time is left, whether the chapter is over and what comes
 * next all arrive from `lib/core/amirnetSimulation.ts`; ⛔ nothing here re-derives one. ⛔ And there
 * is ⛔ no `setInterval` that computes state (`T-296`ⓒ): the interval below moves a DISPLAY
 * timestamp, and every decision is then asked of the core with that timestamp.
 * ⛔ The component ⛔ never touches the database — items arrive as a prop.
 *
 * ── Layout, grepped from `screen_sim`:
 *      header band    :256-257  y=84 h=96, hairline at 180   ⇒ one band, ⛔ not a card in a card
 *      chapter line   :258      13.5px Bold, right           ⇒ `text-base font-bold`
 *      type line      :259      11.5px, right, brand         ⇒ `text-sm text-brand-surface`
 *      clock card     :260-264  86×40 r=12, LTR, 18px Black  ⇒ `rounded-xl`, `min-h-touch`, tabular
 *      six dots       :265-269  r=5, pitch 26, RTL           ⇒ 10px dots, RTL row, each labelled
 *      question count :270-271  11px, left                   ⇒ `text-sm`
 *      question card  :272-275  h=118 r=18, two lines        ⇒ `rounded-2xl`, `<EnWord>`
 *      option row     :276-286  h=56 r=14, pitch 64, ring right ⇒ `min-h-touch`, `rounded-xl`
 *      primary action :287-289  h=54 r=15                    ⇒ `min-h-touch`, `rounded-xl`
 *      carry-over note:290-291  10.5px, centred, standing    ⇒ `text-sm`, always on screen
 *
 * ── Declared שכבה A gaps (the gates override the render, `36 § 14.4`), each with the render's own
 *    number: type line 11.5→14 · question counter 11→14 · carry-over note 10.5→14
 *    (`check:text-floor`) · clock card 40→44 and option row 56→44-floor (44px) · option radius
 *    14→12 and question card 18→16 (the five-value scale, `D-102`, has ⛔ no 14 and ⛔ no 18) ·
 *    the dots carry an `aria-label` each, because the render separates their three states by FILL
 *    alone and layer A forbids state in colour alone.
 * ── The render is dark; the product is light (`36 § 14.2`, Roy 11/09) ⇒ the background is
 *    ⛔ NOT a gap. Every colour below is a `palette.ts` product token.
 *
 * ── 🔴 THE COUNTDOWN IS THE PRODUCT HERE, ⛔ not a deviation — the full reasoning, and why it
 *    ⛔ does not contradict the practice screen's upward clock, is in `amirnetSimulation.ts`'s
 *    header. `41 § 2` makes a per-chapter countdown binding.
 * ── ⛔ No score, ⛔ no score estimate, ⛔ no XP, streak, coin or leaderboard (`T-296`ⓓ · `D-050` ·
 *    `41 § 9.2` is Roy's) · ⛔ no adaptivity (`41 § 3`) · ⛔ no per-question feedback: the render
 *    draws none, and an exam that grades each answer as it lands is ⛔ not the exam being simulated.
 * ── `prefers-reduced-motion`: the clock is text that updates once a second and every transition is
 *    a re-render. There is ⛔ no animation in this component to reduce (`T-296`ⓔ · `check:motion`).
 */

export const KICKER_HE = 'העולם · אמירנט';
export const HEADING_HE = 'סימולציה';
export const NO_ITEMS_HE = 'אין פריטים לפרק הזה';
/**
 * ⛔ ONE literal, ⛔ not two. `T-298`'s result screen offers the same way out, and the same
 * words written in two files can only drift apart — the reason `amirnetPractice.ts` gives for
 * owning every string two amirnet screens share. It moved to `lib/core/amirnetResult.ts` and
 * is re-exported here, so ⛔ nothing that imported it from this module had to change.
 */
export { BACK_TO_DASHBOARD_HE };

function typeNameHe(type: string): string {
  return AMIRNET_TYPES.find((t) => t.type === type)?.nameHe ?? '';
}

/**
 * The three dot states, and ⛔ none of them is distinguished by hue alone — each carries its own
 * SHAPE (filled · filled-with-ring · outline) **and** its own `aria-label` from the core. The
 * render separates them by fill only (:266-269), which layer A forbids.
 * ⚠️ The bare brand token is ⛔ not available as a FILL: it measures 4.42:1 and
 * `lib/core/palette.test.ts` (`F-036`) refuses it — and that guard reads the raw source, so ⛔ not
 * even a comment may spell it. ⇒ the current chapter is `bg-brand-surface` **plus a ring**,
 * ⛔ not a second, weaker colour.
 */
const DOT_CLASS: Readonly<Record<'done' | 'current' | 'upcoming', string>> = {
  done: 'h-[10px] w-[10px] rounded-full bg-brand-surface/60',
  current: 'h-[10px] w-[10px] rounded-full bg-brand-surface ring-2 ring-brand-surface/35',
  upcoming: 'h-[10px] w-[10px] rounded-full border border-border-subtle bg-surface-raised',
};

export interface AmirnetSimulationProps {
  /** Already gated by `servableItems()`. ⛔ The component filters nothing. */
  readonly items: readonly AmirnetServedItem[];
  /** ⛔ Injectable so the walk and the tests are deterministic; defaults to the real clock. */
  readonly now?: () => number;
  readonly onExit?: () => void;
  /**
   * Fired **once**, the moment the run reaches its end (`T-309`). ⛔ Not on exit, and ⛔ not on
   * every render in which `finished` happens to be true: a run that finished is one fact, and a
   * caller that recorded it twice would be counting one evening as two (`T-312` reads those rows).
   *
   * ⛔ **The component still decides ⛔ nothing** — it ⛔ does not know a completion is recorded,
   * ⛔ does not know which level it ran, and ⛔ never touches the database. It says «this ended»;
   * `AmirnetSimulationEntry` is what that sentence means something to.
   */
  readonly onFinished?: () => void;
}

export default function AmirnetSimulation({ items, now, onExit, onFinished }: AmirnetSimulationProps) {
  const clock = now ?? (() => Date.now());
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const [state, setState] = useState<AmirnetSimulationState>(() => startSimulation(clock()));
  const [chosen, setChosen] = useState<number | null>(null);
  const [tickMs, setTickMs] = useState(() => clock());

  /**
   * DISPLAY only — it moves a timestamp and ⛔ decides nothing. Whether the chapter is over is
   * asked of `isChapterExpired(state, tickMs)` below, so the rule lives in one pure place and a
   * throttled or backgrounded tab ⛔ cannot under-count it into never expiring.
   */
  useEffect(() => {
    if (state.finished) return undefined;
    const id = setInterval(() => setTickMs(clockRef.current()), 1000);
    return () => clearInterval(id);
  }, [state.finished, state.chapterIndex]);

  /**
   * `T-309` — the run ended, and that is the ⛔ only thing announced here. The ref is what makes it
   * **once**: `finished` stays true for every later render, and an effect without it would re-fire
   * on each one, writing a second completion row for a run the learner did once.
   */
  const announcedRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;
  useEffect(() => {
    if (!state.finished || announcedRef.current) return;
    announcedRef.current = true;
    onFinishedRef.current?.();
  }, [state.finished]);

  const header = (
    <header className="pt-2">
      <p className="text-xs text-ink-muted">{KICKER_HE}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
      <AmirnetTabs active="simulation" built={AMIRNET_BUILT_TABS} />
    </header>
  );

  if (state.finished) {
    return (
      <section>
        {header}
        <p className="mt-10 text-base text-ink">{SIMULATION_OVER_HE}</p>
        <p className="mt-2 text-sm text-ink-muted">{CARRY_OVER_NOTICE_HE}</p>
        <button
          type="button"
          onClick={onExit}
          className="mt-4 min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
        >
          {BACK_TO_DASHBOARD_HE}
        </button>
      </section>
    );
  }

  const chapter = chapterAt(state.chapterIndex);
  const item = items[state.questionIndex];
  const remaining = remainingSeconds(state, tickMs);
  const expired = isChapterExpired(state, tickMs);
  const leavesChapter = expired || isLastQuestionOfChapter(state);
  const endsRun = isLastQuestionOfRun(state);

  /**
   * ⛔ TWO paths, and the difference is `T-296`ⓑ. A chapter whose clock ran out moves to the NEXT
   * CHAPTER — ⛔ never to the next question of a chapter the learner can no longer answer in — so
   * the expired case asks `advanceChapter()` and the ordinary case asks `advance()`. Both re-stamp
   * from the same `nowMs`, so neither can carry time forward.
   */
  const step = () => {
    setChosen(null);
    const stamp = clockRef.current();
    setState((prev) => (isChapterExpired(prev, stamp) ? advanceChapter(prev, stamp) : advance(prev, stamp)));
  };

  return (
    <section>
      {header}

      {/* ⛔ ONE band, ⛔ not a card inside a card (skill § 15). */}
      <div className="mt-6 border-b border-border-subtle pb-3">
        <div className="flex items-start justify-between gap-3">
          <p
            className={
              expired
                ? 'flex min-h-touch min-w-[86px] items-center justify-center rounded-xl border-2 border-danger px-3 text-xl font-black tabular-nums text-danger'
                : 'flex min-h-touch min-w-[86px] items-center justify-center rounded-xl border border-border-subtle px-3 text-xl font-black tabular-nums text-ink'
            }
          >
            <span className="sr-only">{`${REMAINING_LABEL_HE}: `}</span>
            <span dir="ltr">{chapterClock(remaining)}</span>
          </p>
          <div className="text-right">
            <p className="text-base font-bold text-ink">{chapterHeadingHe(state.chapterIndex)}</p>
            <p className="text-sm text-brand-surface">{typeNameHe(chapter?.type ?? '')}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-sm text-ink-muted">
            {questionCounterHe(state.questionIndex, chapter?.questionCount ?? 0)}
          </p>
          {/* RTL: chapter 1 sits rightmost, exactly as the render draws it (:265-269). */}
          <ul className="flex flex-row-reverse items-center gap-2">
            {AMIRNET_CHAPTERS.map((c) => {
              const dot = chapterDotState(c.index, state.chapterIndex);
              return (
                <li
                  key={c.index}
                  aria-label={chapterDotLabelHe(dot, c.index)}
                  className={DOT_CLASS[dot]}
                />
              );
            })}
          </ul>
        </div>
      </div>

      {item === undefined ? (
        <p className="mt-10 text-base text-ink">{NO_ITEMS_HE}</p>
      ) : (
        <>
          <div className="mt-4 rounded-2xl border border-border-subtle bg-surface-raised p-4">
            {item.passageEn === '' ? null : (
              <p className="mb-3 text-sm leading-relaxed text-ink-muted">
                <EnWord>{item.passageEn}</EnWord>
              </p>
            )}
            <p className="text-base leading-relaxed text-ink">
              <EnWord>{item.stemEn}</EnWord>
            </p>
          </div>

          <ul className="mt-4 space-y-1">
            {item.optionsEn.map((option, i) => {
              const isChosen = i === chosen;
              return (
                <li key={option}>
                  <button
                    type="button"
                    aria-pressed={isChosen}
                    aria-disabled={expired}
                    onClick={() => {
                      if (!expired) setChosen(i);
                    }}
                    /* ⟦T-311⟧ pressed feedback ⛔ only while the chapter clock still runs — an
                       expired chapter's option is `aria-disabled` and sets nothing. */
                    className={
                      isChosen
                        ? `flex min-h-touch w-full items-center gap-3 rounded-xl border-2 border-brand bg-brand-surface/10 px-4 py-3 text-right text-ink${expired ? '' : ' active:opacity-90'}`
                        : `flex min-h-touch w-full items-center gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4 py-3 text-right text-ink${expired ? '' : ' active:opacity-90'}`
                    }
                  >
                    <span
                      aria-hidden="true"
                      className={
                        isChosen
                          ? 'h-[22px] w-[22px] shrink-0 rounded-full border-2 border-brand bg-brand-surface'
                          : 'h-[22px] w-[22px] shrink-0 rounded-full border border-border-subtle'
                      }
                    />
                    <span className="flex-1 text-base">
                      <EnWord>{option}</EnWord>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      )}

      {/* ⛔ The expired chapter says so IN WORDS — the red clock above is ⛔ never the only channel. */}
      {expired ? <p className="mt-4 text-sm font-bold text-danger">{CHAPTER_TIME_UP_HE}</p> : null}

      <button
        type="button"
        onClick={step}
        className="mt-4 min-h-touch w-full rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
      >
        {endsRun || (expired && state.chapterIndex === AMIRNET_CHAPTERS.length - 1)
          ? FINISH_RUN_HE
          : leavesChapter
            ? NEXT_CHAPTER_HE
            : NEXT_QUESTION_HE}
      </button>

      {/* `41 § 2` rule two, standing text — the render keeps it on screen at all times (:290-291). */}
      <p className="mt-4 text-center text-sm text-ink-muted">{CARRY_OVER_NOTICE_HE}</p>
    </section>
  );
}
