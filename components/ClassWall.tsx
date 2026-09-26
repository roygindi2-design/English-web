'use client';

import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import WallPicture, { WallPicturePicker } from '@/components/WallPicture';
import WallReplySheet from '@/components/WallReplySheet';
import { apiGet, apiPost } from '@/lib/api/client';
import { RETRY_HE } from '@/lib/core/failure';
import { toWallPictureKey, wallSentence, wallTimeLabel, type WallPictureKey, type WallPost, type WallReply } from '@/lib/core/wallFeed';
import { LEARNER_TIME_ZONE } from '@/lib/core/onboarding';

/**
 * The class wall — the posts (T-473 · `39 § 5` · D-288). 🎯 Render: docs/design/kol-C-10-wall-feed.png,
 * drawn by render_video_C.py `wall_feed` (:132-150): avatar · `<name> · המורה` · the time
 * line · the question, bold · `Answer in one sentence.` · a rule · `N תגובות` on the right,
 * heart + number on the left · the two top replies as small cards · `הצג את כל N התגובות`.
 *
 * ⚠️ Declared gap, ⛔ not a design choice: ⛔ no table holds a display name (`profiles` has no
 * name column, measured C-0803) ⇒ the author line is the ROLE — `המורה` for the opener
 * (D-288), `אתה` for the learner's own, `חבר בכיתה` otherwise — and the avatar is a glyph,
 * ⛔ not a letter. A name source is a PM row, ⛔ not something to invent here.
 * T-474 — a heart is a toggle (optimistic, reverted on failure) and ⛔ off on your own
 * content; `הוסף תגובה מהבלוקים` opens `<WallReplySheet>`; the opener gets `שאלה חדשה`.
 * ⛔ Draws only: the feed arrives shaped by `lib/core/wallFeed.ts` (`buildWallFeed`).
 */
export const ANSWER_HINT_EN = 'Answer in one sentence.';
export const OPENER_HE = 'המורה';
export const ME_HE = 'אתה';
export const MEMBER_HE = 'חבר בכיתה';
export const FEED_EMPTY_HE = 'הקיר מתמלא כשיש פוסט ראשון';
export const ADD_REPLY_HE = 'הוסף תגובה מהבלוקים';
export const NEW_QUESTION_HE = 'שאלה חדשה';
export const OWN_LIKE_HE = 'אי אפשר לסמן לייק על תוכן שלך';

export type LikeTarget = { readonly postId: string } | { readonly replyId: string };

export const repliesHe = (n: number) => (n === 1 ? 'תגובה אחת' : `${n} תגובות`);
export const showAllHe = (n: number) => `הצג את כל ${n} התגובות`;

export type ClassWallState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly posts: readonly WallPost[] }
  | { readonly kind: 'error' };

function authorHe(p: { readonly byOpener?: boolean; readonly mine: boolean }): string {
  if (p.byOpener) return OPENER_HE;
  return p.mine ? ME_HE : MEMBER_HE;
}

function Avatar({ size }: { readonly size: 'lg' | 'sm' }) {
  const box = size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  return (
    <span aria-hidden className={`flex ${box} shrink-0 items-center justify-center rounded-full bg-brand-surface/20 text-brand-surface`}>
      <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" />
      </svg>
    </span>
  );
}

/**
 * A count with its heart. Filled vs outline is the SHAPE channel; the words are for the reader.
 * With `onLike` it is a 44px toggle; on the learner's OWN content it is ⛔ off (D-288).
 */
