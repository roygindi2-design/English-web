import { describe, expect, it } from 'vitest';

import {
  BINARY_GRADES,
  buildCard,
  directionFor,
  gradeTypedAnswer,
  type Card,
  type CardDirection,
} from './flashcard';
import type { GeneratedSense } from './contentSchema';

const sense: GeneratedSense = {
  headword: 'deliberate',
  pos: 'adjective',
  translationHe: 'מכוון',
  definitionEn: 'done on purpose',
  examples: {
    supportive: 'It was a deliberate choice, not an accident.',
    neutral: 'Her answer was deliberate.',
  },
  items: [],
  distractors: [],
};

const BOTH: readonly CardDirection[] = ['recognition', 'production'];
const later = { isFirstEncounter: false } as const;

describe('buildCard — faces', () => {
  it('recognition shows the English word alone on the front', () => {
    const c = buildCard(sense, 'recognition', later);
    expect(c.front.primary).toBe('deliberate');
    expect(c.front.secondary).toBeNull(); // minimum information principle
    expect(c.back.primary).toBe('מכוון');
  });

  it('the front never carries a second line in either direction', () => {
    // A production front that leaks the English answer destroys the exercise it is testing.
    for (const d of BOTH) {
      const c = buildCard(sense, d, later);
      expect(c.front.secondary).toBeNull();
      expect(c.front.example).toBeNull();
    }
  });

  it('trims stored text so a stray space never becomes a wrong typed answer', () => {
    const s = { ...sense, headword: '  deliberate  ', translationHe: ' מכוון ' };
    expect(buildCard(s, 'recognition', later).front.primary).toBe('deliberate');
    expect(buildCard(s, 'recognition', later).back.primary).toBe('מכוון');
  });

  it('production shows the Hebrew alone on the front', () => {
    const c = buildCard(sense, 'production', later);
    expect(c.front.primary).toBe('מכוון');
    expect(c.back.primary).toBe('deliberate');
  });

  it('the example is always on the back, never the front', () => {
    for (const d of BOTH) {
      const c = buildCard(sense, d, later);
      expect(c.front.example).toBeNull();
      expect(c.back.example).not.toBeNull();
    }
  });

  it('marks the language of every face so RTL wrapping is not guessed', () => {
    const r = buildCard(sense, 'recognition', later);
    expect(r.front.primaryLang).toBe('en');
    expect(r.back.primaryLang).toBe('he');

    const p = buildCard(sense, 'production', later);
    expect(p.front.primaryLang).toBe('he');
    expect(p.back.primaryLang).toBe('en');
  });

  it('the example sentence is English on both directions, even on a Hebrew face', () => {
    for (const d of BOTH) {
      const c = buildCard(sense, d, later);
      expect(c.back.exampleLang).toBe('en');
    }
  });
});

describe('buildCard — which example', () => {
  it('a first encounter gets the supportive sentence; later reviews get the neutral one', () => {
    expect(buildCard(sense, 'recognition', { isFirstEncounter: true }).back.example).toBe(
      'It was a deliberate choice, not an accident.',
    );
    expect(buildCard(sense, 'recognition', later).back.example).toBe('Her answer was deliberate.');
  });

  it('falls back to the supportive example when neutral is missing', () => {
    const s = { ...sense, examples: { supportive: sense.examples.supportive, neutral: '' } };
    expect(buildCard(s, 'recognition', later).back.example).toBe(sense.examples.supportive);
  });

  it('treats a whitespace-only example as missing, not as a blank line on the card', () => {
    const s = { ...sense, examples: { supportive: sense.examples.supportive, neutral: '   \n' } };
    expect(buildCard(s, 'recognition', later).back.example).toBe(sense.examples.supportive);
  });

  it('falls back to the neutral example when the supportive one is missing on a first encounter', () => {
    // The introduction card is the one card where an example matters most.
    const s = { ...sense, examples: { supportive: '', neutral: sense.examples.neutral } };
    expect(buildCard(s, 'recognition', { isFirstEncounter: true }).back.example).toBe(
      sense.examples.neutral,
    );
  });

  it('renders no example rather than an empty one when both sentences are missing', () => {
    const s = { ...sense, examples: { supportive: '', neutral: '' } };
    expect(buildCard(s, 'recognition', later).back.example).toBeNull();
  });

  it('trims the chosen example so the card never carries stray whitespace', () => {
    const s = { ...sense, examples: { supportive: sense.examples.supportive, neutral: '  Her answer was deliberate.  ' } };
    expect(buildCard(s, 'recognition', later).back.example).toBe('Her answer was deliberate.');
  });
});

