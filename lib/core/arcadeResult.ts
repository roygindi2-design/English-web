/**
 * § 4.2י · D-044 — מה קרב שנגמר משנה, ו**מה הוא ⛔ אינו רשאי לגעת בו**. טהור.
 *
 * ⚠️ הפונקציה מחזירה **תוכנית כתיבה** ⛔ ואינה כותבת. זו הצורה שהופכת את הגבול של
 * D-044 מהערה לבדיקה שנכשלת: אפשר להחיל את התוכנית על מחסן מדומה ולמדוד ש-
 * `word_progress` זהה בית-בבית לפני ואחרי. פונקציה שקוראת ל-supabase בעצמה אינה
 * ניתנת למדידה הזאת, וזה בדיוק מה שמדד ההצלחה ⓐ דורש.
 *
 * ⛔ «היריב שרד» אינו מוריד דבר (הכרעת רוי · D-059) · ⛔ אין ניקוד, מטבע ו-XP (D-050:
 * ניקוד g=0.340 מול בלי ניקוד g=0.840, p=0.013) · ⛔ «המילים שהפילו אותך» הוא
 * ערך מוחזר לתצוגה ⛔ ואינו שורה שנכתבת (D-047).
 */
import { ARCADE_AMMO, applyWin, isVictory } from './arcadeLadder';

export interface ArcadeAnswer {
  readonly wordId: string;
  readonly correct: boolean;
  readonly chosen: string;
  readonly answer: string;
}

export type ArcadeWriteTable = 'arcade_progress' | 'arcade_runs' | 'arcade_collected_words';

export interface ArcadeWriteRow {
  readonly table: ArcadeWriteTable;
  readonly values: Readonly<Record<string, unknown>>;
}

/**
 * שורת אוסף אחת כפי שהיא **לפני** הקרב. ⛔ אין כאן שדה לימודי ו⛔ אין CEFR — D-052.
 */
export interface CollectedBefore {
  readonly wordId: string;
  readonly timesMissed: number;
  readonly timesCorrect: number;
}

export interface ArcadeWritePlan {
  readonly rows: readonly ArcadeWriteRow[];
  readonly enemyDefeated: boolean;
  /** ⛔ שני מוצאים בלבד (D-059). «הפסד» ⛔ אינו ערך אפשרי. */
  readonly outcome: 'victory' | 'survived';
  readonly leveledUp: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
  /**
   * ⛔ **שדה נפרד מ-`missed`, וזו לא כפילות:** `missed` הוא תקרת **תצוגה** בת 5 (D-047),
   * ו-`collected` הוא מה ש**נכתב** — קרב עם 7 החמצות אוסף 7. תקרה שהייתה חותכת את
   * האיסוף הייתה גורמת לאוסף לשקר על מה שקרה בקרב.
   */
  readonly collected: readonly { readonly wordId: string; readonly timesMissed: number; readonly timesCorrect: number }[];
}

