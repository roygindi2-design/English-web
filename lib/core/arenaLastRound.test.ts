import { describe, expect, it } from 'vitest';
import {
  LAST_ROUND_SURVIVED_HE,
  LAST_ROUND_WON_HE,
  lastRoundDateHe,
  lastRoundFromRow,
  lastRoundOutcomeHe,
  lastRoundScoreHe,
} from './arenaLastRound';

const ROW = Object.freeze({
  finished_at: '2026-09-16T23:13:07.482Z',
  words_seen: 16,
  words_correct: 14,
  enemy_defeated: true,
});

describe('T-360 · חותמת ⓒ — השורה הגולמית מ-`arcade_runs`', () => {
  it('שורה תקינה ⇒ מודל תצוגה, והמספרים הם אלה של השורה', () => {
    expect(lastRoundFromRow(ROW)).toEqual({
      finishedAt: '2026-09-16T23:13:07.482Z',
      wordsSeen: 16,
      wordsCorrect: 14,
      enemyDefeated: true,
    });
  });

  it('⛔ אין שורה ⇒ `null`, ⛔ ולא שגיאה — לומד שטרם קרב הוא מצב תקין', () => {
    expect(lastRoundFromRow(null)).toBeNull();
    expect(lastRoundFromRow(undefined)).toBeNull();
  });

  it('⛔ שדה חסר או בטיפוס שגוי ⇒ `null`, ⛔ ולא מספר שקרי על המסך', () => {
    expect(lastRoundFromRow({ ...ROW, finished_at: 'אתמול' })).toBeNull();
    expect(lastRoundFromRow({ ...ROW, words_seen: '16' })).toBeNull();
    expect(lastRoundFromRow({ ...ROW, words_correct: Number.NaN })).toBeNull();
    expect(lastRoundFromRow({ ...ROW, enemy_defeated: 1 })).toBeNull();
    expect(lastRoundFromRow({ words_seen: 4, words_correct: 2, enemy_defeated: false })).toBeNull();
  });

  it('⛔ `words_correct > words_seen` ⇒ `null` — אותו תנאי של `arcade_runs_counts_check`', () => {
    expect(lastRoundFromRow({ ...ROW, words_correct: 17 })).toBeNull();
  });

  it('⛔ מספר שלילי ⇒ `null`', () => {
    expect(lastRoundFromRow({ ...ROW, words_seen: -1, words_correct: -1 })).toBeNull();
  });

  it('שבר עשרוני נחתך כלפי מטה ⛔ ולא מוצג כ-`13.7 / 16`', () => {
    expect(lastRoundFromRow({ ...ROW, words_correct: 13.7 })?.wordsCorrect).toBe(13);
  });
});

describe('T-360 · שלוש המחרוזות — ⛔ עובדות, ⛔ ולא פסקי דין (R-016 · `37 § 9` ח4)', () => {
  const won = lastRoundFromRow(ROW);
  const survived = lastRoundFromRow({ ...ROW, enemy_defeated: false, words_correct: 7 });

  it('שני המוצאים בלבד, ו⛔ אין ביניהם מילת הפסד', () => {
    expect(lastRoundOutcomeHe(won!)).toBe(LAST_ROUND_WON_HE);
    expect(lastRoundOutcomeHe(survived!)).toBe(LAST_ROUND_SURVIVED_HE);
    expect(`${LAST_ROUND_WON_HE} ${LAST_ROUND_SURVIVED_HE}`).not.toContain('הפסד');
  });

  it('הניקוד בצורת שורת `נכונות` של מסך הסיום', () => {
    expect(lastRoundScoreHe(won!)).toBe('14 / 16');
    expect(lastRoundScoreHe(survived!)).toBe('7 / 16');
  });

  it('התאריך נגזר מהקידומת ⛔ ואינו תלוי באזור הזמן של הקורא', () => {
    expect(lastRoundDateHe(won!)).toBe('16.09');
    expect(lastRoundDateHe(lastRoundFromRow({ ...ROW, finished_at: '2026-01-05T00:00:00Z' })!)).toBe('05.01');
  });
});
