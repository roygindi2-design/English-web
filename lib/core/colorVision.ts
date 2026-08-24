/**
 * ראייה צבעונית — הסימולציה והמרחק. **טהור:** ⛔ אפס React · DOM · רשת · שעון · env.
 *
 * ⛔ **למה זה קיים:** `plan/RULES.md § 0.8` מחייב להריץ `scripts/validate_palette.js`
 * «לפני כל גרף, מד או פס התקדמות», ו**הקובץ הזה מעולם לא היה בריפו** — נמדד 23/08,
 * `find . -name "validate_palette*"` החזיר אפס (T-172). כלל שמצביע על קובץ שאינו
 * קיים ⛔ אינו כלל: הוא הוראה שכל סוכן מדלג עליה בשקט, ואז אומד צבע בעין.
 *
 * ⛔ **מה הקובץ הזה ⛔ אינו:** הוא ⛔ אינו «בודק נגישות». הוא עונה על **שתי שאלות
 * מדידות בלבד** — האם צבע נקרא על משטח (יחס ניגודיות WCAG, ב-`palette.ts`), והאם
 * שני צבעים **קטגוריים** נבדלים זה מזה גם לעין שאינה רואה אותם כמונו. שאלת «האם
 * הגרף מובן» ⛔ אינה נמדדת כאן ו⛔ אין להתיימר שכן.
 *
 * **המקור לסימולציה:** Viénot, Brettel & Mollon (1999) — הקירוב הליניארי במרחב
 * LMS. ⛔ המקדמים מועתקים ו⛔ אינם מכוילים כאן.
 *
 * **הסף הקטגורי הוא שלנו ו⛔ לא מיוחס לאיש:** `CATEGORICAL_MIN_DELTA_E`. הוא נבחר,
 * ⛔ ולא נמדד מספרות, ולכן הוא **מוצהר** — סוכן שרוצה לשנותו רואה כאן שזו הכרעה.
 */

/**
 * ⛔ **פרוטן ודויטן בלבד — ⛔ ואין טריטן, וזו הכרעה מדודה ⛔ ולא השמטה.**
 * Viénot et al. (1999) נותן את המישור הדיכרומטי לפרוטנופיה ולדויטרנופיה. מקדמי
 * ה«טריטן» שמסתובבים באותם קטעי קוד נבדקו כאן ישירות, ו**הם משאירים כחול טהור
 * וצהוב טהור ללא שינוי כלל** (`#0000ff`→`#0000ff` · `#ffff00`→`#ffff00`) — כלומר
 * הם משמרים בדיוק את הציר שטריטנופיה פוגעת בו. ⛔ סימולציה כזאת הייתה מדווחת
 * «אין התנגשות» על פלטה כחול־צהוב, כלומר **false negative** — ובדיוק הסוג הזה של
 * ערובה חלולה הוא מה שהקובץ הזה נכתב נגדו. ⇒ טריטן ⛔ אינו נבדק, ו⛔ אין לטעון שכן.
 */
export type CvdType = 'protan' | 'deutan';
export const CVD_TYPES: readonly CvdType[] = ['protan', 'deutan'] as const;

/**
 * ⚠️ **ערך שנבחר, ⛔ ולא נמדד.** ΔE‏76 של 20 הוא «נבדל בבירור» בשימוש המקובל
 * בהדמיית נתונים. ⛔ אין לו כאן מקור נמדד, ולכן הוא מוצהר כהכרעה ⛔ ולא כעובדה.
 */
export const CATEGORICAL_MIN_DELTA_E = 20;

const HEX = /^#[0-9a-f]{6}$/i;

