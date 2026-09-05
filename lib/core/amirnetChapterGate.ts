/**
 * שער הפרק — הצד שרק קבוצת שאלות חושפת: T-223, `41 § 6.2` (הבנת הנקרא).
 *
 * ⛔ טהור, כמו `amirnetItemGate` שעליו הוא בנוי. כל שאלה נבדקת קודם בשער הפריט
 * (options · vocab · אורך קטע וכו') ואז מתווספות שתי בדיקות שרק חמש שאלות ביחד
 * חושפות: שכולן חולקות אותו קטע וזהות רמה, ושפיזור התשובה הנכונה אינו קבוע.
 */
import {
  amirnetItemGate,
  type AmirnetGateOptions,
  type AmirnetItemRecord,
} from './amirnetItemGate';

export const RC_QUESTIONS_PER_CHAPTER = 5;

export type AmirnetChapterGateReason =
  | 'wrong_question_count'
  | 'passage_mismatch'
  | 'level_mismatch'
  | 'not_all_rc'
  | 'correct_index_not_spread'
  | `item_${number}_failed`;

export interface AmirnetChapterGateResult {
  readonly ok: boolean;
  readonly reasons: readonly AmirnetChapterGateReason[];
  readonly perQuestion: readonly ReturnType<typeof amirnetItemGate>[];
}

export function amirnetChapterGate(
  questions: readonly AmirnetItemRecord[],
  opts: AmirnetGateOptions,
): AmirnetChapterGateResult {
  const reasons: AmirnetChapterGateReason[] = [];

  if (questions.length !== RC_QUESTIONS_PER_CHAPTER) reasons.push('wrong_question_count');

  if (questions.some((q) => q.type !== 'rc')) reasons.push('not_all_rc');

  const firstPassage = questions[0]?.passageEn ?? '';
  if (questions.some((q) => q.passageEn !== firstPassage)) reasons.push('passage_mismatch');

  const firstLevel = questions[0]?.level;
  if (questions.some((q) => q.level !== firstLevel)) reasons.push('level_mismatch');

  // ⛔ Every question landing on the same correctIndex is the collection-level
  // giveaway pattern (a learner who always picks "C" would score suspiciously
  // well). A tie across at most 4 of 5 is fine; only all-identical is flagged —
  // five questions is too small a sample to police an exact distribution.
  const correctIndices = questions.map((q) => q.correctIndex);
  if (correctIndices.length > 0 && new Set(correctIndices).size === 1) {
    reasons.push('correct_index_not_spread');
  }

  const perQuestion = questions.map((q) => amirnetItemGate(q, opts));
  perQuestion.forEach((result, i) => {
    if (!result.ok) reasons.push(`item_${i}_failed`);
  });

  return { ok: reasons.length === 0, reasons, perQuestion };
}
