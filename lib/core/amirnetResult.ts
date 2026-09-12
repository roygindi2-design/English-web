/**
 * PURE. The amirnet simulation RESULT — what a finished run is worth saying about itself.
 * `T-298` · `41 § 7` «מסך תוצאה» · `41 § 8` item 3. **המשך של: T-296** — the engine there
 * runs the chapters; this module reads what a finished run already produced and ⛔ derives
 * ⛔ nothing the run did not measure.
 *
 * 🎯 Render: `docs/design/kol-D-07-result.png`, drawn by `docs/design/render_video_D.py`
 * `scene_result` (:311-345) over `CHAPTERS` (:252-253) and its own `res` table (:325-326).
 * Every number and every string below was grepped from that function, ⛔ not eyeballed.
 *
 * ⛔ Zero React, window, document, localStorage, fetch, process.env, `Date.now()` —
 * `scripts/check-core-purity.mjs`. The run's elapsed seconds arrive measured.
 *
 * ── 🔴 ⛔ THE SCORE ESTIMATE IS ⛔ NOT BUILT HERE, AND THAT IS THE ROW'S OWN ⓒ.
 *    The render draws a 50–150 dial and a «you rose N» line above the breakdown
 *    (`scene_result`: `score_dial` :315 · the line at :317). `41 § 9.2` declares the formula
 *    **unpublished and Roy's**, and forbids reconstructing מאל״ו's own calculation. `41 § 8`
 *    puts score estimation in item 4 — ⛔ not item 3, which is what this row belongs to.
 *    ⇒ the screen shows **what was measured** — correctness and time — and ⛔ invents ⛔ no
 *    number. That is the same fence `T-291` already stood at, where the dashboard's dial was
 *    ⛔ not built either. ⚠️ Declared as a gap with the render's own numbers, ⛔ not closed
 *    silently: the 200px gradient card at :314 becomes a card of measured totals.
 *    ⛔ And «ההפרש מהסימולציה הקודמת» (`41 § 7`) goes with it — a difference between two
 *    numbers that ⛔ do not exist is ⛔ not a smaller feature, it is the same one.
 *
 * ── ⛔ No time-based scoring and ⛔ no speed multiplier (`R-020`'s live half). The elapsed
 *    minutes are a FACT `41 § 7` requires the screen to show — ⛔ never a rate, ⛔ never a
 *    bonus, and ⛔ nothing here reaches `word_progress` (invariant `37 § 13.1`).
 * ── ⛔ No points, coins, streak or leaderboard (`R-022` · `D-050`).
 * ── The render is dark; the product is light (`36 § 14.2`, Roy 11/09) ⇒ a background
 *    difference is ⛔ not a gap.
 */

import {
  AMIRNET_TYPES,
  weakestType,
  type AmirnetPracticeType,
  type AmirnetTypeStat,
} from './amirnetPractice';
import { AMIRNET_CHAPTERS, CHAPTER_COUNT, chapterAt } from './amirnetSimulation';

/**
 * One finished chapter, as the run measured it. ⛔ Four fields and ⛔ not a fifth: a field
 * derived from these (a rate, a rank, a score) would be a decision taken where the run is
 * being reported instead of where it happened.
 */
export interface AmirnetChapterOutcome {
  readonly chapterIndex: number;
  readonly correct: number;
  /** Answered, ⛔ not asked — a chapter whose clock ran out answered fewer than it held. */
  readonly answered: number;
  readonly elapsedSeconds: number;
}

/**
 * Three standings, and ⛔ they are the render's own three colours (:333 — `SUCCESS` when
 * every answer was right, `AMBER` one short, `DANGER` otherwise). ⛔ Each carries WORDS, because
 * layer A forbids state in colour alone and this is the row's only per-chapter judgement.
 */
export type AmirnetRowStanding = 'full' | 'near' | 'weak';

export interface AmirnetResultRow {
  readonly chapterIndex: number;
  readonly type: AmirnetPracticeType;
  /** `1. השלמת משפטים` — the render's own shape at :335. */
  readonly positionHe: string;
  /** `4/4`, drawn LTR at :338. The screen renders it `dir="ltr"` for exactly that reason. */
  readonly correctLtr: string;
  /** `41 § 7` in words — «נכונות מתוך סה״כ». The label a screen reader reads. */
  readonly correctHe: string;
  /** `3.1 דק׳` — «זמן בפועל» (:336). ⛔ The budget is ⛔ not this number. */
  readonly timeHe: string;
  readonly standing: AmirnetRowStanding;
  readonly standingHe: string;
}

