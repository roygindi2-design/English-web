import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * GET /api/study/queue — T-064 חלק ב׳, לפי `docs/superpowers/plans/2026-08-13-study-queue.md`.
 *
 * הבדיקות רצות על ה**מקור** ולא על קריאה חיה, בדיוק כמו `app/api/profile/route.test.ts`:
 * המסלול דורש ENV של Supabase ו-session אמיתי, ו-`docs/api-contract.md` הוא מסמך. ההיגיון
 * עצמו — מיון, סינון וצורת החוט — כבר נבדק ב-`lib/core/deck.test.ts` על 23 בדיקות התנהגות;
 * מה שנשאר לאכוף כאן הוא בדיוק מה שאי אפשר לבדוק בשכבה הטהורה: **סדר** ההגנות, ומה
 * **אסור** שייצא מהמסלול החוצה.
 *
 * ⚠️ הבדיקות רצות על מקור מנוקה-הערות (C-0032/C-0071/C-0072): הגנה שהערה יכולה לספק
 * אינה מגינה על דבר, ובלי הניקוי מחרוזת כמו `senses.cefr_level` בתוך הסבר הייתה מפילה
 * בדיקה שלילית על קוד תקין — או, גרוע יותר, מספקת בדיקה חיובית על קוד חסר.
 */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(readFileSync('app/api/study/queue/route.ts', 'utf8'));
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

describe('סדר ההגנות — ⛔ קורא לא מזוהה אינו לומד אילו פרמטרים מתקבלים (דפוס C-0032)', () => {
  // ⚠️ נמדד על **אתרי הקריאה** ולא על השמות: שניהם מיובאים מאותה שורת `import`, ושם
  // הסדר אלפביתי — כלומר בדיקה על השם הייתה מודדת את סדר הייבוא ונכשלת על קוד תקין.
  it('בודק ENV לפני שהוא בכלל בונה לקוח', () => {
    expect(CODE.indexOf('readSupabaseEnv()')).toBeLessThan(CODE.indexOf('createRouteClient('));
  });

  it('בודק session לפני שהוא נוגע ב-searchParams', () => {
    expect(CODE.indexOf('getUser')).toBeLessThan(CODE.indexOf('searchParams'));
  });

  it('אין session ⇒ 401 session_expired', () => {
    expect(CODE).toContain("code: 'session_expired'");
    expect(CODE).toContain('status: 401');
  });

  it('deck לא מוכר ⇒ 400, ⛔ ולא נפילה חזרה שקטה לחפיסה שהלומד לא ביקש', () => {
    expect(CODE).toContain('parseDeckName');
    expect(CODE).toContain('status: 400');
  });
});

describe('⛔ מחרוזת השגיאה של Supabase לעולם אינה נכנסת ל-JSON (אותה דרישה כמו T-053)', () => {
  it('כל שורה שנוגעת ב-error.message היא שורת console.error', () => {
    const leaks = CODE.split('\n').filter(
      (line) => line.includes('error.message') && !line.includes('console.error'),
    );
    expect(leaks).toEqual([]);
  });

  it('גוף התשובה מורכב מ-code קבוע בלבד', () => {
    expect(CODE).not.toMatch(/message:\s*error/);
    expect(CODE).not.toMatch(/detail:\s*error/);
  });
});

describe('מיפוי השגיאות — סכמה שלא הורצה היא 503 מוסבר, ⛔ לא 500 ולא מצב ריק', () => {
  it('שני קודי "הטבלה איננה" ממופים ל-schema_missing', () => {
    expect(CODE).toContain("'42P01'");
    expect(CODE).toContain("'PGRST205'");
    expect(CODE).toContain("code: 'schema_missing'");
  });

  it('ההודעה העברית זהה בקוד ובחוזה — ⛔ שני נוסחים הם שני מקורות אמת', () => {
    expect(CODE).toContain('המאגר עדיין לא הוקם');
    expect(CONTRACT).toContain('המאגר עדיין לא הוקם');
  });

  it('כל שגיאה אחרת היא 503 unavailable, ⛔ ואין 404 בשום מצב', () => {
    expect(CODE).toContain('status: 503');
    expect(CODE).not.toContain('status: 404');
    expect(CODE).not.toContain('status: 500');
  });
});

