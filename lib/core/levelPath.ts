/**
 * מפת שש הרמות — שורה 6 של § 4.2ז (T-084). טהור: אפס React, DOM, רשת ו-env.
 *
 * ⛔ **מה שאין כאן, ומה שלעולם לא ייכנס:** ⛔ אין שדה «נעול», ⛔ אין סף, ⛔ אין
 * «מוכנות» ו⛔ אין רצף. D-037 קובע שהמעבר בין רמות הוא פעולה של הלומד מפני ש**אין ולו
 * סף אמפירי אחד בספרות** — Webb/Sasao/Ballance 2017 כותבים על נקודת החיתוך
 * *"appears to have been arbitrary"*. כל מספר שהיינו מציגים כמוכנות היה טענה פדגוגית
 * בלי מקור, כלומר R-017 בדיוק.
 *
 * `percent` הוא **ספירה**: כמה מילים ברמה סימן הלומד כידועות, מתוך כמה יש בה. ⛔ הוא
 * ⛔ אינו רשאי להיקרא «שליטה», ⛔ אינו פותח דבר, ו⛔ אינו חוסם דבר.
 */
import { BAND_ORDER, type CefrBand } from './cefrLevels';
import type { LevelSummary } from './levelSummary';

export interface LevelChip {
  readonly band: CefrBand;
  readonly known: number;
  readonly totalInLevel: number;
  readonly isCurrent: boolean;
  /** רמה שאין בה מילים במאגר (C1/C2 היום). המסך מציג אותה **מושבתת עם המספר 0**,
   *  ⛔ ולא מסתיר אותה — § 4.2ז שורה 6, ואותו כלל של «חפיסה ריקה» ב-§ 4.2ו. */
  readonly isEmpty: boolean;
  /** 0..100, שלם. ⛔ לא שבר: טבעת ומספר על מסך של 375px אינם מקום לנקודה עשרונית. */
  readonly percent: number;
}

function percentOf(known: number, total: number): number {
  // ⛔ חלוקה באפס אינה 0 — היא NaN, ו-NaN על המסך נראה כמו באג תצוגה. רמה בלי מילים
  // היא 0 באופן מוצהר.
  if (!Number.isFinite(total) || total <= 0) return 0;
  const raw = Math.round((known / total) * 100);
  return Math.min(100, Math.max(0, raw));
}

/**
 * ⛔ **תמיד שישה, בסדר.** רמה שלא הופיעה ברשימה שהשרת מסר חוזרת כאפסים ⛔ ואינה
 * נעדרת: מסלול שמשנה את מספר השבבים שלו כשהמאגר גדל משאיר את הלומד בלי דרך לדעת
 * אם המוצר השתנה או הוא.
 */
export function buildLevelPath(
  levels: readonly LevelSummary[],
  current: CefrBand | null,
): readonly LevelChip[] {
  const byBand = new Map<CefrBand, LevelSummary>();
  for (const level of levels) byBand.set(level.level, level);

  return BAND_ORDER.map((band) => {
    const level = byBand.get(band);
    const totalInLevel = level?.totalInLevel ?? 0;
    const known = level?.known ?? 0;
    return {
      band,
      known,
      totalInLevel,
      isCurrent: current === band,
      isEmpty: totalInLevel === 0,
      percent: percentOf(known, totalInLevel),
    };
  });
}
