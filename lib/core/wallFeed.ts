/**
 * The class wall feed, pure (T-471 · `39 § 5` · D-288).
 *
 * ⛔ No I/O here: the route reads the three tables of 0034 under RLS and hands the rows in;
 * this file decides what the learner is shown — the two top replies of each post, the
 * counts, and the time line.
 *
 * `39 § 5`: «מוצגות רק התגובות המובילות לפי לייקים» and ⛔ no infinite loading of every
 * reply ⇒ a feed post carries `top` (at most two) and `replyCount`, ⛔ never the rest.
 */
import { whenOf } from '@/lib/core/messages';

export const TOP_REPLIES = 2;

/**
 * T-484 · D-291 — the closed gallery a wall question may carry a picture from. ⛔ No upload,
 * ⛔ no URL: the key is the whole of it, and the drawing lives in `components/WallPicture.tsx`.
 */
export const WALL_PICTURE_KEYS = ['mountains', 'beach', 'classroom', 'market', 'park', 'kitchen', 'city', 'rain'] as const;
export type WallPictureKey = (typeof WALL_PICTURE_KEYS)[number];

/** A key outside the gallery ⇒ `undefined` — ⛔ never an empty frame. */
export function toWallPictureKey(v: unknown): WallPictureKey | undefined {
  return typeof v === 'string' && (WALL_PICTURE_KEYS as readonly string[]).includes(v) ? (v as WallPictureKey) : undefined;
}

export interface WallPostRow {
  readonly id: string;
  readonly author_id: string;
  readonly body_en: string;
  readonly created_at: string;
  /** D-291 — only a post carries it; absent until the column exists (T-485). */
  readonly picture_key?: string | null;
}
export interface WallReplyRow extends WallPostRow {
  readonly post_id: string;
}
export interface WallLikeRow {
  readonly user_id: string;
  readonly post_id: string | null;
  readonly reply_id: string | null;
}

export interface WallReply {
  readonly id: string;
  readonly bodyEn: string;
  readonly createdAt: string;
  readonly likes: number;
  readonly likedByMe: boolean;
  readonly mine: boolean;
}
export interface WallPost {
  readonly id: string;
  readonly bodyEn: string;
  readonly createdAt: string;
  /** D-288 — «<שם> · המורה» belongs to the class opener; a role in the class, ⛔ not an account type. */
  readonly byOpener: boolean;
  readonly mine: boolean;
  /** T-484 · D-291 — a scene from `WALL_PICTURE_KEYS`; an unknown key never reaches here. */
  readonly pictureKey?: WallPictureKey;
  readonly likes: number;
  readonly likedByMe: boolean;
  readonly replyCount: number;
  readonly top: readonly WallReply[];
}

/**
 * Most-liked first; a tie ⇒ the EARLIER reply (it had the room first). `n` caps the list —
 * the feed passes `TOP_REPLIES`, «show all» passes nothing.
 */
export function topReplies<T extends { readonly likes: number; readonly createdAt: string; readonly id: string }>(
  replies: readonly T[],
  n: number = Number.POSITIVE_INFINITY,
): readonly T[] {
  return [...replies]
    .sort((a, b) => b.likes - a.likes || Date.parse(a.createdAt) - Date.parse(b.createdAt) || (a.id < b.id ? -1 : 1))
    .slice(0, n);
}

const WEEKDAY_FULL_HE = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'שבת'] as const;

/**
 * `39 § 5`'s three forms, exactly: `היום 08:15` · `אתמול 17:40` · `יום ראשון 09:00` —
 * computed in `timeZone` (the product passes `Asia/Jerusalem`), ⛔ never UTC: a post from
 * 23:50 last night must read `אתמול`, not `היום`.
 * ⚠️ A post a week old or more gets a fourth form, `12.9 09:00`: a weekday name alone would
 * point at the wrong week (same rule as the inbox, `lib/core/messages.ts` `whenOf`).
 */
export function wallTimeLabel(iso: string, nowIso: string, timeZone: string): string {
  const created = new Date(iso);
  const time = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone }).format(created);
  const w = whenOf(iso, nowIso, timeZone);
  switch (w.kind) {
    case 'today': return `היום ${time}`;
    case 'yesterday': return `אתמול ${time}`;
    case 'weekday': {
      const day = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone }).format(created);
      const idx = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(day);
      return `${WEEKDAY_FULL_HE[idx] ?? w.dayHe} ${time}`;
    }
    case 'date': return `${w.dateHe} ${time}`;
  }
}

function likeIndex(likes: readonly WallLikeRow[], me: string) {
  const count = new Map<string, number>();
  const mineSet = new Set<string>();
  for (const l of likes) {
    const key = l.post_id ? `p:${l.post_id}` : `r:${l.reply_id}`;
    count.set(key, (count.get(key) ?? 0) + 1);
    if (l.user_id === me) mineSet.add(key);
  }
  return { count: (k: string) => count.get(k) ?? 0, mine: (k: string) => mineSet.has(k) };
}

export function toWallReplies(replies: readonly WallReplyRow[], likes: readonly WallLikeRow[], me: string): readonly WallReply[] {
  const idx = likeIndex(likes, me);
  return replies.map((r) => ({
    id: r.id,
    bodyEn: r.body_en,
    createdAt: r.created_at,
    likes: idx.count(`r:${r.id}`),
    likedByMe: idx.mine(`r:${r.id}`),
    mine: r.author_id === me,
  }));
}

/** Newest post first; each with its counts and its two top replies. ⛔ No author id leaves. */
export function buildWallFeed(
  posts: readonly WallPostRow[],
  replies: readonly WallReplyRow[],
  likes: readonly WallLikeRow[],
  me: string,
  openerId: string,
): readonly WallPost[] {
  const idx = likeIndex(likes, me);
  const shaped = toWallReplies(replies, likes, me);
  const byPost = new Map<string, WallReply[]>();
  replies.forEach((r, i) => {
    const list = byPost.get(r.post_id) ?? [];
    list.push(shaped[i] as WallReply);
    byPost.set(r.post_id, list);
  });
  return [...posts]
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .map((p) => {
      const rs = byPost.get(p.id) ?? [];
      const pictureKey = toWallPictureKey(p.picture_key);
      return {
        id: p.id,
        bodyEn: p.body_en,
        createdAt: p.created_at,
        byOpener: p.author_id === openerId,
        mine: p.author_id === me,
        ...(pictureKey ? { pictureKey } : {}),
        likes: idx.count(`p:${p.id}`),
        likedByMe: idx.mine(`p:${p.id}`),
        replyCount: rs.length,
        top: topReplies(rs, TOP_REPLIES),
      };
    });
}

/**
 * T-472 — the stored form of a keyboard sentence: the words as sent, the first letter
 * capitalised, a lone `i` as `I`, and one closing mark — `?` on a question (the opener's
 * post, `39 § 5`), `.` on a reply. ⛔ Nothing is added between the words.
 */
export function wallSentence(words: readonly string[], kind: 'question' | 'reply'): string {
  const body = words.map((w) => (w.toLowerCase() === 'i' ? 'I' : w)).join(' ');
  return `${body.charAt(0).toUpperCase()}${body.slice(1)}${kind === 'question' ? '?' : '.'}`;
}
