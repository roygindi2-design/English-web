/**
 * The onboarding screen — a real question now, not a placeholder.
 *
 * T-029 landed the goal question here: minutes per day (the primary question,
 * R-012), the exam date (the input to engine 7.1), and an optional target score
 * that is never presented as a motivator. **The "at which institution" question
 * (A7) is still T-003 and is deliberately absent** — this screen asks only what
 * there is a column to store.
 *
 * T-002 made it the first screen behind the session wall: proxy.ts sends
 * anyone without a live session to /login before this renders. The sign-out
 * control lives here because this is currently the only screen a signed-in
 * learner can be on — /logout is an action, not a screen (UX plan T-002).
 *
 * F-003 added a second lock on the same door: this screen now checks the
 * session itself, so the proxy is no longer the single point of enforcement.
 *
 * TD-13: because that check needs Supabase env and check:mobile runs without
 * it, this route answers 307 in the harness. The form is measured through the
 * `/dev/onboarding` fixture instead.
 */
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import OnboardingForm from '@/components/OnboardingForm';
import RegisteredAddress from '@/components/RegisteredAddress';
import { ONBOARDING_TITLE_HE } from '@/lib/core/onboarding';
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
        <h1 className="text-3xl font-bold leading-tight">{ONBOARDING_TITLE_HE}</h1>
        {user.email && <RegisteredAddress email={user.email} />}
        <OnboardingForm />
      </div>

      {/* A plain form, so signing out works with JavaScript disabled and cannot
          be triggered by a stray image request the way a GET logout can. */}
      <form action="/logout" method="post">
        <button
          type="submit"
          className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
        >
          יציאה מהחשבון
        </button>
      </form>
    </>
  );
}
