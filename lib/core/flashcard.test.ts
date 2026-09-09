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

// GeneratedSense plus the one field CardSense adds. Typed as the intersection rather
// than as CardSense so the fixture still fails typecheck if a required field of the
// stored shape is dropped — the reason it was pinned to GeneratedSense in the first place.
const sense: GeneratedSense & { readonly needsHumanReview: boolean } = {
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
  needsHumanReview: false,
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

describe('exampleSegments (TD-11)', () => {
  // Deliberately NOT named `sense`: the module-level fixture above is a full
  // GeneratedSense, and shadowing it here would let a future deletion silently
  // fall through to a different sentence.
  const segSense = {
    headword: 'deliberate',
    translationHe: 'לשקול בכובד ראש',
    examples: { supportive: 'They deliberated all night.', neutral: 'We must deliberate first.' },
    needsHumanReview: false,
  };

  it('splits the example around the inflected target', () => {
    const card = buildCard(segSense, 'recognition', { isFirstEncounter: true });
    expect(card.back.exampleSegments).toEqual([
      { text: 'They ', isTarget: false },
      { text: 'deliberated', isTarget: true },
      { text: ' all night.', isTarget: false },
    ]);
  });

  it('always reassembles into exactly the example string', () => {
    const card = buildCard(segSense, 'production', { isFirstEncounter: false });
    expect(card.back.exampleSegments.map((s) => s.text).join('')).toBe(card.back.example);
  });

  it('marks exactly one segment', () => {
    const card = buildCard(segSense, 'recognition', { isFirstEncounter: false });
    expect(card.back.exampleSegments.filter((s) => s.isTarget)).toHaveLength(1);
  });

  it('falls back to one unmarked segment when the word cannot be located', () => {
    // ⚠️ **הדוגמה כאן הייתה `go`/`went` עד 09/09.** מאז `IRREGULAR_FORMS` מכיר את
    // הזוג הזה ⇒ `went` **כן** מסומן, וזו התוצאה הרצויה. הנפילה-לאחור עדיין חיה,
    // ולכן היא נבדקת על צורה חריגה ש⛔ אינה במפה ו⛔ אין לה שום כלל סיומת.
    const irregular = { ...segSense, headword: 'slay', examples: { supportive: 'He slew the dragon.', neutral: '' } };
    const card = buildCard(irregular, 'recognition', { isFirstEncounter: true });
    expect(card.back.exampleSegments).toEqual([{ text: 'He slew the dragon.', isTarget: false }]);
  });

  it('is empty on a face with no example, and on the front', () => {
    const card = buildCard(segSense, 'recognition', { isFirstEncounter: true });
    expect(card.front.exampleSegments).toEqual([]);
    const bare = { ...segSense, examples: { supportive: '', neutral: '' } };
    expect(buildCard(bare, 'recognition', { isFirstEncounter: true }).back.exampleSegments).toEqual([]);
  });
});

describe('unverified marker (T-045 · D-024)', () => {
  // The one boolean the SQL of Task 3 writes to `senses.needs_human_review`, on its way
  // to the card. It lives on CardFace and not on the sense the component reads, because
  // "back only" has to be a property a test can pin — TD-11 is the recorded cost of
  // re-deriving a card property inside React.
  const UNVERIFIED = { ...sense, needsHumanReview: true };

  it('marks the back, and only the back, of an unverified recognition card', () => {
    const card = buildCard(UNVERIFIED, 'recognition', { isFirstEncounter: true });
    expect(card.back.unverified).toBe(true);
    expect(card.front.unverified).toBe(false);
  });

  it('marks the back, and only the back, of an unverified production card', () => {
    // The front here is the Hebrew prompt. Marking it would tell the learner the
    // QUESTION is unreliable before they have answered — the inverse of D-024,
    // which asks for the unverified TRANSLATION to be flagged, not the prompt.
    const card = buildCard(UNVERIFIED, 'production', { isFirstEncounter: false });
    expect(card.back.unverified).toBe(true);
    expect(card.front.unverified).toBe(false);
  });

  it('leaves both faces unmarked for a verified sense', () => {
    for (const d of BOTH) {
      const card = buildCard({ ...sense, needsHumanReview: false }, d, { isFirstEncounter: true });
      expect(card.back.unverified).toBe(false);
      expect(card.front.unverified).toBe(false);
    }
  });

  it('does not let the flag leak into any other face field', () => {
    // A spread in the wrong order would carry `needsHumanReview` itself onto the
    // face, giving the component a second, unpinned way to read the same claim.
    const card = buildCard(UNVERIFIED, 'recognition', { isFirstEncounter: true });
    expect(Object.keys(card.back).sort()).toEqual(
      ['example', 'exampleLang', 'exampleSegments', 'primary', 'primaryLang', 'secondary', 'unverified'].sort(),
    );
  });
});
