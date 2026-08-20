/**
 * The flow-screen action bar — D-028 · `40-decisions.md` § 4.2ג · closes the
 * design half of 🔴 F-027.
 *
 * F-027: roy signed up on the live site, landed on onboarding, and found no way
 * forward and no way out. The screen was not broken — it was taller than the
 * window. Measured in Chromium at 375px against a 780px viewport: the submit
 * button first painted at y=852, i.e. 72px below the fold, with nothing on the
 * screen saying the page scrolled. This component is what puts a flow screen's
 * single primary action inside the first viewport on every width.
 *
 * ⛔ `fixed`, not `position: sticky` — this is the model § 4.2ג describes
 * ("התוכן מקבל padding-bottom בגובה הסרגל"), and a sticky element in normal
 * flow only pins once its own scroll position is reached, so on a screen
 * shorter than the fold it would sit wherever the content ends. The document
 * padding that pays for the covered strip lives in `app/globals.css` on the
 * scroll container and NOT on `<main>`: the `/sources` link that T-011 requires
 * on every screen is a `<footer>` sibling AFTER `<main>` (`app/layout.tsx:41`
 * vs `:47`), so a spacer inside `<main>` would move the covered strip onto that
 * link instead of clearing it.
 *
 * The hairline is always on, and that is a deliberate, recorded deviation from
 * § 4.2ג's "כשהתוכן נגלל מתחתיה": CSS cannot express "only while content is
 * underneath", and the JS alternative is an IntersectionObserver in a client
 * component — but this bar has to work with JavaScript disabled, because the
 * sign-out form on `/onboarding` is a plain `<form>`. What that sentence
 * forbids is a heavy shadow; a one-pixel token border satisfies it.
 *
 * 🟠 F-082 · `layout` — the bar declares its own shape, because the document
 * padding that pays for the covered strip is a CONSTANT and the bar's height is
 * ⛔ not. Measured C-0214 at 320 · 375 · 414 (width-independent): a single-row
 * bar is **77px** and the `5rem = 80px` reservation covers it; the two-row bar
 * C-0211 introduced on `/study` is **135px** and the same reservation ⛔ leaves
 * 55px of the document under it — which is exactly the `/sources` link the
 * `check:mobile` gate names. ⛔ A bar cannot measure itself without JS, and this
 * component has to render with JavaScript disabled, so the shape travels in the
 * attribute the padding rule already keys off and `app/globals.css` carries one
 * reservation per shape. `ActionBar.test.ts` asserts every emitted value has a
 * rule — a third shape fails at `npm test`, ⛔ not silently three ticks later.
 *
 * ⛔ No 'use client'. No state, no effects.
 */
export default function ActionBar({
  children,
  layout = 'single',
}: {
  children: React.ReactNode;
  /** `stacked` = more than one control on its own row. See F-082 above. */
  layout?: 'single' | 'stacked';
}): React.JSX.Element {
  return (
    <div
      data-action-bar={layout}
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface"
    >
      <div className="mx-auto w-full max-w-md px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
