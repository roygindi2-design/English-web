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
 *
 * ⚠️ T-267 — **נמדד חי בטיק הזה:** עד כאן הקובץ פירק רק את `reset` מה-props,
 * ⛔ ומעולם לא קרא ל-`error` שריאקט/נקסט מוסרים לגבול הזה — כלומר כל קריסה
 * שהגיעה הנה (כולל זו שדווחה על «התחל קרב», 06/09) נזרקה ⛔ בלי אף שורת יומן.
 * ⛔ **זה ⛔ אינו תיקון השורש של T-267** — הקריסה עצמה ⛔ לא שוחזרה בטיק הזה, לא
 * ב-`jsdom` (מסך הבית + מעבר לקרב עם נתונים אמיתיים, כולל `round.questions: []`)
 * ולא בדפדפן חי (Playwright, 375×780, אותו מעבר בדיוק, אפס קריסה). ⇒ בלי לוג כאן
 * כל קריסה עתידית באותו גבול תישאר ⛔ בלתי ניתנת לאבחון, בדיוק כמו זו. `console.error`
 * ⛔ אינו "עטיפה ב-try/catch" שמשתיקה תקלה (`docs/agents/DEV.md`) — הכשל עדיין
 * נכשל **באותו אופן בדיוק** ללומד (`FAILURE_HE.crash`); רק היומן נוסף.
 */
import { useEffect } from 'react';
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE } from '@/lib/core/failure';
import { failureExit } from '@/lib/core/failureExit';

export default function RouteError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // ⛔ `console.error` בלבד — ⛔ אין כאן `fetch`/רשת: גבול שגיאה שעצמו תלוי ברשת
    // כדי לדווח על שגיאה הוא הכפלת הסיכון בדיוק במקום שאמור לצמצם אותו.
    console.error('[app/error.tsx] route error boundary caught:', error);
  }, [error]);
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
