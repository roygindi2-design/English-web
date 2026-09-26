import { classSeats, type ClassSeats, type SeatRow } from '@/lib/core/classSeats';
import type { createRouteClient } from '@/lib/supabase/auth';

type Client = ReturnType<typeof createRouteClient>;
type Failure = { readonly message: string; readonly code?: string };

/**
 * T-520 · D-303 — the three reads a class seat needs: every story line, every wall post and
 * every reply of the class, `author_id` + `created_at` only, under the same RLS as the feed.
 * ⛔ No window and ⛔ no limit — a window is what made the story's seats shift.
 * The map stays on the server; a route sends `seat`, ⛔ never an `author_id`.
 */
export async function readClassSeats(supabase: Client, classId: string): Promise<{ readonly seats: ClassSeats } | { readonly error: Failure }> {
  const posts = await supabase.from('class_posts').select('id, author_id, created_at').eq('class_id', classId);
  if (posts.error) return { error: posts.error };
  const postRows = (posts.data ?? []) as (SeatRow & { readonly id: string })[];

  const replies = postRows.length
    ? await supabase.from('class_replies').select('author_id, created_at').in('post_id', postRows.map((p) => p.id))
    : { data: [], error: null };
  if (replies.error) return { error: replies.error };

  const lines = await supabase.from('class_story_lines').select('author_id, created_at').eq('class_id', classId);
  if (lines.error) return { error: lines.error };

  return { seats: classSeats([...postRows, ...((replies.data ?? []) as SeatRow[]), ...((lines.data ?? []) as SeatRow[])]) };
}
