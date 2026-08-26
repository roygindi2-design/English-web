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
  return { total: vocabulary.size, known };
}
