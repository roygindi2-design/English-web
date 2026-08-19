/**
 * § 4.2י · D-044 — מה קרב שנגמר משנה, ו**מה הוא ⛔ אינו רשאי לגעת בו**. טהור.
 *
 * ⚠️ הפונקציה מחזירה **תוכנית כתיבה** ⛔ ואינה כותבת. זו הצורה שהופכת את הגבול של
 * D-044 מהערה לבדיקה שנכשלת: אפשר להחיל את התוכנית על מחסן מדומה ולמדוד ש-
 * `word_progress` זהה בית-בבית לפני ואחרי. פונקציה שקוראת ל-supabase בעצמה אינה
 * ניתנת למדידה הזאת, וזה בדיוק מה שמדד ההצלחה ⓐ דורש.
 *
 * ⛔ הפסד אינו מוריד דבר (הכרעת רוי) · ⛔ אין ניקוד, אין מטבע ואין XP (D-050:
 * ניקוד g=0.340 מול בלי ניקוד g=0.840, p=0.013) · ⛔ «המילים שהפילו אותך» הוא
 * ערך מוחזר לתצוגה ⛔ ואינו שורה שנכתבת (D-047).
 */
export interface ArcadeAnswer {
  readonly wordId: string;
  readonly correct: boolean;
  readonly chosen: string;
  readonly answer: string;
}

export interface ArcadeWriteRow {
  readonly table: 'arcade_progress' | 'arcade_runs';
  readonly values: Readonly<Record<string, unknown>>;
}

export interface ArcadeWritePlan {
  readonly rows: readonly ArcadeWriteRow[];
  readonly enemyDefeated: boolean;
  readonly unlocked: string | null;
  readonly missed: readonly { readonly wordId: string; readonly answer: string; readonly chosen: string }[];
}

export const ARCADE_WRITE_TABLES = Object.freeze(['arcade_progress', 'arcade_runs'] as const);
export const ARCADE_MISSED_LIMIT = 5;
export const ARCADE_ITEMS = Object.freeze(['helmet', 'cape', 'lantern', 'boots', 'banner'] as const);

export function planArcadeWrites(input: {
  readonly userId: string;
  readonly answers: readonly ArcadeAnswer[];
  readonly before: { readonly arcadeLevel: number; readonly wins: number; readonly unlockedItems: readonly string[] };
  readonly enemyHp: number;
  readonly finishedAt: string;
}): ArcadeWritePlan {
  const correct = input.answers.filter((a) => a.correct).length;
  const enemyDefeated = correct >= input.enemyHp;
  const wins = input.before.wins + (enemyDefeated ? 1 : 0);
  const arcadeLevel = enemyDefeated ? input.before.arcadeLevel + 1 : input.before.arcadeLevel;
  const held = new Set(input.before.unlockedItems);
  const next = enemyDefeated ? ARCADE_ITEMS.find((i) => !held.has(i)) ?? null : null;
  const unlockedItems = next ? [...input.before.unlockedItems, next] : [...input.before.unlockedItems];

  const missed = input.answers
    .filter((a) => !a.correct)
    .slice(0, ARCADE_MISSED_LIMIT)
    .map((a) => ({ wordId: a.wordId, answer: a.answer, chosen: a.chosen }));

  return {
    rows: [
      {
        table: 'arcade_progress',
        values: {
          user_id: input.userId,
          arcade_level: arcadeLevel,
          wins,
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
          enemy_defeated: enemyDefeated,
        },
      },
    ],
    enemyDefeated,
    unlocked: next,
    missed,
  };
}
