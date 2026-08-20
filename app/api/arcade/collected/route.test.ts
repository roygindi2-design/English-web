import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-039 · F-065 — הלבנת הערות לפני כל טענה, בדיוק כמו ב-
 * `app/api/arcade/result/route.test.ts`: `grep` גולמי פוגע גם בהערה שמתעדת את האיסור
 * וגם באסרציה שאוכפת אותו. ⛔ הפתרון הוא הלבנה, ⛔ לא מחיקת ההערות.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/collected/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('§ 4.2יב · T-110 — האוסף נקרא, ⛔ ואינו מנוע', () => {
  it('⛔ GET קורא ⛔ ואינו כותב', () => {
    const get = CODE.slice(CODE.indexOf('export async function GET'),
                           CODE.indexOf('export async function PATCH'));
    expect(get.length).toBeGreaterThan(0);
    for (const write of ['.insert(', '.update(', '.upsert(', '.delete(']) {
      expect(get).not.toContain(write);
    }
  });

  it('הקריאה מסוננת ללומד, ל-hidden_by_learner=false, והחדש למעלה', () => {
    expect(CODE).toContain(".eq('user_id', user.id)");
    expect(CODE).toContain(".eq('hidden_by_learner', false)");
    expect(CODE).toContain('ascending: false');
  });

  it('⛔ אין רמת CEFR בשליפה — לא כעמודה ולא בתשובה', () => {
    expect(CODE.toLowerCase()).not.toContain('cefr');
  });

  it.each(['word_progress', 'next_review_at', 'easiness', 'repetition',
           'self_marked_known', 'current_level'])('⛔ %s ⛔ אינו בקובץ', (bad) => {
    expect(CODE).not.toContain(bad);
  });

  it('PATCH מסתיר בדגל ⛔ ואינו מוחק שורה', () => {
    const patch = CODE.slice(CODE.indexOf('export async function PATCH'));
    expect(patch.length).toBeGreaterThan(0);
    expect(patch).toContain('hidden_by_learner');
    expect(patch).not.toContain('.delete(');
  });

  it('⛔ ואין DELETE בקובץ בכלל — «הסתרה» היא דגל (D-053)', () => {
    expect(CODE).not.toContain('export async function DELETE');
  });

  it('סדר השומרים של C-0032: ENV ⇒ סשן ⇒ שאילתה', () => {
    expect(CODE.indexOf('readSupabaseEnv')).toBeLessThan(CODE.indexOf('getUser'));
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf("from('arcade_collected_words')"));
  });

  it('סכמה חסרה ⇒ 503 בעברית, ⛔ לא 500', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('status: 503');
  });

  // ⚠️ הפרסר מוצהר **מעל** PATCH, ולכן חיתוך מ-`export async function PATCH` והלאה ⛔ אינו
  // רואה את השומרים — אסרציה כזאת הייתה נכשלת על קוד תקין (מחלקת F-039). הבדיקה
  // קוראת את הפרסר עצמו, בדיוק כמו `parseAnswers` ב-`result/route.test.ts`.
  it('⛔ גוף ה-PATCH מאומת בטיפוסו, ⛔ ואין cast עיוור', () => {
    const parser = CODE.slice(CODE.indexOf('function parseHideBody'),
                              CODE.indexOf('export async function PATCH'));
    expect(parser.length).toBeGreaterThan(0);
    for (const guard of ["typeof b.wordId !== 'string'", "typeof b.hidden !== 'boolean'"]) {
      expect(parser).toContain(guard);
    }
    expect(CODE.slice(CODE.indexOf('export async function PATCH'))).toContain('status: 422');
  });

  it('hiddenCount נמדד בשאילתה נפרדת — ⛔ בלעדיו «ריק» ו«הסתרת הכל» קורסים לאחד', () => {
    expect(CODE).toContain("count: 'exact'");
    expect(CODE).toContain(".eq('hidden_by_learner', true)");
  });

  it('החוזה מתעד את הנתיב באותו קומיט', () => {
    expect(CONTRACT).toContain('GET /api/arcade/collected');
    expect(CONTRACT).toContain('PATCH /api/arcade/collected');
  });
});
