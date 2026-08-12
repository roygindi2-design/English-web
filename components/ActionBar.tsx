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
 * ⛔ No 'use client'. No state, no effects.
 */
export default function ActionBar({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <div
      data-action-bar="true"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border-subtle bg-surface"
    >
      <div className="mx-auto w-full max-w-md px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {children}
      </div>
    </div>
  );
}
