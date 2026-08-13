import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudiesScreen from '@/components/StudiesScreen';
import {
  LEARNER_TIME_ZONE,
  daysUntilExam,
  daysUntilExamHe,
  toIsoDateInZone,
} from '@/lib/core/onboarding';
import { createRouteClient, readSupabaseEnv } from '@/lib/supabase/auth';

/**
 * לימודים — the route tab, and the screen a learner lands on after onboarding
 * and on every return visit (D-027 · § 4.2ב: "כל מה שהוא מסלול").
 *
 * § 4.2ב question 1, the three-second test: the learner sees how many days are
 * left until the exam and one button to start. ⛔ Not a menu, ⛔ not a welcome
 * message, ⛔ no readiness estimate and no predicted score (4.4.3).
 *
 * The session is checked here and not only in `proxy.ts` — the F-003 lesson,
 * that one lock on a door is a single point of failure. TD-13 follows from it:
 * this route needs Supabase env, so it answers 307 under `check:mobile`, and
 * the geometry is measured through a `/dev/tabs/studies` fixture instead. That
 * fixture renders `<StudiesScreen>`, the same component this file renders — the
 * markup exists once, so the fixture cannot drift from the screen (F-027).
 */
export const dynamic = 'force-dynamic';

const NO_EXAM_DATE_HE = 'תאריך המבחן עוד לא נקבע.';

export default async function StudiesPage() {
  const env = readSupabaseEnv();
  if (!env) redirect('/login?expired=1');

  const supabase = createRouteClient(env, await cookies());
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?expired=1');

  const { data } = await supabase
    .from('profiles')
    .select('exam_date')
    .eq('id', user.id)
    .maybeSingle();
  const examDate = (data?.exam_date as string | null | undefined) ?? null;

  // The clock is read at the edge, so lib/core stays a pure function of its
  // arguments — and the day it produces is the learner's calendar day, because
  // they sit the exam on the Israeli calendar and not on the container's (C-0032).
  const today = toIsoDateInZone(new Date(), LEARNER_TIME_ZONE);
  // ⛔ No fallback estimate when the date is missing: an invented countdown is a
  // claim about the learner's exam that nobody made.
  const headline = examDate ? daysUntilExamHe(daysUntilExam(examDate, today)) : NO_EXAM_DATE_HE;

  return <StudiesScreen headline={headline} />;
}