export interface AmirnetResultWeakness {
  readonly type: AmirnetPracticeType;
  readonly nameHe: string;
  /** `החולשה: הבנת הנקרא · 3 מתוך 5` — the render's own line at :343. */
  readonly titleHe: string;
  readonly adviceHe: string;
}

/** Verbatim from the render (:316 · :344). */
export const CHAPTER_BREAKDOWN_HE = 'פירוט לפי פרק';
export const WEAKNESS_ADVICE_HE = 'לתרגול ממוקד בסוג הזה';
const WEAKNESS_PREFIX_HE = 'החולשה: ';

/** What the summary card says, now that the dial it replaces is ⛔ not ours to draw. */
export const MEASURED_CORRECT_LABEL_HE = 'תשובות נכונות';
export const MEASURED_TIME_LABEL_HE = 'זמן בפועל';
export const CHAPTERS_LABEL_HE = 'פרקים שהושלמו';

export const EMPTY_RUN_HE = 'לא הושלם אף פרק בסימולציה הזאת';
export const NO_WEAKNESS_HE = 'אין סוג אחד חלש בריצה הזאת';
export const PRACTICE_ALL_HE = 'לתרגול לפי בחירה';
export const BACK_TO_DASHBOARD_HE = 'חזרה לדשבורד';

function typeNameHe(type: AmirnetPracticeType): string {
  return AMIRNET_TYPES.find((t) => t.type === type)?.nameHe ?? '';
}

/**
 * `3.1 דק׳`, one decimal, exactly as the render writes every chapter's time (:325-326, :336).
 * ⛔ No second unit below a minute: one unit across six rows is what makes the column
 * comparable at a glance, and the render uses that one.
 */
export function minutesHe(seconds: number): string {
  const safe = Math.max(0, seconds);
  return `${(safe / 60).toFixed(1)} דק׳`;
}

function standingOf(correct: number, answered: number): AmirnetRowStanding {
  if (answered > 0 && correct >= answered) return 'full';
  if (correct >= answered - 1) return 'near';
  return 'weak';
}

function standingHe(standing: AmirnetRowStanding, correct: number, answered: number): string {
  if (standing === 'full') return 'כל התשובות נכונות';
  const wrong = Math.max(0, answered - correct);
  if (wrong === 1) return 'תשובה אחת שגויה';
  return `${wrong} תשובות שגויות`;
}

/**
 * ONE ROW PER CHAPTER THE RUN ACTUALLY FINISHED — ⛔ never one per chapter that exists.
 *
 * 🔴 This is `T-298`'s own failure scenario, and it is the whole reason the function exists
 * instead of the component mapping `AMIRNET_CHAPTERS`: a run stopped after five chapters must
 * draw **five** rows. Padding to six puts a `—` on screen where a measurement never happened,
 * and `—` is ⛔ not an answer (`T-298`ⓓ · the same rule `amirnetPractice.ts` states for a type
 * with zero answers). The short run says so in a SENTENCE — `shortRunNoticeHe` below.
 * ⚠️ An outcome naming a chapter that ⛔ does not exist is dropped rather than drawn: the
 * alternative is a row whose title is blank.
 */
export function resultRows(
  outcomes: readonly AmirnetChapterOutcome[],
): readonly AmirnetResultRow[] {
  return outcomes
    .filter((o) => chapterAt(o.chapterIndex) !== undefined)
    .map((o) => {
      const chapter = AMIRNET_CHAPTERS[o.chapterIndex] as (typeof AMIRNET_CHAPTERS)[number];
      const standing = standingOf(o.correct, o.answered);
      return {
        chapterIndex: o.chapterIndex,
        type: chapter.type,
        positionHe: `${o.chapterIndex + 1}. ${typeNameHe(chapter.type)}`,
        correctLtr: `${o.correct}/${o.answered}`,
        correctHe: `${o.correct} נכונות מתוך ${o.answered}`,
        timeHe: minutesHe(o.elapsedSeconds),
        standing,
        standingHe: standingHe(standing, o.correct, o.answered),
      };
    });
}

export function isShortRun(outcomes: readonly AmirnetChapterOutcome[]): boolean {
  return resultRows(outcomes).length < CHAPTER_COUNT;
}

