import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * 🧪 T-328 — `לימודים` מוגשת מהקצה, ⛔ ולא מהשרת.
 *
 * 🔬 **המדידה שפתחה את השורה, ⛔ ולא השערה:** `npm run build` על `dev` (`fd3d190`)
 * סימן `○ /cards` · `○ /world` · `○ /settings` מול `ƒ /studies` ו-`ƒ /me` ⇒ שתי
 * לשוניות מתוך חמש עשו הלוך-ושוב לשרת **ול-Supabase** בכל מעבר.
 *
 * ⛔ **ומדוע שומר מקור ו⛔ לא רק פלט בנייה:** מדד ההצלחה ⓐ של השורה הוא הסימן `○`
 * ב-`npm run build`, והוא נמדד **בשער** (‏`verify` מריץ `build`). אבל `build` אומר
 * «סטטי **היום**» — הוא ⛔ אינו אומר **למה**, ו-`export const dynamic` יחיד שיחזור
 * לקובץ הזה מחזיר את `ƒ` בלי שאיש ישאל. ⇒ הבדיקה הזאת נועלת את **הסיבה**.
 *
 * סביבת vitest היא `node` ו-jsdom נעדר בכוונה, בדיוק כמו
 * `app/(tabs)/settings/page.test.ts`. גיאומטריה — 44px, אפס גלילה — היא `check:mobile`.
 */
const SRC = readFileSync('app/(tabs)/studies/page.tsx', 'utf8');
const CODE = withoutComments(SRC);
const PROXY = readFileSync('proxy.ts', 'utf8');
const CARDS = withoutComments(readFileSync('app/(tabs)/cards/page.tsx', 'utf8'));

describe('T-328 — `לימודים` מוגשת סטטית, כמו שלוש הלשוניות האחרות', () => {
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
    expect(CODE).toContain('<StudiesScreen />');
    // ⛔ אין `.from(` ו⛔ אין `supabase` בקובץ דף. זה החוק הכללי
    // («A UI component NEVER touches the database»), וכאן הוא נמדד.
    expect(CODE).not.toContain('supabase');
    expect(CODE).not.toMatch(/\.from\(/);
  });

  it('הדף הוא בדיוק אותה צורה של `/cards`, שהיא `○` כבר היום', () => {
    // ⛔ דפוס חדש הוא דפוס שיסטה. שתי הלשוניות חולקות צורה אחת: ייבוא הרכיב,
    // `metadata`, ופונקציה **סינכרונית** שמחזירה אותו.
    expect(CODE).toMatch(/export default function StudiesPage\(\) \{/);
    expect(CODE).not.toMatch(/export default async function/);
    expect(CARDS).toMatch(/export default function CardsPage\(\) \{/);
  });

  it('🔴 מוטציה — השער ⛔ לא ירד יחד עם הקריאה: `/studies` נשאר ב-PROTECTED_SCREENS', () => {
    // ⛔ זו הבדיקה שהופכת את השינוי הזה לבטוח. הסרת `getUser()` מהדף מותרת אך ורק
    // כל עוד `proxy.ts` חוסם את המסלול לפני שהמסמך נשלח — בדיוק כפי ש-`/cards`
    // ו-`/settings` חיות היום (F-003: מנעול אחד על דלת אחת הוא נקודת כשל יחידה).
    expect(PROXY).toContain("'/studies'");
    expect(PROXY).toMatch(/PROTECTED_SCREENS = \[[^\]]*'\/studies'/);
  });
});
