/**
 * שער שאלת ההבנה — החצי הטהור של T-189 (`36 § 7` · K-001).
 *
 * ⛔ טהור: אפס React · DOM · רשת · שעון · env. כמו `storyGate`, הקובץ ⛔ אינו יודע
 * מאין באות קבוצות ההיתר — הקורא בונה אותן, וזה התקדים של `GateOptions.allowedWords`.
 *
 * **הצורה, לפי T-188:** השאלה **באנגלית**, שלוש התשובות **בעברית**.
 *
 * ⚠️ **סתירה בתוך T-189 שהוכרעה כאן, ונרשמת ל-Critic ⛔ ולא נבלעת:** ⓑ דורש
 * ש«מילת תוכן שאינה בבנק ברמת הסיפור או נמוכה ממנה» תיפסל **«בשאלה ובשלוש
 * התשובות»** — אבל T-188 קובע שהתשובות עבריות, ובנק הלמות שלנו אנגלי. ⛔ אי אפשר
 * לבדוק מחרוזת עברית מול קבוצת למות אנגליות. ⇒ **ההכרעה: התשובות נבדקות מול
 * קבוצת התרגומים העבריים של אותן ערכי בנק** (`allowedHebrew`), שהקורא בונה מאותה
 * שאילתה בדיוק. זה מקיים את כוונת ⓑ — «אין מילה שהלומד לא ראה» — בשתי השפות.
 *
 * ⛔ **מה שהשער ⛔ אינו יודע לבדוק, ו⛔ אינו מתיימר:**
 *   · **נושא רגיש** — עין אנושית, בדיוק כמו בסיפורים (T-189, מפורשות).
 *   · **האם השאלה באמת נענית מהסיפור.** `not_grounded` הוא **פרוקסי מדיד**, ⛔ לא
 *     הוכחה: שאלת ידע כללי («What is the capital of France?») ⛔ אינה חולקת מילות
 *     תוכן עם הסיפור, ולכן נתפסת. שאלה גרועה שכן חולקת אותן — ⛔ אינה נתפסת, וזה
 *     נאמר כאן במפורש כדי שאיש לא יסתמך על השער במקום לקרוא.
 */
import type { StoryLevel } from './storyGate';
import { storyLemma } from './storyGate';

/** T-188ⓐ: שלוש תשובות. ⛔ לא פרמטר כוונון. */
export const ANSWERS_PER_QUESTION = 3;

/**
 * ⛔ מחלקה סגורה, ⛔ ולא טענה פדגוגית: אלה מילות התפקוד שנושאות את **צורת** השאלה
 * ולכן ⛔ אינן נדרשות להופיע בסיפור. ⚠️ הרשימה משמשת **אך ורק** להחרגה מבדיקת
 * העיגון — היא ⛔ אינה מעניקה היתר אוצר מילים, ומילה כאן שאינה בבנק עדיין נפסלת.
 */
const QUESTION_FUNCTION_WORDS: ReadonlySet<string> = new Set([
  'what', 'who', 'where', 'when', 'why', 'how', 'which', 'whose',
  'is', 'are', 'was', 'were', 'do', 'does', 'did', 'be', 'been', 'being',
  'the', 'a', 'an', 'this', 'that', 'these', 'those',
  'of', 'to', 'in', 'on', 'at', 'for', 'with', 'from', 'by', 'about',
  'and', 'or', 'but', 'if', 'not', 'no', 'so',
  'he', 'she', 'it', 'they', 'we', 'you', 'i', 'his', 'her', 'its', 'their',
  'have', 'has', 'had', 'will', 'would', 'can', 'could', 'may', 'might',
]);

export interface StoryQuestionRecord {
  readonly storyLevel: StoryLevel;
  /** קושר את הפריט לסיפור שלו. ⛔ הקליטה, ⛔ לא השער, מוודאת שהכותרת קיימת. */
  readonly storyTitleEn: string;
  readonly questionEn: string;
  readonly answersHe: readonly string[];
  readonly correctIndex: number;
}

export type StoryQuestionGateReason =
  | 'wrong_answer_count'
  | 'bad_correct_index'
  | 'duplicate_answers'
  | 'unknown_words'
  | 'unknown_hebrew'
  | 'correct_is_longest'
  | 'not_grounded'
  | 'digit_in_text';

