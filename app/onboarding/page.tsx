import Link from 'next/link';

/**
 * Placeholder screen for the real onboarding flow (T-003, blocked).
 *
 * UX plan T-001 is explicit: the primary button must not lead to a 404.
 * A 404 here counts as a bug, so this screen exists deliberately and says
 * plainly what happens next — no fake progress bars, no invented content.
 */
export default function OnboardingPage() {
  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-3xl font-bold leading-tight">כמעט מוכן</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          כאן ייבנה השלב שבו נשאל אותך למה אתה לומד, באיזה מוסד אתה, מה ציון
          היעד שלך ומתי המבחן. השלב הזה עוד בבנייה.
        </p>
      </div>

      <Link
        href="/"
        className="flex min-h-touch items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-lg font-semibold text-slate-900 active:bg-slate-100"
      >
        חזרה למסך הפתיחה
      </Link>
    </>
  );
}
