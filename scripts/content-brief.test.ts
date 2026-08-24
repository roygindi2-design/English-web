import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ANSWERS_PER_QUESTION } from '@/lib/core/storyQuestionGate';
import { REQUIRED_WORDS_PER_MESSAGE } from '@/lib/core/messageGate';
import {
  STORIES_PER_LEVEL,
  STORY_LEVELS,
  STORY_MAX_WORDS,
  STORY_MIN_WORDS,
  STORY_TITLE_MAX_WORDS,
} from '@/lib/core/storyGate';

/**
 * F-087 · F-093 — מסמך הוראה שמספריו ⛔ אינם נמדדים מול הקוד סוחף בשקט, והסוכן
 * מייצר לפי המספר הישן. כל מספר בהוראה נטען כאן מול הקבוע שהשער אוכף.
 */
const BRIEF = readFileSync('docs/content-stories-brief.md', 'utf8');

describe('docs/content-stories-brief.md — ⛔ אפס סחיפה מול הקוד', () => {
  it('נוקב באורך הגוף כפי שהשער אוכף אותו', () => {
    expect(BRIEF).toContain(`${STORY_MIN_WORDS}–${STORY_MAX_WORDS}`);
  });

  it('נוקב במכסה: 3 בכל רמה, 12 בסך הכל', () => {
    expect(BRIEF).toContain(`${STORIES_PER_LEVEL}`);
    expect(BRIEF).toContain(`${STORIES_PER_LEVEL * STORY_LEVELS.length}`);
  });

  it('נוקב בתקרת הכותרת', () => {
    expect(BRIEF).toContain(`${STORY_TITLE_MAX_WORDS}`);
  });

  it('מונה את ארבע הרמות ⛔ ולא את C1/C2', () => {
    for (const level of STORY_LEVELS) expect(BRIEF).toContain(level);
    expect(BRIEF).not.toContain('C1');
    expect(BRIEF).not.toContain('C2');
  });

  it('⛔ אוסר שם פרטי ו⛔ אוסר ספרה — שתי המחלקות שהשער פוסל בפועל', () => {
    expect(BRIEF).toMatch(/שם פרטי/);
    expect(BRIEF).toMatch(/ספרה|ספרות/);
  });

  it('⛔ אוסר תיקון ביד: פריט שנפסל מיוצר מחדש', () => {
    expect(BRIEF).toMatch(/מיוצר מחדש/);
  });
});


/**
 * ⛔ **THE DRIFT THAT THE NUMBER CHECKS ABOVE CANNOT CATCH.** F-087/F-093 pinned
 * the numbers in one brief. The failure that is left is structural and applies to
 * all three: a gate GAINS a rejection reason, the brief never learns about it, and
 * CONTENT produces a whole batch that the gate rejects for a rule ⛔ nobody wrote
 * down. R-014 then forbids repair, so the batch is regenerated — blind, again.
 *
 * ⇒ the reason union is read **out of the gate's source**, ⛔ not retyped here.
 * Retyping it would mean this test asserts against a copy that drifts in exactly
 * the same way it exists to prevent.
 */
const reasonsDeclaredIn = (gateFile: string): string[] => {
  const src = readFileSync(gateFile, 'utf8');
  const union = /export type \w*GateReason =([\s\S]*?);/.exec(src);
  if (union === null) throw new Error(`${gateFile}: ⛔ no exported GateReason union`);
  const body = union[1];
  if (body === undefined) throw new Error(`${gateFile}: ⛔ union matched with no body`);
  const reasons = [...body.matchAll(/'([a-z_]+)'/g)]
    .map((m) => m[1])
    .filter((r): r is string => r !== undefined);
  if (reasons.length === 0) throw new Error(`${gateFile}: ⛔ union parsed to zero reasons`);
  return reasons;
};

const PAIRS: readonly (readonly [string, string])[] = [
  ['docs/content-stories-brief.md', 'lib/core/storyGate.ts'],
  ['docs/content-story-questions-brief.md', 'lib/core/storyQuestionGate.ts'],
  ['docs/content-messages-brief.md', 'lib/core/messageGate.ts'],
];

describe('כל תדריך מונה כל סיבת פסילה שהשער שלו יודע לפלוט', () => {
  for (const [brief, gate] of PAIRS) {
    it(`${brief} ← ${gate}`, () => {
      const text = readFileSync(brief, 'utf8');
      const missing = reasonsDeclaredIn(gate).filter((r) => !text.includes(r));
      expect(missing, `⛔ סיבות שהשער פולט ו⛔ אינן בתדריך: ${missing.join(', ')}`).toEqual([]);
    });
  }
});

describe('docs/content-story-questions-brief.md · docs/content-messages-brief.md — המספרים', () => {
  it('שאלת הבנה: מספר התשובות בתדריך הוא זה שהשער אוכף', () => {
    const text = readFileSync('docs/content-story-questions-brief.md', 'utf8');
    expect(ANSWERS_PER_QUESTION).toBe(3);
    expect(text).toContain(`${ANSWERS_PER_QUESTION}`);
    expect(text).toContain(`${STORIES_PER_LEVEL * STORY_LEVELS.length}`);
  });

  it('הודעות: מספר מילות החובה בתדריך הוא זה שהשער אוכף', () => {
    const text = readFileSync('docs/content-messages-brief.md', 'utf8');
    expect(REQUIRED_WORDS_PER_MESSAGE).toBe(3);
    expect(text).toContain(`${REQUIRED_WORDS_PER_MESSAGE}`);
  });

  it('⛔ שני התדריכים אוסרים תיקון ביד — R-014 ⛔ אינו נתון לפרשנות לפי הזמנה', () => {
    for (const [brief] of PAIRS) {
      expect(readFileSync(brief, 'utf8'), brief).toMatch(/מיוצר מחדש|מיוצרת מחדש/);
    }
  });
});
