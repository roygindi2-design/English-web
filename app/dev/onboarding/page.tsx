import OnboardingForm from '@/components/OnboardingForm';
import { ONBOARDING_TITLE_HE } from '@/lib/core/onboarding';

/**
 * Layout harness for check:mobile. NOT a product screen and NOT linked from
 * anywhere.
 *
 * TD-13: the harness runs without Supabase env, so `/onboarding` answers 307 to
 * `/login?expired=1` and every line reporting "ok /onboarding …" is really
 * measuring the login screen. The T-029 form would therefore ship unmeasured —
 * the exact F-007 pattern.
 *
 * Submitting from here reaches POST /api/profile with no session and gets a
 * documented 401; the harness never submits, and the route is noindex.
 */
export default function DevOnboardingPage() {
  return (
    <>
      <h1 className="text-3xl font-bold leading-tight">{ONBOARDING_TITLE_HE}</h1>
      <p className="text-sm text-ink-muted">בדיקת פריסה — אינו מסך מוצר</p>
      <OnboardingForm />
    </>
  );
}
