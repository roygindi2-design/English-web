import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
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
