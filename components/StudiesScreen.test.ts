import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/StudiesScreen.tsx', 'utf8');

function withoutComments(source: string): string {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(SRC);

describe('<StudiesScreen> — בורר ארבעת המסלולים (T-246 · 36 § 9)', () => {
  it('ארבעה יעדי שבב אמיתיים, אחד לכל מסלול', () => {
    // ⚠️ D-110 latitude, logged in the tick report: ארבעת מזהי המסלול ⛔ אינם
    // כתובים כאן בקוד המקור — `STUDY_TRACKS` הוא מקור-האמת היחיד (T-246ⓐ: «הוספת
    // מסלול היא רשומה, ⛔ לא מסך»), וכפילות מחרוזת כאן הייתה בדיוק הגדרה שנייה
    // ש-§ 4.2ז אוסר. הכיסוי האמיתי ל«ארבעה, ובסדר הזה» יושב ב-`studyTracks.test.ts`;
    // כאן נבדק שהרכיב מייבא את הרישום הקנוני ומרנדר אותו כבורר, ⛔ לא ניווט.
    expect(CODE).toContain('STUDY_TRACKS');
    expect(CODE).toMatch(/from ['"]@\/lib\/core\/studyTracks['"]/);
    // כל שבב הוא <button role="tab">, ⛔ לא <li> סטטי — הבחירה משנה state, אינה
    // ניווט. ⚠️ נבדק על role="tab", ⛔ לא ספירת <button> פיזיות: JSX ממופה בלולאה
    // מופיע פעם אחת במקור בלבד (plan Task 3 Step 4 warning).
    expect(CODE).toContain('role="tab"');
    expect(CODE).toContain('STUDY_TRACKS.map');
  });

  it('השבב הפעיל נושא aria-current — ⛔ לא רק צבע (36 § 12.7)', () => {
    expect(CODE).toContain('aria-current');
  });

  it('⛔ אפס נקודות · מטבע · XP · לוח תוצאות · רצף יומי (D-050 · R-012 · T-032)', () => {
    for (const forbidden of ['נקודות', 'מטבע', 'XP', 'לוח תוצאות', 'רצף יומי', 'רצף'])
      expect(CODE, `"${forbidden}" אסור על המסך הזה`).not.toContain(forbidden);
  });

  it('⛔ אפס תחזית קצב בטיק הזה — הנוסחה לא הוגדרה (Global Constraint 8)', () => {
    expect(CODE).not.toContain('בקצב הזה');
    expect(CODE).not.toContain('forecastHe');
  });

  it('⛔ אין readiness/score claim (4.4.3)', () => {
    for (const forbidden of ['מוכנות', 'ציון חזוי', 'צפוי לקבל'])
      expect(CODE, `"${forbidden}" is a claim nobody measured`).not.toContain(forbidden);
  });

  it('קורא ל-GET /api/levels/summary דרך apiGet, ⛔ לא fetch גולמי', () => {
    expect(CODE).toContain('apiGet');
    expect(CODE).toContain('/api/levels/summary');
    expect(CODE).not.toMatch(/\bfetch\(/);
  });

  it('מקבל fixtureLevels אופציונלי — כמו fixtureSummary ב-LevelMapScreen', () => {
    expect(CODE).toContain('fixtureLevels');
  });

  it('⛔ הקובץ עצמו אינו ניגש לדאטהבייס (⛔ אפס Supabase import)', () => {
    expect(CODE).not.toMatch(/@\/lib\/supabase/);
  });
});
