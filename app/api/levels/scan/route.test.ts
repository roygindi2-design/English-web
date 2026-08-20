import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * `GET/POST /api/levels/scan` — T-082 · D-041. בדיקות מקור, כמו שאר נתיבי ה-API:
 * סביבת vitest היא `node`, אין כאן Supabase חי, והדבר שנשמר כאן הוא **סדר השומרים
 * ואילו עמודות נכתבות** — בדיוק מה שמוטציה יכולה לשבור בשקט.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(readFileSync('app/api/levels/scan/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר השומרים (דפוס C-0032)', () => {
  it('ENV נבדק לפני שנוצר לקוח', () => {
    // ⚠️ סטייה מהתוכנית, ⛔ ולא בחירה: התוכנית מדדה `indexOf('readSupabaseEnv')` מול
    // `indexOf('createRouteClient')`, ושני השמות יושבים על **אותה שורת import**, בסדר
    // אלפביתי הפוך — כלומר הבדיקה מדדה את שורת הייבוא ⛔ ולא את סדר השומרים, ונפלה
    // (`293 < 274`). נמדד באתרי הקריאה, לפי דפוס `app/api/world/bank/route.test.ts:16`.
    const env = CODE.indexOf('readSupabaseEnv()');
    const client = CODE.indexOf('createRouteClient(env');
    expect(env).toBeGreaterThan(-1);
    expect(client).toBeGreaterThan(env);
  });

  it('session נבדק לפני שהגוף מאומת — קורא לא מזוהה אינו לומד אילו ערכים מתקבלים', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('checkScanPayload('));
  });

  it('גוף פסול ⇒ 400, ⛔ לא 500', () => {
    expect(CODE).toContain('status: 400');
  });

  it('⛔ מחרוזת השגיאה של Supabase אינה נכנסת ל-JSON (T-053)', () => {
    expect(CODE).not.toMatch(/message:\s*\w+Error\.message/);
    expect(CODE).toContain('console.error');
  });
});

describe('⛔ הכתיבה נוגעת בשלוש עמודות בלבד — ⛔ אף אחת מהן אינה SM-2 (D-038)', () => {
  const updateArg = CODE.slice(CODE.indexOf('const MARK ='), CODE.indexOf('};', CODE.indexOf('const MARK =')));

  it('self_marked_known · self_marked_at · updated_at, ותו לא', () => {
    expect(updateArg).toContain('self_marked_known');
    expect(updateArg).toContain('self_marked_at');
    expect(updateArg).toContain('updated_at');
  });

  it.each([
    'easiness',
    'interval_days',
    'repetition',
    'next_review_at',
    'consecutive_correct_recognition',
    'correct_attempts',
    'mastered_at',
    'attempts_to_mastery',
    'time_to_first_correct',
  ])('⛔ %s אינו נכתב — סימון עצמי אינו חשיפה שנענתה', (column) => {
    expect(updateArg).not.toContain(column);
  });

  it('⛔ אין upsert — insert על שורה חסרה, update על קיימת (D-016)', () => {
    expect(CODE).not.toContain('.upsert(');
    expect(CODE).toContain('.insert(');
    expect(CODE).toContain('.update(');
  });
});

describe('ⓐ הסריקה מציעה מילים שטרם נראו, ⛔ ולא את כל הרמה', () => {
  it('מסננת דרך excludeSeen בשכבה הטהורה ⛔ ולא ב-not.in בשאילתה', () => {
    expect(CODE).toContain('excludeSeen(');
    expect(CODE).not.toContain('.not(');
  });

  it('הסינון לרמה הוא cefr_profile_band ⛔ ולעולם לא senses.cefr_level (D-034)', () => {
    expect(CODE).toContain('cefr_profile_band');
    expect(CODE).not.toContain('cefr_level');
  });

  it('שש הרמות מוגדרות במקום אחד — דרך parseLevel', () => {
    expect(CODE).toContain('parseLevel(');
    expect(CODE).not.toMatch(/\['A1',\s*'A2'/);
  });
});

describe('התקרה מפילה ל-503, ⛔ ולא לרשימה חלקית', () => {
  it('נבדקת מול MAX_SCAN_WORDS ומחזירה unavailable', () => {
    expect(CODE).toContain('MAX_SCAN_WORDS');
    expect(CODE).toMatch(/>=\s*MAX_SCAN_WORDS/);
  });
});

describe('⛔ המסך לעולם אינו רואה «0 מילים» על תקלה', () => {
  it('כשל סכמה ⇒ schema_missing עם משפט עברי', () => {
    expect(CODE).toContain('schema_missing');
    expect(CODE).toContain('המאגר עדיין לא הוקם');
  });

  it('אין סשן ⇒ 401 session_expired', () => {
    expect(CODE).toContain('session_expired');
    expect(CODE).toContain('status: 401');
  });
});

describe('החוזה מתעדכן באותו קומיט', () => {
  it.each(['GET /api/levels/scan', 'POST /api/levels/scan'])('%s מתועד', (heading) => {
    expect(CONTRACT).toContain(heading);
  });

  it('החוזה אומר במפורש שהסריקה ⛔ אינה נוגעת ב-SM-2', () => {
    expect(CONTRACT).toContain('self_marked_known');
    expect(CONTRACT).toContain('D-038');
  });
});
