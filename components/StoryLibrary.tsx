'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import type { CefrBand } from '@/lib/core/cefrLevels';
import { FAILURE_HE, RETRY_HE, SESSION_EXPIRED_HE } from '@/lib/core/failure';
import { failureExit } from '@/lib/core/failureExit';
import {
  STORY_LIBRARY_LEVELS,
  type StoryLibraryItem,
  type StoryLibraryLevel,
  type StoryLibraryStatus,
} from '@/lib/core/storyLibrary';

/**
 * 🗂️ **T-511 · `D-297`ⓒ — «ספריית הסיפורים»**, built to Figma `3342:2` (`kol-A-06`,
 * 393×852, light): kicker · title · back `›` · summary line · four level chips · one card
 * per story · footer line. Layout, strings and order are the frame's.
 *
 * ⛔ **Zero database access** — everything through `GET /api/world/story/library`
 * (`lib/api/client.ts`). A card opens `/world/story?id=<id>` (`T-510`ⓒ).
 *
 * Two logged calls under `RULES § 0.22` (reversible, one commit):
 * ⓐ the chips are a radio group — exactly one level is on; the chosen chip carries
 *   `aria-checked` AND a heavier border and weight, ⛔ never the fill alone (layer A);
 * ⓑ the status tags keep the frame's text + sign (`✓` · `★` · none); the frame's tinted
 *   fills become a token-coloured BORDER (`success` · `brand`), because a `var(--…)` colour
 *   takes ⛔ no Tailwind opacity modifier (measured: `bg-success/15` painted nothing) and
 *   ⛔ `--brand` is ⛔ not a text colour here (4.42:1, `palette.test.ts`).
 */

export const STORY_LIBRARY_HREF = '/world/story/library';
const STORY_HREF = '/world/story';

const KICKER_HE = 'העולם · סיפורים';
const TITLE_HE = 'ספריית הסיפורים';
const BACK_LABEL_HE = 'חזרה לסיפור של היום';
const TAP_HINT_HE = 'הקש על סיפור כדי לקרוא';
const FOOTER_HE = 'סיפור שכבר נקרא נשאר כאן — אפשר לקרוא אותו שוב.';
const EMPTY_LEVEL_HE = 'אין עדיין סיפורים ברמה הזו';
const LOADING_HE = 'טוען את הסיפורים…';
const LEVELS_LABEL_HE = 'רמת הסיפורים';

const STATUS_HE: Readonly<Record<StoryLibraryStatus, string>> = {
  read: '✓ נקרא',
  today: '★ הסיפור של היום',
  new: 'חדש',
};

const STATUS_CLASS: Readonly<Record<StoryLibraryStatus, string>> = {
  read: 'border border-success text-ink',
  today: 'border border-brand text-ink',
  new: 'border border-transparent bg-border-subtle text-ink-muted',
};

export function summaryHe(items: readonly StoryLibraryItem[]): string {
  const read = items.filter((i) => i.status === 'read').length;
  return `${items.length} סיפורים · ${read} ${read === 1 ? 'נקרא' : 'נקראו'} · ${TAP_HINT_HE}`;
}

function paragraphsHe(n: number): string {
  return n === 1 ? 'פסקה אחת' : `${n} פסקאות`;
}

type LibraryBody =
  | {
      readonly ok: true;
      readonly level: CefrBand | null;
      readonly levels: readonly StoryLibraryLevel[];
    }
  | { readonly ok: false; readonly code: string };

export type StoryLibraryState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'session_expired' }
  | { readonly kind: 'error' }
  | {
      readonly kind: 'ready';
      readonly level: CefrBand | null;
      readonly levels: readonly StoryLibraryLevel[];
    };

