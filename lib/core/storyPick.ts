/**
 * PURE. ⛔ Zero React, DOM, network, clock, env — `npm run check:core` enforces it.
 *
 * ⛔ **ZERO `Math.random`, and that is the whole point of the file (T-185ⓐ).** Two loads
 * of the same state must return the same story, or a learner who refreshes mid-read is
 * thrown into a different one and concludes the product is broken.
 *
 * The day index is the mechanism § 4.2יג already names — «סיפור אחד ביום» — and D-108
 * question 2 — «מחר יש סיפור אחר». It costs ⛔ zero columns and ⛔ zero migration.
 * The clock itself stays in the route: this file is handed an ISO date, exactly the way
 * `app/api/review/route.ts` hands `toIsoDateInZone(...)` down.
 */
import { storyContentWords } from './storyOverlap';

export interface StoryCandidate {
  readonly id: string;
  readonly titleEn: string;
  readonly bodyEn: string;
  readonly createdAt: string;
}

export interface StoryPickInput {
  readonly stories: readonly StoryCandidate[];
  readonly dayIndex: number;
  readonly readStoryIds: ReadonlySet<string>;
}

export interface StoryPick {
  readonly story: StoryCandidate;
  readonly index: number;
  readonly total: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

/** Whole days since the epoch for a YYYY-MM-DD string. ⛔ Reads no clock. */
export function dayIndexFromIsoDate(isoDate: string): number {
  const m = ISO_DATE.exec(isoDate);
  if (!m) return 0;
  return Math.floor(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) / MS_PER_DAY);
}

/** `createdAt` then `id` — `id` breaks a tie so two rows written in the same
 *  transaction cannot swap places between two reads. */
export function orderStories(stories: readonly StoryCandidate[]): readonly StoryCandidate[] {
  return [...stories].sort((a, b) =>
    a.createdAt === b.createdAt ? a.id.localeCompare(b.id) : a.createdAt.localeCompare(b.createdAt),
  );
}

export function pickStory({ stories, dayIndex, readStoryIds }: StoryPickInput): StoryPick | null {
  const ordered = orderStories(stories);
  const total = ordered.length;
  if (total === 0) return null;

  const start = ((dayIndex % total) + total) % total;

  // ⓐ The day's own story, ⛔ untouched. `36 § 4.2יג` — one story a day — and `T-185` ⓐ:
  //    two loads of the same state return the same story. ⛔ Nothing below may move this.
  const today = ordered[start];
  if (today !== undefined && !readStoryIds.has(today.id)) {
    return { story: today, index: start + 1, total };
  }

  // ⓑ The day's story is read ⇒ a NEXT story is being chosen, and `D-121 § ה` says that
  //    choice is **to repeat words, ⛔ not to vary**. `T-209` ⓑ. The read stories' bodies
  //    are already in `stories` — the route hands the whole level — so this costs
  //    ⛔ zero new fields and ⛔ zero migration.
  // 🔬 **And the measurement that bounds the claim, `T-209` ⓒ, ⛔ not an assumption:**
  //    `npm run measure:story-repetition` on the live seed ⇒ within one level the words met
  //    twice or more are **26/27/27/26 of 97/120/122/135**, and that number is
  //    **order-INVARIANT** — a full pass reads the same stories. ⇒ this ⛔ does ⛔ NOT add
  //    encounters; it moves **25** of them earlier (after story 2: A1 8⇢13 · A2 9⇢16 ·
  //    B1 6⇢19 · B2 13⇢13). ⛔ Any stronger claim is arithmetically false.
  const seen = new Set<string>();
  for (const story of ordered) {
    if (!readStoryIds.has(story.id)) continue;
    for (const word of storyContentWords(story.bodyEn)) seen.add(word);
  }

  let best: StoryPick | null = null;
  let bestOverlap = 0;
  for (let step = 0; step < total; step += 1) {
    const at = (start + step) % total;
    const candidate = ordered[at];
    if (candidate === undefined) continue;
    if (readStoryIds.has(candidate.id)) continue;
    // ⛔ The forward scan from `start` is still the tie-break, ⛔ never iteration order:
    //    strict `>` keeps the FIRST candidate at the best score, so two calls on a
    //    permuted input agree.
    if (best === null) best = { story: candidate, index: at + 1, total };
    let overlap = 0;
    for (const word of storyContentWords(candidate.bodyEn)) if (seen.has(word)) overlap += 1;
    if (overlap > bestOverlap) {
      bestOverlap = overlap;
      best = { story: candidate, index: at + 1, total };
    }
  }
  if (best !== null) return best;
  // Every story read. ⛔ Reading is never blocked — the day's story comes back.
  const fallback = ordered[start];
  if (fallback === undefined) return null;
  return { story: fallback, index: start + 1, total };
}