function channels(hex: string): [number, number, number] {
  if (!HEX.test(hex)) throw new TypeError(`colorVision: "${hex}" ⛔ אינו hex בן 6 ספרות`);
  const n = Number.parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** sRGB ⇄ ליניארי — עקומת ה-IEC 61966-2-1, ⛔ ולא קירוב חזקה 2.2. */
const toLinear = (c: number): number => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const toSrgb = (v: number): number => {
  const c = Math.min(1, Math.max(0, v));
  const s = c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.round(s * 255);
};

const hex2 = (n: number): string => n.toString(16).padStart(2, '0');

/** LMS לפי Viénot et al. (1999). */
const RGB_TO_LMS = [
  [17.8824, 43.5161, 4.11935],
  [3.45565, 27.1554, 3.86714],
  [0.0299566, 0.184309, 1.46709],
] as const;

const LMS_TO_RGB = [
  [0.080944448, -0.13050441, 0.116721066],
  [-0.010248534, 0.054019327, -0.113614708],
  [-0.000365297, -0.004121615, 0.693511405],
] as const;

const apply = (m: readonly (readonly number[])[], v: readonly number[]): [number, number, number] => [
  (m[0]?.[0] ?? 0) * (v[0] ?? 0) + (m[0]?.[1] ?? 0) * (v[1] ?? 0) + (m[0]?.[2] ?? 0) * (v[2] ?? 0),
  (m[1]?.[0] ?? 0) * (v[0] ?? 0) + (m[1]?.[1] ?? 0) * (v[1] ?? 0) + (m[1]?.[2] ?? 0) * (v[2] ?? 0),
  (m[2]?.[0] ?? 0) * (v[0] ?? 0) + (m[2]?.[1] ?? 0) * (v[1] ?? 0) + (m[2]?.[2] ?? 0) * (v[2] ?? 0),
];

/** הצבע כפי שנראה לעין דיכרומטית. אפור נשאר אפור — זו בדיקת השפיות של הסימולציה. */
export function simulateCvd(hex: string, type: CvdType): string {
  const [r, g, b] = channels(hex);
  const lms = apply(RGB_TO_LMS, [toLinear(r), toLinear(g), toLinear(b)]);
  const [l, m, s] = lms;
  const shifted: [number, number, number] =
    type === 'protan' ? [2.02344 * m - 2.52581 * s, m, s] : [l, 0.494207 * l + 1.24827 * s, s];
  const [lr, lg, lb] = apply(LMS_TO_RGB, shifted);
  return `#${hex2(toSrgb(lr))}${hex2(toSrgb(lg))}${hex2(toSrgb(lb))}`;
}

/** CIE Lab‏ D65. */
function lab(hex: string): [number, number, number] {
  const [r, g, b] = channels(hex).map(toLinear) as [number, number, number];
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t: number): number => (t > 216 / 24389 ? Math.cbrt(t) : (841 / 108) * t + 4 / 29);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

/** ΔE‏ CIE76 — ⛔ ולא CIE2000. הפשטות כאן מכוונת: הסף שלנו גס ממילא. */
export function deltaE76(hexA: string, hexB: string): number {
  const a = lab(hexA);
  const b = lab(hexB);
  return Math.hypot((a[0] ?? 0) - (b[0] ?? 0), (a[1] ?? 0) - (b[1] ?? 0), (a[2] ?? 0) - (b[2] ?? 0));
}

export interface CategoricalClash {
  readonly a: string;
  readonly b: string;
  /** `null` = ראייה רגילה. */
  readonly vision: CvdType | null;
  readonly deltaE: number;
}

/**
 * כל זוג בסדרה קטגורית, בראייה רגילה **ובשני סוגי ה-CVD שאנחנו מדמים**. מחזיר את
 * ההתנגשויות בלבד — ⛔ רשימה ריקה היא התשובה «אין התנגשות **בראיות שנבדקו**»,
 * ⛔ ולא «הפלטה נגישה».
 */
export function categoricalClashes(
  colors: readonly string[],
  minDeltaE: number = CATEGORICAL_MIN_DELTA_E,
): CategoricalClash[] {
  const out: CategoricalClash[] = [];
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const a = colors[i];
      const b = colors[j];
      if (a === undefined || b === undefined) continue;
      for (const vision of [null, ...CVD_TYPES] as const) {
        const sa = vision === null ? a : simulateCvd(a, vision);
        const sb = vision === null ? b : simulateCvd(b, vision);
        const d = deltaE76(sa, sb);
        if (d < minDeltaE) out.push({ a, b, vision, deltaE: d });
      }
    }
  }
  return out;
}
