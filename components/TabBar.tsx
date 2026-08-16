'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import LockIcon from '@/components/LockIcon';
import { apiGet } from '@/lib/api/client';

/**
 * The four-tab shell — D-027 · `40-decisions.md` § 4.2ב · T-051.
 *
 * The tab count and the RTL order are a locked information architecture, not a
 * layout preference: § 4.2ב assigns a domain to each tab (route · word ·
 * production · learner) so every future feature has one obvious home. The
 * rightmost tab in RTL is the first in the DOM.
 *
 * ⛔ There is no "coming soon" screen. While the world tab is locked it is
 * `aria-disabled` and opens a one-sentence sheet instead — § 4.2ב, because a
 * "בקרוב" screen is exactly F-011, which already came back once as F-016.
 * `aria-disabled` and not the `disabled` attribute: the button must still take
 * a tap in order to open that sheet, and a `disabled` button takes none.
 *
 * ⚠️ **The lock is a server answer, ⛔ not a constant — D-031, task 7.** `TABS`
 * still declares `href: null` for the world entry, because the tab bar is not
 * the place where a product threshold lives; the entry becomes navigable only
 * when `GET /api/world/status` says `unlocked: true`. Two consequences that are
 * measured in `TabBar.test.ts` and ⛔ are not stylistic:
 *   · **A read that failed leaves the tab LOCKED.** The state is `null` until an
 *     `ok:true` body arrives, and the gate is `=== true` and ⛔ not a truthiness
 *     test — an unlock we could not confirm is not an unlock, and 401 / 503 /
 *     offline are exactly the moments a wrong unlock would send the learner to a
 *     screen that cannot load either.
 *   · **`null` and `0` are different facts.** Before the count is known the sheet
 *     states the threshold WITHOUT the «יש לך» clause. «יש לך 0» told to a
 *     learner who has 11 active words is a lie the sheet has no need to tell —
 *     the same rule `<MeScreen>` and `<WorldFeed>` follow with «—».
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
const WORLD_SHEET_CLOSE_HE = 'סגירה';

/** The one route the world entry may point at once the server unlocked it. */
const WORLD_HREF = '/world';

/**
 * § 4.2ה, verbatim: «העולם ייפתח כשיהיו לך 12 מילים פעילות. יש לך <n>.»
 *
 * The threshold is spelled out in the sentence and ⛔ is not interpolated from a
 * constant here: the number that governs the gate is `MIN_ACTIVE_WORDS` in
 * `app/api/world/status/route.ts` (a product parameter, D-031), and a second copy of it in
 * the tab bar would be a copy that can silently disagree with the one doing the deciding.
 * A learner never sees a threshold this file invented — they see the sentence the product
 * decision wrote, and the count the server measured.
 *
 * ⛔ No date, ⛔ no bare «בקרוב» as the sentence, ⛔ no "request access" button (§ 4.2ה).
 */
const worldSheetTextHe = (activeWords: number | null): string =>
  activeWords === null
    ? 'העולם ייפתח כשיהיו לך 12 מילים פעילות.'
    : `העולם ייפתח כשיהיו לך 12 מילים פעילות. יש לך ${activeWords}.`;

/** Exactly the two fields this bar reads. ⛔ `functionWords` is the bank's business, not
 *  the tab's: the sentence § 4.2ה fixes speaks about active words only. */
type WorldStatus = {
  readonly unlocked: boolean;
  readonly activeWords: number;
};

type StatusResponse =
  | { readonly ok: true; readonly unlocked: boolean; readonly activeWords: number }
  | { readonly ok: false; readonly code: string };

const ITEM_BASE =
  'flex min-h-touch flex-1 flex-col items-center justify-center gap-1 px-2 pt-2 text-sm';

/**
 * The two non-colour channels live here, next to the `aria-current` that
 * declares the same state: a 2px top indicator (shape) and a weight change
 * (typography). The transparent border on the inactive tab is what keeps the
 * row from shifting by 2px when the active tab changes.
 */
const ITEM_INACTIVE = 'border-t-2 border-transparent font-normal text-ink-muted';

/* T-078: `LockIcon` moved to `components/LockIcon.tsx` — unchanged artwork, one
   home. `CardsScreen` needed the same mark beside its own «נעול» and could not
   reach it here. Inline SVG, ⛔ never an emoji as an icon (constitution § 6). */

export default function TabBar(): React.JSX.Element {
  const pathname = usePathname();
  const [worldSheetOpen, setWorldSheetOpen] = useState(false);
  const [worldStatus, setWorldStatus] = useState<WorldStatus | null>(null);

  useEffect(() => {
    // `cancelled` and ⛔ not an AbortController: the bar is mounted by the tabs layout and
    // survives every navigation inside it, so the one place this can unmount is a route
    // change out of the group — where the only thing worth preventing is a setState on a
    // component that is gone.
    let cancelled = false;
    void (async () => {
      try {
        const body = await apiGet<StatusResponse>('/api/world/status');
        if (cancelled || !body.ok) return;
        setWorldStatus({ unlocked: body.unlocked, activeWords: body.activeWords });
      } catch {
        // `apiGet` rejects only when the answer never arrived or was not JSON. Nothing to
        // act on, and ⛔ nothing to unlock: the state stays `null`, the tab stays locked,
        // and the sheet states the threshold without claiming to know the count.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <nav
        data-tab-bar="true"
        aria-label="ניווט ראשי"
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface"
      >
        <div className="mx-auto flex w-full max-w-md items-stretch pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {TABS.map((tab) => {
            // The locked entry is the only one whose destination is state-dependent, and it
            // resolves to a route ONLY on a confirmed unlock.
            const href =
              tab.href ??
              (tab.id === 'world' && worldStatus?.unlocked === true ? WORLD_HREF : null);
            if (href === null) {
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
            const active = pathname === href;
            return (
              <Link
                key={tab.id}
                href={href}
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
              {worldSheetTextHe(worldStatus?.activeWords ?? null)}
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
