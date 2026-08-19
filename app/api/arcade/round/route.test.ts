import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}
const CODE = withoutComments(readFileSync('app/api/arcade/round/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('⛔ קריאה בלבד — D-044 בשכבת הנתיב', () => {
  it.each(['.update(', '.insert(', '.upsert(', '.delete('])('⛔ %s אינו מופיע בקובץ', (verb) => {
    expect(CODE).not.toContain(verb);
  });

  it('⛔ word_progress אינו נקרא ואינו נכתב', () => {
    expect(CODE).not.toContain('word_progress');
  });

  it('הטבלאות שהקובץ נוגע בהן הן בדיוק שלוש, וכולן קריאה', () => {
    const tables = [...CODE.matchAll(/\.from\('([a-z_]+)'\)/g)].map((m) => m[1]);
    expect([...new Set(tables)].sort()).toEqual(['arcade_progress', 'profiles', 'words']);
  });
});

describe('בחירת המילים (D-034 · § 4.2י)', () => {
  const selectBlock = CODE.slice(CODE.indexOf('ROUND_SELECT'), CODE.indexOf('function isSchemaMissing'));

  it('הסינון הוא cefr_profile_band ⛔ ולעולם לא senses.cefr_level', () => {
    expect(CODE).toContain(".eq('cefr_profile_band', level)");
    expect(CODE).not.toContain('cefr_level');
  });

  it('המסיחים נשלפים מהטבלה ⛔ ואינם מיוצרים בזמן אמת', () => {
    expect(selectBlock).toContain('sense_distractors');
    expect(CODE).not.toMatch(/generateDistractor|makeDistractor/i);
  });

  it('!inner על שני הצמתים — מילה בלי משמעות או בלי מסיח ⛔ אינה פריט קרב', () => {
    expect(selectBlock).toContain('senses!inner');
    expect(selectBlock).toContain('sense_distractors!inner');
  });

  it('order בא לפני limit — תקרה על סדר לא מוגדר חותכת אוכלוסייה אקראית (לקח F-034)', () => {
    expect(CODE.indexOf(".order('ngsl_rank'")).toBeLessThan(CODE.indexOf('.limit('));
  });
});

describe('⛔ אין שעון (D-045 · R-020) — נמדד בסריקת מקור', () => {
  it.each(['setTimeout', 'setInterval', 'deadline', 'countdown'])('⛔ %s אינו מופיע', (token) => {
    expect(CODE).not.toContain(token);
  });
});

describe('הנתיב אינו מחליט — ההחלטה בשכבה הטהורה', () => {
  it('קורא ל-buildRound ⛔ ואינו סופר או מסנן בעצמו', () => {
    expect(CODE).toContain('buildRound(');
    expect(CODE).not.toMatch(/\.filter\([^)]*band/);
  });

  it('רמה קטנה מדי ⇒ 200 עם המספר, ⛔ לא 404 ו⛔ לא מסך ריק (D-046)', () => {
    const branch = CODE.slice(CODE.indexOf('if (!round.ok)'), CODE.indexOf('return NextResponse.json({ ok: true, level, seed'));
    expect(branch).toContain('eligible');
    expect(branch).toContain('required');
    expect(branch).not.toContain('404');
  });

  it('current_level ריק ⇒ round: null ⛔ ולא נפילה שקטה ל-A1', () => {
    expect(CODE).toContain('parseLevel(');
    expect(CODE).not.toMatch(/\?\?\s*'A1'/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב', () => {
    expect(CONTRACT).toContain('GET /api/arcade/round');
  });
});
