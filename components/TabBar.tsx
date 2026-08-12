'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * The four-tab shell — D-027 · `40-decisions.md` § 4.2ב · T-051.
 *
 * The tab count and the RTL order are a locked information architecture, not a
 * layout preference: § 4.2ב assigns a domain to each tab (route · word ·
 * production · learner) so every future feature has one obvious home. The
 * rightmost tab in RTL is the first in the DOM.
 *
 * ⛔ There is no `app/world` route and no "coming soon" screen. The world tab is
 * `aria-disabled` and opens a one-sentence sheet instead — § 4.2ב, because a
 * "בקרוב" screen is exactly F-011, which already came back once as F-016.
 * `aria-disabled` and not the `disabled` attribute: the button must still take
 * a tap in order to open that sheet, and a `disabled` button takes none.
 *
 * The active tab is marked by three channels and never by colour alone
 * (constitution § 1): `aria-current="page"` for assistive tech, a 2px top
 * indicator for shape, and a weight change for the label itself.
 *
 * ⛔ This bar is rendered by `app/(tabs)/layout.tsx` only. The route group is
 * the structural guarantee that a flow screen can never receive it — D-028
 * forbids the tab bar and the action bar from sharing a screen, and a rule that
 * lives in a route group cannot be broken by forgetting a conditional.
 */
export const TABS = [
  { id: 'studies', href: '/studies', labelHe: 'לימודים' },
  { id: 'cards', href: '/cards', labelHe: 'כרטיסיות' },
  // href: null is the lock itself — there is nothing to navigate to.
  { id: 'world', href: null, labelHe: 'העולם' },
  { id: 'me', href: '/me', labelHe: 'אני' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

const WORLD_LOCK_LABEL_HE = 'בקרוב';
const WORLD_SHEET_TEXT_HE = 'העולם ייפתח כשיהיה בו תוכן.';
const WORLD_SHEET_CLOSE_HE = 'סגירה';

const ITEM_BASE =
  'flex min-h-touch flex-1 flex-col items-center justify-center gap-1 px-2 pt-2 text-sm';

/**
 * The two non-colour channels live here, next to the `aria-current` that
 * declares the same state: a 2px top indicator (shape) and a weight change
 * (typography). The transparent border on the inactive tab is what keeps the
 * row from shifting by 2px when the active tab changes.
 */
const ITEM_INACTIVE = 'border-t-2 border-transparent font-normal text-ink-muted';

/** Inline SVG, ⛔ never an emoji as an icon (constitution § 6). */
function LockIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <rect x="3.5" y="7" width="9" height="6.5" rx="1.5" />
      <path d="M5.75 7V5a2.25 2.25 0 0 1 4.5 0v2" />
    </svg>
  );
}

export default function TabBar(): React.JSX.Element {
  const pathname = usePathname();
  const [worldSheetOpen, setWorldSheetOpen] = useState(false);

  return (
    <>
      <nav
        data-tab-bar="true"
        aria-label="ניווט ראשי"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {TABS.map((tab) => {
            if (tab.href === null) {
              return (
                <button
                  key={tab.id}
                  type="button"
                  aria-disabled="true"
                  onClick={() => setWorldSheetOpen(true)}
                  className={`${ITEM_BASE} ${ITEM_INACTIVE}`}
                >
                  <span className="flex items-center gap-1">
                    <LockIcon />
                    {tab.labelHe}
                  </span>
                  <span className="text-xs text-ink-muted">{WORLD_LOCK_LABEL_HE}</span>
                </button>
              );
            }
            const active = pathname === tab.href;
            return (
              <Link
                key={tab.id}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={`${ITEM_BASE} ${
                  active ? 'border-t-2 border-brand font-semibold text-ink' : ITEM_INACTIVE
                }`}
              >
                {tab.labelHe}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* One sentence and one button — § 4.2ב.

          ⛔ No scrim, and the reason is measured, not aesthetic: every colour
          token is a bare `var(--x)` with no `<alpha-value>` slot, so Tailwind
          cannot compute an alpha from it. Probed with the real config —
          `.bg-ink` emits `background-color: var(--ink)` while `bg-ink/40` emits
          NO RULE AT ALL, which would make a full-screen scrim div invisible and
          still tap-blocking: every touch on the page swallowed with nothing on
          screen to explain why. Adding a scrim token would be an edit to the
          frozen constitution, which Dev may not make.

          A sheet without a scrim is non-modal, so this carries `role="dialog"`
          and ⛔ not `aria-modal="true"` — that attribute promises that nothing
          behind it is reachable, and here everything behind it still is. */}
      {worldSheetOpen && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col justify-end">
          <div
            role="dialog"
            aria-labelledby="world-sheet-text"
            className="mx-auto w-full max-w-md rounded-t-2xl border-t border-border-subtle bg-surface-raised px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
          >
            <p id="world-sheet-text" className="text-lg leading-relaxed text-ink">
              {WORLD_SHEET_TEXT_HE}
            </p>
            <button
              type="button"
              onClick={() => setWorldSheetOpen(false)}
              className="mt-4 flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong px-5 py-3 text-base text-ink active:opacity-90"
            >
              {WORLD_SHEET_CLOSE_HE}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
