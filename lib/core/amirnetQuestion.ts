/**
 * PURE. One amirnet practice question and its immediate feedback (T-287 · 41 § 7 · 41 § 8 item 1).
 * 🎯 Renders: docs/design/kol-D-04-practice-question.png · kol-D-05-practice-feedback.png, both
 * drawn by docs/design/render_video_D.py `screen_practice` (:138-175). Every layout value used by
 * the component was grepped from that function, ⛔ not eyeballed from the PNG.
 *
 * ⛔ Zero React, window, document, localStorage, fetch, process.env — `scripts/check-core-purity.mjs`.
 * ⛔ AND ZERO CLOCK: the caller passes `elapsedMs` in. A module that reads `Date.now()` cannot be
 * tested for the one thing that matters here — that the number it reports is the learner's own
 * response time and ⛔ not a deadline.
 *
 * ── ⛔ THE ITEM IS NEVER INVENTED, AND THAT IS THE WHOLE GATE (`R-010`, extended to amirnet by
 *    `RULES § 0.1 ז׳`). `isServable()` REJECTS; it ⛔ never repairs. An item with no Hebrew
 *    explanation is ⛔ not served, and that is ⛔ not grounds to write one here — which is
 *    precisely what a `?? 'אין הסבר'` fallback would be.
 *
 * ── 🔴 DECLARED DEVIATION FROM THE RENDER, and it is a GATE, ⛔ not a taste call (`36 § 14.4`:
 *    the accessibility and product gates override the render).
 *    The render draws the header clock as a COUNTDOWN — `screen_practice(:143)` prints
 *    `f"0:{secs:02d}"` with `secs` falling, coloured `DANGER` below 15 — i.e. time pressure with
 *    a visible failure threshold. `plan/20-alerts.md` **R-020** is live and binding outside the
 *    arena («⛔ אין מכפיל מהירות מחוץ לזירה · ⛔ אין ניקוד לפי זמן מחוץ לזירה»), and `D-049`
 *    narrows a clock to material the learner ALREADY KNOWS, quoting Nation 2007: *"If the
 *    activity involves unknown vocabulary, it is not a fluency activity"*. An amirnet practice
 *    item is, by construction, material the learner is being tested on.
 *    ⇒ the clock here counts **UP**: an elapsed stopwatch, ⛔ no deadline, ⛔ no danger colour,
 *    ⛔ no failure state at any value. `41 § 7` says «שעון» and, in the same sentence, «וזמן
 *    התגובה» — an elapsed clock satisfies both readings; a countdown satisfies only one and
 *    contradicts R-020. **Recorded as `F-222`; the render is ⛔ not amended from a DEV tick.**
 *    ⚠️ This says ⛔ nothing about the SIMULATION (`T-296`), where a per-chapter countdown is the
 *    product being simulated and `41 § 7` mandates it explicitly.
 *
 * ── ⛔ No score, XP, currency, streak or leaderboard (`D-050`). The feedback object carries the
 *    seconds and ⛔ no field derived from them — the test asserts the absence by key name.
 * ── ⛔ No adaptivity (`41 § 7`): nothing here reads an answer to choose the next item.
 * ── ⛔ And response time reaches ⛔ no field of `word_progress` (R-020, invariant `37 § 13.1`) —
 *    this module returns it to the screen and stores nothing.
 */

import type { AmirnetLevel, AmirnetPracticeType } from './amirnetPractice';

/** One item as the screen receives it — already gated. ⛔ The component validates nothing. */
export interface AmirnetServedItem {
  readonly id: string;
  readonly type: AmirnetPracticeType;
  readonly level: AmirnetLevel;
  /** sc: the sentence with the blank. rs: the source sentence. rc: the question. English. */
  readonly stemEn: string;
  /** `rc` only — the passage the question is grounded in. sc/rs carry ''. */
  readonly passageEn: string;
  readonly optionsEn: readonly string[];
  readonly correctIndex: number;
  /** Hebrew, from the item itself. ⛔ Never generated, ⛔ never defaulted. */
  readonly explanationHe: string;
}

