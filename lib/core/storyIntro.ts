/**
 * PURE — T-150 (`36 § 7` · D-043 · D-115). ⛔ Zero React, DOM, network, clock, env.
 *
 * שכבת הפתיחה של מסך הסיפור עונה על שאלה אחת: **«כמה מזה אתה כבר יודע»**.
 *
 * ⛔ **אין כאן עמודה חדשה ו⛔ אין שדה חדש על החוט (T-150ⓐ · D-043).** שני המספרים
 * נגזרים **בזמן תצוגה** משני דברים שכבר נוסעים ב-`GET /api/world/story`: מפתחות
 * `glosses` (המילים שיש להן משמעות אצלנו) ו-`knownLemmas`.
 *
 * ⛔ **מילה בלי משמעות ⛔ אינה נספרת באף אחד משני המספרים (T-150ⓓ).** היא אינה יעד
 * הקשה (`36 § 3` תנאי 1), ולכן היא ⛔ אינה חלק מאוצר המילים של הסיפור — לא כ«חדשה»
 * ולא כ«ידועה». לומד שנושא `zzz` שאין לו גלוסה ⛔ אינו «יודע» מילה בסיפור הזה.
 *
 * ⛔ **`known` הוא «כמה אתה כבר מכיר», ⛔ ולעולם לא «כמה חסרות לך» (T-150ⓒ).**
 * ההיפוך הזה הוא בדיוק מה שהופך משפט פתיחה מעודד לרשימת חובות, ו-
 * `lib/core/storyIntro.test.ts` מפיל אותו **בשם**.
 */
export interface StoryIntro {
  /** Story words that have a sense with us. ⛔ A word with no gloss is in NEITHER number (T-150ⓓ). */
  readonly total: number;
  /** Of those, the ones the learner already carries. ⛔ Never «how many are missing» (T-150ⓒ). */
  readonly known: number;
  /**
   * T-383ⓐ — **what this story came to TEACH him**, derived here and ⛔ nowhere else.
   *
   * ⛔ **And it is ⛔ not `payload.counts.newWords`, which travels on the wire.** The
   * server counts the story BODY (`app/api/world/story/route.ts`), while `glosses` —
   * the set these three numbers are built from — carries the TITLE's words too since
   * `T-240`. ⇒ reading the wire field would print «5 חדשות · 2 ידועות» over **8**
   * marked words, and the learner would be counting a screen that ⛔ does not add up.
   * ⇒ the split is derived from the SAME set the screen paints, ⛔ or it is not derived.
   *
   * ⛔ **`fresh` is ⛔ never «how many are missing» either (T-150ⓒ).** The distinction
   * is the sentence it feeds: «this story teaches you N new words» is what the story is
   * WORTH; «you are missing N words» is a debt list. Same arithmetic, ⛔ opposite screen.
   */
  readonly fresh: number;
}

export function storyIntro(
  lemmasWithSense: readonly string[],
  knownLemmas: readonly string[],
): StoryIntro {
  const vocabulary = new Set(lemmasWithSense);
  const carried = new Set(knownLemmas);
  let known = 0;
  for (const lemma of vocabulary) {
    if (carried.has(lemma)) known += 1;
  }
  // ⛔ `fresh` ⛔ is ⛔ not a second traversal and ⛔ not a second source: `known` is
  // counted out of `vocabulary`, so the complement ⛔ cannot disagree with it (T-383ⓐ).
  return { total: vocabulary.size, known, fresh: vocabulary.size - known };
}
