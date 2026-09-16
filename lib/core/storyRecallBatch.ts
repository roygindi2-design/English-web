/**
 * PURE — `T-208` · `D-254` (`§ 4.2כב`). ⛔ Zero React, DOM, network, clock, env.
 *
 * **מה נכנס לתור החזרות בסוף הסיפור, ו⛔ בכמה.** `D-254`ⓐ קובע שהמועמדות היחידות הן
 * **המילים שהלומד הקיש עליהן** — הקשה היא שליפה מוצהרת (`10-pedagogy § 1.15` S22 ·
 * S21) — ו⛔ **מילה שהוא רק עבר מעליה ⛔ אינה מועמדת**. זה בדיוק תרחיש הכשל ש-`T-208`
 * נוקבת בו: «מילה עוברת ל«בתור חזרה» על סמך כלום» = כשל הזירה מ-23/08.
 *
 * ⛔ **התקרה ⛔ אינה כאן, והיא ⛔ לא תהיה כאן.** `cap` הוא **פרמטר**, כי המספר עצמו
 * (`NEW_CARDS_PER_DAY`) הוא **פרמטר מוצר** שיושב ב-`app/api/study/queue/route.ts`,
 * ואותו קובץ מצהיר במפורש שהוא ⛔ אינו עובר ל-`/lib/core` כדי שקורא מאוחר ⛔ לא יצטט
 * אותו כאילו השכבה הטהורה גזרה אותו. ⇒ השכבה הזאת יודעת **לחתוך**, ⛔ ולא **כמה**.
 *
 * ⛔ **⛔ ואין כאן מילוי של שארית** (`D-254`ⓑ): הקיש הלומד על 2 ⇒ יוצאות 2, ⛔ ולא 5.
 * מילוי מ«מילים שלא הוקשו» הוא בדיוק ה-`attempts` בלי שליפה ש-ⓐ אוסר.
 * ⛔ **והסדר הוא סדר ההקשה** — ⛔ לא תדירות ו⛔ לא רמה: ⛔ אין כאן פדגוגיה חדשה
 * להמציא (`R-010`), יש סדר שהלומד עצמו יצר.
 */

/** מה שצריך כדי לכתוב — הלמה שהלומד רואה, והמזהה שהשרת מקבל. */
export interface StoryRecallCandidate {
  readonly lemma: string;
  readonly wordId: string;
}

export interface StoryRecallGloss {
  readonly wordId: string;
}

/**
 * ⛔ **שלושה מסננים, ⛔ וכל אחד מהם מדיד בנפרד:**
 * ⓐ **כפילות** — אותה למה שהוקשה פעמיים היא **שליפה אחת של אותה מילה**, ⛔ ולא שתי
 *    מועמדות. הראשונה קובעת את המקום בסדר.
 * ⓑ **בלי `wordId` ⛔ אין מה לכתוב** — מילה בלי גלוסה ⛔ אינה יעד הקשה מלכתחילה
 *    (`36 § 3` תנאי 1), ⇒ אם היא בכל זאת הגיעה לכאן, ⛔ אין לה שורה ב-`words`.
 * ⓒ **מה שכבר נחת ⛔ אינו «נוסף»** — הלומד כבר ראה «נוספה לחזרה» על המילה הזאת
 *    (`D-183`), ולספור אותה שנית היה הופך את המספר שבמחרוזת לטענה ⛔ לא נכונה.
 *
 * ⚠️ `cap <= 0` ⇒ ריק. ⛔ זו ⛔ אינה שגיאה: היא הצורה של «⛔ אין מה להוסיף היום».
 */
export function selectStoryRecallBatch(
  tapOrder: readonly string[],
  glosses: Readonly<Record<string, StoryRecallGloss>>,
  alreadyAdded: readonly string[],
  cap: number,
): readonly StoryRecallCandidate[] {
  if (cap <= 0) return [];
  const added = new Set(alreadyAdded);
  const seen = new Set<string>();
  const picked: StoryRecallCandidate[] = [];
  for (const lemma of tapOrder) {
    if (seen.has(lemma)) continue;
    seen.add(lemma);
    if (added.has(lemma)) continue;
    const wordId = glosses[lemma]?.wordId;
    if (wordId === undefined) continue;
    picked.push({ lemma, wordId });
    if (picked.length === cap) break;
  }
  return picked;
}