export interface StoryQuestionGateResult {
  readonly ok: boolean;
  readonly unknownWords: readonly string[];
  readonly unknownHebrew: readonly string[];
  readonly reasons: readonly StoryQuestionGateReason[];
}

export interface StoryQuestionGateOptions {
  readonly allowedLemmas: ReadonlySet<string>;
  readonly allowedHebrew: ReadonlySet<string>;
  /** גוף הסיפור שהשאלה נשענת עליו. העיגון נמדד מולו. */
  readonly storyBodyEn: string;
}

const DIGIT = /[0-9]/;
const TOKEN = /[a-z']+/g;

const tokensOf = (text: string): string[] => text.toLowerCase().match(TOKEN) ?? [];

/**
 * ⛔ **שתי** מילות תוכן משותפות, ⛔ ולא אחת — ומזה יש נימוק, ⛔ לא טעם: `girl` או
 * `book` מופיעות כמעט בכל סיפור, ולכן חפיפה של מילה אחת היא צירוף מקרים סביר.
 * שתיים היא כבר צירוף. ⚠️ שאלה קצרה שיש בה מילת תוכן אחת בלבד נמדדת מול אותה אחת.
 */
const MIN_SHARED_CONTENT_WORDS = 2;

export function storyQuestionGate(
  record: StoryQuestionRecord,
  opts: StoryQuestionGateOptions,
): StoryQuestionGateResult {
  const reasons: StoryQuestionGateReason[] = [];

  if (record.answersHe.length !== ANSWERS_PER_QUESTION) reasons.push('wrong_answer_count');
  if (
    !Number.isInteger(record.correctIndex) ||
    record.correctIndex < 0 ||
    record.correctIndex >= record.answersHe.length
  ) {
    reasons.push('bad_correct_index');
  }

  const trimmed = record.answersHe.map((a) => a.trim());
  if (new Set(trimmed).size !== trimmed.length) reasons.push('duplicate_answers');

  // ── vocabulary, English side ──
  const questionTokens = tokensOf(record.questionEn);
  const unknown = new Set<string>();
  for (const token of questionTokens) {
    if (storyLemma(token, opts.allowedLemmas) === null) unknown.add(token);
  }
  unknown.delete('');
  if (unknown.size > 0) reasons.push('unknown_words');

  // ── vocabulary, Hebrew side (see the header note on T-189's contradiction) ──
  const unknownHe = new Set<string>();
  for (const answer of trimmed) {
    if (answer !== '' && !opts.allowedHebrew.has(answer)) unknownHe.add(answer);
  }
  if (unknownHe.size > 0) reasons.push('unknown_hebrew');

  // ── the correct answer must not be the longest ──
  // ⛔ Strictly longest: a tie is NOT a giveaway, and rejecting a tie would force
  // the writer to pad a wrong answer, which is a worse item.
  if (
    record.correctIndex >= 0 &&
    record.correctIndex < trimmed.length &&
    trimmed.every(
      (a, i) => i === record.correctIndex || a.length < trimmed[record.correctIndex]!.length,
    ) &&
    trimmed.length > 1
  ) {
    reasons.push('correct_is_longest');
  }

  // ── grounding: a measurable proxy, ⛔ not a proof (see the header) ──
  const storyLemmas = new Set<string>();
  for (const token of tokensOf(opts.storyBodyEn)) {
    const lemma = storyLemma(token, opts.allowedLemmas);
    if (lemma !== null) storyLemmas.add(lemma);
  }
  const contentLemmas = new Set<string>();
  for (const token of questionTokens) {
    if (QUESTION_FUNCTION_WORDS.has(token)) continue;
    const lemma = storyLemma(token, opts.allowedLemmas);
    if (lemma !== null) contentLemmas.add(lemma);
  }
  const shared = [...contentLemmas].filter((l) => storyLemmas.has(l)).length;
  const needed = Math.min(MIN_SHARED_CONTENT_WORDS, contentLemmas.size);
  if (contentLemmas.size === 0 || shared < needed) reasons.push('not_grounded');

  if (DIGIT.test(record.questionEn) || trimmed.some((a) => DIGIT.test(a))) {
    reasons.push('digit_in_text');
  }

  return {
    ok: reasons.length === 0,
    unknownWords: [...unknown].sort(),
    unknownHebrew: [...unknownHe].sort(),
    reasons,
  };
}
