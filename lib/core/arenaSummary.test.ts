import { describe, expect, it } from 'vitest';
import { BATTLE_MS, CRITICAL_MS, ENEMY_HP, startBattle, type BattleState } from '@/lib/core/battle';
import type { ArenaWordKind } from '@/lib/core/arenaWords';
import { endingOf, firstMetHe, meanSecondsHe, summarize, wordsFromBossHe } from '@/lib/core/arenaSummary';

const cast = (wordId: string, correct: boolean, responseMs: number, kind: ArenaWordKind = 'known') => ({
  wordId, correct, responseMs, critical: correct && responseMs < CRITICAL_MS, kind,
});

describe('summarize — 37 § 10', () => {
  it('⛔ אפס הטלות ⛔ אינו NaN', () => {
    const s = summarize([]);
    expect(s.total).toBe(0);
    expect(s.correct).toBe(0);
    expect(s.meanResponseMs).toBe(0);
    expect(s.bestStreak).toBe(0);
    expect(s.slow).toEqual([]);
  });

  it('נכונות ורצף מרבי — הרצף ⛔ אינו הרצף האחרון', () => {
    const s = summarize([
      cast('a', true, 900), cast('b', true, 900), cast('c', true, 900),
      cast('d', false, 900), cast('e', true, 900),
    ]);
    expect(s.correct).toBe(4);
    expect(s.total).toBe(5);
    expect(s.bestStreak).toBe(3);
  });

  it('«איטית» = נכונה שאינה קריטית (§ 5), ⛔ ולא סף שהומצא', () => {
    const s = summarize([
      cast('a', true, CRITICAL_MS - 1),
      cast('b', true, CRITICAL_MS),
      cast('c', false, 9_000),
    ]);
    expect(s.slow.map((c) => c.wordId)).toEqual(['b']);
  });

  it('הממוצע מעוגל, והפורמט הוא «1.8 ש׳»', () => {
    expect(summarize([cast('a', true, 1_750), cast('b', true, 1_850)]).meanResponseMs).toBe(1_800);
    expect(meanSecondsHe(1_800)).toBe('1.8 ש׳');
    expect(meanSecondsHe(0)).toBe('0.0 ש׳');
  });
});

describe('firstMet — T-282 · 37 § 10 · קריאה בלבד', () => {
  it('הטלות על מילים `unfiltered`, פעם אחת למילה, נכונות ושגויות כאחד', () => {
    const s = summarize([
      cast('a', true, 900),                       // known
      cast('b', false, 900, 'unfiltered'),        // met, wrong
      cast('c', true, 900, 'unfiltered'),         // met, right
      cast('b', true, 900, 'base'),               // the requeued copy — ⛔ not a second meeting
      cast('d', true, 900, 'base'),
    ]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b', 'c']);
  });

  it('⛔ מילה אחת ⛔ נספרת פעמיים גם אם הוטלה פעמיים כ-`unfiltered`', () => {
    const s = summarize([cast('b', false, 900, 'unfiltered'), cast('b', true, 900, 'unfiltered')]);
    expect(s.firstMet.map((c) => c.wordId)).toEqual(['b']);
  });

  it('⛔ אפס הטלות ⇒ רשימה ריקה, ⛔ לא undefined', () => {
    expect(summarize([]).firstMet).toEqual([]);
  });

  it('«פגשת 4 מילים חדשות» מהרנדר, ו«מילה אחת» ליחיד', () => {
    expect(firstMetHe(4)).toBe('פגשת 4 מילים חדשות');
    expect(firstMetHe(1)).toBe('פגשת מילה אחת חדשה');
  });
});

describe('endingOf — T-283 · 37 § 9 ח4 · 37 § 3', () => {
  const fresh = (): BattleState =>
    startBattle([{ wordId: 'w1', headword: 'Lorem1', translationHe: 'אפשרות 1', kind: 'base' }]);

  it('קרב רץ ⇒ null — ⛔ אין סיכום לקרב שלא נגמר', () => {
    expect(endingOf(fresh(), 0)).toBeNull();
    expect(endingOf(fresh(), BATTLE_MS - 1)).toBeNull();
  });

  it('היריב ב-0 ⇒ victory, ו-wordsFromBoss = 0', () => {
    expect(endingOf({ ...fresh(), enemyHp: 0 }, 10_000)).toEqual({ kind: 'victory', wordsFromBoss: 0 });
  });

  it('הלומד ב-0 ⇒ survived, והפער הוא חיי היריב שנותרו', () => {
    expect(endingOf({ ...fresh(), learnerHp: 0, enemyHp: 7 }, 10_000)).toEqual({ kind: 'survived', wordsFromBoss: 7 });
  });

  it('השעון נגמר, אחוז חיים גבוה יותר ⇒ outlasted, והפער עדיין נקוב', () => {
    const s = { ...fresh(), learnerHp: 10, enemyHp: 5 };      // 10/12 > 5/10 (`D-278`ⓑ: `ENEMY_HP = 10`)
    expect(endingOf(s, BATTLE_MS)).toEqual({ kind: 'outlasted', wordsFromBoss: 5 });
  });

  it('השעון נגמר, תיקו באחוזים ⇒ survived (§ 3: «מנצח אחוז החיים הגבוה», ⛔ לא השווה)', () => {
    const s = { ...fresh(), learnerHp: 6, enemyHp: 10 };       // 6/12 = 10/20
    expect(endingOf(s, BATTLE_MS)?.kind).toBe('survived');
  });

  it('«היית 2 מילים מהבוס» — נוסח § 9 ח4 מילה במילה, ו«מילה אחת» ליחיד', () => {
    expect(wordsFromBossHe(2)).toBe('היית 2 מילים מהבוס');
    expect(wordsFromBossHe(ENEMY_HP)).toBe(`היית ${ENEMY_HP} מילים מהבוס`);
    expect(wordsFromBossHe(1)).toBe('היית מילה אחת מהבוס');
  });
});
