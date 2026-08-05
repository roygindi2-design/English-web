'use client';

/**
 * Route-level error boundary. UX plan T-001: never a white screen, and never
 * an English stack trace in front of a Hebrew-speaking learner.
 */
export default function RouteError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-center gap-4">
        <h1 className="text-2xl font-bold leading-tight">משהו נתקע</h1>
        <p className="text-lg leading-relaxed text-slate-600">
          התקלה אצלנו, לא אצלך. ההתקדמות שלך לא נפגעה.
        </p>
      </div>

      <button
        type="button"
        onClick={reset}
        className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white active:bg-slate-700"
      >
        נסה שוב
      </button>
    </div>
  );
}
