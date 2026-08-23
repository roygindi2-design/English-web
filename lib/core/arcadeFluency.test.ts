import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ARCADE_KNOWN_CORRECT_MIN, fluencyPool, isKnownInArcade } from './arcadeFluency';

describe('D-062 — «ידועה» נמדדת בתוך הזירה בלבד', () => {
  it('הסף הוא 3', () => {
    expect(ARCADE_KNOWN_CORRECT_MIN).toBe(3);
  });
  it('2 נכונות ⛔ אינן «ידועה»', () => {
    expect(isKnownInArcade({ timesCorrect: 2 })).toBe(false);
  });
  it('3 נכונות ⇒ «ידועה»', () => {
    expect(isKnownInArcade({ timesCorrect: 3 })).toBe(true);
  });
  it('המאגר מחזיר מזהים בלבד, ורק את הכשירים', () => {
    expect(fluencyPool([
      { wordId: 'a', timesCorrect: 5 },
      { wordId: 'b', timesCorrect: 1 },
      { wordId: 'c', timesCorrect: 3 },
    ])).toEqual(['a', 'c']);
  });
  it('⛔ מאגר ריק ⇒ מערך ריק, ⛔ ולא null', () => {
    expect(fluencyPool([])).toEqual([]);
  });
});

describe('⛔ הבידוד של D-052 הוא בדיקה שנכשלת', () => {
  // ⛔ המקור **הגולמי**, ⛔ ללא הלבנת הערות ובמכוון: כאן גם אזכור בהערה הוא ריח,
  // כי מודול שמסביר את עצמו בשמות של הצד הלימודי הוא מודול שעומד לקרוא אותם.
  const src = readFileSync('lib/core/arcadeFluency.ts', 'utf8');
  it.each(['self_marked_known', 'selfMarkedKnown', 'repetition', 'word_progress',
           'next_review_at', 'easiness', 'current_level'])('⛔ %s ⛔ אינו בקובץ', (bad) => {
    expect(src).not.toContain(bad);
  });
  it('⛔ ואין שעון ואין דדליין (D-049 · S16)', () => {
    for (const bad of ['setTimeout', 'Date.now', 'deadline', 'countdown']) {
      expect(src).not.toContain(bad);
    }
  });
});
