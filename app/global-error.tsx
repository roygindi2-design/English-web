'use client';

import './globals.css';

/**
 * Last-resort boundary: catches failures in the root layout itself, so it must
 * render its own <html>/<body>. Stays RTL and Hebrew even here.
 */
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="he" dir="rtl">
      <body className="bg-slate-50 text-slate-900 antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-4 px-5 py-8">
          <h1 className="text-2xl font-bold leading-tight">האפליקציה לא נטענה</h1>
          <p className="text-lg leading-relaxed text-slate-600">
            נסה לרענן. אם זה חוזר, נסה שוב בעוד כמה דקות.
          </p>
          <button
            type="button"
            onClick={reset}
            className="flex min-h-touch items-center justify-center rounded-xl bg-slate-900 px-5 py-3 text-lg font-semibold text-white active:bg-slate-700"
          >
            נסה שוב
          </button>
        </main>
      </body>
    </html>
  );
}
