'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import EnWord from '@/components/EnWord';
import SeatAvatar from '@/components/SeatAvatar';
import WallReplySheet from '@/components/WallReplySheet';
import { apiGet, apiPost } from '@/lib/api/client';
import { CATEGORY_CHIPS } from '@/lib/core/blockKeyboard';
import { RETRY_HE } from '@/lib/core/failure';
import type { StoryLine } from '@/lib/core/storyChain';
import { wallSentence } from '@/lib/core/wallFeed';
import { ME_HE, MEMBER_HE, OPENER_HE } from '@/components/ClassWall';
import './block-keyboard-tokens.css';

/**
 * סיפור בהמשכים — the class story chain (T-479 · `39 § 6` · D-290).
 * 🎯 Source: `docs/design/render_video_C.py:196-235` (`scene_story` — ⛔ no PNG; the code is
 * the render). Taken from there, grepped:
 *   · header `הודעות · <כיתה>` / `סיפור בהמשכים` (`:200`) — drawn by `InboxList`'s Header
 *   · the five-category legend ABOVE the chain (`:203-209`): tinted pill + a solid bar +
 *     the category name. ⛔ Not copied: `CATEGORY_CHIPS` and the keyboard's own scoped
 *     tokens (`block-keyboard-tokens.css`), so the legend ⛔ cannot drift from the blocks
 *   · each line (`:211-218`): a vertical rail on the right with an avatar on it, the
 *     author over the sentence in a card r=14 ⇒ `rounded-2xl` (16, five-value scale)
 *   · after the chain (`:219-221`): the learner's avatar + `התור שלך`
 * ⚠️ Declared gaps: ⛔ no table holds a display name (the same gap as the wall,
 * `ClassWall.tsx`) ⇒ the author line is the ROLE, and the avatar carries the author's
 * CLASS `seat` (T-520/T-521 · D-303) — a number, stable per author and the SAME on the
 * wall — where the render draws a letter; `<SeatAvatar>` is shared with the wall. The render's
 * glow on `התור שלך` is layer B and ⛔ not built on this row.
 * 🔴 The draft survives a failure AND a lost turn: the sheet is hidden while sending and
 * ⛔ never unmounted (the `WallReplySheet` pattern), so its six picks come back with it.
 */
export const STORY_HEADING_HE = 'סיפור בהמשכים';
export const YOUR_TURN_HE = 'התור שלך';
export const WAITING_HE = 'מחכים למשפט של מישהו אחר';
export const STORY_EMPTY_HE = 'הסיפור מתחיל במשפט שלך';
export const LEGEND_HE = 'חלקי הדיבר';
export const TURN_TAKEN_HE = 'מישהו הוסיף משפט לפני שלך. הטיוטה נשמרה.';
export const STORY_CLOSED_HE = 'הסיפור עוד לא פתוח בכיתה הזאת';

export type ClassStoryState =
  | { readonly kind: 'loading' }
  | { readonly kind: 'ready'; readonly lines: readonly StoryLine[]; readonly myTurn: boolean }
  | { readonly kind: 'unavailable' }
  | { readonly kind: 'error' };

function authorHe(l: StoryLine): string {
  if (l.mine) return ME_HE;
  return l.byOpener ? OPENER_HE : MEMBER_HE;
}

/** `:203-209` — the five categories, above the chain. Words and colour both: ⛔ never colour alone. */
function Legend() {
  return (
    <div data-block-keyboard data-story-legend role="list" aria-label={LEGEND_HE} className="mt-3 flex flex-wrap gap-1.5">
      {CATEGORY_CHIPS.map((c) => (
        <span key={c.colour} role="listitem" data-chip={c.colour} className="flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs text-ink-muted">
          <span aria-hidden data-chip-dot className="h-2 w-1 rounded-full" />
          {c.he}
        </span>
      ))}
    </div>
  );
}

function Line({ line }: { readonly line: StoryLine }) {
  return (
    <li data-story-line className="relative flex gap-3 pb-2">
      <span aria-hidden className="absolute bottom-0 right-4 top-0 w-0.5 bg-surface-raised" />
      <SeatAvatar seat={line.seat} mine={line.mine} className="relative z-10" />
      <div className="min-w-0 flex-1 rounded-2xl border border-surface-raised bg-surface px-4 py-2.5">
        <p className="text-xs font-semibold text-ink-muted">{authorHe(line)}</p>
        <p className="mt-1 text-base leading-6 text-ink"><EnWord>{line.bodyEn}</EnWord></p>
      </div>
    </li>
  );
}

export interface ClassStoryViewProps {
  readonly state: ClassStoryState;
  readonly onTurn?: () => void;
  readonly onRetry?: () => void;
  /** A notice over the turn row — the turn was taken while composing (409). */
  readonly notice?: string | null;
  /** The sheet, mounted by the live component (or a fixture) under the chain. */
  readonly sheet?: ReactNode;
}

