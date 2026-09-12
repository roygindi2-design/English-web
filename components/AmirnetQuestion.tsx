'use client';

import { useEffect, useRef, useState } from 'react';
import AmirnetTabs, { AMIRNET_BUILT_TABS } from '@/components/AmirnetTabs';
import EnWord from '@/components/EnWord';
import { AMIRNET_TYPES, type AmirnetLevel } from '@/lib/core/amirnetPractice';
import {
  BACK_TO_MENU_HE,
  CORRECT_ANSWER_LABEL_HE,
  ELAPSED_LABEL_HE,
  NEXT_HE,
  NO_MORE_ITEMS_HE,
  elapsedClock,
  feedbackFor,
  nextIndex,
  questionCounterHe,
  type AmirnetFeedback,
  type AmirnetServedItem,
} from '@/lib/core/amirnetQuestion';

/**
 * שאלת תרגול אחת עם משוב מיידי — T-287 · 41 § 7 · 41 § 8 item 1. **המשך של: T-286**.
 * 🎯 Renders: docs/design/kol-D-04-practice-question.png · kol-D-05-practice-feedback.png, drawn by
 * docs/design/render_video_D.py `screen_practice` (:138-175). Every value below was grepped from
 * that function, ⛔ not eyeballed from the PNG.
 *
 * ⛔ Draws only. The verdict, the response time and the end of the queue all arrive from
 * `lib/core/amirnetQuestion.ts`; ⛔ nothing here re-derives one. A component that recomputes a
 * verdict is a second place for it to be wrong — the same reason `AmirnetPracticeMenu` takes
 * precomputed cards.
 * ⛔ The component ⛔ never touches the database (RULES): items arrive as a prop.
 *
 * ── Layout, grepped from `screen_practice`:
 *      header card   :140-143  y=190 h=44 r=12   ⇒ `rounded-xl`, `min-h-touch` (44 — as drawn)
 *      type · level  :142      13px Bold, right  ⇒ `text-sm font-bold`
 *      clock         :143-144  13px Bold, left   ⇒ `text-sm font-bold`, LTR, tabular
 *      counter       :145      11.5px, centred   ⇒ `text-sm` — raised, `check:text-floor`
 *      question card :146-149  h=110 r=18        ⇒ `rounded-2xl` (16 — the five-value scale
 *                                                   (D-102) has ⛔ no 18)
 *      stem          :148-149  15px, LTR         ⇒ `text-base`, inside `<EnWord>`
 *      option row    :151-164  h=54 r=14, pitch 58 ⇒ `min-h-touch` + `py-3`, `rounded-xl` (12 —
 *                                                   14 has ⛔ no name in the scale; rounding DOWN
 *                                                   keeps the row visibly distinct from the 16
 *                                                   question card above it), `space-y-1`
 *      radio         :160      circle r=11, right ⇒ a 22px ring, first in RTL order
 *      feedback card :166-175  h=96 r=16          ⇒ `rounded-2xl` — exact
 *      verdict       :169      13.5px Bold        ⇒ `text-sm font-bold`
 *      explanation   :170-174  12px, two lines    ⇒ `text-sm` — raised, `check:text-floor`
 *
 * ── Declared layer-A gaps (the gates override the render, `36 § 14.4`): counter 11.5→14px ·
 *    explanation 12→14px · option radius 14→12 · question-card radius 18→16.
 * ── The render is dark; the product is light (`36 § 14.2`, Roy 11/09). The background is
 *    ⛔ NOT a gap — every colour below is a product token.
 *
 * ── 🔴 THE ONE DEVIATION THAT IS ⛔ NOT A SIZE — the clock. The render draws a COUNTDOWN
 *    (`:143`, `secs` falling, `DANGER` under 15). `plan/20-alerts.md` **R-020** forbids time
 *    pressure outside the arena and `D-049` narrows a clock to material the learner already
 *    knows (Nation 2007). ⇒ built as an elapsed stopwatch counting UP: ⛔ no deadline, ⛔ no
 *    danger tint, ⛔ no failure state. Full reasoning and the `F-222` reference live in
 *    `lib/core/amirnetQuestion.ts`'s header. ⚠️ ⛔ Not a statement about `T-296`'s simulation,
 *    where a per-chapter countdown is the product being simulated.
 *
 * ── ⛔ No score, XP, currency, streak, leaderboard (`D-050`) · ⛔ no adaptivity (`41 § 7`) ·
 *    ⛔ no score estimate (Roy's, `41 § 9.2`) · correct/incorrect carries an SVG mark **and** the
 *    Hebrew word, so state is ⛔ never colour alone.
 * ── `prefers-reduced-motion`: the clock is text that updates once a second and the reveal is a
 *    re-render. There is ⛔ no animation in this component to reduce (`check:motion`).
 */

export const HEADING_HE = 'תרגול ממוקד';
export const KICKER_HE = 'העולם · אמירנט';

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3.5 8.5l3 3 6-7" />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  );
}

function typeNameHe(item: AmirnetServedItem): string {
  return AMIRNET_TYPES.find((t) => t.type === item.type)?.nameHe ?? '';
}

/**
 * The option's ring state. ⛔ Every branch that carries a colour also carries a MARK or the
 * ring's own weight, so ⛔ nothing here is signalled by hue alone.
 */
function optionClasses(revealed: boolean, isCorrect: boolean, isChosen: boolean): string {
  const base = 'flex min-h-touch w-full items-center gap-3 rounded-xl border px-4 py-3 text-right';
  if (revealed && isCorrect) return `${base} border-2 border-success bg-success/10 text-ink`;
  if (revealed && isChosen) return `${base} border-2 border-danger bg-danger/10 text-ink`;
  if (isChosen) return `${base} border-2 border-brand bg-brand-surface/10 text-ink`;
  return `${base} border-border-subtle bg-surface-raised text-ink`;
}

