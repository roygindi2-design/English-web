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
 * author's order of first appearance in the chain — enough for the screen to tell two
 * members apart (`render_video_C.py:211`, one avatar per author) ⛔ without a name, which
 * no table holds (the same declared gap as the wall, `components/ClassWall.tsx`).
 */

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
  /** 1-based, by first appearance. The same author ⇒ the same seat on every line. */
  readonly seat: number;
}

/** D-290: the learner's turn iff the last line is ⛔ not theirs. An empty chain is anyone's. */
export function myTurn(lines: readonly { readonly authorId: string }[], me: string): boolean {
  return lines.at(-1)?.authorId !== me;
}

/** Oldest first — a story is read from its beginning (⛔ the reverse of the wall). */
export function buildStoryChain(rows: readonly StoryLineRow[], me: string, openerId: string): {
  readonly lines: readonly StoryLine[];
  readonly myTurn: boolean;
} {
  const sorted = [...rows].sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || (a.id < b.id ? -1 : 1));
  const seats = new Map<string, number>();
  const lines = sorted.map((r) => {
    if (!seats.has(r.author_id)) seats.set(r.author_id, seats.size + 1);
    return {
      id: r.id,
      bodyEn: r.body_en,
      createdAt: r.created_at,
      mine: r.author_id === me,
      byOpener: r.author_id === openerId,
      seat: seats.get(r.author_id) as number,
    };
  });
  return { lines, myTurn: myTurn(sorted.map((r) => ({ authorId: r.author_id })), me) };
}
