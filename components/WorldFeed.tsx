'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { FAILURE_HE, RETRY_HE } from '@/lib/core/failure';
import { producedWordCount } from '@/lib/core/world';

/**
 * The private feed of `העולם` — plan `2026-08-14-world-compose.md` task 6, § 4.2ה.
 *
 * `/world` is inside the `(tabs)` group, so it already carries the tab bar and ⛔ can never
 * carry an `<ActionBar>` (D-028). Every state below therefore puts its one action inline,
 * and the guard test measures the absence of the bar rather than trusting this comment.
 *
 * Five states, each fixed by § 4.2ה and ⛔ none invented here:
 *   loading ⇒ a skeleton in the SHAPE of the feed, ⛔ never a spinner (constitution § 5) —
 *     a spinner says "something is happening"; a skeleton says what is about to arrive and
 *     does not shift the layout when it does.
 *   empty ⇒ one action, «כתוב את הפוסט הראשון», ⛔ never a white screen.
 *   loaded ⇒ the posts newest-first (the server orders them; ⛔ this screen does not
 *     re-sort, because two sort rules are one rule too many) plus the counter.
 *   failed ⇒ Hebrew and «נסה שוב», ⛔ no English and ⛔ no raw code (constitution § 2).
 *   session expired ⇒ `/login`.
 *
 * ⚠️ **Deviation from the plan's wording, and its measurement.** The plan says the posts
 * render "through `<EnText>`". They render through `<EnWord>` instead, because `<EnText>`
 * takes `segments` with an `isTarget` flag and `GET /api/world/posts` answers
 * `{ id, body_en, created_at }` — it does not say which word was the target. Marking one
 * here would mean re-deriving a pedagogical decision in React, which is precisely what
 * TD-11 forbids, and guessing it would underline the wrong word on the learner's own
 * sentence. Both components emit the identical bidi-isolated English run — the language,
 * direction and isolation attributes are declared in `EnWord.tsx` and ⛔ nowhere else, which
 * is what `EnWord.test.ts` measures across the tree (T-009);
 * what `<EnText>` adds is the mark this screen has no input for. When the feed read grows a
 * target column, this becomes `<EnText>` with no other change.
 *
 * ⚠️ **The counter is «מילים שהפקת» and it is a DIFFERENT number from «מילים שנלמדו» on
 * `/studies`.** Learned is mastery, written once by gate 7.7 (D-010); produced is what the
 * learner has published with their own hands. They are allowed to disagree, and the two
 * labels are the whole reason the screen may show both without lying. `«—»` and ⛔ never
 * `0` while the feed is unknown — the `<MeScreen>` rule: a dash is honest, a wrong number
 * never is.
 *
 * ⛔ Nothing on this screen judges the sentence: no grade, no correction, no "יפה"
 * (R-016). The feed shows what the learner wrote, exactly as it was stored.
 */

const HEADING_HE = 'העולם';
const PRODUCED_WORDS_HE = 'מילים שהפקת';
const UNKNOWN_COUNT_HE = '—';
const EMPTY_HE = 'עוד לא כתבת פוסט.';
const FIRST_POST_HE = 'כתוב את הפוסט הראשון';
const SCHEMA_MISSING_HE = 'המאגר עדיין לא הוקם';
const SIGN_IN_AGAIN_HE = 'התחברות מחדש';
const LOADING_HE = 'טוען את הפוסטים שלך…';
const COMPOSE_HREF = '/world/compose';

/** Exactly the columns `GET /api/world/posts` returns — ⛔ this screen never asks for more,
 *  and `generation_run_id` / `needs_human_review` are not its business (task 5). */
export type WorldPost = {
  readonly id: string;
  readonly body_en: string;
  readonly created_at: string;
};

type FeedResponse =
  | { readonly ok: true; readonly posts: readonly WorldPost[]; readonly total: number }
  | { readonly ok: false; readonly code: string };

