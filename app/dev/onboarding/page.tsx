import OnboardingForm from '@/components/OnboardingForm';
import RegisteredAddress from '@/components/RegisteredAddress';
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
 *
 * F-027 (C-0064): this fixture used to render the form ALONE, while the real
 * screen renders the address band above it and the sign-out form below it. A
 * fixture shorter than the screen it stands for understates exactly the
 * quantity the harness exists to measure — measured at 375px, the submit button
 * sat at y=726 here and at y=852 in the real composition, and 780px is the
 * viewport. It is now `app/onboarding/page.tsx` minus the session gate, and
 * `verify-mobile.test.ts` asserts element-by-element that it stays that way.
 * `fixture@example.com` is nobody: RFC 2606 reserves example.com precisely so a
 * test address cannot reach a real person.
 */
export default function DevOnboardingPage() {
  return (
    <>
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight">{ONBOARDING_TITLE_HE}</h1>
        <p className="text-sm text-ink-muted">בדיקת פריסה — אינו מסך מוצר</p>
        <RegisteredAddress email="fixture@example.com" />
        <OnboardingForm />
      </div>

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
