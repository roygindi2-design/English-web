import { describe, expect, it } from 'vitest';
import {
  ARCADE_MISSED_LIMIT,
  ARCADE_WRITE_TABLES,
  planArcadeWrites,
  type ArcadeAnswer,
  type ArcadeWritePlan,
} from './arcadeResult';

const FINISHED_AT = '2026-08-19T01:00:00.000Z';
const BEFORE = { gameLevel: 1, wins: 0, unlockedItems: [] as string[] };

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
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain(column);
  });
});

describe('D-061 — ניצחון מקדם מונה, ⛔ ולא רמה', () => {
  const wonAnswers = (correct: number) =>
    answers(Array.from({ length: 15 }, (_, i) => i < correct));

  const plan = (correct: number, before: { gameLevel: number; wins: number }) =>
    planArcadeWrites({
      userId: 'u-1',
      answers: wonAnswers(correct),
      before: { ...before, unlockedItems: [] },
      finishedAt: FINISHED_AT,
    });

  it('ניצחון ראשון: המונה עולה, הרמה ⛔ לא', () => {
    const p = plan(10, { gameLevel: 2, wins: 0 });
    expect(p.outcome).toBe('victory');
    expect(p.leveledUp).toBe(false);
    expect(p.rows[0]?.values).toMatchObject({ arcade_level: 2, wins: 1 });
  });

  it('ניצחון שלישי: הרמה עולה והמונה מתאפס', () => {
    const p = plan(12, { gameLevel: 2, wins: 2 });
    expect(p.leveledUp).toBe(true);
    expect(p.rows[0]?.values).toMatchObject({ arcade_level: 3, wins: 0 });
  });

  it('⛔ פריט נפתח בעליית רמה בלבד, ⛔ ולא בכל ניצחון', () => {
    expect(plan(10, { gameLevel: 2, wins: 0 }).unlocked).toBeNull();
    expect(plan(10, { gameLevel: 2, wins: 2 }).unlocked).not.toBeNull();
  });

  it('⛔ «היריב שרד» ⛔ אינו מוריד דבר — לא רמה, לא מונה, לא פריטים', () => {
    const p = planArcadeWrites({
      userId: 'u-1',
      answers: wonAnswers(9),
      before: { gameLevel: 5, wins: 2, unlockedItems: ['helmet', 'cape'] },
      finishedAt: FINISHED_AT,
    });
    expect(p.outcome).toBe('survived');
    expect(p.enemyDefeated).toBe(false);
    expect(p.leveledUp).toBe(false);
    expect(p.unlocked).toBeNull();
    expect(p.rows[0]?.values).toMatchObject({
      arcade_level: 5,
      wins: 2,
      unlocked_items: ['helmet', 'cape'],
    });
  });

  it('⛔ הכתיבה עדיין נוגעת בשתי טבלאות הזירה בלבד (D-044)', () => {
    const p = plan(10, { gameLevel: 1, wins: 0 });
    expect([...new Set(p.rows.map((r) => r.table))].sort()).toEqual(['arcade_progress', 'arcade_runs']);
  });

  it('⛔ הסף הוא הקבוע ⛔ ולא שדה מהלקוח — 9 נכונות ⛔ אינן ניצחון בשום נתיב', () => {
    expect(planArcadeWrites({
      userId: 'u-1',
      answers: wonAnswers(9),
      before: BEFORE,
      finishedAt: FINISHED_AT,
    }).outcome).toBe('survived');
  });
});

describe('«המילים שהפילו אותך» (D-047) — תצוגה בלבד', () => {
  it('עד חמש מילים, ורק השגויות, עם המסיח שפיתה', () => {
    const plan = planArcadeWrites({
      userId: 'u-1',
      answers: answers([false, false, false, false, false, false, true]),
      before: BEFORE,
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
      finishedAt: FINISHED_AT,
    });
    const keys = plan.rows.flatMap((r) => Object.keys(r.values));
    expect(keys).not.toContain('missed');
    expect(keys).not.toContain('missed_words');
  });
});

describe('D-067ⓑ — הסף נגזר, ⛔ והלקוח ⛔ אינו יכול להנמיך אותו', () => {
  const answer = (correct: boolean, i: number) => ({
    wordId: `w-${i}`, correct, chosen: 'א', answer: correct ? 'א' : 'ב',
  });
  const before = { gameLevel: 1, wins: 0, unlockedItems: [] as string[] };

  it('קרב מלא: 10 נכונות מתוך 15 ⇒ ניצחון · 9 ⇒ היריב שרד', () => {
    const win = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 15 }, (_, i) => answer(i < 10, i)),
    });
    expect(win.outcome).toBe('victory');
    const lose = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 15 }, (_, i) => answer(i < 9, i)),
    });
    expect(lose.outcome).toBe('survived');
  });

  it('⛔ תשובה אחת נכונה ⛔ אינה ניצחון — הרצפה היא התחמושת', () => {
    const plan = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: [answer(true, 0)],
    });
    expect(plan.enemyDefeated).toBe(false);
    expect(plan.outcome).toBe('survived');
  });

  it('סיום מוקדם: 10 תשובות שכולן נכונות ⛔ עדיין ניצחון', () => {
    const plan = planArcadeWrites({
      userId: 'u', finishedAt: '2026-01-01T00:00:00.000Z', before,
      answers: Array.from({ length: 10 }, (_, i) => answer(true, i)),
    });
    expect(plan.outcome).toBe('victory');
  });
});
