'use client';

import { useEffect } from 'react';

/** T-524 — `public/sw.js` `STALE_NAVIGATION`. Kept in step by `scripts/sw.test.ts`. */
const STALE_NAVIGATION = 'kol-stale-navigation';

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* registration failure must never break the app */
    });

    // T-524 — the worker painted a stored copy of this page and the server's late
    // answer was a redirect (signed out ⇒ /login · never onboarded ⇒ /onboarding).
    // The worker has already dropped that copy, so a reload goes to the network and
    // lands where the server says — ⛔ never left on a screen it would not have sent.
    const onMessage = (event: MessageEvent) => {
      if ((event.data as { type?: unknown } | null)?.type === STALE_NAVIGATION) {
        window.location.reload();
      }
    };
    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, []);

  return null;
}
