/**
 * PURE. ⛔ אפס React, DOM, שעון, רשת ו-env.
 *
 * שתי הפונקציות הועברו לכאן **מילה במילה** מ-`lib/core/arcadeRound.ts:71-90` (C-0321).
 * ⛔ אין כאן שינוי התנהגות: אותו seed מחזיר את אותה תמורה בדיוק, ו-`shuffle.test.ts`
 * מחזיק את התמורות שנמדדו **לפני** ההעברה כזהב.
 *
 * ⚠️ הסיבה שהן יצאו: `sentenceItem.ts` צריך בדיוק את אותה הגרלה ניתנת-לשחזור, ועותק שני
 * של גנרטור הוא מקום שבו שני מסלולים סוטים בשקט. `Math.random` ⛔ אינו חלופה — הגרלה
 * שאי-אפשר לשחזר היא פריט שאי-אפשר לכתוב עליו בדיקה.
 */

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(items: readonly T[], rnd: () => number): T[] {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rnd() * (i + 1));
    // ⛔ ⛔ לא destructuring swap: `noUncheckedIndexedAccess` מטפס `out[i]` ל-`T | undefined`
    // וההשמה ההדדית אינה מהדרת (נמדד בהרצת `tsc --noEmit`, C-0178).
    const atI = out[i] as T;
    const atJ = out[j] as T;
    out[i] = atJ;
    out[j] = atI;
  }
  return out;
}