export const CORRECT_HE = 'נכון';
export const INCORRECT_HE = 'לא נכון';
export const NO_MORE_ITEMS_HE = 'אין עוד פריטים ברמה הזאת';
export const BACK_TO_MENU_HE = 'חזרה לתפריט התרגול';
export const NEXT_HE = 'הבא';
export const CORRECT_ANSWER_LABEL_HE = 'התשובה הנכונה';
/** The clock's own label, so «what is this number» is ⛔ never inferred from its position. */
export const ELAPSED_LABEL_HE = 'זמן שחלף';

const OPTIONS_PER_ITEM = 4;

/**
 * `m:ss`, counting UP from zero. ⛔ There is no ceiling and ⛔ no wrap — a learner who thinks for
 * eleven minutes reads `11:00`, ⛔ not `1:00`, and ⛔ never a negative number.
 */
export function elapsedClock(elapsedMs: number): string {
  const total = Math.max(0, Math.floor(elapsedMs / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

/** Hebrew counts its own way. `1 שניות` is ⛔ not Hebrew, and `0 שניות` is ⛔ not true either. */
export function secondsHe(seconds: number): string {
  if (seconds <= 0) return 'פחות משנייה';
  if (seconds === 1) return 'שנייה אחת';
  return `${seconds} שניות`;
}

export function questionCounterHe(index: number, total: number): string {
  return `שאלה ${index + 1} מתוך ${total}`;
}

/** null ⇒ the queue is spent. ⛔ It ⛔ does not wrap round to the first item (T-287ⓓ). */
export function nextIndex(index: number, total: number): number | null {
  const next = index + 1;
  return next < total ? next : null;
}

/**
 * The serving gate. ⛔ Four refusals, ⛔ and every one of them is a refusal to GUESS:
 *   ⓐ `level` outside 1–4 — including the `null` that 1,602 pre-`D-141` rows carry. That null is
 *      a declared legal state in the schema (`0021_sense_items_level.sql`), ⛔ not a gap to fill;
 *   ⓑ no Hebrew explanation — `T-287`'s own fence, and ⛔ not grounds to write one;
 *   ⓒ `correctIndex` outside the item's own options — a silent fall-back to 0 would mark a
 *      learner wrong on a correct answer;
 *   ⓓ the wrong number of options (`41 § 6.4`, four).
 */
export function isServable(item: AmirnetServedItem): boolean {
  if (!Number.isInteger(item.level) || item.level < 1 || item.level > 4) return false;
  if (item.explanationHe.trim() === '') return false;
  if (item.optionsEn.length !== OPTIONS_PER_ITEM) return false;
  if (!Number.isInteger(item.correctIndex)) return false;
  if (item.correctIndex < 0 || item.correctIndex >= item.optionsEn.length) return false;
  if (item.stemEn.trim() === '') return false;
  return true;
}

export function servableItems(items: readonly AmirnetServedItem[]): readonly AmirnetServedItem[] {
  return items.filter(isServable);
}

export interface AmirnetFeedback {
  readonly correct: boolean;
  /** The WRITTEN channel. State is ⛔ never colour alone (constitution, layer A). */
  readonly verdictHe: string;
  readonly correctIndex: number;
  /** The item's own explanation, wrong answer and right answer alike. */
  readonly explanationHe: string;
  readonly seconds: number;
  readonly secondsHe: string;
}

/**
 * ⚠️ The explanation is returned on BOTH outcomes on purpose. Showing it only when the learner
 * errs makes it a punishment; withholding it when they err makes the screen useless. `41 § 7`
 * asks for «משוב מיידי עם הסבר בעברית» with ⛔ no condition attached.
 */
export function feedbackFor(
  item: AmirnetServedItem,
  selectedIndex: number,
  elapsedMs: number,
): AmirnetFeedback {
  const correct = selectedIndex === item.correctIndex;
  const seconds = Math.max(0, Math.round(elapsedMs / 1000));
  return {
    correct,
    verdictHe: correct ? CORRECT_HE : INCORRECT_HE,
    correctIndex: item.correctIndex,
    explanationHe: item.explanationHe,
    seconds,
    secondsHe: secondsHe(seconds),
  };
}
