import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The landing destination after onboarding — T-051 · § 4.2ב flow 1.
 *
 * The endpoint returns `{ ok: true, next }` and `components/OnboardingForm.tsx`
 * navigates to whatever string arrives. That makes `next` the single place the
 * post-onboarding destination is decided, and a one-character edit here moves
 * the learner to a different screen with nothing else in the repo objecting.
 *
 * Both assertions run on the SOURCE, not on a live call: the route needs
 * Supabase env and a real session, and `docs/api-contract.md` is a document.
 * The cross-file assertion is the point — F-029's shape is a live number in a
 * document drifting away from the code that produces it, and the contract is
 * required to be updated in the same commit as the route (RULES, Dev § 5).
 */
const ROUTE = readFileSync('app/api/profile/route.ts', 'utf8');
const CONTRACT = readFileSync('docs/api-contract.md', 'utf8');

/** C-0032/C-0071/C-0072: a guard a comment can satisfy guards nothing. */
function withoutComments(source: string): string {
  return source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');
}

const CODE = withoutComments(ROUTE);

describe('POST /api/profile — the post-onboarding destination (§ 4.2ב)', () => {
  it('sends the learner to the לימודים tab, not to the flow screen', () => {
    expect(CODE).toMatch(/next:\s*'\/studies'/);
  });

  it('no longer sends anyone to /study, which is a flow screen with no tab bar', () => {
    expect(CODE).not.toMatch(/next:\s*'\/study'/);
  });

  it('is documented with the same string it returns', () => {
    expect(CONTRACT).toContain('"next": "/studies"');
    expect(CONTRACT).not.toContain('"next": "/study"');
  });
});

/**
 * D-056 · T-111 — הכתיבה לעמודה נפסקת, ⛔ והעמודה נשארת.
 *
 * ⚠️ **הטענה כאן היא על `.update(` ⛔ ולא על הקובץ כולו**, וזו ⛔ אינה קפדנות
 * מיותרת: הקובץ **חייב** להמשיך להזכיר את השדה בהערה אחת — «העמודה נשארת ואיש
 * אינו כותב אליה» — אחרת הסוכן הבא יראה עמודה יתומה בסכמה ויציע `drop column`,
 * שהוא בדיוק מה ש-D-056 אוסרת. ⇒ סריקה גורפת הייתה **מענישה את התיעוד הנכון**.
 *
 * ⚠️ סטייה מוצהרת מנוסח התוכנית: התוכנית קוראת למקור הגולמי `SRC` ומגדירה
 * `CODE` מקומי. הקובץ הזה כבר מחזיק את שניהם ברמת המודול — `ROUTE` (גולמי) ו-
 * `CODE` (מולבן ב-`withoutComments`, אותה הלבנה בדיוק) — ולכן הבלוק משתמש בהם
 * ⛔ ואינו מגדיר שלישייה שנייה שתיפרד מהראשונה.
 */
describe('the institution column is no longer written (D-056 · T-111)', () => {
  it('⛔ never passes the field into checkOnboarding', () => {
    expect(CODE).not.toMatch(/institution:\s*body\.institution/);
  });

  it('⛔ never puts the field in the update payload', () => {
    // ⚠️ נמדד: `.slice(indexOf('.update('))` לבדו רץ עד סוף הקובץ ותופס הערות
    // מתחתיו. הטווח נחתך על הסוגר של האובייקט — הוא ⛔ אינו יכול לצאת ממנו.
    const at = CODE.indexOf('.update({');
    expect(at, 'the profile update is not in the source').toBeGreaterThan(-1);
    const payload = CODE.slice(at, CODE.indexOf('})', at));
    expect(payload).not.toContain('institution');
    // ⚠️ והשומר שמונע «עברנו כי ה-slice ריק»: ארבעת השדות שכן נכתבים.
    for (const kept of ['daily_minutes', 'exam_date', 'target_score', 'onboarded_at']) {
      expect(payload).toContain(kept);
    }
  });

  it('keeps the prose that stops the next agent from dropping the column', () => {
    // ⚠️ F-088 — כאן הטענה היא **על ההערה עצמה**, ולכן ⛔ בלי הלבנה: זה המקום
    // היחיד בקובץ שבו הופעת המילה היא הדבר הנדרש ⛔ ולא הדבר האסור.
    expect(ROUTE).toMatch(/institution/);
    expect(ROUTE).toMatch(/D-056/);
  });

  /**
   * A spread would hand Postgres whatever the caller invented. The route names
   * every key it reads and every column it writes — that is the property, not
   * the specific field.
   */
  it('still spreads nothing from the request body', () => {
    expect(CODE).not.toContain('...body');
    expect(CODE).not.toContain('...payload');
  });

  /**
   * ⚠️ Second deviation from the plan: it slices from the heading to the END of
   * the contract, so the word `institution` appearing anywhere in the five
   * sections that follow — `POST /api/review`, the planned-endpoints table —
   * would satisfy a test whose whole claim is "documented *here*". The slice is
   * bounded by the next `## ` heading instead.
   */
  it('documents the removal in the same commit, ⛔ and ⛔ not the field', () => {
    const start = CONTRACT.indexOf('## POST /api/profile');
    expect(start).toBeGreaterThan(-1);
    const rest = CONTRACT.slice(start + 1);
    const end = rest.indexOf('\n## ');
    const section = end === -1 ? rest : rest.slice(0, end);
    // ⚠️ **F-115 — סטייה מוצהרת מנוסח התוכנית.** התוכנית הורתה `not.toContain('institution')`
    // על הסעיף כולו, ובאותה נשימה הורתה לכתוב בו שלוש שורות שמסבירות **מה קרה
    // לשדה `institution`** — שתי ההוראות ⛔ אינן יכולות להתקיים יחד. הנמדד כאן
    // הוא הדבר שהתוכנית התכוונה אליו: השדה ⛔ אינו **מתועד כשדה מתקבל** —
    // ⛔ אינו בגוף הדוגמה ו⛔ אין לו תקרת 120 — וההסבר שמונע `drop column` נשאר.
    expect(section).not.toContain('"institution"');
    expect(section).not.toContain('120');
    expect(section).toContain('D-056');
    expect(section).toContain('institution');
  });
});
