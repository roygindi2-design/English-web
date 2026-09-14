import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * `הגדרות` — הבית של שינוי הרמה (T-211 · D-123ד׳ · `36 § 4`).
 *
 * שומר מקור, באותה צורה ומאותה סיבה כמו `LevelMapScreen.test.ts`: סביבת vitest היא
 * `node` ו-jsdom נעדר בכוונה. גיאומטריה — 44px, אפס גלילה אופקית — היא `check:mobile`.
 */
const SRC = readFileSync('app/(tabs)/settings/page.tsx', 'utf8');

const CODE = withoutComments(SRC);
const PROXY = readFileSync('proxy.ts', 'utf8');

describe('T-211 — שינוי הרמה מקבל בית ב`הגדרות`', () => {
  it('מציע את כל שש הרמות דרך <LevelPath> ⛔ ואינו נועל אף אחת', () => {
    expect(CODE).toContain('<LevelPath');
    // ⚠️ «המאגר **עדיין לא** הוקם» הוא נוסח **תקלת הקמה** של T-056, ⛔ ולא שער על הלומד.
    // עד T-273 הוא היה מחרוזת בקובץ הזה והוחסר לפני הסריקה; מאז הוא מיובא כקבוע
    // (`SCHEMA_MISSING_HE`) ולכן ⛔ אינו בקוד כלל, והסריקה רצה על הקובץ כמות שהוא.
    // מה שנאסר הוא **שער**: רמה נעולה, «עדיין לא שלטת», או `disabled` קשיח.
    expect(CODE).toContain('SCHEMA_MISSING_HE');
    expect(CODE).not.toMatch(/נעול|עדיין לא|disabled=\{true\}/);
  });

  it('⛔ אפס נתיב חדש — אותו POST /api/levels/current שהמסך השתמש בו', () => {
    expect(CODE).toContain("'/api/levels/current'");
    expect(CODE).toContain("'/api/levels/summary'");
    // ⛔ אין כאן כותב שני לאותה עמודה, ו⛔ אין מסלול חדש.
    expect(CODE).not.toMatch(/\/api\/levels\/(?!current|summary)/);
  });

  it('מוטציה: החלפת רמה ⛔ אינה מבקשת אישור', () => {
    expect(CODE).not.toMatch(/אתה בטוח|confirm\(/);
  });

  it('מוטציה: `/settings` חייב להצטרף ל-PROTECTED_SCREENS ברגע שהוא קורא את הפרופיל', () => {
    expect(PROXY).toContain("'/settings'");
    expect(PROXY).toMatch(/PROTECTED_SCREENS = \[[^\]]*'\/settings'/);
  });

  it('T-211ⓓ — הקישור לסריקה נשאר, ⛔ ומפסיק להיקרא «שינוי רמה»', () => {
    expect(CODE).toContain('LEVEL_SCAN_HREF');
    expect(CODE).toContain("const SCAN_TITLE_HE = 'סריקת רמה'");
    expect(CODE).toContain("const SCAN_BODY_HE = 'לסמן מה שאתה כבר יודע'");
    // ⛔ הכותרת «שינוי רמה» שייכת עכשיו לבורר, ⛔ ולא לסריקה.
    expect(CODE).toMatch(/const LEVEL_HEADING_HE = 'שינוי רמה'/);
  });

  it('T-211ⓕ — LevelPath.tsx ⛔ לא נערך: זהו שינוי הורה', () => {
    const component = withoutComments(readFileSync('components/LevelPath.tsx', 'utf8'));
    expect(component).not.toContain('/api/');
    expect(component).not.toContain('useState');
  });

  it('⛔ סימון פעולה ראשית אחד בדיוק (F-027)', () => {
    expect(CODE.match(/data-primary-action/g)?.length).toBe(1);
  });

  it('⛔ אין מרכוז אנכי, ⛔ אין h-screen (F-011 · F-016 · חוקה § 4)', () => {
    expect(CODE).not.toContain('justify-center');
    expect(CODE).not.toContain('h-screen');
  });

  it('⛔ אין גישה ישירה לדאטהבייס — הכל דרך lib/api/client.ts', () => {
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('⛔ אין hex גולמי ו⛔ אין אמוג\'י (חוקה § 6)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('⛔ אין הגדרה שהמפרט אינו נוקב בה (36 § 4)', () => {
    for (const invented of ['ערכת נושא', 'התראות', 'שפה', 'מחיקת חשבון', 'ייצוא']) {
      expect(CODE, `«${invented}» ⛔ אינה ב-36 § 4`).not.toContain(invented);
    }
  });
});
