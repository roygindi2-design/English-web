'use client';

import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { RETRY_HE } from '@/lib/core/failure';
import { wallTimeLabel, type WallPost, type WallReply } from '@/lib/core/wallFeed';
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
 * ⚠️ The hearts are a COUNT here; tapping them is T-474.
 * ⛔ Draws only: the feed arrives shaped by `lib/core/wallFeed.ts` (`buildWallFeed`).
 */
export const ANSWER_HINT_EN = 'Answer in one sentence.';
export const OPENER_HE = 'המורה';
export const ME_HE = 'אתה';
export const MEMBER_HE = 'חבר בכיתה';
export const FEED_EMPTY_HE = 'הקיר מתמלא כשיש פוסט ראשון';

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

/** A count with its heart. Filled vs outline is the SHAPE channel; the words are for the reader. */
function Likes({ n, mine }: { readonly n: number; readonly mine: boolean }) {
  return (
    <span data-wall-likes className={`inline-flex items-center gap-1 text-sm font-semibold ${mine ? 'text-danger' : 'text-ink-muted'}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill={mine ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
        <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
      </svg>
      <span>{n}</span>
      <span className="sr-only">{mine ? 'לייקים, כולל שלך' : 'לייקים'}</span>
    </span>
  );
}

function ReplyCard({ r }: { readonly r: WallReply }) {
  return (
    <li data-wall-reply className="flex items-center gap-3 rounded-2xl border border-surface-raised bg-surface p-3">
      <Avatar size="sm" />
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold text-ink-muted">{authorHe(r)}</span>
        <span className="block text-sm text-ink"><EnWord>{r.bodyEn}</EnWord></span>
      </span>
      <Likes n={r.likes} mine={r.likedByMe} />
    </li>
  );
}

function PostCard({ post, nowIso, all, onShowAll }: {
  readonly post: WallPost;
  readonly nowIso: string;
  readonly all: readonly WallReply[] | 'loading' | undefined;
  readonly onShowAll: (postId: string) => void;
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
      <p className="mt-1 text-sm text-ink-muted"><EnWord>{ANSWER_HINT_EN}</EnWord></p>
      <div className="mt-3 flex items-center justify-between border-t border-ink-muted/20 pt-3">
        <span className="text-sm font-semibold text-ink-muted">{repliesHe(post.replyCount)}</span>
        <Likes n={post.likes} mine={post.likedByMe} />
      </div>
      {replies.length > 0 ? <ul className="mt-2 space-y-2">{replies.map((r) => <ReplyCard key={r.id} r={r} />)}</ul> : null}
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
    </article>
  );
}

export function ClassWallView({ state, nowIso, expanded = {}, onShowAll = () => {}, onRetry = () => {} }: {
  readonly state: ClassWallState;
  readonly nowIso: string;
  readonly expanded?: Readonly<Record<string, readonly WallReply[] | 'loading'>>;
  readonly onShowAll?: (postId: string) => void;
  readonly onRetry?: () => void;
}) {
  if (state.kind === 'loading') {
    // `STEP 5.6` — a skeleton in the card's shape, ⛔ not a spinner.
    return (
      <div data-wall-skeleton aria-busy className="mt-4 space-y-3">
        {[0, 1].map((i) => (
          <div key={i} className="rounded-2xl bg-surface-raised p-4">
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
  if (state.posts.length === 0) {
    return <p data-wall-empty className="mt-6 text-center text-sm text-ink-muted">{FEED_EMPTY_HE}</p>;
  }
  return (
    <div className="mt-4 space-y-4">
      {state.posts.map((p) => <PostCard key={p.id} post={p} nowIso={nowIso} all={expanded[p.id]} onShowAll={onShowAll} />)}
    </div>
  );
}

type FeedBody = { ok: true; posts: readonly WallPost[] } | { ok: false; code: string };
type RepliesBody = { ok: true; replies: readonly WallReply[] } | { ok: false; code: string };

/** Live: `GET /api/world/classes/[id]/wall`; «show all» reads `…/[postId]/replies` and opens IN PLACE. */
export default function ClassWall({ classId }: { readonly classId: string }): React.JSX.Element {
  const [state, setState] = useState<ClassWallState>({ kind: 'loading' });
  const [expanded, setExpanded] = useState<Record<string, readonly WallReply[] | 'loading'>>({});
  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<FeedBody>(`/api/world/classes/${classId}/wall`);
      setState(body.ok ? { kind: 'ready', posts: body.posts } : { kind: 'error' });
    } catch {
      setState({ kind: 'error' });
    }
  }, [classId]);
  useEffect(() => { void load(); }, [load]);

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

  return <ClassWallView state={state} nowIso={new Date().toISOString()} expanded={expanded} onShowAll={(id) => { void showAll(id); }} onRetry={() => { void load(); }} />;
}
