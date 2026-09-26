/**
 * The class story chain, pure (T-478 · `39 § 6` · D-290).
 *
 * One chain per class, open to every member. **The turn rule:** a member may add a
 * sentence when the LAST line is ⛔ not theirs — ⛔ never two in a row by one author,
 * and ⛔ no fixed rotation (a rotation stalls on the one member who never came back).
 * The database enforces the same rule in `add_story_line()` (T-477); this file is what
 * the screen shows, so `התור שלך` appears exactly when the insert would pass.
 *
 * ⛔ No author id leaves: a line carries `mine` · `byOpener` · `seat`, where `seat` is the
 * author's CLASS seat (`lib/core/classSeats.ts` · T-520 · D-303) — first appearance across
 * the whole class history, handed in by the route, ⛔ never counted here from the window —
 * enough for the screen to tell two members apart (`render_video_C.py:211`, one avatar per
 * author) ⛔ without a name, which no table holds (`for-roy` 145).
 */
import { seatReader, type ClassSeats } from '@/lib/core/classSeats';

export interface StoryLineRow {
  readonly id: string;
  readonly author_id: string;
  readonly body_en: string;
  readonly created_at: string;
}

export interface StoryLine {
  readonly id: string;
  readonly bodyEn: string;
  readonly createdAt: string;
  readonly mine: boolean;
  readonly byOpener: boolean;
  /** The class seat (T-520): the same author ⇒ the same number here and on the wall. */
  readonly seat: number;
}

/** D-290: the learner's turn iff the last line is ⛔ not theirs. An empty chain is anyone's. */
export function myTurn(lines: readonly { readonly authorId: string }[], me: string): boolean {
  return lines.at(-1)?.authorId !== me;
}

/** Oldest first — a story is read from its beginning (⛔ the reverse of the wall). */
export function buildStoryChain(rows: readonly StoryLineRow[], me: string, openerId: string, seats: ClassSeats): {
  readonly lines: readonly StoryLine[];
  readonly myTurn: boolean;
} {
  const sorted = [...rows].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : 1));
  const seat = seatReader(seats);
  const lines = sorted.map((r) => {
    return {
      id: r.id,
      bodyEn: r.body_en,
      createdAt: r.created_at,
      mine: r.author_id === me,
      byOpener: r.author_id === openerId,
      seat: seat(r.author_id),
    };
  });
  return { lines, myTurn: myTurn(sorted.map((r) => ({ authorId: r.author_id })), me) };
}