type FeedState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'posts'; readonly posts: readonly WorldPost[] }
  | { readonly kind: 'empty' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

/** The one action, in the one shape the constitution allows for a primary action: a real
 *  ≥44px target (`min-h-touch`), brand surface, radius from § 3. */
const PRIMARY_ACTION_CLASS =
  'inline-flex min-h-touch items-center justify-center rounded-lg bg-brand-surface px-5 py-3 text-lg font-semibold text-brand-on active:opacity-90';

export default function WorldFeed(): React.JSX.Element {
  const [state, setState] = useState<FeedState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<FeedResponse>('/api/world/posts');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else setState({ kind: 'error' });
        return;
      }
      setState(body.posts.length === 0 ? { kind: 'empty' } : { kind: 'posts', posts: body.posts });
    } catch {
      // `apiGet` rejects only when the answer never arrived or was not JSON. There is no
      // code to act on, so this is the generic failure and ⛔ not a guess about the cause.
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // The count is derived from the posts this screen actually holds, in the pure layer, and
  // is `null` in every state where the feed is unknown — including the failure states,
  // where showing `0` would tell a learner with a full feed that they produced nothing.
  const produced =
    state.kind === 'posts'
      ? producedWordCount(state.posts.map((post) => post.body_en))
      : state.kind === 'empty'
        ? 0
        : null;

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-3xl font-bold leading-tight">{HEADING_HE}</h1>

      {/* The number carries its own Hebrew label — size and colour are never the only
          channel (constitution § 1). It stays on screen in every state so the layout does
          not jump when the feed lands. */}
      <div className="flex flex-col gap-1">
        <p className="text-4xl font-bold leading-none">
          {produced === null ? UNKNOWN_COUNT_HE : produced}
        </p>
        <p className="text-lg text-ink-muted">{PRODUCED_WORDS_HE}</p>
      </div>

      {state.kind === 'loading' && (
        // The shape of what is coming. `aria-hidden` on the boxes with the sentence in a
        // live region: a screen reader hears "loading", ⛔ not three empty rectangles.
        <div className="flex flex-col gap-3" data-skeleton>
          <p className="sr-only" role="status">
            {LOADING_HE}
          </p>
          <div aria-hidden className="h-20 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-20 rounded-lg bg-surface-raised" />
          <div aria-hidden className="h-20 w-2/3 rounded-lg bg-surface-raised" />
        </div>
      )}

      {state.kind === 'posts' && (
        // ⛔ No re-sort: the server answered newest-first and re-ordering here would be a
        // second copy of a rule that already has one home (task 5).
        <ul className="flex flex-col gap-3">
          {state.posts.map((post) => (
            <li key={post.id} className="rounded-lg bg-surface-raised px-4 py-3">
              <p className="text-lg leading-relaxed text-ink">
                <EnWord>{post.body_en}</EnWord>
              </p>
            </li>
          ))}
        </ul>
      )}

      {state.kind === 'empty' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{EMPTY_HE}</p>
          <Link href={COMPOSE_HREF} data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {FIRST_POST_HE}
          </Link>
        </div>
      )}

      {state.kind === 'schema_missing' && (
        // Its own sentence and ⛔ never the empty state: «עוד לא כתבת» would tell a learner
        // that their own posts do not exist, when the fault is ours.
        <p className="text-lg leading-relaxed text-ink">{SCHEMA_MISSING_HE}</p>
      )}

      {state.kind === 'error' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex min-h-touch items-center rounded-lg border border-border-strong px-5 py-3 text-lg text-ink active:opacity-90"
          >
            {RETRY_HE}
          </button>
        </div>
      )}

      {state.kind === 'session_expired' && (
        <div className="flex flex-col items-start gap-3">
          <p className="text-lg leading-relaxed text-ink">{FAILURE_HE.load}</p>
          {/* A plain <a> and ⛔ not <Link>: the session is gone, so the next request has to
              reach the server and be allowed to redirect — the client router is free to
              answer from its cache. Same reasoning as the retry in <MeScreen>. */}
          <a href="/login" data-primary-action="true" className={PRIMARY_ACTION_CLASS}>
            {SIGN_IN_AGAIN_HE}
          </a>
        </div>
      )}
    </section>
  );
}
