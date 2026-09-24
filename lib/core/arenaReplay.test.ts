import { describe, expect, it } from 'vitest';
import type { BattleCast } from './battle';
import { REPLAY_MAX, replayTallyHe, replayWordIds } from './arenaReplay';

const c = (wordId: string, correct: boolean): BattleCast => ({
  wordId, correct, responseMs: 2000, critical: false, kind: 'base',
});

describe('T-451 · `37 § 8` ק8 — אילו מילים חוזרות', () => {
  it('⛔ אפס טעויות ⇒ אפס מילים ⇒ השלב מדולג', () => {
    expect(replayWordIds([c('a', true), c('b', true)])).toEqual([]);
    expect(replayWordIds([])).toEqual([]);
  });

  it('מילה שהוחטאה חוזרת — גם `base`, ⛔ לא רק `unfiltered`', () => {
    expect(replayWordIds([c('a', true), c('b', false), c('c', true)])).toEqual(['b']);
  });

  it('⛔ מילה שתוקנה אחר כך בתוך השעון ⛔ אינה חוזרת', () => {
    expect(replayWordIds([c('a', false), c('a', true), c('b', false)])).toEqual(['b']);
  });

  it('טעות אחרי תיקון פותחת את המילה שוב', () => {
    expect(replayWordIds([c('a', false), c('a', true), c('a', false)])).toEqual(['a']);
  });

  it('מזהה ייחודי — שתי טעויות על אותה מילה ⇒ חזרה אחת', () => {
    expect(replayWordIds([c('a', false), c('a', false)])).toEqual(['a']);
  });

  it('עד שלוש, בסדר הטעות — ⛔ הרביעית נשארת בחוץ', () => {
    const casts = ['d', 'b', 'a', 'c'].map((id) => c(id, false));
    expect(REPLAY_MAX).toBe(3);
    expect(replayWordIds(casts)).toEqual(['d', 'b', 'a']);
  });

  it('⛔ הפונקציה ⛔ אינה משנה את הקלט', () => {
    const casts = Object.freeze([c('a', false), c('b', false)]);
    replayWordIds(casts);
    expect(casts).toHaveLength(2);
  });

  it('השורה בסיכום', () => {
    expect(replayTallyHe(2, 3)).toBe('תיקנת 2 מתוך 3');
  });
});
