'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import GlobeIcon from '@/components/GlobeIcon';

/**
 * The five-tab shell — `36 § 4` · T-174 · **D-117**.
 *
 * The tab count and the RTL order are a locked information architecture, not a layout
 * preference: § 4.2ב assigns a domain to each tab (route · word · production · learner) so
 * every future feature has one obvious home, and `36 § 4` adds `הגדרות` as the fifth.
 * The rightmost tab in RTL is the first in the DOM.
 *
 * ⛔ **THE FIFTH TAB IS STRUCTURAL, ⛔ NOT A WISH LIST.** `36 § 4` words it exactly:
 * «הגדרות נוספה כדי לאפשר את המרכוז ולתת בית לשינוי רמה ולניהול מסלולים». A bar of four
 * ⛔ cannot put `העולם` at the exact geometric centre, and the render
 * `docs/design/kol-world-ring.png` draws it there. Five equal items ⇒ centres at
 * 10 · 30 · **50** · 70 · 90 %, which is `36 § 4` verbatim and ⛔ not a coincidence of
 * `flex-1`.
 *
 * ## 🔴 THE LOCK IS GONE, AND THAT IS THE WHOLE POINT — D-117
 *
 * ⚠️ **If you remember `href: null`, `aria-disabled`, a sheet and a `worldStatus` fetch in
 * this file, you remember a rule that ⛔ no longer exists.** Measured 2026-08-26T08:40Z on
 * three routes: the bar said `העולם` + the lock label on EVERY screen while `/world` behind
 * it rendered two open apps. That is seal ⓐ of `36 § 13.2` failing, ⛔ not a finish defect.
 *
 * ⇒ `isWorldUnlocked` is ⛔ no longer this tab's navigation condition. The entry is a plain
 * `Link` on every screen that has a bar, ⛔ with no sheet and ⛔ with no server read — and
 * that is precisely what makes seal ⓐ verifiable inside the loop (D-119): there is now
 * ⛔ zero server traffic anywhere on the path «any screen → tab → ring».
 *
 * ⛔ **The conditions were ⛔ not deleted — they went down one level.** What was one wall in
 * front of the whole world is now a message on a single ring node: `זירת קרב` locked with
 * «נדרשות 12 מילים ברמה, יש 8», `סיפורים` with «נדרשים 3 סיפורים ברמה שלך, יש 1». D-066 is
 * kept whole — the condition is in the learner's control and is told to them WITH its
 * number; what changed is **where** it is said. And the string F-011 and F-016 are both
 * about is ⛔ gone from this file entirely, which `TabBar.test.ts` now measures by name.
 *
 * ## The channels
 *
 * The active tab is marked by three channels and ⛔ never by colour alone (constitution
 * § 1): `aria-current="page"` for assistive tech, a 2px top indicator for shape, and a
 * weight change for the label. The world entry is additionally a raised circle — a shape
 * difference that survives greyscale.
 *
 * ⚠️ Targets stay **44×44** (constitution layer A4). `36 § 3`'s inline exemption is for a
 * word inside a reading paragraph and `36 § 4` says in one line that it ⛔ does not apply
 * to tabs.
 *
 * ⛔ This bar is rendered by `app/(tabs)/layout.tsx` only. The route group is the
 * structural guarantee that a flow screen can never receive it — D-028 forbids the tab bar
 * and the action bar from sharing a screen, and a rule that lives in a route group cannot
 * be broken by forgetting a conditional.
 */
export const TABS = [
  { id: 'studies', href: '/studies', labelHe: 'לימודים' },
  { id: 'cards', href: '/cards', labelHe: 'כרטיסיות' },
  // ⛔ D-117: a plain href, on every screen. ⛔ Never `null` again.
  { id: 'world', href: '/world', labelHe: 'העולם' },
  { id: 'me', href: '/me', labelHe: 'אני' },
  { id: 'settings', href: '/settings', labelHe: 'הגדרות' },
] as const;