export interface AmirnetQuestionProps {
  /** Already gated by `servableItems()`. ⛔ The component filters nothing. */
  readonly items: readonly AmirnetServedItem[];
  readonly level: AmirnetLevel;
  /** ⛔ Injectable so the walk and the tests are deterministic; defaults to the real clock. */
  readonly now?: () => number;
  readonly onBackToMenu?: () => void;
}

export default function AmirnetQuestion({ items, level, now, onBackToMenu }: AmirnetQuestionProps) {
  const clock = now ?? (() => Date.now());
  const clockRef = useRef(clock);
  clockRef.current = clock;

  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AmirnetFeedback | null>(null);
  const [startedAt, setStartedAt] = useState(() => clock());
  const [elapsedMs, setElapsedMs] = useState(0);

  const item = items[index];
  const answered = feedback !== null;

  /**
   * DISPLAY only. The answer's response time is the gap between `startedAt` and the stamp taken
   * when the learner presses — ⛔ never a total accumulated by this interval, which a backgrounded
   * or throttled tab would silently under-count.
   */
  useEffect(() => {
    if (item === undefined || answered) return undefined;
    const id = setInterval(() => setElapsedMs(clockRef.current() - startedAt), 1000);
    return () => clearInterval(id);
  }, [item, answered, startedAt]);

  if (item === undefined) {
    return (
      <section>
        <header className="pt-2">
          <p className="text-xs text-ink-muted">{KICKER_HE}</p>
          <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
          <AmirnetTabs active="practice" built={AMIRNET_BUILT_TABS} />
        </header>
        <p className="mt-10 text-base text-ink">{NO_MORE_ITEMS_HE}</p>
        <button
          type="button"
          onClick={onBackToMenu}
          className="mt-4 min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on"
        >
          {BACK_TO_MENU_HE}
        </button>
      </section>
    );
  }

  const answer = (i: number) => {
    if (answered) return;
    setChosen(i);
    setFeedback(feedbackFor(item, i, clock() - startedAt));
  };

  const advance = () => {
    const next = nextIndex(index, items.length);
    setChosen(null);
    setFeedback(null);
    const stamp = clock();
    setStartedAt(stamp);
    setElapsedMs(0);
    setIndex(next === null ? items.length : next);
  };

  return (
    <section>
      <header className="pt-2">
        <p className="text-xs text-ink-muted">{KICKER_HE}</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
        <AmirnetTabs active="practice" built={AMIRNET_BUILT_TABS} />
      </header>

      <div className="mt-6 flex min-h-touch items-center justify-between gap-3 rounded-xl border border-border-subtle bg-surface-raised px-4">
        <p className="text-sm font-bold text-ink">{`${typeNameHe(item)} · רמה ${level}`}</p>
        <p className="text-sm font-bold tabular-nums text-ink-muted">
          <span className="sr-only">{`${ELAPSED_LABEL_HE}: `}</span>
          <span dir="ltr">{elapsedClock(answered ? (feedback?.seconds ?? 0) * 1000 : elapsedMs)}</span>
        </p>
      </div>

      <p className="mt-3 text-center text-sm text-ink-muted">
        {questionCounterHe(index, items.length)}
      </p>

      <div className="mt-3 rounded-2xl border border-border-subtle bg-surface-raised p-4">
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
          const isCorrect = answered && i === feedback.correctIndex;
          const isChosen = i === chosen;
          return (
            <li key={option}>
              <button
                type="button"
                aria-pressed={isChosen}
                aria-disabled={answered}
                onClick={() => answer(i)}
                className={optionClasses(answered, isCorrect, isChosen)}
              >
                <span
                  aria-hidden="true"
                  className={
                    isCorrect
                      ? 'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-success text-success'
                      : answered && isChosen
                        ? 'flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border-2 border-danger text-danger'
                        : isChosen
                          ? 'h-[22px] w-[22px] shrink-0 rounded-full border-2 border-brand'
                          : 'h-[22px] w-[22px] shrink-0 rounded-full border border-border-subtle'
                  }
                >
                  {isCorrect ? <CheckIcon /> : answered && isChosen ? <CrossIcon /> : null}
                </span>
                <span className="flex-1 text-base">
                  <EnWord>{option}</EnWord>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {feedback === null ? null : (
        <div
          className={
            feedback.correct
              ? 'mt-4 rounded-2xl border border-success bg-success/10 p-4'
              : 'mt-4 rounded-2xl border border-danger bg-danger/10 p-4'
          }
        >
          <p
            className={
              feedback.correct
                ? 'flex items-center gap-2 text-sm font-bold text-success'
                : 'flex items-center gap-2 text-sm font-bold text-danger'
            }
          >
            {feedback.correct ? <CheckIcon /> : <CrossIcon />}
            <span>{`${feedback.verdictHe} · ${feedback.secondsHe}`}</span>
          </p>

          {feedback.correct ? null : (
            <p className="mt-2 text-sm text-ink">
              {`${CORRECT_ANSWER_LABEL_HE}: `}
              <EnWord>{item.optionsEn[feedback.correctIndex] ?? ''}</EnWord>
            </p>
          )}

          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feedback.explanationHe}</p>

          <button
            type="button"
            onClick={advance}
            className="mt-4 min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on"
          >
            {NEXT_HE}
          </button>
        </div>
      )}
    </section>
  );
}
