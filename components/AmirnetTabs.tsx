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
 * Declared layer-A gap (the accessibility gates override the render, 36 § 14.4): the render
 * draws the bar 36px high (:25) and the product floor is 44px — built at 44.
 * Declared radius gap: the render's r=12 maps to `rounded-xl` exactly; the inner pill's
 * r=10 has ⛔ no name in the five-value scale (D-102) and is built at `rounded-lg` (8).
 * ⚠️ The render is dark; the product is light (36 § 14.2, Roy 11/09) — the background is
 * ⛔ NOT a gap, and every colour below is a product token.
 */
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
        return (
          <span
            key={t.key}
            role="tab"
            aria-selected={selected}
            aria-disabled={!live}
            className={
              selected
                ? 'flex min-h-touch items-center justify-center rounded-lg border border-brand bg-brand-surface/15 text-sm font-bold text-brand-surface'
                : 'flex min-h-touch flex-col items-center justify-center rounded-lg text-sm text-ink-muted'
            }
          >
            <span>{t.he}</span>
            {!live && <span className="text-xs">{NOT_YET_HE}</span>}
          </span>
        );
      })}
    </div>
  );
}
