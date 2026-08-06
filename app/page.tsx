import Link from 'next/link';
import InstallPrompt from '@/components/InstallPrompt';

/**
 * Landing screen — UX plan T-001 (project_plan.md 4.2).
 *
 * Exactly three things on the screen: one heading, one explanatory sentence,
 * one primary action. Anything else is cognitive load competing with the only
 * action we care about (D-002: a student under deadline pressure).
 *
 * T-002 closed the edge case T-001 had to leave open: a learner with a live
 * session never reaches this screen — proxy.ts sends them to /onboarding
 * before it renders. The check lives there so this page stays static.
 */
export default function HomePage() {
  return (
    <>
      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-3xl font-bold leading-tight text-balance">
          אנגלית שמתאימה את עצמה אליך
        </h1>
        <p className="text-lg leading-relaxed text-slate-600">
          תרגול יומי קצר שמתכוונן לרמה שלך ולתאריך המבחן שלך.
        </p>
      </div>

      {/* Primary action sits in the lower half of the screen — MF-5, thumb reach. */}
      <Link
        href="/signup"
        className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white active:bg-slate-700"
      >
        בואו נתחיל
      </Link>

      <InstallPrompt />
    </>
  );
}
