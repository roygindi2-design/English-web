import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const SRC = readFileSync('components/CloseIcon.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('<CloseIcon>', () => {
  it('הוא SVG מוטבע ⛔ ולא אמוג\'י ולא תמונה (חוקה § 6)', () => {
    expect(CODE).toMatch(/<svg/);
    expect(CODE).not.toMatch(/<img|url\(|https?:/);
    expect(CODE, 'אמוג\'י אסור כאייקון').not.toMatch(
      /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2190}-\u{21FF}\u{2716}]/u,
    );
  });

  it('יורש את צבע הטקסט שלידו ⛔ ואינו מכיר hex', () => {
    expect(CODE).toMatch(/currentColor/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אינו רכיב לקוח ו⛔ אינו נושא שם נגיש משלו', () => {
    // השם חי על הכפתור שעוטף אותו — אייקון שמכריז על עצמו מכפיל את ההכרזה.
    expect(SRC.startsWith("'use client'")).toBe(false);
    expect(CODE).toMatch(/aria-hidden/);
  });
});
