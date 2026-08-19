import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ARCADE_ENEMY_HP,
  advance,
  chooseOption,
  enemyDefeated,
  isFinished,
  startBattle,
} from './arcadeBattle';
import type { ArcadeQuestion } from './arcadeRound';

/** ⛔ אינן מילים אמיתיות ואינן תרגומים: פיקסטורה ⛔ אינה תוכן לימודי (R-010 · R-013). */
function q(n: number): ArcadeQuestion {
  return {
    wordId: `w${n}`,
    headword: `Lorem${n}`,
    answer: `אפשרות ${n}`,
    options: [`אפשרות ${n}`, `מסיח ${n}א`, `מסיח ${n}ב`, `מסיח ${n}ג`],
  };
}
const QUESTIONS: readonly ArcadeQuestion[] = [q(1), q(2), q(3), q(4), q(5), q(6), q(7), q(8)];

describe('arcadeBattle', () => {
  it('פותח קרב עם חיי היריב הקבועים ובשאלה הראשונה', () => {
    const s = startBattle(QUESTIONS);
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(s.index).toBe(0);
    expect(s.answers).toEqual([]);
    expect(s.chosen).toBeNull();
  });

  it('תשובה נכונה מורידה חיים בדיוק ב-1', () => {
    const s = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP - 1);
    expect(s.answers).toEqual([
      { wordId: 'w1', correct: true, chosen: 'אפשרות 1', answer: 'אפשרות 1' },
    ]);
  });

  it('⛔ תשובה שגויה אינה משנה דבר מלבד הרישום — נמדד בית-בבית', () => {
    const before = startBattle(QUESTIONS);
    const after = chooseOption(before, 'מסיח 1א');
    // המסכה מוציאה בדיוק את שני השדות שתשובה שגויה **כן** מזיזה, ומשווה את כל השאר.
    const mask = (s: typeof before) => JSON.stringify({ ...s, answers: [], chosen: null });
    expect(mask(after)).toBe(mask(before));
    expect(after.enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(after.answers).toEqual([
      { wordId: 'w1', correct: false, chosen: 'מסיח 1א', answer: 'אפשרות 1' },
    ]);
  });

  it('⛔ הקשה שנייה על אותה שאלה אינה מכה שנייה', () => {
    const once = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    const twice = chooseOption(once, 'אפשרות 1');
    expect(twice).toBe(once); // אותה הפניה, ⛔ ולא רק שוויון עמוק
  });

  it('⛔ `advance` אינה זזה כל עוד לא נבחרה אפשרות', () => {
    const s = startBattle(QUESTIONS);
    expect(advance(s)).toBe(s);
  });

  it('`advance` מעבירה לשאלה הבאה ומנקה את הבחירה', () => {
    const s = advance(chooseOption(startBattle(QUESTIONS), 'מסיח 1א'));
    expect(s.index).toBe(1);
    expect(s.chosen).toBeNull();
  });

  it('הקרב נגמר כשחיי היריב נגמרו — ⛔ ולא כשנגמר הזמן', () => {
    let s = startBattle(QUESTIONS);
    for (let i = 0; i < ARCADE_ENEMY_HP; i += 1) {
      s = advance(chooseOption(s, `אפשרות ${i + 1}`));
    }
    expect(s.enemyHp).toBe(0);
    expect(isFinished(s)).toBe(true);
    expect(enemyDefeated(s)).toBe(true);
  });

  it('נגמרו השאלות והיריב עומד ⇒ הקרב נגמר ו⛔ היריב לא נוצח', () => {
    let s = startBattle(QUESTIONS);
    for (const question of QUESTIONS) s = advance(chooseOption(s, question.options[1] ?? ''));
    expect(s.index).toBe(QUESTIONS.length);
    expect(isFinished(s)).toBe(true);
    expect(enemyDefeated(s)).toBe(false);
    expect(s.enemyHp).toBe(ARCADE_ENEMY_HP);
  });

  it('⛔ אין בקובץ שעון, ואין בו מילה מעולם הניקוד', () => {
    const code = readFileSync('lib/core/arcadeBattle.ts', 'utf8')
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    for (const banned of [/\bsetTimeout\b/, /\bsetInterval\b/, /\bdeadline\b/i, /\bcountdown\b/i]) {
      expect(code, `${banned} אסור — D-045 · R-020`).not.toMatch(banned);
    }
    // ⚠️ גבול מזהה ⛔ ולא `toContain` — הלקח של C-0182: `toContain('xp')` מפיל קוד נקי.
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i]) {
      expect(code, `${banned} אסור — D-050`).not.toMatch(banned);
    }
    // D-044 — הזירה ⛔ אינה מזיזה את מנוע החזרות.
    for (const banned of [/word_progress/, /easiness/, /interval_days/, /next_review_at/]) {
      expect(code, `${banned} אסור — D-044`).not.toMatch(banned);
    }
  });
});
