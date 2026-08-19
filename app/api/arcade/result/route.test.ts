import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-039 · F-065 — הלבנת הערות לפני כל טענה. `grep` גולמי על הקובץ כולו פוגע גם
 * בהערה שמתעדת את האיסור וגם באסרציה שאוכפת אותו: זה false-accept בכיוון אחד
 * (F-039) ו-false-reject בכיוון השני (F-065). ⛔ הפתרון הוא הלבנה, ⛔ לא מחיקת ההערות.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/result/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ הכתיבה נוגעת בשתי טבלאות הזירה בלבד (D-044 · § 4.2י מדד ⓐ)', () => {
  const written = [...CODE.matchAll(/\.from\('([a-z_]+)'\)\s*\.(?:upsert|insert|update|delete)\(/g)]
    .map((m) => m[1]);

  it('שתי הטבלאות, ותו לא', () => {
    expect([...new Set(written)].sort()).toEqual(['arcade_progress', 'arcade_runs']);
  });

  it.each(['word_progress', 'profiles', 'words', 'senses'])('⛔ %s אינו נכתב', (table) => {
    expect(written).not.toContain(table);
  });

  it('⛔ word_progress אינו מופיע בקובץ בכלל — גם לא בקריאה', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it.each(['easiness', 'interval_days', 'repetition', 'next_review_at',
           'self_marked_known', 'current_level'])('⛔ %s אינו מופיע בקובץ', (column) => {
    expect(CODE).not.toContain(column);
  });
});

describe('סדר ההגנות (F-004 · C-0032)', () => {
  it('גוף שאינו אובייקט ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('Array.isArray(payload)');
    expect(CODE).toContain('status: 400');
  });

  it('session נבדק לפני שהגוף מאומת', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('parseAnswers(body.answers)'));
  });

  it('תשובות פגומות ⇒ 422 בעברית, ⛔ ולא כתיבה', () => {
    expect(CODE).toContain('status: 422');
    expect(CODE).toContain('fieldErrors');
    expect(CODE.indexOf('status: 422')).toBeLessThan(CODE.indexOf('.upsert('));
  });

  it('⛔ אין cast עיוור על הגוף — כל שדה נבדק בטיפוסו', () => {
    const parser = CODE.slice(CODE.indexOf('function parseAnswers'), CODE.indexOf('export async function POST'));
    for (const guard of ["typeof a.wordId !== 'string'", "typeof a.correct !== 'boolean'"]) {
      expect(parser).toContain(guard);
    }
  });
});

describe('הנתיב אינו מחליט', () => {
  it('קורא ל-planArcadeWrites ומחיל את השורות שחזרו', () => {
    expect(CODE).toContain('planArcadeWrites(');
    expect(CODE).toContain('for (const write of plan.rows)');
  });

  it('⛔ אין ניקוד, מטבע, XP או לוח תוצאות (D-050)', () => {
    // F-065 — המדידה היא בגבול מזהה ⛔ ולא substring גולמי. נמדד ב-C-0182 על מימוש
    // ⛔ שאין בו ולו הפרה אחת: `xp` יושב בתוך `export`, ולכן `toContain('xp')` הכשיל
    // קובץ נקי. ⛔ הפעולה הזולה — לשנות את שם ה-export — לא נעשתה; המדידה תוקנה.
    for (const token of ['score', 'points', 'xp', 'coins', 'leaderboard', 'streak']) {
      expect(CODE.toLowerCase()).not.toMatch(new RegExp(`\\b${token}\\b`));
    }
  });

  it('«המילים שהפילו אותך» חוזר בתשובה ⛔ ואינו נכתב (D-047)', () => {
    const writes = CODE.slice(CODE.indexOf('for (const write of plan.rows)'), CODE.lastIndexOf('return NextResponse.json'));
    expect(writes).not.toContain('missed');
    expect(CODE.slice(CODE.lastIndexOf('return NextResponse.json'))).toContain('missed: plan.missed');
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('POST /api/arcade/result');
  });
});
