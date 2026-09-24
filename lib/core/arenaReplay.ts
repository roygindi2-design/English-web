import type { BattleCast } from './battle';

/**
 * 🔁 `T-451` · `37 § 8` ק8 — «חזרה מהירה»: «3 המילים שהוחטאו חוזרות פעם אחת, מחוץ לשעון».
 *
 * ⛔ **טהורה** (`/lib/core/` — אפס React, אפס רשת). היא ⛔ אינה נוגעת ב-`BattleState`:
 * ניסיונות החזרה ⛔ אינם `cast` ⇒ ⛔ אינם נכנסים ל-`battle.casts`, ⇒ `summarize`,
 * `endingOf` והמטען של `POST /api/arcade/result` ⛔ אינם יכולים לראות אותם.
 * ⛔ `37 § 10`: הזירה ⛔ אינה כותבת ל-`word_progress` — גם החזרה ⛔ לא.
 */
export const REPLAY_MAX = 3;

/**
 * המילים שחוזרות: הוחטאו, ⛔ ולא נענו נכון **אחרי** הטעות האחרונה שלהן · מזהה ייחודי ·
 * **שלוש הראשונות בסדר הטעות הראשונה** — הרווח הארוך ביותר מאז הטעות (הכרעת PM).
 * ⛔ אפס טעויות ⇒ `[]` ⇒ השלב מדולג כולו.
 */
export function replayWordIds(casts: readonly BattleCast[]): readonly string[] {
  const firstMiss = new Map<string, number>();
  const resolved = new Set<string>();
  casts.forEach((c, i) => {
    if (c.correct) {
      if (firstMiss.has(c.wordId)) resolved.add(c.wordId);
      return;
    }
    // טעות חדשה אחרי תיקון ⇒ המילה שוב פתוחה, והטעות הזאת היא נקודת הספירה שלה.
    if (resolved.has(c.wordId)) {
      resolved.delete(c.wordId);
      firstMiss.set(c.wordId, i);
      return;
    }
    if (!firstMiss.has(c.wordId)) firstMiss.set(c.wordId, i);
  });
  return [...firstMiss.entries()]
    .filter(([id]) => !resolved.has(id))
    .sort((a, b) => a[1] - b[1])
    .slice(0, REPLAY_MAX)
    .map(([id]) => id);
}

/** `ⓒ` — השורה בסיכום: «תיקנת 2 מתוך 3». ⛔ `total` הוא מה שהוצג, ⛔ לא מה שנענה. */
export function replayTallyHe(fixed: number, total: number): string {
  return `תיקנת ${fixed} מתוך ${total}`;
}