function Likes({ n, mine, own = false, onLike }: { readonly n: number; readonly mine: boolean; readonly own?: boolean; readonly onLike?: () => void }) {
  const face = (
    <>
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill={mine ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      <span>{n}</span>
      <span className="sr-only">{own ? OWN_LIKE_HE : mine ? 'לייקים, כולל שלך' : 'לייקים'}</span>
    </>
  );
  const tone = `inline-flex items-center gap-1 text-sm font-semibold ${mine ? 'text-danger' : 'text-ink-muted'}`;
  if (!onLike) return <span data-wall-likes className={tone}>{face}</span>;
  return (
    <button
      type="button"
      data-wall-likes
      onClick={own ? undefined : onLike}
      disabled={own}
      aria-pressed={mine}
      className={`${tone} min-h-touch min-w-touch justify-center rounded-xl px-2 active:scale-[0.97] disabled:opacity-60 motion-reduce:transform-none`}
    >
      {face}
    </button>
  );
}

function ReplyCard({ r, onLike }: { readonly r: WallReply; readonly onLike?: (t: LikeTarget) => void }) {
  return (
    <li data-wall-reply className="flex items-center gap-3 rounded-2xl border border-surface-raised bg-surface p-3">
      <Avatar size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-ink-muted">{authorHe(r)}</span>
        <span className="block text-sm text-ink"><EnWord>{r.bodyEn}</EnWord></span>
      </span>
      <Likes n={r.likes} mine={r.likedByMe} own={r.mine} onLike={onLike ? () => onLike({ replyId: r.id }) : undefined} />
    </li>
  );
}

function PostCard({ post, nowIso, all, onShowAll, onLike, onReply }: {
  readonly post: WallPost;
  readonly nowIso: string;
  readonly all: readonly WallReply[] | 'loading' | undefined;
  readonly onShowAll: (postId: string) => void;
  readonly onLike?: (t: LikeTarget) => void;
  readonly onReply?: (postId: string) => void;
}) {
  const replies = Array.isArray(all) ? all : post.top;
  const hidden = post.replyCount - replies.length;
  return (
    <article data-wall-post className="rounded-2xl bg-surface-raised p-4 shadow-sm">
      <header className="flex items-center gap-3">
        <Avatar size="lg" />
        <span>
          <span className="block text-sm font-bold text-ink">{authorHe(post)}</span>
          <span className="block text-xs text-ink-muted">{wallTimeLabel(post.createdAt, nowIso, LEARNER_TIME_ZONE)}</span>
        </span>
      </header>
      <p className="mt-3 text-lg font-bold text-ink"><EnWord>{post.bodyEn}</EnWord></p>
      {/* T-484 — msgs_ui.py `photo`: under the question, card-width less 10px a side (p-4 ⇒ -mx-1.5) */}
      <WallPicture pictureKey={post.pictureKey} className="-mx-1.5 mt-2" />
      <p className="mt-1 text-sm text-ink-muted"><EnWord>{ANSWER_HINT_EN}</EnWord></p>
      <div className="mt-3 flex items-center justify-between border-t border-ink-muted/20 pt-3">
        <span className="text-sm font-semibold text-ink-muted">{repliesHe(post.replyCount)}</span>
        <Likes n={post.likes} mine={post.likedByMe} own={post.mine} onLike={onLike ? () => onLike({ postId: post.id }) : undefined} />
      </div>
      {replies.length > 0 ? <ul className="mt-2 space-y-2">{replies.map((r) => <ReplyCard key={r.id} r={r} onLike={onLike} />)}</ul> : null}
      {hidden > 0 ? (
        <button
          type="button"
          onClick={() => onShowAll(post.id)}
          disabled={all === 'loading'}
          aria-expanded={false}
          className="mt-1 inline-flex min-h-touch items-center text-sm font-bold text-brand-surface disabled:opacity-60"
        >
          {showAllHe(post.replyCount)}
        </button>
      ) : null}
      {onReply ? (
        <button
          type="button"
          data-wall-add-reply
          onClick={() => onReply(post.id)}
          className="mt-3 flex min-h-touch w-full items-center justify-center rounded-2xl border border-brand text-sm font-bold text-brand-surface active:scale-[0.98] motion-reduce:transform-none"
        >
          {ADD_REPLY_HE}
        </button>
      ) : null}
    </article>
  );
}

export function ClassWallView({ state, nowIso, expanded = {}, onShowAll = () => {}, onRetry = () => {}, onLike, onReply, onAsk }: {
  readonly state: ClassWallState;
  readonly nowIso: string;
  readonly expanded?: Readonly<Record<string, readonly WallReply[] | 'loading'>>;
  readonly onShowAll?: (postId: string) => void;
  readonly onRetry?: () => void;
  readonly onLike?: (t: LikeTarget) => void;
  readonly onReply?: (postId: string) => void;
  /** Only the class opener gets it (D-288). */
  readonly onAsk?: () => void;
}) {
  if (state.kind === 'loading') {
    // `STEP 5.6` — a skeleton in the card's shape, ⛔ not a spinner.
    return (
      <div data-wall-skeleton aria-busy="true" aria-live="polite" className="mt-4 space-y-3">
        {/* T-482ⓓ — the shape was already here; the word for a screen reader was ⛔ not. */}
        <span className="sr-only">טוען</span>
        {[0, 1].map((i) => (
          <div key={i} aria-hidden className="rounded-2xl bg-surface-raised p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-surface" />
              <div className="h-3 w-24 rounded-md bg-surface" />
            </div>
            <div className="mt-4 h-4 w-3/4 rounded-md bg-surface" />
            <div className="mt-2 h-3 w-1/2 rounded-md bg-surface" />
          </div>
        ))}
      </div>
    );
  }
  if (state.kind === 'error') {
    return <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>;
  }
  const ask = onAsk ? (
    <button type="button" data-wall-ask onClick={onAsk} className="mt-4 flex min-h-touch w-full items-center justify-center rounded-xl bg-brand-surface text-sm font-bold text-brand-on active:scale-[0.98] motion-reduce:transform-none">
      {NEW_QUESTION_HE}
    </button>
  ) : null;
  if (state.posts.length === 0) {
    return <>{ask}<p data-wall-empty className="mt-6 text-center text-sm text-ink-muted">{FEED_EMPTY_HE}</p></>;
  }
  return (
    <>
      {ask}
      <div className="mt-4 space-y-4">
        {state.posts.map((p) => <PostCard key={p.id} post={p} nowIso={nowIso} all={expanded[p.id]} onShowAll={onShowAll} onLike={onLike} onReply={onReply} />)}
      </div>
    </>
  );
}

type FeedBody = { ok: true; amOpener?: boolean; mySeat?: number | null; posts: readonly WallPost[] } | { ok: false; code: string };
type RepliesBody = { ok: true; replies: readonly WallReply[] } | { ok: false; code: string };
type LikeBody = { ok: true; liked: boolean; likes: number } | { ok: false; code: string };
type WriteBody = { ok: true; id: string | null; createdAt: string | null; bodyEn: string; pictureKey?: string | null } | { ok: false; code: string };

/** Flip one like in the feed, locally. `to` = the server's answer; absent = the optimistic flip. */
export function applyLike(posts: readonly WallPost[], t: LikeTarget, to?: { liked: boolean; likes: number }): readonly WallPost[] {
  const flip = <T extends { likes: number; likedByMe: boolean }>(x: T): T =>
    to ? { ...x, likedByMe: to.liked, likes: to.likes } : { ...x, likedByMe: !x.likedByMe, likes: x.likes + (x.likedByMe ? -1 : 1) };
  return posts.map((p) => {
    if ('postId' in t) return p.id === t.postId ? flip(p) : p;
    return p.top.some((r) => r.id === t.replyId) ? { ...p, top: p.top.map((r) => (r.id === t.replyId ? flip(r) : r)) } : p;
  });
}

interface Sheet {
  readonly kind: 'reply' | 'question';
  readonly postId: string | null;
  readonly sending: boolean;
  readonly failed: boolean;
  /** T-486 — the question's picture. Lives in the SHEET's state ⇒ a failed send keeps it. */
  readonly pictureKey?: WallPictureKey;
}

/** Live: `GET /api/world/classes/[id]/wall`; «show all» reads `…/[postId]/replies` and opens IN PLACE. */
export default function ClassWall({ classId }: { readonly classId: string }): React.JSX.Element {
  const [state, setState] = useState<ClassWallState>({ kind: 'loading' });
  const [amOpener, setAmOpener] = useState(false);
  /** T-520 — the learner's own class seat, for what they write before the feed reloads. `0` = none yet. */
  const [mySeat, setMySeat] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, readonly WallReply[] | 'loading'>>({});
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<FeedBody>(`/api/world/classes/${classId}/wall`);
      if (body.ok) {
        setAmOpener(body.amOpener === true);
        setMySeat(body.mySeat ?? 0);
      }
      setState(body.ok ? { kind: 'ready', posts: body.posts } : { kind: 'error' });
    } catch {
      setState({ kind: 'error' });
    }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

  const setPosts = useCallback((f: (p: readonly WallPost[]) => readonly WallPost[]) => {
    setState((s) => (s.kind === 'ready' ? { kind: 'ready', posts: f(s.posts) } : s));
  }, []);

  const showAll = useCallback(async (postId: string) => {
    setExpanded((e) => ({ ...e, [postId]: 'loading' }));
    try {
      const body = await apiGet<RepliesBody>(`/api/world/classes/${classId}/wall/${postId}/replies`);
      setExpanded((e) => {
        const next = { ...e };
        if (body.ok) next[postId] = body.replies;
        else delete next[postId];
        return next;
      });
    } catch {
      setExpanded((e) => { const next = { ...e }; delete next[postId]; return next; });
    }
  }, [classId]);

  const like = useCallback(async (t: LikeTarget) => {
    setPosts((p) => applyLike(p, t));
    try {
      const body = await apiPost<LikeBody>('/api/world/classes/wall/like', t);
      if (body.ok) setPosts((p) => applyLike(p, t, body));
      else setPosts((p) => applyLike(p, t));
    } catch {
      setPosts((p) => applyLike(p, t));
    }
  }, [setPosts]);

  const send = useCallback(async (words: readonly string[]) => {
    if (!sheet) return;
    const temp = `pending-${Date.now()}`;
    const createdAt = new Date().toISOString();
    const text = wallSentence(words, sheet.kind);
    setSheet({ ...sheet, sending: true, failed: false });
    if (sheet.kind === 'reply' && sheet.postId) {
      const postId = sheet.postId;
      const mineReply: WallReply = { id: temp, bodyEn: text, createdAt, likes: 0, likedByMe: false, mine: true, seat: mySeat };
      setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount + 1, top: [...p.top, mineReply] } : p)));
      try {
        const body = await apiPost<WriteBody>(`/api/world/classes/${classId}/wall/${postId}/replies`, { words });
        if (!body.ok) throw new Error(body.code);
        setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, top: p.top.map((r) => (r.id === temp ? { ...r, id: body.id ?? temp, bodyEn: body.bodyEn } : r)) } : p)));
        setSheet(null);
      } catch {
        setPosts((ps) => ps.map((p) => (p.id === postId ? { ...p, replyCount: p.replyCount - 1, top: p.top.filter((r) => r.id !== temp) } : p)));
        setSheet((s) => (s ? { ...s, sending: false, failed: true } : s));
      }
      return;
    }
    const pictureKey = sheet.pictureKey;
    const mine: WallPost = { id: temp, bodyEn: text, createdAt, byOpener: true, mine: true, seat: mySeat, ...(pictureKey ? { pictureKey } : {}), likes: 0, likedByMe: false, replyCount: 0, top: [] };
    setPosts((ps) => [mine, ...ps]);
    try {
      const body = await apiPost<WriteBody>(`/api/world/classes/${classId}/wall`, pictureKey ? { words, pictureKey } : { words });
      if (!body.ok) throw new Error(body.code);
      const stored = toWallPictureKey(body.pictureKey);
      setPosts((ps) => ps.map((p) => {
        if (p.id !== temp) return p;
        const { pictureKey: _drop, ...rest } = p;
        return { ...rest, id: body.id ?? temp, bodyEn: body.bodyEn, ...(stored ? { pictureKey: stored } : {}) };
      }));
      setSheet(null);
    } catch {
      setPosts((ps) => ps.filter((p) => p.id !== temp));
      setSheet((s) => (s ? { ...s, sending: false, failed: true } : s));
    }
  }, [classId, sheet, setPosts, mySeat]);

  const questionEn = sheet?.postId && state.kind === 'ready' ? state.posts.find((p) => p.id === sheet.postId)?.bodyEn : undefined;
  return (
    <>
      <ClassWallView
        state={state}
        nowIso={new Date().toISOString()}
        expanded={expanded}
        onShowAll={(id) => { void showAll(id); }}
        onRetry={() => { void load(); }}
        onLike={(t) => { void like(t); }}
        onReply={(postId) => setSheet({ kind: 'reply', postId, sending: false, failed: false })}
        onAsk={amOpener ? () => setSheet({ kind: 'question', postId: null, sending: false, failed: false }) : undefined}
      />
      <WallReplySheet
        open={sheet !== null}
        hidden={sheet?.sending ?? false}
        kind={sheet?.kind ?? 'reply'}
        questionEn={questionEn}
        failed={sheet?.failed ?? false}
        picture={sheet?.kind === 'question' ? (
          <WallPicturePicker value={sheet.pictureKey} onChange={(k) => setSheet((s) => (s ? { ...s, pictureKey: k } : s))} />
        ) : undefined}
        onSend={(w) => { void send(w); }}
        onClose={() => setSheet(null)}
      />
    </>
  );
}
