/**
 * The class seats, pure (T-520 · D-303).
 *
 * Every author in a class gets a SEAT — its order of first appearance across the class's
 * WHOLE written history (story lines ∪ wall posts ∪ replies). The wall and the story draw
 * the same number for the same member, so `3` on the wall is the `3` of the story.
 * ⛔ Not a window: `storyChain.ts` used to count inside the `STORY_LINES_MAX` lines it was
 * handed, so seats shifted as old lines fell out of it (measured C-0873).
 * ⛔ No author id leaves a route: the map stays server-side, and only `seat` is sent.
 * ⛔ No name is collected (`for-roy` 145 is open) — a seat is a number and nothing else.
 */

export interface SeatRow {
  readonly author_id: string;
  readonly created_at: string;
}

export type ClassSeats = ReadonlyMap<string, number>;

/** 1-based, by first appearance; a tie in time ⇒ the lower author id, so the order is stable. */
export function classSeats(rows: readonly SeatRow[]): ClassSeats {
  const sorted = [...rows].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.author_id < b.author_id ? -1 : a.author_id > b.author_id ? 1 : 0),
  );
  const seats = new Map<string, number>();
  for (const r of sorted) if (!seats.has(r.author_id)) seats.set(r.author_id, seats.size + 1);
  return seats;
}

/**
 * A reader of the seats that ⛔ never answers «no seat». An author missing from the map — a
 * line written between the seat read and the feed read — gets the next free seat, and
 * keeps it for the rest of this answer. ⛔ The map itself is ⛔ not changed.
 */
export function seatReader(seats: ClassSeats): (authorId: string) => number {
  const late = new Map<string, number>();
  return (authorId) => {
    const known = seats.get(authorId) ?? late.get(authorId);
    if (known !== undefined) return known;
    const next = seats.size + late.size + 1;
    late.set(authorId, next);
    return next;
  };
}