export function ClassStoryView({ state, onTurn = () => {}, onRetry = () => {}, notice = null, sheet = null }: ClassStoryViewProps) {
  if (state.kind === 'loading') {
    return (
      <div data-story-skeleton aria-busy className="mt-4 space-y-3">
        <span className="sr-only">טוען</span>
        <div className="h-6 w-3/4 rounded-md bg-surface-raised" />
        <div className="h-16 rounded-2xl bg-surface-raised" />
        <div className="h-16 rounded-2xl bg-surface-raised" />
      </div>
    );
  }
  if (state.kind === 'unavailable') {
    return <p data-story-closed className="mt-4 rounded-2xl bg-surface-raised p-4 text-sm text-ink-muted">{STORY_CLOSED_HE}</p>;
  }
  if (state.kind === 'error') {
    return <button type="button" onClick={onRetry} className="mt-4 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on">{RETRY_HE}</button>;
  }
  const { lines, myTurn } = state;
  return (
    <div data-class-story className="mt-2">
      <Legend />
      {lines.length > 0 ? (
        <ol className="mt-4" aria-label={STORY_HEADING_HE}>
          {lines.map((l) => <Line key={l.id} line={l} />)}
        </ol>
      ) : (
        <p data-story-empty className="mt-4 text-sm text-ink-muted">{STORY_EMPTY_HE}</p>
      )}
      {notice ? <p role="status" className="mt-2 text-sm font-semibold text-ink">{notice}</p> : null}
      <div className="mt-2 flex items-center gap-3">
        {myTurn ? <SeatAvatar seat={null} mine /> : null}
        {myTurn ? (
          <button
            type="button"
            data-story-turn
            onClick={onTurn}
            className="inline-flex min-h-touch items-center rounded-xl bg-brand-surface px-4 text-sm font-bold text-brand-on active:scale-[0.98] motion-reduce:transform-none"
          >
            {YOUR_TURN_HE}
          </button>
        ) : (
          <p data-story-waiting className="text-sm text-ink-muted">{WAITING_HE}</p>
        )}
      </div>
      {sheet}
    </div>
  );
}

type StoryBody =
  | { ok: true; lines: readonly StoryLine[]; myTurn: boolean }
  | { ok: false; code: string };
type AddBody = { ok: true; id: string | null; createdAt: string | null; bodyEn: string; myTurn: boolean } | { ok: false; code: string };

/** Live: `GET/POST /api/world/classes/[id]/story` (T-478). */
export default function ClassStory({ classId, keyboard }: {
  readonly classId: string;
  /** Tests inject a keyboard; the live screen uses `<BlockKeyboard>` inside the sheet. */
  readonly keyboard?: (onSend: (words: readonly string[]) => void) => ReactNode;
}): React.JSX.Element {
  const [state, setState] = useState<ClassStoryState>({ kind: 'loading' });
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [sheetKey, setSheetKey] = useState(0);
  const path = `/api/world/classes/${classId}/story`;

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setState({ kind: 'loading' });
    try {
      const body = await apiGet<StoryBody>(path);
      if (!body.ok) {
        setState(body.code === 'classes_unavailable' ? { kind: 'unavailable' } : { kind: 'error' });
        return;
      }
      setState({ kind: 'ready', lines: body.lines, myTurn: body.myTurn });
    } catch {
      setState({ kind: 'error' });
    }
  }, [path]);
  useEffect(() => { void load(); }, [load]);

  const send = useCallback(async (words: readonly string[]) => {
    if (state.kind !== 'ready') return;
    const before = state;
    const temp = `pending-${Date.now()}`;
    const seat = before.lines.find((l) => l.mine)?.seat ?? new Set(before.lines.map((l) => l.seat)).size + 1;
    const mine: StoryLine = { id: temp, bodyEn: wallSentence(words, 'reply'), createdAt: new Date().toISOString(), mine: true, byOpener: false, seat };
    setSending(true);
    setFailed(false);
    setNotice(null);
    setState({ kind: 'ready', lines: [...before.lines, mine], myTurn: false });
    try {
      const body = await apiPost<AddBody>(path, { words });
      if (body.ok) {
        setOpen(false);
        setSheetKey((k) => k + 1);
        void load(true);
        return;
      }
      setState(before);
      if (body.code === 'not_your_turn') {
        setNotice(TURN_TAKEN_HE);
        void load(true);
      } else {
        setFailed(true);
      }
    } catch {
      setState(before);
      setFailed(true);
    } finally {
      setSending(false);
    }
  }, [state, path, load]);

  return (
    <ClassStoryView
      state={state}
      notice={notice}
      onRetry={() => { void load(); }}
      onTurn={() => { setOpen(true); setFailed(false); setNotice(null); }}
      sheet={
        <WallReplySheet
          key={sheetKey}
          open={open}
          hidden={sending}
          kind="story"
          questionEn={state.kind === 'ready' ? state.lines.at(-1)?.bodyEn : undefined}
          failed={failed}
          onSend={(w) => { void send(w); }}
          onClose={() => setOpen(false)}
          keyboard={keyboard?.((w) => { void send(w); })}
        />
      }
    />
  );
}
