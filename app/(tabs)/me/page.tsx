import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * אני — the learner tab (D-027 · `40-decisions.md` § 4.2ב: "כל מה שהוא **על
 * הלומד** — התקדמות, הגדרות, ייחוס מקורות (D-007), יציאה").
 *
 * Three things and nothing else: one progress number, the attribution link, and
 * the way out. ⛔ No readiness estimate and ⛔ no predicted score — § 4.2ב
 * question 4 and 4.4.3 forbid both, and neither has a measurement behind it.
 *
 * ⚠️ § 4.2ב question 4 also names a `פס רמה` (a level bar) for this tab. It is
 * NOT built here, and the reason is a missing input rather than a missing hour:
 * the learner has no level. The level test is T-004, which § 4.2ב itself puts
 * out of scope for the shell, and ⛔ `senses.cefr_level` is a property of a
 * word and never of a learner. A bar drawn today would be a claim about the
 * learner that nothing in the database supports. Recorded for the PM in the
 * T-051 row rather than improvised into a third option.
 *
 * The session is checked here and not only in `proxy.ts` — the F-003 lesson,
 * that one lock on a door is a single point of failure. TD-13 follows: this
 * route needs Supabase env, so it answers 307 under `check:mobile` and its
 * geometry is measured through the `/dev/tabs/me` fixture (task 4).
 *
 * ⛔ No `<ActionBar>`. D-028 forbids two bottom-anchored bars on one screen and
 * this screen carries the tab bar, so the sign-out sits in normal flow.
 */
export const dynamic = 'force-dynamic';

const HEADING_HE = 'אני';
const WORDS_LEARNED_HE = 'מילים שנלמדו';
const PROGRESS_UNAVAILABLE_HE = 'לא הצלחנו לטעון את ההתקדמות כרגע.';
const RETRY_HE = 'נסה שוב';
const SOURCES_HE = 'מקורות הנתונים והרישיונות';
const SIGN_OUT_HE = 'יציאה מהחשבון';

export default async function MePage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  // "Learned" is mastery, not exposure: `mastered_at` is written once, at the
  // moment gate 7.7 is satisfied (lib/core/progress.ts · D-010). Counting every
  // word_progress row instead would report a word seen once as a word learned,
  // which is the same lie as a predicted score with extra steps.
  // `head: true` — the count is the whole answer, so no rows cross the wire.
  const { count, error } = await supabase
    .from('word_progress')
    .select('word_id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .not('mastered_at', 'is', null);

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {error ? (
        // § 4.2ב, the error edge case: a Hebrew sentence and a retry. ⛔ Never a
        // silent `0` — a failed read and a learner who has learned nothing look
        // identical on screen, and only one of them is true.
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
          <p className="text-4xl font-bold leading-none">{count ?? 0}</p>
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
