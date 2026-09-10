/**
 * PURE — T-188ⓓ. ⛔ Zero React, DOM, network, clock, env.
 *
 * ⛔ **Zero randomness, for exactly the reason `lib/core/storyPick.ts` has none:** a
 * learner who refreshes the end screen must see the answers in the SAME order, or the
 * screen looks like it is cheating. The order is a Fisher–Yates walk driven by a small
 * integer hash of the story id — the same order for the same story, ⛔ forever.
 *
 * ⚠️ **Why shuffling at all.** `data/generated/story-questions-*.jsonl` carries
 * `correct_index` as written, and `storyQuestionGate` already rejects «the correct answer
 * is the longest». It ⛔ does not, and ⛔ cannot, stop the correct answer sitting at the
 * same index across a batch — and «the answer is always the second one» is a shortcut a
 * learner finds long before we do. This is the fix, and it costs ⛔ zero columns.
 */
/**
 * ⛔ **ביטחון דקדוקי — מה שהכותב באמת יודע על הפריט.**  ⟦10/09 · `R-014`⟧
 * מדגם, ⛔ ולא כל פריט: ברירת המחדל `medium`, יורד ל-`low` כשיש חשש ועולה ל-`high`
 * אחרי אימות. ⛔ **ברירת מחדל ⛔ אינה טענה שמשהו אומת.**
 */
export const GRAMMAR_CONFIDENCE_VALUES = ['low', 'medium', 'high'] as const;
export type GrammarConfidence = (typeof GRAMMAR_CONFIDENCE_VALUES)[number];

export interface StoryQuestion {
  readonly questionEn: string;
  readonly answersHe: readonly string[];
  readonly correctIndex: number;
  /** ⛔ `R-014` — מחליף את דגימת הבקרה האנושית. ⛔ אופציונלי: שורה ישנה ⛔ אינה שקרנית, היא ⛔ לא הצהירה. */
  readonly grammarConfidence?: GrammarConfidence;
}

/**
 * FNV-1a, 32-bit. Small, stable, and ⛔ not a security primitive — it only has to spread
 * twelve story ids across three positions.
 */
function hashOf(seed: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

export function shuffleAnswers(question: StoryQuestion, storyId: string): StoryQuestion {
  const answers = [...question.answersHe];
  const correct = answers[question.correctIndex];
  if (correct === undefined) return question;

  // Fisher–Yates, walked with a counter mixed into the hash so each swap draws a
  // different number from one seed. ⛔ No clock, ⛔ no randomiser.
  let h = hashOf(storyId);
  for (let i = answers.length - 1; i > 0; i -= 1) {
    h = Math.imul(h ^ (i + 1), 0x01000193) >>> 0;
    const j = h % (i + 1);
    const a = answers[i];
    const b = answers[j];
    if (a === undefined || b === undefined) continue;
    answers[i] = b;
    answers[j] = a;
  }

  return {
    questionEn: question.questionEn,
    answersHe: answers,
    correctIndex: answers.indexOf(correct),
  };
}
