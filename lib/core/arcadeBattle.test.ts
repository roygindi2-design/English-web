import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  ARCADE_ENEMY_HP,
  advance,
  ammoLeft,
  battleOutcome,
  chooseOption,
  enemyDefeated,
  isFinished,
  startBattle,
  type BattleState,
} from './arcadeBattle';
import { ARCADE_AMMO } from './arcadeLadder';
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
/** ⛔ `ARCADE_AMMO` ⛔ ולא 8: התחמושת היא הקבוע, והפיקסטורה חייבת להכיל אותה במלואה. */
const QUESTIONS: readonly ArcadeQuestion[] = Array.from({ length: ARCADE_AMMO }, (_, i) => q(i + 1));

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

describe('D-059 — שני מוצאים בלבד מהקרב', () => {
  /** משחק קרב שלם: `correctCount` תשובות נכונות ואז מסיחים עד סוף התחמושת. */
  function play(correctCount: number): BattleState {
    let s = startBattle(QUESTIONS);
    for (const [i, question] of QUESTIONS.entries()) {
      s = advance(chooseOption(s, i < correctCount ? question.answer : (question.options[1] ?? '')));
    }
    return s;
  }

  it('היריב מתחיל עם 10 חיים, ⛔ לא 5', () => {
    expect(startBattle(QUESTIONS).enemyHp).toBe(ARCADE_ENEMY_HP);
    expect(ARCADE_ENEMY_HP).toBe(10);
  });

  it('10 נכונות מתוך 15 ⇒ ניצחון', () => {
    expect(battleOutcome(play(10))).toBe('victory');
  });

  it('9 נכונות מתוך 15 ⇒ «היריב שרד», ⛔ ולא «הפסד»', () => {
    expect(battleOutcome(play(9))).toBe('survived');
  });

  it('⛔ תשובה שגויה ⛔ אינה מרפאת את היריב ו⛔ אינה מסיימת את הקרב', () => {
    let s = startBattle(QUESTIONS);
    s = advance(chooseOption(s, 'אפשרות 1'));
    const hpAfterHit = s.enemyHp;
    s = advance(chooseOption(s, 'מסיח 2א'));
    expect(s.enemyHp).toBe(hpAfterHit);
    expect(battleOutcome(s)).toBe('running');
  });

  it('הקרב באמצע ⇒ running', () => {
    expect(battleOutcome(startBattle(QUESTIONS))).toBe('running');
  });
});

describe('D-067ⓑ — חיי היריב נגזרים מהסיבוב שנשלח', () => {
  it('15 שאלות ⇒ 10 חיים, והמקסימום נשמר במצב', () => {
    const s = startBattle(QUESTIONS);
    expect(s.enemyHp).toBe(10);
    expect(s.enemyHpMax).toBe(10);
  });

  it('סיבוב בן 12 ⇒ 8 חיים ⛔ ולא 10 — קרב שאפשר לנצח בו', () => {
    const s = startBattle(QUESTIONS.slice(0, 12));
    expect(s.enemyHp).toBe(8);
    expect(s.enemyHpMax).toBe(8);
  });

  it('⛔ המקסימום ⛔ אינו זז כשהחיים יורדים', () => {
    const s = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(s.enemyHp).toBe(9);
    expect(s.enemyHpMax).toBe(10);
  });
});

describe('D-070 — התחמושת שנותרה, כדי שלמהירות יהיה מחיר', () => {
  it('בתחילת הקרב נשארו כל הקליעים', () => {
    expect(ammoLeft(startBattle(QUESTIONS))).toBe(ARCADE_AMMO);
  });

  it('⛔ הקליע נשרף ברגע ההקשה ⛔ ולא ב«הבא» — אחרת המחיר מגיע באיחור', () => {
    const chosen = chooseOption(startBattle(QUESTIONS), 'אפשרות 1');
    expect(ammoLeft(chosen)).toBe(ARCADE_AMMO - 1);
    expect(ammoLeft(advance(chosen))).toBe(ARCADE_AMMO - 1);
  });

  it('הקשה שגויה מורידה את התחמושת ⛔ ואינה נוגעת בחיי היריב', () => {
    const before = startBattle(QUESTIONS);
    const after = chooseOption(before, 'מסיח 1א');
    expect(ammoLeft(after)).toBe(ammoLeft(before) - 1);
    expect(after.enemyHp).toBe(before.enemyHp);
  });

  it('בסוף הקרב ⛔ אין תחמושת שלילית', () => {
    let s = startBattle(QUESTIONS);
    for (let i = 0; i < QUESTIONS.length; i += 1) s = advance(chooseOption(s, 'מסיח 1א'));
    expect(ammoLeft(s)).toBe(0);
  });
});
