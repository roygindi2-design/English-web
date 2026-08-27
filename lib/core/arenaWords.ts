/**
 * T-173 · `37-arena-spec § 2` — **מקור המילים של הזירה.** טהור: ⛔ אפס React, DOM, רשת ו-env.
 *
 * ⚠️ זהו **המקום היחיד** שמחליט אילו מילים נכנסות לקרב. הנתיב שואל את הדאטהבייס «אילו
 * מילים יש», ⛔ והוא אינו קובע את התמהיל — תמהיל שנקבע בשני מקומות סוטה בשלישי.
 *
 * ⛔ **הפונקציה קוראת ובלבד** (אינווריאנט `37 § 13.1` · `13.3`): הזירה ⛔ אינה מזיזה את
 * מנוע החזרות, ⛔ ואין כאן ולו שם אחד של שדה שלו. סריקת מקור ב-`arenaWords.test.ts`
 * אוכפת זאת, כי הערה ⛔ אינה אכיפה.
 *
 * ⛔ **אין כאן `Math.random`.** התמהיל נגזר מהיחס בלבד, ⇒ אותו קלט מחזיר את אותו
 * סדר בדיוק — תמהיל שאי-אפשר לשחזר הוא תמהיל שאי-אפשר לכתוב עליו בדיקה.
 *
 * ⚠️ **תרחיש הכשל שהקובץ הזה סוגר:** לומד חדש עם אפס מילים ידועות פותח את הזירה,
 * מקבל מסך ריק ונוטש בקרב הראשון. ⇒ מחסן ריק ⛔ אינו מסך ריק, הוא **100% מילות בסיס**.
 */

/**
 * שלוש הקטגוריות של `37 § 2`, ⛔ ואין רביעית.
 * `unfiltered` = מילה מהרמה שהלומד ⛔ עוד לא סינן — היא **«לחש לא מזוהה»** על המסך:
 * קלף עם `?`, צדקת ⇒ נזק מוגבר, טעית ⇒ הלחש חוזר אליך.
 */
export type ArenaWordKind = 'known' | 'unfiltered' | 'base';

export interface ArenaWord {
  readonly wordId: string;
  readonly headword: string;
  readonly translationHe: string;
  readonly kind: ArenaWordKind;
}

export interface ArenaMixInput {
  readonly known: readonly ArenaWord[];
  readonly unfiltered: readonly ArenaWord[];
  readonly base: readonly ArenaWord[];
  readonly size: number;
}

/**
 * `37 § 2`, שורת «מלא»: **75% ידועות / 25% לא-מסוננות**. ⛔ זו **תקרה** ⛔ ולא מכסה —
 * מחסן שאינו מלא נותן פחות, וזו בדיוק העמודה האמצעית בטבלה («מתמלא ⇒ עולה»).
 */
export const ARENA_KNOWN_SHARE_MAX = 0.75;

/**
 * ⛔ פיזור, ⛔ ולא שרשור. שתים-עשרה ידועות ואז ארבע לא-מסוננות בסוף הן קרב שנעשה קשה
 * בבת אחת בשליש האחרון; הפיזור נותן את אותו יחס בדיוק לאורך כל הקרב.
 * ⛔ **אין כאן הגרלה** — המיקום נגזר מהיחס, ולכן הוא ניתן לשחזור.
 */
function interleave(main: readonly ArenaWord[], spread: readonly ArenaWord[]): readonly ArenaWord[] {
  const total = main.length + spread.length;
  const out: ArenaWord[] = [];
  let iMain = 0;
  let iSpread = 0;
  for (let i = 0; i < total; i += 1) {
    // המנה הבאה מ-`spread` מגיעה כשמרכז המשבצת שלה עבר: `(2·k+1)/2·|spread|` מול `(i+1)/total`.
    const spreadIsDue = (2 * iSpread + 1) * total < 2 * (i + 1) * spread.length;
    const takeSpread = iSpread < spread.length && (iMain >= main.length || spreadIsDue);
    const picked = takeSpread ? spread[iSpread] : main[iMain];
    if (picked === undefined) continue;
    if (takeSpread) iSpread += 1;
    else iMain += 1;
    out.push(picked);
  }
  return out;
}

/**
 * `37 § 2` — התמהיל, בשורה אחת: **הידועות עד התקרה, השאר לא-מסוננות, ואם אין —
 * מילות בסיס.**
 *
 * ⚠️ **`reserve` הוא «בתמהיל תמיד» של המפרט, ⛔ ולא זהירות:** בלעדיו מחסן מלא היה
 * מייצר קרב של מילים ידועות בלבד — כלומר זירה שאי-אפשר ללמוד בה ולו מילה אחת חדשה,
 * וזו בדיוק השורה שהמפרט אוסר במפורש.
 */
export function mixArenaWords(input: ArenaMixInput): readonly ArenaWord[] {
  const size = Math.max(0, Math.floor(input.size));
  if (size === 0) return [];

  const knownCap = Math.floor(size * ARENA_KNOWN_SHARE_MAX);
  const reserve = input.unfiltered.length > 0 ? 1 : 0;
  const knownCount = Math.min(input.known.length, knownCap, Math.max(0, size - reserve));
  const known = input.known.slice(0, knownCount);

  const rest: ArenaWord[] = [];
  for (const word of input.unfiltered) {
    if (known.length + rest.length >= size) break;
    rest.push(word);
  }
  // ⛔ מילות בסיס ⛔ אינן «עוד מקור» — הן **מצב התחלה** (`§ 2` שורה 3), ולכן הן ממלאות
  // אך ורק את מה שנשאר אחרי שתי הקטגוריות שלפניהן.
  for (const word of input.base) {
    if (known.length + rest.length >= size) break;
    rest.push(word);
  }

  return interleave(known, rest);
}
