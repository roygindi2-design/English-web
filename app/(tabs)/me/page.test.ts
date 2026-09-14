import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * 🧪 **T-334 — `אני` מוגשת מהקצה, ⛔ ולא מהשרת. המשך של: T-328.**
 *
 * 🔬 **המדידה שפתחה את השורה, ⛔ ולא השערה:** `npm run build` בקלון הזה אחרי T-328
 * סימן `○ /cards` · `○ /world` · `○ /settings` · `○ /studies` מול **`ƒ /me`** ⇒
 * **ארבע לשוניות מתוך חמש מהקצה, ואחת ⛔ לא.** הלשונית הזאת עשתה הלוך-ושוב לשרת
 * **ול-Supabase** — שתי קריאות: שלוש עמודות המטרה מ-`profiles`, ומניין
 * `word_progress.mastered_at` — לפני שצויר ולו פיקסל אחד של תוכן.
 *
 * ⛔ **ומדוע שומר מקור ו⛔ לא רק פלט בנייה:** מדד ההצלחה ⓐ הוא הסימן `○` ב-`npm run
 * build`, והוא נמדד **בשער** (‏`verify` מריץ `build`). אבל `build` אומר «סטטי
 * **היום**» — ⛔ אינו אומר **למה**, ו-`export const dynamic` יחיד שיחזור לקובץ הזה
 * מחזיר את `ƒ` בלי שאיש ישאל. ⇒ הבדיקה הזאת נועלת את **הסיבה**.
 *
 * ⛔ **ומה שעבר מכאן ו⛔ לא נמחק** — הקריאה עצמה הפכה ל-`GET /api/profile`, ושומריה
 * (‏`profiles` · `word_progress` · `mastered_at` · `null` ⛔ ולא `0`) עברו איתה אל
 * `app/api/profile/route.test.ts`, בדיוק כפי שהמארקאפ ושומריו עברו ל-
 * `components/MeScreen.test.ts` ב-C-0075. ⛔ אף שומר ⛔ לא נפל.
 *
 * סביבת vitest היא `node` ו-jsdom נעדר בכוונה. גיאומטריה — 44px, אפס גלילה — היא
 * `check:mobile`, דרך הפיקסטורה `/dev/tabs/me`.
 */
const SRC = readFileSync('app/(tabs)/me/page.tsx', 'utf8');
const CODE = withoutComments(SRC);
const PROXY = readFileSync('proxy.ts', 'utf8');
const STUDIES = withoutComments(readFileSync('app/(tabs)/studies/page.tsx', 'utf8'));
const ONBOARDING = readFileSync('app/onboarding/page.tsx', 'utf8');

describe('T-334 — `אני` מוגשת סטטית, כמו ארבע הלשוניות האחרות', () => {
  it('⛔ אין `force-dynamic` ו⛔ אין קריאת סשן בקובץ הדף', () => {
    expect(CODE).not.toContain('force-dynamic');
    expect(CODE).not.toContain('getUser');
    expect(CODE).not.toContain('createRouteClient');
    expect(CODE).not.toContain('readSupabaseEnv');
    // ⛔ `next/headers` הוא מה שהופך מסלול לדינמי גם בלי `force-dynamic`.
    expect(CODE).not.toContain('next/headers');
    expect(CODE).not.toContain('cookies(');
  });

  it('⛔ הדף ⛔ אינו ניגש למסד — הרכיב שולף דרך ה-API בעצמו', () => {
    expect(CODE).toContain('<MeScreen />');
    // ⛔ אין `.from(` ו⛔ אין `supabase` בקובץ דף. זה החוק הכללי
    // («A UI component NEVER touches the database»), וכאן הוא נמדד.
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\.from\(/);
    // ⛔ ו⛔ אין גם `<Suspense>`: הגבול היה קיים כדי להזרים ערך שרת לתוך רכיב
    // לקוח (T-301), וקריאה בצד הלקוח ⛔ אינה זקוקה לו — מצב הטעינה הוא של
    // `<MeScreen>` עצמו עכשיו.
    expect(CODE).not.toContain('Suspense');
  });

  it('הדף הוא בדיוק אותה צורה של `/studies`, שהיא `○` כבר היום', () => {
    // ⛔ דפוס חדש הוא דפוס שיסטה. חמש הלשוניות חולקות צורה אחת: ייבוא הרכיב,
    // `metadata`, ופונקציה **סינכרונית** שמחזירה אותו.
    expect(CODE).toMatch(/export default function MePage\(\) \{/);
    expect(CODE).not.toMatch(/export default async function/);
    expect(STUDIES).toMatch(/export default function StudiesPage\(\) \{/);
  });

  it('🔴 מוטציה — השער ⛔ לא ירד יחד עם הקריאה: `/me` נשאר ב-PROTECTED_SCREENS', () => {
    // ⛔ זו הבדיקה שהופכת את השינוי הזה לבטוח. הסרת `getUser()` מהדף מותרת אך ורק
    // כל עוד `proxy.ts` חוסם את המסלול לפני שהמסמך נשלח — בדיוק כפי ש-`/cards`,
    // `/settings` ו-`/studies` חיות היום (F-003: מנעול אחד על דלת אחת הוא נקודת
    // כשל יחידה). המנעול השני הוא `GET /api/profile`, שבודק סשן בעצמו.
    expect(PROXY).toContain("'/me'");
    expect(PROXY).toMatch(/PROTECTED_SCREENS = \[[^\]]*'\/me'/);
  });

  it('renders the same component the harness fixture renders (F-027 cause 2)', () => {
    expect(CODE).toContain('MeScreen');
    expect(readFileSync('app/dev/tabs/me/page.tsx', 'utf8')).toContain('MeScreen');
  });

  it('carries ⛔ no ActionBar — D-028 forbids two bottom bars on one screen', () => {
    expect(CODE).not.toContain('ActionBar');
  });

  it('leaves /onboarding a way out, so an unfinished learner is not trapped', () => {
    // A deliberate deviation from step 3.1 of the plan, which said "moved".
    // Measured: `proxy.ts` sends every signed-in learner from `/` to
    // `/onboarding`, and `/onboarding` lives outside `app/(tabs)` and therefore
    // has no tab bar — so a learner who does not finish the form cannot reach
    // `/me` at all. Deleting the sign-out there re-creates the dead end 🔴 F-027
    // was opened for. The tab is the sign-out's HOME, not its only instance.
    expect(ONBOARDING).toMatch(/action="\/logout"/);
  });
});
