/**
 * Offline screen — precached by the service worker and served when a navigation
 * request fails. UX plan T-001 fixes the copy; no infinite retry loop, no spinner.
 */
export default function OfflinePage() {
  return (
    <div className="flex flex-1 flex-col justify-center gap-4">
      <h1 className="text-3xl font-bold leading-tight">אין חיבור כרגע</h1>
      <p className="text-lg leading-relaxed text-slate-600">
        מה שכבר הורדת יחכה לך כאן.
      </p>
    </div>
  );
}
