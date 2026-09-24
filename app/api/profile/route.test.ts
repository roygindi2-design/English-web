import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

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

/**
 * 🧪 **T-334 — `GET /api/profile`, the read that moved OFF the page.**
 *
 * 🔬 **The measurement that opened the row, ⛔ not a guess:** `npm run build` after
 * T-328 printed `○ /cards` · `○ /world` · `○ /settings` · `○ /studies` against
 * **`ƒ /me`** — four tabs of five served from the edge and one ⛔ not. `/me` was the
 * last tab still doing a Supabase round trip in the server before a pixel of
 * content was drawn, and the reason was this exact read: the three goal columns
 * plus the count of mastered words.
 *
 * ⇒ the read is an endpoint now, and `<MeScreen>` fetches it itself — the pattern
 * `<StudiesScreen>` and `<LevelMapScreen>` already use.
 *
 * ⛔ **AND THE GUARDS BELOW ARE ⛔ NOT NEW — THEY MOVED HERE WITH THE READ.** They
 * were written in C-0073/C-0075 against `app/(tabs)/me/page.tsx` and lived in
 * `app/(tabs)/me/page.test.ts` until this tick. ⛔ Not one was dropped: the file
 * that performs the read is the file that has to answer for it (the same move
 * C-0075 made when the markup went to `components/MeScreen.tsx`).
 */
describe('GET /api/profile — the goal and the count (T-334)', () => {
  it('exists as a GET, ⛔ and ⛔ not as a second POST branch', () => {
    expect(CODE).toMatch(/export async function GET\(/);
  });

  /**
   * ⛔ Moved from `app/(tabs)/me/page.test.ts` — "checks the session itself and
   * does not rely on proxy.ts alone (F-003)". The page's `createRouteClient` read
   * WAS the server round trip, so it could not stay; the second lock on the
   * second door did ⛔ not evaporate with it — it is this route, exactly as
   * `GET /api/levels/summary` is the second lock for `/studies` and `/cards`.
   */
  it('checks the session itself and answers session_expired (F-003, the second door)', () => {
    expect(CODE).toContain('createRouteClient');
    expect(CODE).toMatch(/code:\s*'session_expired'/);
  });

  /** ⛔ Moved from `me/page.test.ts` — "selects the three goal columns from profiles". */
  it('selects the three goal columns from profiles', () => {
    expect(CODE).toContain("from('profiles')");
    const selectArg = CODE.match(/from\('profiles'\)[\s\S]{0,200}?\.select\(([^)]*)\)/)?.[1] ?? '';
    for (const column of ['institution', 'target_score', 'exam_date']) {
      expect(selectArg, `${column} is not in the select() the route sends`).toContain(column);
    }
  });

  /**
   * T-352 — the exam-date update on the אני tab posts back to `POST /api/profile`,
   * which validates all three answers together and requires `dailyMinutes`. ⇒ the
   * read returns it, top-level and ⛔ not inside `goal` (the tab displays nothing from it).
   */
  it('T-352 · returns dailyMinutes so the client can rebuild a valid POST body', () => {
    const selectArg = CODE.match(/from\('profiles'\)[\s\S]{0,200}?\.select\(([^)]*)\)/)?.[1] ?? '';
    expect(selectArg).toContain('daily_minutes');
    expect(CODE).toMatch(/dailyMinutes: profile\?\.daily_minutes \?\? null/);
  });

  /**
   * ⛔ Moved from `me/page.test.ts` — "reads the progress number from
   * word_progress and does not compute one". Mastery is the definition of
   * "learned" (D-010 · `lib/core/progress.ts`); counting every `word_progress`
   * row would report a word seen once as a word learned.
   */
  it('counts mastery in word_progress and ⛔ computes nothing', () => {
    expect(CODE).toContain('word_progress');
    expect(CODE).toContain('mastered_at');
    // `head: true` — the count is the whole answer, so ⛔ no rows cross the wire.
    expect(CODE).toMatch(/count:\s*'exact',\s*head:\s*true/);
  });

  /**
   * 🔴 ⛔ Moved from `me/page.test.ts` — "hands the component null on a failed
   * read, ⛔ never a zero", and it is the one guard on this row that ⛔ cannot be
   * allowed to soften. `wordsLearned === null` (the read failed) and `0` (a
   * learner who has not learned anything yet) are **two different facts**, and
   * folding them into one is a lie on the learner's own screen. `count ?? 0`
   * applies ⛔ ONLY on the success branch.
   */
  it('answers null on a failed count, ⛔ never a zero (T-301 · T-334)', () => {
    expect(CODE).toMatch(/\?\s*null\s*:\s*\(?count\s*\?\?\s*0/);
  });

  /**
   * The row's own wording: "עם `session_expired` ו-`schema_missing` כמו שאר
   * הנתיבים". `42703` (undefined column) is the EXPECTED state until a migration
   * runs in production — a generic 503 "try again" would describe it as
   * temporary, which it is not (`GET /api/levels/summary` carries the same list).
   */
  it('separates a missing schema from a transient failure, like the other routes', () => {
    expect(CODE).toContain('schema_missing');
    for (const code of ['42P01', 'PGRST205', '42703', 'PGRST204']) {
      expect(CODE, `${code} is not in the missing-schema list`).toContain(code);
    }
  });

  /**
   * ⚠️ The two reads are independent — both need only `user.id` — and this row
   * exists because of latency. Sequential awaits would replace one server round
   * trip with two, i.e. hand back most of what moving the read off the page won.
   */
  it('runs the two reads in parallel, ⛔ not one after the other', () => {
    expect(CODE).toContain('Promise.all');
  });

  /** RULES, Dev § 5: the contract moves in the SAME commit as the endpoint. */
  it('is documented in the contract, in the same commit', () => {
    const start = CONTRACT.indexOf('## GET /api/profile');
    expect(start, 'the GET section is missing from docs/api-contract.md').toBeGreaterThan(-1);
    const rest = CONTRACT.slice(start + 1);
    const end = rest.indexOf('\n## ');
    const section = end === -1 ? rest : rest.slice(0, end);
    expect(section).toContain('wordsLearned');
    expect(section).toContain('session_expired');
    expect(section).toContain('schema_missing');
    // The null/zero distinction is the one thing a reader of this contract must
    // ⛔ not have to infer from the code.
    expect(section).toContain('null');
  });
});
