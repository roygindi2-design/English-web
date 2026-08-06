'use client';

import './globals.css';

/**
 * Last-resort boundary: catches failures in the root layout itself, so it must
 * render its own <html>/<body>. Stays RTL and Hebrew even here.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-surface text-ink antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-8">
          <h1 className="text-2xl font-bold leading-tight">האפליקציה לא נטענה</h1>
          <p className="text-lg leading-relaxed text-ink-muted">
            נסה לרענן. אם זה חוזר, נסה שוב בעוד כמה דקות.
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex min-h-touch items-center justify-center rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            נסה שוב
          </button>
        </main>
      </body>
    </html>
  );
}