describe('D-034 — המיון הוא words.cefr_profile_band, ⛔ ולעולם לא senses.cefr_level', () => {
  it('⛔ המסלול אינו מזכיר את העמודה שאסור למיין לפיה', () => {
    expect(CODE).not.toContain('cefr_level');
  });

  it('הוא כן מושך את העמודה שכן ממיינים לפיה', () => {
    expect(CODE).toContain('cefr_profile_band');
  });

  it('המיון, הסינון וצורת החוט מיובאים מהשכבה הטהורה ⛔ ואינם משוכפלים כאן', () => {
    expect(CODE).toMatch(/from\s+'@\/lib\/core\/deck'/);
    expect(CODE).toContain('selectDeck(');
    expect(CODE).toContain('toQueueCardInput(');
  });

  // ⚠️ המסלול **כן** ממיין פעם אחת — בין המשמעויות של אותה מילה, לפי `sense_index`
  // (D-021). זו בחירת שורה ולא סדר תור. הבדיקה מפרידה בין השתיים: מיון יחיד, על
  // `sense_index` בלבד, ו⛔ אפס עקבות של פרימיטיבי סדר-התור בקובץ הזה.
  it('⛔ סדר התור אינו משוכפל כאן — המיון היחיד הוא בחירת המשמעות', () => {
    expect(CODE.match(/\.sort\(/g)).toHaveLength(1);
    expect(CODE).toMatch(/\.sort\(\s*\n?\s*\(a, b\) => \(a\.sense_index/);
    for (const queueOrdering of ['bandRank', 'CEFR_BAND_ORDER', 'nextReviewAtMs -', 'sortQueue']) {
      expect(CODE).not.toContain(queueOrdering);
    }
  });
});

describe('שתי החפיסות — ההבדל ביניהן הוא בשאילתה, לא בשני מסלולים', () => {
  it("מסנן התאריך תלוי ב-deck === 'due' ו⛔ אינו חל על unknown", () => {
    expect(CODE).toMatch(/deck === 'due'[\s\S]{0,200}lte\('next_review_at'/);
    expect(CODE.match(/lte\('next_review_at'/g)).toHaveLength(1);
  });

  it("חפיסת «לא ידעתי» מסוננת ב-isUnknownRow הטהור — ⛔ בלי טבלה חדשה ובלי מיגרציה", () => {
    expect(CODE).toContain('isUnknownRow');
  });

  it('יש תקרת שורות קשיחה על השאילתה', () => {
    expect(CODE).toMatch(/MAX_QUEUE_ROWS\s*=\s*200/);
    expect(CODE).toContain('.limit(MAX_QUEUE_ROWS)');
  });
});

describe('החוזה מתעדכן באותו קומיט (RULES, Dev § 5)', () => {
  it('לנתיב יש מדור משלו', () => {
    expect(CONTRACT).toContain('GET /api/study/queue');
  });

  it('שבעת המצבים מתועדים — כולל תור ריק שהוא 200 ולא שגיאה', () => {
    for (const state of ['schema_missing', 'session_expired', '"total"', '"cards"']) {
      expect(CONTRACT).toContain(state);
    }
  });

  it('החוזה מצהיר על אותו קבוע קידום שהמסלול מעביר לשכבה הטהורה', () => {
    expect(CODE).toMatch(/PROMOTE_AFTER_CONSECUTIVE_CORRECT\s*=\s*3/);
    expect(CONTRACT).toContain('PROMOTE_AFTER_CONSECUTIVE_CORRECT');
  });
});
