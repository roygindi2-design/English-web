import { RETRY_HE } from '@/lib/core/failure';

/**
 * Offline screen — precached by the service worker and served when a navigation
 * request fails. UX plan T-001 fixes the copy; no infinite retry loop, no spinner.
 *
 * T-076: this was the one terminal state in the product with nothing to press.
 * `app/error.tsx`, `app/not-found.tsx` and all three failure branches of
 * `components/WorldFeed.tsx` end in exactly one action; a learner whose
 * connection came back had to know to reload the page themselves.
 *
 * The label is `RETRY_HE` and ⛔ not a new sentence — T-056 collapsed four
 * wordings for one event into one constant, and a fifth would undo it. The
 * element is a bare `<a href="/">` and ⛔ not `<Link>`, for the reason this
 * screen exists: the navigation that failed must be retried against the
 * network, and the client router is free to answer from the cache that failed.
 * Same pattern as `components/MeScreen.tsx`'s retry.
 */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col gap-4">
      <h1 className="text-3xl font-bold leading-tight">אין חיבור כרגע</h1>
      <p className="text-lg leading-relaxed text-ink-muted">
        מה שכבר הורדת יחכה לך כאן.
      </p>
      <a
        href="/"
        className="inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
      >
        {RETRY_HE}
      </a>
    </div>
  );
}
