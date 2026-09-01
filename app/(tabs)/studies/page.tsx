import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudiesScreen from '@/components/StudiesScreen';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * לימודים — הטאב שהלומד נוחת עליו אחרי onboarding ובכל כניסה חוזרת (D-027).
 * T-246 · `36 § 9`: המסך הוא בורר ארבעת המסלולים, ⛔ ולא ספירת ימים לבחינה
 * (D-077/D-083 נסוגו מפני D-176 — ראה `plan/40-decisions.md`).
 *
 * הסשן נבדק כאן ולא רק ב-`proxy.ts` — לקח F-003, ששער אחד על דלת אחת הוא נקודת
 * כשל יחידה. TD-13 נגזרת מכך: המסלול הזה דורש env של Supabase ועונה 307 בלעדיו,
 * ולכן הגאומטריה נמדדת דרך `/dev/tabs/studies`.
 *
 * ⛔ **הקריאה לנתוני ההתקדמות אינה כאן** — `<StudiesScreen>` קורא אותה בעצמו
 * דרך `GET /api/levels/summary` (Task 3), בדיוק הדפוס של `<LevelMapScreen>`.
 */
export const dynamic = 'force-dynamic';

export default async function StudiesPage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  return <StudiesScreen />;
}
