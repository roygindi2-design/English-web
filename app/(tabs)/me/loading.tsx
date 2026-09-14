/**
 * T-300 — the skeleton for אני, shaped like `<MeScreen>`.
 * The reasoning for the per-tab boundary lives in `app/(tabs)/cards/loading.tsx`.
 *
 * 🔴 **T-334 — and what this tab waits for CHANGED, so this note had to.** It used to
 * say `page.tsx` is `force-dynamic` and awaits `supabase.auth.getUser()` before
 * rendering anything. ⛔ That is no longer true: the page is static (`○ /me`) and both
 * reads moved to `GET /api/profile` and `GET /api/levels/summary`, which `<MeScreen>`
 * fetches itself. ⇒ this boundary now covers the route segment's own load, and the
 * WAIT FOR DATA is covered inside the component — by this very skeleton, as its
 * in-flight state. ⛔ Neither gate was removed with the read: `proxy.ts` holds
 * `/me` in `PROTECTED_SCREENS` and the endpoint checks the session itself (F-003,
 * two locks on two different doors).
 *
 * ⚠️ **T-301ⓒ:** the counted figure's box is now `<MeWordsLearnedSkeleton>`, because
 * the route streams that figure on its own and needs the identical shape as its
 * `<Suspense>` fallback. One definition, two call sites.
 */
import MeWordsLearnedSkeleton from '@/components/MeWordsLearnedSkeleton';
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col gap-6">
      <span className="sr-only">טוען</span>
      <div className="h-8 w-1/4 rounded-lg bg-border-subtle" />
      {/* T-301ⓒ — the counted figure's reserved box, the SAME file the route's
          own `<Suspense>` fallback renders. ⛔ Not a hand-copied second shape. */}
      <MeWordsLearnedSkeleton />
      <div className="space-y-3">
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
        <div className="min-h-touch rounded-2xl bg-border-subtle py-5" />
      </div>
    </div>
  );
}
