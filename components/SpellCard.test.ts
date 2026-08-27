import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const withoutComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
const SRC = readFileSync('components/SpellCard.tsx', 'utf8');
const CODE = withoutComments(SRC);

describe('T-178 · 37 § 5 — הקלף מצייר ו⛔ אינו מחשב', () => {
  it('⛔ אין כאן חוק: הקלף ⛔ אינו יודע מהי תשובה נכונה', () => {
    for (const token of ['translationHe', 'correct', 'cast(', 'battle']) {
      expect(CODE).not.toContain(token);
    }
  });

  it('ההכרעה מגיעה מ-`arenaGesture`, ⛔ ולא מספר בתוך מטפל אירועים', () => {
    expect(CODE).toContain("from '@/lib/core/arenaGesture'");
    expect(CODE).toMatch(/resolveGesture|cardLift/);
    // ⛔ 60 ⛔ אינו נכתב כאן: קבוע שקבור ב-`onPointerUp` נבדק רק בדפדפן.
    expect(CODE).not.toMatch(/\b60\b/);
  });

  it('⛔ אין שעון ברכיב — ההשתקעות היא CSS, ⛔ ולא JS', () => {
    for (const token of ['setTimeout', 'setInterval', 'requestAnimationFrame', 'Date.now']) {
      expect(CODE).not.toContain(token);
    }
  });
});

describe('שכבה א׳ — הבחירה ⛔ אינה מקודדת בצבע בלבד', () => {
  it('`aria-pressed` נושא את מצב הבחירה', () => {
    expect(CODE).toContain('aria-pressed');
  });

  it('יעד המגע הוא לפחות 44px, בטוקן ⛔ ולא במספר', () => {
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ קלף `?` נושא את התווית העברית **וגם** את הסימן (א2)', () => {
    expect(SRC).toContain('לחש לא מזוהה');
  });
});

describe('אינווריאנט 37 § 13.5 — ⛔ אין hex בתוך הרכיב', () => {
  it('⛔ אף צבע ⛔ אינו כתוב כאן — הכול טוקן', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

describe('פני הקלף עבריים — ⛔ ולא אנגלית', () => {
  it('⛔ `<EnWord>` ⛔ אינו מופיע: התווית היא תרגום, וה-headword יושב בבאנר', () => {
    expect(CODE).not.toContain('EnWord');
  });
});
