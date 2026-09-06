'use client';

import './globals.css';

import { useEffect } from 'react';
import { FAILURE_HE, FAILURE_TITLE_HE, RETRY_HE } from '@/lib/core/failure';

/**
 * Last-resort boundary: catches failures in the root layout itself, so it must
 * render its own <html>/<body>. Stays RTL and Hebrew even here.
 *
 * T-056: the title is this screen's own (`app`, ⛔ not `route`) because the two
 * boundaries fail differently, but the sentence and the button label come from
 * the shared module. `lib/core/failure.ts` is a constants module with zero
 * imports, so it stays safe to pull in from the root boundary.
 *
 * T-267 — same gap as `app/error.tsx`, same fix: `error` reaches this boundary
 * too (a crash in the root layout itself), and used to be discarded unread.
 */
export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error('[app/global-error.tsx] root error boundary caught:', error);
  }, [error]);
  return (
    <html lang="he" dir="rtl">
      <body className="bg-surface text-ink antialiased">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-5 py-8">
          <h1 className="text-2xl font-bold leading-tight">{FAILURE_TITLE_HE.app}</h1>
          <p className="text-lg leading-relaxed text-ink-muted">{FAILURE_HE.load}</p>
          <button
            type="button"
            onClick={reset}
            className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
          >
            {RETRY_HE}
          </button>
        </main>
      </body>
    </html>
  );
}
