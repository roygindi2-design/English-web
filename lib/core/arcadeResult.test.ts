import { describe, expect, it } from 'vitest';
import {
  ARCADE_MISSED_LIMIT,
  ARCADE_WRITE_TABLES,
  planArcadeWrites,
  type ArcadeAnswer,
  type ArcadeWritePlan,
} from './arcadeResult';

const FINISHED_AT = '2026-08-19T01:00:00.000Z';
const BEFORE = { arcadeLevel: 1, wins: 0, unlockedItems: [] as string[] };

function answers(pattern: readonly boolean[]): ArcadeAnswer[] {
  return pattern.map((correct, i) => ({
    wordId: `w-${i}`,
    correct,
    chosen: correct ? `נכון-${i}` : `מסיח-${i}`,
    answer: `נכון-${i}`,
  }));
}

/** מחסן מדומה. ⛔ הוא ⛔ אינו יודע להחיל שום טבלה שאינה של הזירה. */
function makeStore() {
  return {
    word_progress: [
      {
        user_id: 'u-1',
        word_id: 'w-0',
        attempts: 3,
        repetition: 2,
        easiness: 2.5,
        interval_days: 6,
        next_review_at: '2026-08-25T00:00:00.000Z',
        self_marked_known: false,
        consecutive_correct_recognition: 1,
      },
    ],
    profiles: [{ id: 'u-1', current_level: 'A2', updated_at: '2026-08-18T00:00:00.000Z' }],
    arcade_progress: [] as Record<string, unknown>[],
    arcade_runs: [] as Record<string, unknown>[],
  };
}

function applyPlan(store: ReturnType<typeof makeStore>, plan: ArcadeWritePlan): void {
  for (const row of plan.rows) {
    if (row.table !== 'arcade_progress' && row.table !== 'arcade_runs') {
      throw new Error(`arcadeResult tried to write outside the arcade: ${row.table}`);
    }
    store[row.table].push({ ...row.values });
  }
}

describe('⛔ מדד ההצלחה ⓐ של § 4.2י — הבידוד של D-044 הוא בדיקה שנכשלת, ⛔ לא הערה', () => {
  it('קרב מלא (נכונות ושגיאות) ⇒ word_progress זהה בית-בבית לפני ואחרי', () => {
    const store = makeStore();
    const before = JSON.stringify(store.word_progress);
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, false, true, true, false, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    applyPlan(store, plan);
    expect(JSON.stringify(store.word_progress)).toBe(before);
  });

  it('ואותו קרב ⇒ profiles.current_level זהה בית-בבית', () => {
    const store = makeStore();
    const before = JSON.stringify(store.profiles);
    applyPlan(
      store,
      planArcadeWrites({
        userId: 'u-1',
        answers: answers([false, false, false, false, false, false, false, false]),
        before: BEFORE,
        enemyHp: 5,
        finishedAt: FINISHED_AT,
      }),
    );
    expect(JSON.stringify(store.profiles)).toBe(before);
  });

  it('התוכנית נוגעת בשתי טבלאות הזירה בלבד', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    expect([...new Set(plan.rows.map((r) => r.table))].sort()).toEqual([...ARCADE_WRITE_TABLES].sort());
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'self_marked_known',
    'consecutive_correct_recognition',
    'current_level',
  ])('⛔ %s אינו מפתח באף שורה שהתוכנית כותבת', (column) => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, false, true, false, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain(column);
  });
});

describe('מה הקרב כן משנה', () => {
  it('ניצחון מעלה רמת משחק, מוסיף ניצחון ופותח פריט אחד', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([true, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const progress = plan.rows.find((r) => r.table === 'arcade_progress')!.values;
    expect(plan.enemyDefeated).toBe(true);
    expect(progress.arcade_level).toBe(2);
    expect(progress.wins).toBe(1);
    expect(plan.unlocked).not.toBeNull();
    expect(progress.unlocked_items).toEqual([plan.unlocked]);
  });

  it('⛔ הפסד אינו מוריד דבר — רמת משחק, ניצחונות ופריטים נשארים כמו שהיו', () => {
    const before = { arcadeLevel: 4, wins: 3, unlockedItems: ['helmet', 'cape'] };
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, false, true, false, false, false, false, false]),
      before,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const progress = plan.rows.find((r) => r.table === 'arcade_progress')!.values;
    expect(plan.enemyDefeated).toBe(false);
    expect(progress.arcade_level).toBe(4);
    expect(progress.wins).toBe(3);
    expect(progress.unlocked_items).toEqual(['helmet', 'cape']);
  });
});

describe('«המילים שהפילו אותך» (D-047) — תצוגה בלבד', () => {
  it('עד חמש מילים, ורק השגויות, עם המסיח שפיתה', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, false, false, false, false, false, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    expect(plan.missed).toHaveLength(ARCADE_MISSED_LIMIT);
    expect(plan.missed[0]).toEqual({ wordId: 'w-0', answer: 'נכון-0', chosen: 'מסיח-0' });
    expect(plan.missed.map((m) => m.wordId)).not.toContain('w-6');
  });

  it('⛔ הרשימה אינה שורה שנכתבת — היא אינה מופיעה באף `values`', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, true, true, true, true, true, true, true]),
      before: BEFORE,
      enemyHp: 5,
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain('missed');
    expect(keys).not.toContain('missed_words');
  });
});
