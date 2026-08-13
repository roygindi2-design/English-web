import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MeScreen from '@/components/MeScreen';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * אני — the learner tab (D-027 · `40-decisions.md` § 4.2ב: "כל מה שהוא **על
 * הלומד** — התקדמות, הגדרות, ייחוס מקורות (D-007), יציאה").
 *
 * This file is the session and the read; the markup is `<MeScreen>`, which the
 * `/dev/tabs/me` harness fixture renders too. TD-13: this route needs Supabase
 * env, so it answers 307 under `check:mobile` and its geometry is only ever
 * measured through that fixture — sharing the component is what stops the
 * fixture from standing for a screen it no longer resembles (F-027 cause 2).
 *
 * ⚠️ § 4.2ב question 4 also names a `פס רמה` (a level bar) for this tab. It is
 * NOT built, and the reason is a missing input rather than a missing hour: the
 * learner has no level. The level test is T-004, which § 4.2ב itself puts out of
 * scope for the shell, and ⛔ `senses.cefr_level` is a property of a word and
 * never of a learner. A bar drawn today would be a claim about the learner that
 * nothing in the database supports. Recorded for the PM in the T-051 row rather
 * than improvised into a third option.
 *
 * The session is checked here and not only in `proxy.ts` — the F-003 lesson,
 * that one lock on a door is a single point of failure.
 */
export const dynamic = 'force-dynamic';

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

  // § 4.2ד. ⛔ `maybeSingle` and not `single`: 0001's trigger creates the row,
  // but a screen that throws because a row is missing tells the learner nothing
  // and costs them the whole tab. A failed read yields an empty goal, which
  // renders as no block at all — the same honest silence `wordsLearned === null`
  // uses. ⛔ Three stored answers, nothing computed from them (4.4.3).
  const { data: profile } = await supabase
    .from('profiles')
    .select('institution, target_score, exam_date')
    .eq('id', user.id)
    .maybeSingle();

  // ⛔ `null` on failure and never `0`: a failed read and a learner who has
  // learned nothing look identical on screen, and only one of them is true.
  return (
    <MeScreen
      wordsLearned={error ? null : (count ?? 0)}
      goal={{
        institution: profile?.institution ?? null,
        targetScore: profile?.target_score ?? null,
        examDate: profile?.exam_date ?? null,
      }}
    />
  );
}
