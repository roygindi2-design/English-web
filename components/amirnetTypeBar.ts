import type { AmirnetPracticeType } from '@/lib/core/amirnetPractice';

/**
 * The bar tint per amirnet question type — ONE table, two screens (T-286's menu, T-291's dashboard).
 *
 * ⛔ Why it is not a copy in each component, and this is not tidiness: `lib/core/amirnetPractice.ts`
 * already carries the argument in its own header — the same three facts written twice can only
 * drift. A learner who sees `ניסוח מחדש` in one tint on the dashboard and another in the menu is
 * being told they are two different things (constitution § 6). It is not in `/lib/core` because a
 * Tailwind class is presentation, and `/lib/core` is pure product logic.
 *
 * ── THE DECLARED DEVIATION, inherited verbatim from `components/AmirnetPracticeMenu.tsx` and
 *    restated here because this is now the file that owns it. The render colours the three type
 *    bars `BRAND_SURFACE · DANGER · AMBER` (`docs/design/render_video_D.py:41-43` `TYPES`), and
 *    ⛔ neither half of that is buildable as drawn:
 *      ⓐ `--danger` is this product's INCORRECT-state token (`lib/core/palette.ts`). Spending it
 *        on a permanent CATEGORY teaches a learner that `ניסוח מחדש` is an error state.
 *      ⓑ `AMBER #f2b544` has ⛔ no token in either mode, and measured against this product's light
 *        surfaces it is **1.75:1** on `--surface #f8fafc` and **1.83:1** on `--surface-raised
 *        #ffffff` — against a 4.5:1 body-text floor, since the render draws the percentage ITSELF
 *        in that colour (:75). That is the accessibility-gate carve-out `36 § 14.4` names, ⛔ not
 *        a taste call, and the numbers above were measured in this tick.
 *    ⚠️ And ⛔ not bare `--brand` either: `--brand` is the MARK colour at 4.42:1 and `F-036`
 *    forbids it as a fill (`lib/core/palette.test.ts` measures exactly that).
 *    ⇒ product tokens, and the type name is written beside every bar, so ⛔ nothing is encoded by
 *    colour at all — which is also why losing the render's three hues costs a learner nothing.
 *
 * ⚠️ The render is dark; the product is light (`36 § 14.2`, Roy 11/09). A background difference is
 * ⛔ not a gap.
 */
export const TYPE_BAR_CLASS: Readonly<Record<AmirnetPracticeType, string>> = Object.freeze({
  sc: 'bg-brand-surface',
  rs: 'bg-ink',
  rc: 'bg-ink-muted',
});
