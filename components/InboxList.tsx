'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import ClassStory, { STORY_HEADING_HE } from '@/components/ClassStory';
import ClassJoin, { WALL_HEADING_HE, WALL_KICKER_NO_CLASS_HE, wallKickerHe, type ClassPanelState } from '@/components/ClassJoin';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { RETRY_HE } from '@/lib/core/failure';
import { failureExit, SIGN_IN_AGAIN_HE } from '@/lib/core/failureExit';
import { inboxCountsHe, toInboxRows, type InboxCounts, type InboxItem, type InboxRow } from '@/lib/core/messages';
import { LEARNER_TIME_ZONE } from '@/lib/core/onboarding';

/**
 * תיבת הסימולציות — the list (T-191 · 39 § 7 · D-109). 🎯 Render: docs/design/kol-C-13-inbox.png,
 * drawn by render_msgs_screens.py `screen_inbox` (:50-82). Layout values are grepped there.
 *
 * ⛔ Draws only: rows arrive precomputed from lib/core/messages.ts (`toInboxRows`). ⛔ No
 * filter/reduce/sort here. ⛔ No write anywhere: apiGet alone.
 * Layer A gaps, declared: chip 9.5→12px · time 10.5→12px · card sub-line 11→12px; radii
 * 17→16 (rows) · 14→16 (card) · 10→12 (active segment). The sliding pill is T-480's (שכבה ב׳).
 *
 * ⚠️ ⛔ No horizontal padding of its own (T-285ⓓ · D-206): `app/layout.tsx`'s `<main>`
 * already carries the product's single gutter, and a `px-4` here would make a third one.
 */
export const KICKER_HE = 'הודעות · סימולציות';
export const HEADING_HE = 'תיבת הסימולציות';
// T-469 · `הקיר` opened with the classes; T-479 · `39 § 9`-5 — `סיפור` opened with the story chain.
export type MessagesTab = 'wall' | 'story' | 'inbox';
const TABS: readonly { readonly he: string; readonly key: MessagesTab | null }[] = [
  { he: 'הקיר', key: 'wall' },
  { he: 'סיפור', key: 'story' },
  { he: 'תיבה', key: 'inbox' },
];
const CARD_TITLE_HE = 'כל התכתובת מול דמויות';
const CARD_SUB_HE = 'אין כאן משתמשים אחרים';
const NO_LEVEL_HE = 'כדי לקרוא הודעות ברמה שלך, בחר קודם רמה.';
const NO_LEVEL_HREF = '/study/scan';
const NO_SIMS_HE = 'עדיין אין כאן הודעות ברמה שלך.';
// ⛔ `RETRY_HE` is imported and ⛔ never restated — `lib/core/failure.test.ts` measures it.

