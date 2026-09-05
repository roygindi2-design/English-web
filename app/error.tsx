'use client';

/**
 * Route-level error boundary. UX plan T-001: never a white screen, and never
 * an English stack trace in front of a Hebrew-speaking learner.
 *
 * T-056: the wording is imported and ⛔ never restated here. This file held one
 * of the four rival wordings the task exists to collapse.
 *
 * T-124 · D-065: `reset()` לבדו הוא מסך ללא דרך החוצה כשהתקלה מתמידה — הלומד
 * לוחץ, המסך קורס שוב, ואין לאן ללכת. היציאה נוספה לצידו, והיעד שלה מגיע
 * מהטבלה ב-`failureExit.ts` ⛔ ואינו נכתב כאן.
 */
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit } from '@/lib/core/failureExit';

export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  const exit = failureExit('unavailable');
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4">
        <h1 className="text-2xl font-bold leading-tight">{FAILURE_TITLE_HE.route}</h1>
        <p className="text-lg leading-relaxed text-ink-muted">{FAILURE_HE.crash}</p>
      </div>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          {RETRY_HE}
        </button>
        {/* ⛔ `<a>` ולא `<Link>`: הראוטר של הלקוח הוא בדיוק מה שקרס. */}
        <a
          href={exit.href}
          className="flex min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
        >
          {exit.labelHe}
        </a>
      </div>
    </div>
  );
}
