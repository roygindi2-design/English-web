import Link from 'next/link';
import InstallPrompt from '@/components/InstallPrompt';
import {
  LANDING_HEADLINE,
  LANDING_SUBHEAD,
  LANDING_VALUE_POINTS,
  landingPreviewCard,
} from '@/lib/core/landing';

/**
 * Landing screen — T-027 (docs/ui-proposal.html), replacing the T-001 version.
 *
 * F-011 measured this screen at 375x812 and found two dead bands of 267px and
 * 275px — 67% of the viewport empty — because `flex-1 justify-center` centred
 * two lines of text inside the whole flexible area. The text is now anchored to
 * the top and the space carries three lines of what the learner actually gets.
 *
 * F-012 (no way to see the product before handing over an email) is only half
 * addressed here: the slot for a real flashcard exists and renders the moment
 * `PREVIEW_CARDS` has a row, but no licensed Hebrew source has been ingested
 * yet (R-005), and inventing a word pair is forbidden. See plan/20-alerts.md.
 *
 * A learner with a live session never reaches this screen — proxy.ts sends them
 * to /onboarding first, which is what keeps this page static.
 */
export default function HomePage() {
  const preview = landingPreviewCard();

  return (
    <>
      <section className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold leading-tight text-balance">{LANDING_HEADLINE}</h1>
        <p className="text-lg leading-relaxed text-ink-muted">{LANDING_SUBHEAD}</p>

        <ul className="mt-2 flex flex-col gap-3">
          {LANDING_VALUE_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-surface text-sm font-bold text-brand-on"
              >
                ✓
              </span>
              <span className="text-base leading-relaxed text-ink">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/*
        TODO:CONTENT-PLACEHOLDER — the taste-before-signup card (T-027 ⓑ/ⓒ).
        Renders only when a licensed source has been ingested; today the array
        is empty on purpose, so nothing invented ships to production.
      */}
      {preview ? (
        <section
          aria-label="דוגמה לכרטיסייה"
          className="rounded-2xl border border-border-subtle bg-surface-raised p-5"
        >
          <p className="text-sm text-ink-muted">נסה מילה אחת עכשיו</p>
          <p className="mt-1 text-2xl font-bold">
            <span className="ltr-inline" lang="en">
              {preview.headword}
            </span>
          </p>
          <p className="text-sm text-ink-muted">{preview.pos}</p>
          <ul className="mt-4 flex flex-col gap-2">
            {preview.options.map((option) => (
              <li key={option}>
                <span className="flex min-h-touch items-center rounded-xl border border-border-subtle px-4 text-base">
                  {option}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Primary action stays in the lower half of the screen — MF-5, thumb reach. */}
      <div className="mt-auto flex flex-col gap-2">
        <Link
          href="/signup"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-xl bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          בואו נתחיל
        </Link>
        <Link
          href="/login"
          className="flex min-h-touch items-center justify-center text-base text-ink-muted underline underline-offset-4 active:text-ink"
        >
          כבר יש לך חשבון? התחברות
        </Link>
      </div>

      <InstallPrompt />
    </>
  );
}
