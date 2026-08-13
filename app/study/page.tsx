import StudyDeckScreen from '@/components/StudyDeckScreen';
import { parseDeckName } from '@/lib/core/deck';

/**
 * The study screen — T-041, rewired in T-065 (plan `2026-08-13-study-queue.md` task 6).
 *
 * It stays a Server Component and its whole job is one query parameter: `?deck=`. The queue
 * itself is read by `<StudyDeckScreen>` on the client through `lib/api/client.ts`, and ⛔ not
 * here. Fetching on the server would mean this screen could only ever render the queue as it
 * was at first paint — a learner who finishes their dose and comes back would need a full
 * page load to see the next one — and it would put a Supabase read on a route that today
 * renders fine with no env at all.
 *
 * ⛔ The empty state is no longer hard-coded here. Until C-0102 an empty queue was the ONLY
 * state this screen had, because there was no endpoint to ask; keeping the hard-coded copy
 * alongside a live queue would give the learner two different explanations of the same
 * situation, which is exactly what `<StudyEmptyState>` was extracted to prevent (T-051).
 * The screen still carries a marked way forward in every state it can reach without a
 * session — the `<ActionBar>` moved into `<StudyDeckScreen>` with the states it belongs to
 * (F-027, `FLOW_ROUTES` in `scripts/verify-mobile.mjs`).
 *
 * An unrecognised `?deck=` value falls back to the day's dose and ⛔ does not 404: the only
 * way to get one is a stale bookmark or a typo, and neither is something the learner can act
 * on. `parseDeckName` is the single source of which names exist (`DECK_NAMES`), so a third
 * deck lands here without this file changing.
 */
export default async function StudyPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const raw = params.deck;
  const deck = parseDeckName(typeof raw === 'string' ? raw : null) ?? 'due';

  return <StudyDeckScreen deck={deck} />;
}