describe('buildCard — grading', () => {
  it('production is typed, recognition is self-graded', () => {
    expect(buildCard(sense, 'production', later).input).toBe('typed');
    expect(buildCard(sense, 'recognition', later).input).toBe('self');
  });

  it('grading is binary in both directions', () => {
    for (const d of BOTH) {
      expect(buildCard(sense, d, later).grades).toEqual(['again', 'good']);
    }
  });

  it('cannot have its grade list mutated through one card into every later card', () => {
    const a = buildCard(sense, 'recognition', later);
    expect(() => (a.grades as unknown as string[]).push('easy')).toThrow(TypeError);
    expect(buildCard(sense, 'recognition', later).grades).toEqual(['again', 'good']);
    expect(BINARY_GRADES).toEqual(['again', 'good']);
  });

  it('does not let a self-graded production card exist at the type level', () => {
    // @ts-expect-error production is typed; a self-graded production card is a contradiction.
    const bad: Card = { ...buildCard(sense, 'production', later), input: 'self' };
    expect(bad.direction).toBe('production');
  });
});

describe('gradeTypedAnswer — the learner never rates themselves on production', () => {
  const card = buildCard(sense, 'production', later);

  it('accepts the exact English headword', () => {
    expect(gradeTypedAnswer(card, 'deliberate')).toBe('good');
  });

  it('ignores case and surrounding whitespace', () => {
    expect(gradeTypedAnswer(card, '  Deliberate ')).toBe('good');
    expect(gradeTypedAnswer(card, 'DELIBERATE')).toBe('good');
  });

  it('collapses internal whitespace so a double space in a phrase still counts', () => {
    const phrase = buildCard({ ...sense, headword: 'take off' }, 'production', later);
    expect(gradeTypedAnswer(phrase, 'take  off')).toBe('good');
  });

  it('marks a wrong or empty answer as again', () => {
    expect(gradeTypedAnswer(card, 'deliberately')).toBe('again');
    expect(gradeTypedAnswer(card, '')).toBe('again');
    expect(gradeTypedAnswer(card, '   ')).toBe('again');
  });

  it('refuses to auto-grade a recognition card — that one is self-rated by design', () => {
    expect(() => gradeTypedAnswer(buildCard(sense, 'recognition', later), 'deliberate')).toThrow(
      RangeError,
    );
  });
});

describe('buildCard — refuses to render a broken card', () => {
  it('rejects a sense with no headword', () => {
    expect(() => buildCard({ ...sense, headword: '  ' }, 'recognition', later)).toThrow(RangeError);
  });

  it('rejects a sense with no Hebrew translation', () => {
    expect(() => buildCard({ ...sense, translationHe: '' }, 'recognition', later)).toThrow(RangeError);
  });

  it('rejects a direction it does not know', () => {
    expect(() =>
      buildCard(sense, 'listening' as unknown as CardDirection, later),
    ).toThrow(RangeError);
  });
});

describe('directionFor — direction follows mastery, not a global setting', () => {
  const opts = { promoteAfterConsecutiveCorrect: 3 } as const;

  it('starts a brand new word in recognition', () => {
    expect(directionFor({ consecutiveCorrectRecognition: 0 }, opts)).toBe('recognition');
  });

  it('stays in recognition below the promotion threshold', () => {
    expect(directionFor({ consecutiveCorrectRecognition: 2 }, opts)).toBe('recognition');
  });

  it('promotes to production once the word is stable in recognition', () => {
    expect(directionFor({ consecutiveCorrectRecognition: 3 }, opts)).toBe('production');
    expect(directionFor({ consecutiveCorrectRecognition: 9 }, opts)).toBe('production');
  });

  it('refuses a promotion threshold below one — that would skip recognition entirely', () => {
    expect(() => directionFor({ consecutiveCorrectRecognition: 0 }, { promoteAfterConsecutiveCorrect: 0 })).toThrow(
      RangeError,
    );
  });

  it('refuses a fractional or negative streak', () => {
    expect(() => directionFor({ consecutiveCorrectRecognition: 1.5 }, opts)).toThrow(RangeError);
    expect(() => directionFor({ consecutiveCorrectRecognition: -1 }, opts)).toThrow(RangeError);
  });
});
