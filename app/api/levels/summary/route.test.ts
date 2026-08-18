import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * GET /api/levels/summary — T-080, לפי `docs/superpowers/plans/2026-08-17-level-map.md`.
 *
 * בדיקות מקור, בדיוק כמו `app/api/study/queue/route.test.ts`: הנתיב דורש ENV של
 * Supabase ו-session אמיתי. ההתנהגות המספרית כבר נבדקה ב-`lib/core/levelSummary.test.ts`;
 * מה שנשאר לאכוף כאן הוא מה שאי-אפשר לבדוק בשכבה הטהורה — סדר ההגנות, מיפוי השגיאות,
 * ומה אסור שייצא החוצה.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(readFileSync('app/api/levels/summary/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר ההגנות (דפוס C-0032)', () => {
  it('ENV לפני בניית לקוח', () => {
    expect(CODE.indexOf('readSupabaseEnv()')).toBeLessThan(CODE.indexOf('createRouteClient('));
  });

  it('session לפני כל שאילתה על נתוני לומד', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf("from('profiles')"));
  });

  it('אין session ⇒ 401 session_expired', () => {
    expect(CODE).toContain("code: 'session_expired'");
    expect(CODE).toContain('status: 401');
  });
});

describe('הרמה — words.cefr_profile_band, ⛔ ולעולם לא senses.cefr_level (D-034)', () => {
  it('מסנן לפי cefr_profile_band', () => {
    expect(CODE).toContain('cefr_profile_band');
  });

  it('⛔ המחרוזת cefr_level אינה מופיעה בקוד כלל', () => {
    expect(CODE).not.toMatch(/senses\.cefr_level|['"]cefr_level['"]/);
  });

  it('רמה שאינה מוכרת עוברת דרך parseLevel ⛔ ולא נוחשת', () => {
    expect(CODE).toContain('parseLevel(');
  });
});

describe('⛔ הנתיב אינו מחשב — הוא שואל ומרכיב (T-080)', () => {
  it('הסיכום מגיע מ-summarizeLevel', () => {
    expect(CODE).toContain('summarizeLevel(');
  });

  it('⛔ אין ספירה מקבילה ב-SQL על self_marked_known או attempts', () => {
    // predicate כזה היה הגדרה שנייה של אותה קבוצה, בדיוק מה ש-§ 4.2ז אוסר.
    expect(CODE).not.toMatch(/\.or\(/);
    expect(CODE).not.toMatch(/\.gt\(['"]attempts['"]/);
    expect(CODE).not.toMatch(/\.eq\(['"]self_marked_known['"]/);
  });

  it('גודל הרמה נספר ב-head ⛔ ולא נשלף כשורות', () => {
    expect(CODE).toMatch(/count:\s*'exact'/);
    expect(CODE).toMatch(/head:\s*true/);
  });

  it('שליפת שורות ההתקדמות חסומה בתקרה', () => {
    expect(CODE).toMatch(/MAX_PROGRESS_ROWS/);
    expect(CODE).toMatch(/\.limit\(MAX_PROGRESS_ROWS\)/);
  });
});

describe('מיפוי שגיאות — סכמה שלא הורצה היא 503 מוסבר, ⛔ לא אפסים ולא 500', () => {
  it('כולל את קוד העמודה החסרה 42703 — 0013 עלולה שלא להיות מוחלת', () => {
    // ⚠️ זה המצב **הצפוי** בייצור עד שרוי יריץ את המיגרציה (03-for-roy פריט 28):
    // הטבלאות קיימות והעמודה לא, ואז PostgREST מחזיר 42703 ⛔ ולא 42P01.
    expect(CODE).toContain('42703');
    expect(CODE).toContain('42P01');
    expect(CODE).toContain('PGRST205');
  });

  it('מחזיר הודעה בעברית ⛔ ולא ספירות אפס', () => {
    expect(CODE).toContain("code: 'schema_missing'");
    expect(CODE).toContain('המאגר עדיין לא הוקם');
    expect(CODE).not.toMatch(/known:\s*0/);
  });

  it('⛔ מחרוזת השגיאה של Supabase לעולם אינה נכנסת לגוף התשובה', () => {
    const leaks = CODE.split('\n').filter(
      (line) => line.includes('error.message') && !line.includes('console.error'),
    );
    expect(leaks).toEqual([]);
  });
});

describe('⛔ אפס נגיעה ב-SM-2 (§ 4.2ז מדד ⓑ)', () => {
  it.each(['easiness', 'interval_days', 'next_review_at'])('⛔ %s אינו מופיע', (column) => {
    expect(CODE).not.toContain(column);
  });

  it('⛔ אין כאן שום כתיבה — זו נקודת קריאה', () => {
    expect(CODE).not.toMatch(/\.update\(|\.insert\(|\.upsert\(/);
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it('docs/api-contract.md מתעד את הנתיב ואת מצב level:null', () => {
    expect(CONTRACT).toContain('GET /api/levels/summary');
    expect(CONTRACT).toContain('"level": null');
  });
});
