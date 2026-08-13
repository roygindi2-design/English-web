/**
 * Loading skeleton shaped like the real screen: heading, sentence, button.
 * UX plan T-001 forbids a lone spinner on a white page.
 */
export default function Loading() {
  return (
    <div aria-busy="true" aria-live="polite" className="flex flex-1 flex-col">
      <span className="sr-only">טוען</span>

      <div className="flex flex-1 flex-col gap-4">
        <div className="h-9 w-4/5 rounded-lg bg-border-subtle" />
        <div className="space-y-2">
          <div className="h-5 w-full rounded bg-border-subtle" />
          <div className="h-5 w-2/3 rounded bg-border-subtle" />
        </div>
      </div>

      <div className="min-h-touch rounded-xl bg-border-subtle py-3" />
    </div>
  );
}
