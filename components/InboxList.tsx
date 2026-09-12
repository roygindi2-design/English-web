'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
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
 * 17→16 (rows) · 14→16 (card) · 10→12 (active segment). The sliding pill is motion and is
 * ⛔ not built (D-148: no שכבה ב׳ on this row).
 *
 * ⚠️ ⛔ No horizontal padding of its own (T-285ⓓ · D-206): `app/layout.tsx`'s `<main>`
 * already carries the product's single gutter, and a `px-4` here would make a third one.
 */
export const KICKER_HE = 'הודעות · סימולציות';
export const HEADING_HE = 'תיבת הסימולציות';
const TABS_HE = ['הקיר', 'סיפור', 'תיבה'] as const;
const TABS_CONDITION_HE = 'הקיר וסיפור נפתחים עם הכיתות';
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

function Header() {
  return (
    <header className="pt-2">
      <p className="text-xs text-ink-muted">{KICKER_HE}</p>
      <h1 className="mt-1 text-2xl font-bold text-ink">{HEADING_HE}</h1>
      <div role="tablist" aria-label="הודעות" className="mt-3 grid h-11 grid-cols-3 rounded-xl border border-surface-raised bg-surface-raised p-0.5">
        {TABS_HE.map((t) => {
          const live = t === 'תיבה';
          return (
            <span
              key={t}
              role="tab"
              aria-selected={live}
              aria-disabled={!live}
              className={live
                ? 'flex items-center justify-center rounded-xl border border-brand bg-brand-surface/25 text-sm font-bold text-brand-surface'
                : 'flex items-center justify-center text-sm text-ink-muted'}
            >
              {t}
            </span>
          );
        })}
      </div>
      <p className="mt-1 text-xs text-ink-muted">{TABS_CONDITION_HE}</p>
    </header>
  );
}

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

export function InboxListView({ state, onRetry = () => {} }: { readonly state: InboxScreenState; readonly onRetry?: () => void }) {
  return (
    <section dir="rtl" className="mx-auto w-full max-w-md pb-6 text-ink">
      <Header />
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
  return <InboxListView state={state} onRetry={() => { void load(); }} />;
}
