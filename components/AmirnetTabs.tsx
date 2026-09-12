/**
 * The three amirnet tabs — `דשבורד · תרגול · סימולציה`, RTL order (41 § 7).
 * 🎯 Render: docs/design/kol-D-03-practice-menu.png, drawn by render_video_D.py `head` (:21-39).
 * Layout values are grepped there, ⛔ not eyeballed from the PNG.
 *
 * ⛔ ONE tabs component, and T-291ⓐ is explicit about why: the dashboard is the SAME bar with
 * a different tab active. A second bar is a second thing to keep in sync.
 *
 * ⚠️ A tab that is not built yet is PRESENT and `aria-disabled`, with the word «טרם» —
 * ⛔ never hidden (D-152 § ב׳: «טרם» is a statement of fact, ⛔ not a promise like «בקרוב»).
 *
 * ⟦C-0536 · F-224⟧ ⛔ A BUILT TAB IS A LINK, and until today ⛔ none of them was. Every tab was a
 * `<span role="tab">` with ⛔ no `onClick`, ⛔ no `href` and ⛔ no router call — so a tab the product
 * itself declared built (`aria-disabled="false"`) did ⛔ nothing when a learner pressed it, and the
 * only way between the dashboard and the practice menu was out through `world/ring` and back in.
 * ⛔ That is «פעולה שלא עושה כלום», `RULES § 0.31`. ⚠️ And the four source-scanning tests could
 * ⛔ never have caught it: the source read perfectly — right strings, right order, right 44px
 * floor — because what was missing was an attribute ⛔ nobody asserted. ⇒ the guard is now a
 * RENDER (`AmirnetTabs.dom.test.tsx`), ⛔ not a regex.
 *
 * Declared layer-A gap (the accessibility gates override the render, 36 § 14.4): the render
 * draws the bar 36px high (:25) and the product floor is 44px — built at 44.
 * Declared radius gap: the render's r=12 maps to `rounded-xl` exactly; the inner pill's
 * r=10 has ⛔ no name in the five-value scale (D-102) and is built at `rounded-lg` (8).
 * ⚠️ The render is dark; the product is light (36 § 14.2, Roy 11/09) — the background is
 * ⛔ NOT a gap, and every colour below is a product token.
 */
import Link from 'next/link';

export type AmirnetTabKey = 'dashboard' | 'practice' | 'simulation';

interface Tab {
  readonly key: AmirnetTabKey;
  readonly he: string;
}

/** RTL order, exactly as `TABS` in render_video_D.py:19. */
export const AMIRNET_TABS: readonly Tab[] = [
  { key: 'dashboard', he: 'דשבורד' },
  { key: 'practice', he: 'תרגול' },
  { key: 'simulation', he: 'סימולציה' },
];

export const NOT_YET_HE = 'טרם';

/**
 * WHICH TABS EXIST TODAY — ⛔ one list, and ⛔ never a literal at each call site.
 *
 * ⟦NEW C-0533 · T-291⟧ It was a literal in four places across three files, and the walk measured
 * what that costs: the moment the dashboard was built, the practice menu and the question screen
 * ⛔ kept telling a learner `דשבורד · טרם` — about a screen that ⛔ was already there. A promise
 * of absence is worse than no promise; `D-152 § ב׳` allows «טרם» precisely because it is a
 * STATEMENT OF FACT, and a stale one stops being that.
 * ⇒ `T-296` (simulation) flips ⛔ one line here, and every screen agrees on the same tick.
 *
 * ⟦C-0553 · T-308⟧ `'simulation'` is IN, and it went in **in the same commit** as
 * `app/(tabs)/world/amirnet/simulation/page.tsx`. ⛔ Neither half is shippable alone: a route with
 * no tab is a screen with no way to it, and a tab with no route is a 404 with a nice label —
 * which is why `AmirnetTabs.dom.test.tsx` measures the page on disk rather than trusting this list.
 */
export const AMIRNET_BUILT_TABS: readonly AmirnetTabKey[] = ['dashboard', 'practice', 'simulation'];

/**
 * WHERE EACH TAB GOES — ⛔ one map, next to the list that says which of them exist.
 *
 * ⚠️ The two belong together on purpose: `AMIRNET_BUILT_TABS` is what turns a tab into a link, so a
 * key flipped there without a route here is a learner sent to a 404. `AmirnetTabs.dom.test.tsx`
 * measures exactly that — every BUILT key must resolve to a `page.tsx` that exists on disk — which
 * is why `T-296` flipping `simulation` could not land before `/world/amirnet/simulation` did —
 * and it did, in `T-308`'s own commit.
 *
 * ⛔ These are the PRODUCT routes, ⛔ never the `/dev/amirnet/*` fixtures: those are walk harnesses
 * (`STEP 6.5`), ⛔ not a surface a learner reaches, and a tab bar that navigated inside them would
 * be measuring a product that does not exist.
 */
export const AMIRNET_TAB_HREF: Readonly<Record<AmirnetTabKey, string>> = {
  dashboard: '/world/amirnet',
  practice: '/world/amirnet/practice',
  simulation: '/world/amirnet/simulation',
};

export default function AmirnetTabs({
  active,
  built,
}: {
  readonly active: AmirnetTabKey;
  /** Which tabs exist today. Everything else renders disabled with «טרם». */
  readonly built: readonly AmirnetTabKey[];
}) {
  return (
    <div
      role="tablist"
      aria-label="סימולציות אמירנט"
      className="mt-3 grid grid-cols-3 gap-1 rounded-xl border border-border-subtle bg-surface-raised p-1"
    >
      {AMIRNET_TABS.map((t) => {
        const live = built.includes(t.key);
        const selected = live && t.key === active;
        const className = selected
          ? 'flex min-h-touch items-center justify-center rounded-lg border border-brand bg-brand-surface/15 text-sm font-bold text-brand-surface'
          : 'flex min-h-touch flex-col items-center justify-center rounded-lg text-sm text-ink-muted';
        const label = (
          <>
            <span>{t.he}</span>
            {!live && <span className="text-xs">{NOT_YET_HE}</span>}
          </>
        );

        // ⛔ An unbuilt tab is ⛔ never a link: it is present and disabled, ⛔ not tappable.
        if (!live) {
          return (
            <span key={t.key} role="tab" aria-selected={false} aria-disabled className={className}>
              {label}
            </span>
          );
        }

        return (
          <Link
            key={t.key}
            href={AMIRNET_TAB_HREF[t.key]}
            role="tab"
            aria-selected={selected}
            aria-disabled={false}
            // ⚠️ `aria-selected` says which tab is active; `aria-current` says the learner is
            // already THERE. A link needs the second one — ⛔ and state is never colour alone.
            aria-current={selected ? 'page' : undefined}
            className={className}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