/** `5 מתוך 6` — the value beside a written label, where the label already says «פרקים». */
export function chaptersDoneShortHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  return `${resultRows(outcomes).length} מתוך ${CHAPTER_COUNT}`;
}

/**
 * `5 פרקים מתוך 6` — the same fact as a standalone sentence. ⛔ Two strings and ⛔ not one,
 * for the reason `amirnetPractice.ts` already gives for `answeredHe`/`answeredShortHe`: the
 * label-and-value form would otherwise read «פרקים שהושלמו: 5 פרקים מתוך 6».
 */
export function chaptersDoneHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  return `${resultRows(outcomes).length} פרקים מתוך ${CHAPTER_COUNT}`;
}

/**
 * `T-298`ⓓ — the written short-run state. ⛔ An interrupted run is ⛔ not an error and
 * ⛔ not an empty table; it is a run with fewer chapters, and the screen says which.
 */
export function shortRunNoticeHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  const done = resultRows(outcomes).length;
  if (done >= CHAPTER_COUNT) return '';
  if (done === 0) return EMPTY_RUN_HE;
  return `הסימולציה הופסקה אחרי ${done} פרקים מתוך ${CHAPTER_COUNT}. הפירוט כאן הוא של מה שהושלם`;
}

/** `18 מתוך 23` — the value beside the written label `תשובות נכונות`. */
export function runCorrectShortHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  const rows = outcomes.filter((o) => chapterAt(o.chapterIndex) !== undefined);
  const correct = rows.reduce((n, o) => n + o.correct, 0);
  const answered = rows.reduce((n, o) => n + o.answered, 0);
  return `${correct} מתוך ${answered}`;
}

/** The same fact as a sentence — `41 § 7`'s «נכונות מתוך סה״כ» for the run as a whole. */
export function runCorrectHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  const rows = outcomes.filter((o) => chapterAt(o.chapterIndex) !== undefined);
  const correct = rows.reduce((n, o) => n + o.correct, 0);
  const answered = rows.reduce((n, o) => n + o.answered, 0);
  return `${correct} נכונות מתוך ${answered}`;
}

export function runTimeHe(outcomes: readonly AmirnetChapterOutcome[]): string {
  const seconds = outcomes
    .filter((o) => chapterAt(o.chapterIndex) !== undefined)
    .reduce((n, o) => n + Math.max(0, o.elapsedSeconds), 0);
  return minutesHe(seconds);
}

/**
 * The run, folded onto the three question types — in `AMIRNET_TYPES` order, and always all
 * three. ⚠️ A type the run never reached stays at `answered: 0` on purpose: that is precisely
 * what makes `weakestType` refuse to name a weakness (`T-291`ⓑ), and ⛔ dropping the row
 * would let it compare two types and call one of them «the» weak one.
 */
export function runTypeStats(
  outcomes: readonly AmirnetChapterOutcome[],
): readonly AmirnetTypeStat[] {
  return AMIRNET_TYPES.map((t) => {
    const mine = outcomes.filter((o) => chapterAt(o.chapterIndex)?.type === t.type);
    return {
      type: t.type,
      answered: mine.reduce((n, o) => n + o.answered, 0),
      correct: mine.reduce((n, o) => n + o.correct, 0),
    };
  });
}

/**
 * ⛔ ONE PLACE DECIDES WHICH TYPE IS WEAK, and it is ⛔ not this file: `weakestType()` in
 * `amirnetPractice.ts` already answers that question for the practice menu and the dashboard
 * (`T-286` · `T-291`). A second comparison here would be the drift that module exists to
 * prevent (constitution § 6), and it would let two screens disagree about a learner's weak spot.
 * ⇒ this function only WORDS the answer, in the result render's own two lines (:343-344) —
 * which are ⛔ not the dashboard's two lines, the same way `answeredHe` and `answeredShortHe`
 * are two strings for one fact.
 */
export function runWeakness(
  outcomes: readonly AmirnetChapterOutcome[],
): AmirnetResultWeakness | null {
  const stats = runTypeStats(outcomes);
  const type = weakestType(stats);
  if (type === null) return null;
  const stat = stats.find((s) => s.type === type);
  if (stat === undefined) return null;
  const nameHe = typeNameHe(type);
  return {
    type,
    nameHe,
    titleHe: `${WEAKNESS_PREFIX_HE}${nameHe} · ${stat.correct} מתוך ${stat.answered}`,
    adviceHe: WEAKNESS_ADVICE_HE,
  };
}