export default function StoryLibrary(): React.JSX.Element {
  const [state, setState] = useState<StoryLibraryState>({ kind: 'loading' });

  const load = useCallback(async () => {
    setState({ kind: 'loading' });
    try {
      const body = await apiGet<LibraryBody>('/api/world/story/library');
      if (!body.ok) {
        setState(body.code === 'session_expired' ? { kind: 'session_expired' } : { kind: 'error' });
        return;
      }
      setState({ kind: 'ready', level: body.level, levels: body.levels });
    } catch {
      setState({ kind: 'error' });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return <StoryLibraryView state={state} onRetry={() => void load()} />;
}

export function StoryLibraryView({
  state,
  onRetry,
}: {
  readonly state: StoryLibraryState;
  readonly onRetry?: () => void;
}): React.JSX.Element {
  return (
    <section dir="rtl" data-story-library className="flex min-h-[100dvh] flex-col gap-4 pb-6 pt-2">
      <header className="flex items-center justify-start gap-2">
        <Link
          href={STORY_HREF}
          aria-label={BACK_LABEL_HE}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl font-medium text-ink active:opacity-70"
        >
          <span aria-hidden>›</span>
        </Link>
        <div className="flex flex-col gap-0.5 text-right">
          <p className="text-[13px] text-ink-muted">{KICKER_HE}</p>
          <h1 className="text-2xl font-bold text-ink">{TITLE_HE}</h1>
        </div>
      </header>

      {state.kind === 'ready' ? (
        <LibraryReady level={state.level} levels={state.levels} />
      ) : state.kind === 'loading' ? (
        <LibrarySkeleton />
      ) : (
        <div className="rounded-2xl border border-border-subtle bg-surface-raised p-4">
          <p className="text-sm text-ink">
            {state.kind === 'session_expired' ? SESSION_EXPIRED_HE : FAILURE_HE.load}
          </p>
          {state.kind === 'session_expired' ? (
            <Link
              href={failureExit('session_expired').href}
              className="mt-4 inline-flex min-h-touch min-w-touch items-center rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
            >
              {failureExit('session_expired').labelHe}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 min-h-touch min-w-touch rounded-xl bg-brand-surface px-5 text-sm font-bold text-brand-on active:opacity-90"
            >
              {RETRY_HE}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function LibraryReady({
  level,
  levels,
}: {
  readonly level: CefrBand | null;
  readonly levels: readonly StoryLibraryLevel[];
}): React.JSX.Element {
  const first = STORY_LIBRARY_LEVELS.find((l) => l === level) ?? STORY_LIBRARY_LEVELS[0] ?? 'A1';
  const [chosen, setChosen] = useState<CefrBand>(first);
  const items = levels.find((l) => l.level === chosen)?.items ?? [];

  return (
    <>
      <p data-story-library-summary className="text-[13px] text-ink-muted">
        {summaryHe(items)}
      </p>

      <div role="radiogroup" aria-label={LEVELS_LABEL_HE} className="flex gap-2">
        {STORY_LIBRARY_LEVELS.map((l) => {
          const on = l === chosen;
          return (
            <button
              key={l}
              type="button"
              role="radio"
              aria-checked={on}
              data-story-library-level={l}
              onClick={() => setChosen(l)}
              className={[
                'inline-flex h-11 w-16 items-center justify-center rounded-full text-[15px]',
                on
                  ? 'border-2 border-brand bg-brand-surface font-bold text-brand-on'
                  : 'border border-border-strong bg-surface-raised font-medium text-ink',
              ].join(' ')}
            >
              <EnWord>{l}</EnWord>
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <p data-story-library-empty className="rounded-2xl border border-border-subtle bg-surface-raised px-4 py-6 text-center text-sm text-ink-muted">
          {EMPTY_LEVEL_HE}
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`${STORY_HREF}?id=${encodeURIComponent(item.id)}`}
                data-story-library-card={item.status}
                className="flex min-h-touch flex-col gap-1.5 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3.5 active:opacity-90"
              >
                <span className="flex items-center justify-between gap-3">
                  <EnWord className="min-w-0 text-[17px] font-medium text-ink">{item.titleEn}</EnWord>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[item.status]}`}
                  >
                    {STATUS_HE[item.status]}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">
                  <EnWord>{chosen}</EnWord>
                  {` · ${item.words} מילים · ${paragraphsHe(item.paragraphs)}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-ink-muted">{FOOTER_HE}</p>
    </>
  );
}

/** Three cards in the shape that lands — ⛔ no motion, so `prefers-reduced-motion` holds by construction. */
function LibrarySkeleton(): React.JSX.Element {
  return (
    <div aria-busy="true" aria-live="polite" data-story-library-skeleton className="flex flex-col gap-4">
      <span className="sr-only">{LOADING_HE}</span>
      <span aria-hidden className="h-4 w-3/5 rounded-md bg-border-subtle" />
      <div aria-hidden className="flex gap-2">
        {STORY_LIBRARY_LEVELS.map((l) => (
          <span key={l} className="h-11 w-16 rounded-full bg-border-subtle" />
        ))}
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          aria-hidden
          data-skeleton="story-card"
          className="flex flex-col gap-2.5 rounded-2xl border border-border-subtle bg-surface-raised px-4 py-3.5"
        >
          <span className="flex items-center justify-between gap-3">
            <span className="h-5 w-3/5 rounded-md bg-border-subtle" />
            <span className="h-5 w-16 rounded-lg bg-border-subtle" />
          </span>
          <span className="h-3 w-2/5 rounded-md bg-border-subtle" />
        </div>
      ))}
    </div>
  );
}
