import { describe, expect, it } from 'vitest';
import { buildSentenceCard, completeStem, gradeChoice, splitStem } from './sentenceCard';

const item = {
  wordId: '11111111-1111-4111-8111-111111111111',
  itemIndex: 0,
  stem: 'The workers had to ____ the design.',
  answer: 'alter',
  options: ['repair', 'alter', 'later'],
  translationHe: 'לשנות',
  exampleNeutral: 'They may alter the plan.',
};

describe('sentenceCard — D-156 · D-169', () => {
  it('הגזע נחתך בחסר, והגב הוא המשפט המושלם', () => {
    expect(splitStem(item.stem)).toEqual({ before: 'The workers had to ', after: ' the design.' });
    expect(completeStem(item.stem, 'alter')).toBe('The workers had to alter the design.');
    expect(() => splitStem('no blank here')).toThrow(RangeError);
  });

  it('input הוא choice, שלוש אפשרויות, והתשובה ביניהן', () => {
    const card = buildSentenceCard(item);
    expect(card.input).toBe('choice');
    if (card.input !== 'choice') throw new Error('unreachable');
    expect(card.options).toHaveLength(3);
    expect(card.options).toContain('alter');
    expect(card.front.primaryLang).toBe('en');
  });

  it('הגב: משפט מושלם · תרגום · דוגמה ניטרלית — ⛔ שדה חדש אין (D-156 ⓒ)', () => {
    const card = buildSentenceCard(item);
    expect(card.back.primary).toBe('The workers had to alter the design.');
    expect(card.back.secondary).toBe('לשנות');
    expect(card.back.example).toBe('They may alter the plan.');
    expect(card.back.exampleSegments.map((s) => s.text).join('')).toBe('They may alter the plan.');
    expect(card.back.exampleSegments.some((s) => s.isTarget)).toBe(true);
  });

  it('ציון: התשובה המדויקת בלבד היא good — ⛔ לא רישיות שונות, ⛔ לא רווחים', () => {
    const card = buildSentenceCard(item);
    expect(gradeChoice(card, 'alter')).toBe('good');
    expect(gradeChoice(card, 'repair')).toBe('again');
    expect(gradeChoice(card, 'Alter')).toBe('again');
  });

  it('מוטציה: ⛔ אף אפשרות עברית ו⛔ אין translation_he בין האפשרויות (D-087 בהיפוך)', () => {
    const card = buildSentenceCard(item);
    if (card.input !== 'choice') throw new Error('unreachable');
    for (const option of card.options) expect(option).not.toMatch(/[֐-׿]/);
    expect(card.options).not.toContain('לשנות');
  });

  // Added beyond the plan's block: the two edges a component would otherwise hit first.
  it('דוגמה ניטרלית חסרה ⇒ גב בלי דוגמה, ⛔ ולא זריקה', () => {
    const card = buildSentenceCard({ ...item, exampleNeutral: null });
    expect(card.back.example).toBeNull();
    expect(card.back.exampleSegments).toEqual([]);
  });

  it('⛔ gradeChoice על כרטיס שאינו choice זורק — ⛔ אין דירוג שקט של כרטיס אחר', () => {
    const card = buildSentenceCard(item);
    const notChoice = { ...card, input: 'self' as const, direction: 'recognition' as const };
    expect(() => gradeChoice(notChoice as never, 'alter')).toThrow(RangeError);
  });
});