export const ARCADE_WRITE_TABLES = Object.freeze(
  ['arcade_progress', 'arcade_runs', 'arcade_collected_words'] as const,
);
export const ARCADE_MISSED_LIMIT = 5;
export const ARCADE_ITEMS = Object.freeze(['helmet', 'cape', 'lantern', 'boots', 'banner'] as const);

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly gameLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  /**
   * ⛔ **רשות במכוון:** קורא שלא סיפק אותו מקבל בדיוק את ההתנהגות הישנה — אין שורת
   * אוסף ואין `times_correct` שעולה. כך `typecheck` נשאר ירוק בתוך הצעד עצמו.
   */
  readonly collectedBefore?: readonly CollectedBefore[];
  readonly finishedAt: string;
}): ArcadeWritePlan {
  const correct = input.answers.filter((a) => a.correct).length;
  // ⛔ מספר השאלות ⛔ אינו מגיע מהגוף (D-059 · D-067ⓑ): לקוח ששלח «שלחו לי שאלה אחת»
  // היה מנצח בתשובה אחת. `Math.max` מול התחמושת חוסם **בדיוק** את זה, ועדיין מתיר
  // סיום מוקדם (10 תשובות ⇒ הסף נשאר 10) וגם סיבוב עתידי ארוך מ-15.
  // ⛔ הכיוון היחיד שהלקוח יכול להזיז בו את הסף הוא **למעלה**, וזה ⛔ אינו רווח לו.
  const served = Math.max(input.answers.length, ARCADE_AMMO);
  const won = isVictory(correct, served);
  const after = won
    ? applyWin({ level: input.before.gameLevel, wins: input.before.wins })
    : { level: input.before.gameLevel, wins: input.before.wins, leveledUp: false };

  const held = new Set(input.before.unlockedItems);
  // ⛔ פריט נפתח בעליית **רמה**, ⛔ ולא בכל ניצחון (D-061).
  const next = after.leveledUp ? ARCADE_ITEMS.find((i) => !held.has(i)) ?? null : null;
  const unlockedItems = next ? [...input.before.unlockedItems, next] : [...input.before.unlockedItems];

  const missed = input.answers
    .filter((a) => !a.correct)
    .slice(0, ARCADE_MISSED_LIMIT)
    .map((a) => ({ wordId: a.wordId, answer: a.answer, chosen: a.chosen }));

  // T-109 · הכרעה א׳ של התוכנית: **שורה נוצרת על טעות בלבד.** תשובה נכונה מעלה את
  // `times_correct` אך ורק על מפתח שכבר קיים — או באוסף שנקרא מהמאגר, או שנוצר קודם
  // באותו קרב עצמו. מילה שנענתה נכון ומעולם לא הוחמצה ⛔ אינה נכנסת לאוסף.
  const collectedMap = new Map<string, { timesMissed: number; timesCorrect: number }>();
  for (const row of input.collectedBefore ?? []) {
    collectedMap.set(row.wordId, { timesMissed: row.timesMissed, timesCorrect: row.timesCorrect });
  }
  const touched = new Set<string>();
  for (const a of input.answers) {
    const existing = collectedMap.get(a.wordId);
    if (!a.correct) {
      collectedMap.set(a.wordId, {
        timesMissed: (existing?.timesMissed ?? 0) + 1,
        timesCorrect: existing?.timesCorrect ?? 0,
      });
      touched.add(a.wordId);
      continue;
    }
    if (!existing) continue;
    collectedMap.set(a.wordId, { timesMissed: existing.timesMissed, timesCorrect: existing.timesCorrect + 1 });
    touched.add(a.wordId);
  }
  const collected = [...touched].map((wordId) => {
    const row = collectedMap.get(wordId) as { timesMissed: number; timesCorrect: number };
    return { wordId, timesMissed: row.timesMissed, timesCorrect: row.timesCorrect };
  });

  return {
    rows: [
      {
        table: 'arcade_progress',
        values: {
          user_id: input.userId,
          arcade_level: after.level,
          wins: after.wins,
          unlocked_items: unlockedItems,
          updated_at: input.finishedAt,
        },
      },
      {
        table: 'arcade_runs',
        values: {
          user_id: input.userId,
          finished_at: input.finishedAt,
          words_seen: input.answers.length,
          words_correct: correct,
          enemy_defeated: won,
        },
      },
      // ⛔ `first_seen_at` ⛔ אינו נכתב במכוון: ברירת המחדל בסכמה היא `now()`, וכתיבה
      // מפורשת הייתה **מאפסת** את תאריך הפגישה הראשונה בכל upsert חוזר.
      ...collected.map((c) => ({
        table: 'arcade_collected_words' as const,
        values: {
          user_id: input.userId,
          word_id: c.wordId,
          times_missed: c.timesMissed,
          times_correct: c.timesCorrect,
        },
      })),
    ],
    collected,
    enemyDefeated: won,
    outcome: won ? 'victory' : 'survived',
    leveledUp: after.leveledUp,
    unlocked: next,
    missed,
  };
}
