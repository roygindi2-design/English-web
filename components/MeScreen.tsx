/**
 * The body of the אני tab — one progress number, the attribution link, and the
 * way out. No session read and no data access of its own.
 *
 * Same reason as `StudiesScreen`: `/me` answers 307 without Supabase env
 * (TD-13), so its geometry is measured through the `/dev/tabs/me` fixture, and
 * the fixture renders THIS component rather than a copy of the screen's JSX.
 * F-027 cause 2 is a fixture that drifts from the screen it stands for.
 *
 * `wordsLearned` is `null` when the read failed — ⛔ never `0`. A failed read
 * and a learner who has learned nothing look identical on screen, and only one
 * of them is true.
 *
 * ⛔ No readiness estimate and ⛔ no predicted score (§ 4.2ב question 4 · 4.4.3)
 * — neither has a measurement behind it. ⛔ No `<ActionBar>`: D-028 forbids two
 * bottom-anchored bars on one screen and this screen carries the tab bar, so the
 * sign-out sits in normal flow.
 */
import Link from 'next/link';

const HEADING_HE = 'אני';
const WORDS_LEARNED_HE = 'מילים שנלמדו';
const PROGRESS_UNAVAILABLE_HE = 'לא הצלחנו לטעון את ההתקדמות כרגע.';
const RETRY_HE = 'נסה שוב';
const SOURCES_HE = 'מקורות הנתונים והרישיונות';
const SIGN_OUT_HE = 'יציאה מהחשבון';

export default function MeScreen({
  wordsLearned,
}: {
  wordsLearned: number | null;
}): React.JSX.Element {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {wordsLearned === null ? (
        // § 4.2ב, the error edge case: a Hebrew sentence and a retry.
        // A plain <a> and ⛔ not <Link>: the retry has to reach the server
        // again, and the client router would be free to answer from its cache.
        <div className="flex flex-col gap-2">
          <p className="text-lg leading-relaxed text-ink">{PROGRESS_UNAVAILABLE_HE}</p>
          <a href="/me" className="inline-flex min-h-touch items-center text-lg text-ink underline">
            {RETRY_HE}
          </a>
        </div>
      ) : (
        <div className="flex flex-col gap-1">
          {/* The number carries its own label in Hebrew — colour and size are
              never the only channel (constitution § 1). */}
          <p className="text-4xl font-bold leading-none">{wordsLearned}</p>
          <p className="text-lg text-ink-muted">{WORDS_LEARNED_HE}</p>
        </div>
      )}

      {/* D-007 · T-011. The attribution link also sits in the global footer, on
          every screen, because the obligation attaches to the product; here it
          is a destination the learner can be told to go to, which is what
          § 4.2ב assigns to this tab. Same label, ⛔ not a second wording. */}
      <Link
        href="/sources"
        className="inline-flex min-h-touch items-center text-lg text-ink underline"
      >
        {SOURCES_HE}
      </Link>

      {/* A plain form, so signing out works with JavaScript disabled and cannot
          be triggered by a stray image request the way a GET logout can.
          ⚠️ The same form deliberately stays on `/onboarding` as well: a learner
          who has not finished that form is redirected there from `/` by
          `proxy.ts`, and `/onboarding` lives outside `app/(tabs)` and so has no
          tab bar — removing it there would leave exactly the dead end 🔴 F-027
          was opened for. This tab is the sign-out's home, not its only place. */}
      <form action="/logout" method="post">
        <button
          type="submit"
          data-primary-action="true"
          className="flex w-full min-h-touch items-center justify-center rounded-lg border border-border-strong bg-surface-raised px-5 py-3 text-lg font-semibold text-ink active:opacity-90"
        >
          {SIGN_OUT_HE}
        </button>
      </form>
    </section>
  );
}
