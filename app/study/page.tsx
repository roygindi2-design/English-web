import type { Metadata } from 'next';
import StudyDeckScreen from '@/components/StudyDeckScreen';
import { parseDeckName, type DeckName } from '@/lib/core/deck';

/**
 * T-264 → T-199ⓐ — `<StudyDeckScreen>` renders one `<h1>` per deck (`HEADINGS` in
 * `components/StudyDeckScreen.tsx`), and this Server Component parses the same `deck`
 * value below — `generateMetadata` mirrors exactly that record, ⛔ not a second copy of the
 * parsing rule, so the title always names the deck the screen actually opened. A record
 * over `DeckName`, ⛔ not a ternary chain: a fifth deck without a title fails to compile.
 */
const TITLES: Record<DeckName, string> = {
  due: 'מנת היום',
  unknown: 'לא ידעתי',
  level: 'סינון מילים',
  sentences: 'משפטים',
};

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const params = await searchParams;
  const raw = params.deck;
  const deck = parseDeckName(typeof raw === 'string' ? raw : null) ?? 'due';
  return { title: TITLES[deck] };
}

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
 * on.
 *
 * ⚠️ **T-199ⓐ · D-169 — the parser is the WIDE `parseDeckName` again.** C-0321 narrowed it
 * because `'sentences'` was a cloze item no screen could draw (F-143). Since T-066 the same
 * `<Flashcard>` draws it as its `choice` variant, so every deck the route serves is a deck
 * this screen renders, and the narrow gate was deleted from `lib/core/deck.ts` — a URL can
 * ⛔ no longer reach a broken screen (the F-027 class) through it.
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
