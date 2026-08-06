/**
 * Placeholder screen for the real onboarding flow (T-003, blocked).
 *
 * UX plan T-001 is explicit: the primary button must not lead to a 404.
 * A 404 here counts as a bug, so this screen exists deliberately and says
 * plainly what happens next — no fake progress bars, no invented content.
 *
 * T-002 made it the first screen behind the session wall: proxy.ts sends
 * anyone without a live session to /login before this renders. The sign-out
 * control lives here because this is currently the only screen a signed-in
 * learner can be on — /logout is an action, not a screen (UX plan T-002).
 *
 * F-003 added a second lock on the same door: this screen now checks the
 * session itself, so the proxy is no longer the single point of enforcement.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

export const dynamic = 'force-dynamic';

export default async function OnboardingPage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight">כמעט מוכן</h1>
        <p className="text-lg leading-relaxed text-ink-muted">
          כאן ייבנה השלב שבו נשאל אותך למה אתה לומד, באיזה מוסד אתה, מה ציון
          היעד שלך ומתי המבחן. השלב הזה עוד בבנייה.
        </p>
      </div>

      {/* A plain form, so signing out works with JavaScript disabled and cannot
          be triggered by a stray image request the way a GET logout can. */}
      <form action="/logout" method="post">
        <button
          type="submit"
          className="flex w-full min-h-touch items-center justify-center rounded-xl border border-border-strong bg-surface-raised px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
        >
          יציאה מהחשבון
        </button>
      </form>
    </>
  );
}