export type InboxScreenState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly rows: readonly InboxRow[]; readonly countsHe: string }
  | { readonly kind: 'no_level' }
  | { readonly kind: 'no_simulations' }
  | { readonly kind: 'schema_missing' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' };

type MessagesBody =
  | { ok: true; items: readonly InboxItem[]; counts: InboxCounts }
  | { ok: false; code: 'no_level' | 'no_simulations' | 'schema_missing' | 'unavailable' | 'session_expired' };

function Header({ tab, onTab, kickerHe, headingHe }: { readonly tab: MessagesTab; readonly onTab: (t: MessagesTab) => void; readonly kickerHe: string; readonly headingHe: string }) {
  return (
    <header className="pt-2">
      <p className="text-xs text-ink-muted">{kickerHe}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{headingHe}</h1>
      <div role="tablist" aria-label="הודעות" className="relative mt-3 grid grid-cols-3 rounded-xl border border-surface-raised bg-surface-raised p-0.5">
        {/*
          T-480 · `39 § 4` — ONE active background under the three buttons, sliding to the
          selected tab (`render_video_C.py:201`). `transform` only; in RTL the first tab
          (`הקיר`) sits on the RIGHT, so the pill starts at `right` and moves by a NEGATIVE
          percentage of its own width — one tab per step of its width. A transition, ⛔ not keyframes: a
          tap mid-slide retargets from where the pill IS. 250ms, ⛔ the render's 400: the
          interface ceiling is 300 (`35 § ב6`). Reduced motion ⇒ it appears in place.
        */}
        <span aria-hidden className="pointer-events-none absolute inset-0.5">
          <span
            data-tab-indicator
            style={{ transform: `translateX(${-100 * Math.max(0, TABS.findIndex((t) => t.key === tab))}%)` }}
            className="absolute inset-y-0 right-0 w-1/3 rounded-xl border border-brand bg-brand-surface/25 transition-transform duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] motion-reduce:transition-none"
          />
        </span>
        {TABS.map((t) => {
          const selected = t.key === tab;
          if (t.key === null) {
            return (
              <span key={t.he} role="tab" aria-selected={false} aria-disabled className="relative flex min-h-touch items-center justify-center text-sm text-ink-muted">
                {t.he}
              </span>
            );
          }
          const key = t.key;
          return (
            <button
              key={t.he}
              type="button"
              role="tab"
              aria-selected={selected}
              data-messages-tab={key}
              onClick={() => onTab(key)}
              className={selected
                ? 'relative flex min-h-touch items-center justify-center rounded-xl text-sm font-bold text-brand-surface'
                : 'relative flex min-h-touch items-center justify-center rounded-xl text-sm font-medium text-ink'}
            >
              {t.he}
            </button>
          );
        })}
      </div>
    </header>
  );
}

/** T-462ⓑ — the second indicator's word. */
export const ANSWERED_HE = 'נענה';

function Row({ row }: { readonly row: InboxRow }) {
  return (
    <li>
      {/*
        ⟦C-0522 · T-192⟧ `prefetch={false}` is GONE, exactly as C-0518 instructed it to be:
        it existed only because `/world/messages/[id]` answered **404**, whose three `_rsc`
        requests kept `networkidle` from ever settling and killed `check:mobile` on this
        route. That route is created in this same commit ⇒ the reason is spent.
      */}
      <Link
        href={row.href}
        className={`flex min-h-touch gap-3 rounded-2xl border p-3 ${row.unread ? 'border-brand bg-surface-raised' : 'border-surface-raised bg-surface'}`}
      >
        <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-surface text-base font-bold text-brand-on">
          {row.initial}
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className={`text-sm ${row.unread ? 'font-bold' : 'font-semibold'} text-ink`}><EnWord>{row.senderEn}</EnWord></span>
            {/*
              ⚠️ A BORDER and ⛔ not a fill, measured in the walk: the render fills the chip
              with the sender's own colour at α55 (`render_msgs_screens.py:67`), and a
              per-sender colour is ⛔ not a `palette.ts` token (D-102, one visual language).
              A `bg-surface-raised` fill made the chip **invisible** on an unread row, whose
              background is that same token — one channel lost. The outline reads on both.
            */}
            <span className="rounded-lg border border-ink-muted/40 px-2 text-xs font-medium text-ink-muted">{row.contextHe}</span>
          </span>
          <span className={`mt-1 block text-sm ${row.unread ? 'font-bold text-ink' : 'text-ink-muted'}`}><EnWord>{row.subjectEn}</EnWord></span>
          <span className="mt-1 block text-xs text-ink-muted"><EnWord>{row.previewEn}</EnWord></span>
        </span>
        <span className="flex shrink-0 flex-col items-center gap-2">
          <span className="text-xs font-medium text-ink-muted">{row.whenHe}</span>
          {row.unread ? <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-brand-surface" /> : null}
          {/*
            T-462ⓑ · D-207 — «נענה» is a SECOND indicator: an icon AND a word, in `success`,
            ⛔ never the blue dot relit (the dot means «טרם נקראה», and only that).
          */}
          {row.answered ? (
            <span data-inbox-answered className="flex items-center gap-1 text-xs font-semibold text-success">
              <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12.5l4.5 4.5L19 7.5" />
              </svg>
              {ANSWERED_HE}
            </span>
          ) : null}
          <span className="sr-only">{row.unread ? 'טרם נקראה' : 'נקראה'}</span>
        </span>
      </Link>
    </li>
  );
}

function IsolationCard() {
  return (
    <aside className="mt-4 flex items-start gap-3 rounded-2xl bg-surface-raised p-4">
      <svg aria-hidden viewBox="0 0 24 24" className="mt-0.5 h-5 w-5 shrink-0 text-ink-muted" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="10" width="16" height="11" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0" />
      </svg>
      <span>
        <span className="block text-sm font-semibold text-ink">{CARD_TITLE_HE}</span>
        <span className="block text-xs text-ink-muted">{CARD_SUB_HE}</span>
      </span>
    </aside>
  );
}

function Exit({ code, onRetry }: { readonly code: 'session_expired' | 'schema_missing' | 'unavailable'; readonly onRetry: () => void }) {
  if (code === 'unavailable') {
    return <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>;
  }
  const exit = failureExit(code);
  return <Link href={exit.href} className="mt-4 inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{code === 'session_expired' ? SIGN_IN_AGAIN_HE : exit.labelHe}</Link>;
}

export interface InboxListViewProps {
  readonly state: InboxScreenState;
  readonly onRetry?: () => void;
  /** T-469 — which tab is showing. The inbox is the default, as before. */
  readonly tab?: MessagesTab;
  readonly onTab?: (t: MessagesTab) => void;
  /** The `הקיר` tab's body and its kicker (`הודעות · <שם הכיתה>`, kol-C-10). */
  readonly wall?: ReactNode;
  readonly wallKickerHe?: string;
  /** T-479 — the `סיפור` tab's body; the kicker is the wall's (`הודעות · <שם הכיתה>`). */
  readonly story?: ReactNode;
}

export function InboxListView({ state, onRetry = () => {}, tab = 'inbox', onTab = () => {}, wall = null, wallKickerHe: wallKicker = WALL_KICKER_NO_CLASS_HE, story = null }: InboxListViewProps) {
  if (tab === 'story') {
    return (
      <section dir="rtl" className="mx-auto w-full max-w-md pb-6 text-ink">
        <Header tab="story" onTab={onTab} kickerHe={wallKicker} headingHe={STORY_HEADING_HE} />
        <div role="tabpanel">{story}</div>
      </section>
    );
  }
  if (tab === 'wall') {
    // ⛔ No IsolationCard here: it says «אין כאן משתמשים אחרים», and on the wall there are.
    return (
      <section dir="rtl" className="mx-auto w-full max-w-md pb-6 text-ink">
        <Header tab="wall" onTab={onTab} kickerHe={wallKicker} headingHe={WALL_HEADING_HE} />
        <div role="tabpanel">{wall}</div>
      </section>
    );
  }
  return (
    <section dir="rtl" className="mx-auto w-full max-w-md pb-6 text-ink">
      <Header tab="inbox" onTab={onTab} kickerHe={KICKER_HE} headingHe={HEADING_HE} />
      {state.kind === 'loading' ? <p className="mt-4 text-xs text-ink-muted">טוען…</p> : null}
      {state.kind === 'ready' ? (
        <>
          <p data-inbox-unread className="mt-3 text-xs text-ink-muted">{state.countsHe}</p>
          <ul className="mt-2 space-y-3">{state.rows.map((r) => <Row key={r.id} row={r} />)}</ul>
        </>
      ) : null}
      {state.kind === 'no_level' ? <p className="mt-4 text-sm">{NO_LEVEL_HE} <Link href={NO_LEVEL_HREF} className="inline-flex min-h-touch items-center font-semibold text-brand-surface underline">לבחירת רמה</Link></p> : null}
      {state.kind === 'no_simulations' ? <p className="mt-4 text-sm text-ink-muted">{NO_SIMS_HE}</p> : null}
      {state.kind === 'schema_missing' ? <Exit code="schema_missing" onRetry={onRetry} /> : null}
      {state.kind === 'session_expired' ? <Exit code="session_expired" onRetry={onRetry} /> : null}
      {state.kind === 'error' ? <Exit code="unavailable" onRetry={onRetry} /> : null}
      <IsolationCard />
    </section>
  );
}

export default function InboxList(): React.JSX.Element {
  const [state, setState] = useState<InboxScreenState>({ kind: 'loading' });
  const [tab, setTab] = useState<MessagesTab>('inbox');
  const [wallKicker, setWallKicker] = useState(wallKickerHe({ kind: 'loading' }));
  const onClassState = useCallback((s: ClassPanelState) => setWallKicker(wallKickerHe(s)), []);
  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<MessagesBody>('/api/world/messages');
      if (!body.ok) {
        if (body.code === 'session_expired') setState({ kind: 'session_expired' });
        else if (body.code === 'schema_missing') setState({ kind: 'schema_missing' });
        else if (body.code === 'no_level') setState({ kind: 'no_level' });
        else if (body.code === 'no_simulations') setState({ kind: 'no_simulations' });
        else setState({ kind: 'error' });
        return;
      }
      // ⛔ No computing here beyond formatting: `readAt`/`answeredAt` already travel on
      // `items`, and `counts` is the server’s — the component never re-derives either.
      setState({
        kind: 'ready',
        rows: toInboxRows(body.items, new Date().toISOString(), LEARNER_TIME_ZONE),
        countsHe: inboxCountsHe(body.counts),
      });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);
  useEffect(() => { void load(); }, [load]);
  return (
    <InboxListView
      state={state}
      onRetry={() => { void load(); }}
      tab={tab}
      onTab={setTab}
      wall={tab === 'wall' ? <ClassJoin onState={onClassState} /> : null}
      story={tab === 'story' ? <ClassJoin onState={onClassState} body={(id) => <ClassStory classId={id} />} /> : null}
      wallKickerHe={wallKicker}
    />
  );
}
