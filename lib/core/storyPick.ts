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
  for (let step = 0; step < total; step += 1) {
    const at = (start + step) % total;
    const candidate = ordered[at];
    if (!readStoryIds.has(candidate.id)) return { story: candidate, index: at + 1, total };
  }
  // Every story read. ⛔ Reading is never blocked — the day's story comes back.
  return { story: ordered[start], index: start + 1, total };
}
