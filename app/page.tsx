import Link from 'next/link';
import ActionBar from '@/components/ActionBar';
import EnWord from '@/components/EnWord';
import InstallPrompt from '@/components/InstallPrompt';
import {
  LANDING_HEADLINE,
  LANDING_SUBHEAD,
  LANDING_VALUE_POINTS,
  landingPreviewCard,
} from '@/lib/core/landing';

// T-264 — the exact `LANDING_HEADLINE` string this screen's own `<h1>` already
// renders (already imported above). ⚠️ **This one hand-builds the `· English Web`
// suffix, ⛔ unlike every other route** — `title.template` "will not apply to a
// title defined in a page.js of the same route segment" as the layout that sets it
// (`node_modules/next/dist/docs/.../generate-metadata.md` § template), and this page
// IS the root segment. Measured live: without this, `/` rendered the bare headline,
// ⛔ zero suffix, while every other route showed it — a second inconsistency this
// task exists to close.
export const metadata = { title: `${LANDING_HEADLINE} · English Web` };

/**
 * Landing screen — T-027 (docs/ui-proposal.html), replacing the T-001 version.
 *
 * F-011 measured this screen at 375x812 and found two dead bands of 267px and
 * 275px — 67% of the viewport empty — because `flex-1 justify-center` centred
 * two lines of text inside the whole flexible area. The text is now anchored to
 * the top and the space carries three lines of what the learner actually gets.
 *
 * F-012 (no way to see the product before handing over an email): the slot for
 * a real flashcard exists and, since 2026-08-16, holds gate-verified rows from
 * the content bank — see lib/core/previewCards.generated.ts. The `preview ?`
 * guard stays: it is what keeps this screen renderable if the bank is ever
 * emptied.
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
              {/* T-077 · constitution § 6 («SVG בלבד») · § 2. A character used to
                  sit here as the marker. A character-as-icon takes its weight,
                  height and optical centre from whichever font resolves it, and
                  this one has no coverage in Heebo or Assistant — inside a fixed
                  h-6 w-6 box it fell through to a system font. The shape is code
                  now, in the `LockIcon` pattern: currentColor, no fill. */}
              <span
                aria-hidden="true"
                className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-surface text-brand-on"
              >
                <svg
                  viewBox="0 0 16 16"
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3.5 8.5 6.5 11.5 12.5 5" />
                </svg>
              </span>
              <span className="text-base leading-relaxed text-ink">{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The taste-before-signup card (T-027 ⓑ/ⓒ · T-034). Content is generated
          — lib/core/previewCards.generated.ts — never hand-written here. */}
      {preview ? (
        <section
          aria-label="דוגמה לכרטיסייה"
          className="rounded-2xl border border-border-subtle bg-surface-raised p-5"
        >
          <p className="text-sm text-ink-muted">נסה מילה אחת עכשיו</p>
          <p className="mt-1 text-2xl font-bold">
            <EnWord>{preview.headword}</EnWord>
          </p>
          {/* `pos` is English too ("noun", "adjective") — PreviewCard documents it
              as "part of speech, as recorded by the source". Bare inside lang=he,
              a Hebrew screen reader pronounces it with Hebrew phonetics. */}
          <p className="text-sm text-ink-muted">
            <EnWord>{preview.pos}</EnWord>
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {preview.options.map((option) => (
              <li key={option}>
                <span className="flex min-h-touch items-center rounded-md border border-border-subtle px-4 text-base">
                  {option}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* D-028 · F-027: the primary action is anchored to the window. The
          secondary link stays in normal flow — one action per bar. */}
      <ActionBar>
        <Link
          href="/signup"
          data-primary-action="true"
          className="flex min-h-touch items-center justify-center rounded-full bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90"
        >
          בואו נתחיל
        </Link>
      </ActionBar>

      <div className="mt-auto flex flex-col gap-2">
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