export type TabId = (typeof TABS)[number]['id'];

/* ── The tab marks — inline SVG, ⛔ never an emoji (constitution § 6) ──────────
   The render draws a glyph above every label; a bar of five bare labels is a
   missing element, ⛔ not a finish preference (D-120 א׳). `currentColor` with no
   `fill`, so each mark inherits its tab's state colour in both themes. */

const TAB_ICON: Readonly<Record<Exclude<TabId, 'world'>, React.JSX.Element>> = {
  studies: (
    <>
      <rect x="3.5" y="5" width="7" height="14" rx="1.5" />
      <rect x="13.5" y="5" width="7" height="14" rx="1.5" />
    </>
  ),
  cards: (
    <>
      <rect x="8" y="4" width="11.5" height="14" rx="2" />
      <path d="M15.5 20H6.5a2 2 0 0 1-2-2V8" />
    </>
  ),
  me: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 19.5c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2M12 18.5v2M4.9 7.8l1.7 1M17.4 15.2l1.7 1M4.9 16.2l1.7-1M17.4 8.8l1.7-1" />
    </>
  ),
};

const ITEM_BASE =
  'flex min-h-touch min-w-touch flex-1 flex-col items-center justify-center gap-1 px-1 pt-2 text-[9.8pt]';

/**
 * The two non-colour channels live here, next to the `aria-current` that declares the same
 * state: a 2px top indicator (shape) and a weight change (typography). The transparent
 * border on the inactive tab is what keeps the row from shifting by 2px when the active
 * tab changes.
 */
const ITEM_INACTIVE = 'border-t-2 border-transparent font-normal text-ink-muted';
const ITEM_ACTIVE = 'border-t-2 border-brand font-semibold text-ink';

/**
 * ⛔ **The raised circle is r=27 (`36 § 4`), and it is a SHAPE difference before it is a
 * colour one** — it survives greyscale, which is what constitution § 1 asks of any state
 * channel. The glow is one of the two the screen allows itself (constitution layer B3),
 * lives on `--brand-surface` only, and its pulse is switched off under
 * `prefers-reduced-motion` in `app/globals.css`. `-mt-6` is what lifts it above the bar's
 * top edge exactly as the render draws it; the 44×44 target is unaffected because the
 * ITEM, ⛔ not the circle, is the hit area.
 *
 * T-230 — the pulse itself lives on `data-tab-world-glow`, a dedicated `aria-hidden`
 * sibling, ⛔ not on `data-tab-world` any more: `box-shadow` is a paint property, so
 * animating it on the circle itself repainted it every frame, forever, on all 5 tab
 * routes. `data-tab-world` now carries a static glow; the glow child animates only
 * `opacity`/`transform` (`app/globals.css`), which the compositor can run on its own
 * thread. It sits behind the icon (`-z-10`) and never intercepts a tap
 * (`pointer-events: none` in CSS).
 */
function WorldMark({ active }: { readonly active: boolean }): React.JSX.Element {
  return (
    <span
      data-tab-world
      data-glow="true"
      className={`-mt-6 flex h-[54px] w-[54px] items-center justify-center rounded-full border bg-brand-surface text-brand-on ${
        active ? 'border-brand' : 'border-transparent'
      }`}
    >
      <span data-tab-world-glow aria-hidden="true" className="-z-10" />
      <GlobeIcon className="h-7 w-7" />
    </span>
  );
}

export default function TabBar(): React.JSX.Element {
  const pathname = usePathname();

  return (
    <nav
      data-tab-bar="true"
      aria-label="ניווט ראשי"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface"
    >
      <div className="mx-auto flex w-full max-w-md items-stretch pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              className={`${ITEM_BASE} ${active ? ITEM_ACTIVE : ITEM_INACTIVE}`}
            >
              {tab.id === 'world' ? (
                <WorldMark active={active} />
              ) : (
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  {TAB_ICON[tab.id]}
                </svg>
              )}
              {tab.labelHe}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
