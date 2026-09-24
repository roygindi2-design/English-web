'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import EnWord from '@/components/EnWord';
import { apiGet } from '@/lib/api/client';
import { colourOf, countHe, keyboardView, labelOf, type KeyboardView } from '@/lib/core/blockKeyboard';
import type { Block, ContinuationLevel, NextBlocks } from '@/lib/core/continuations';
import { RETRY_HE } from '@/lib/core/failure';
import './block-keyboard-tokens.css';

/**
 * מקלדת הבלוקים — T-461 · `39 § 3` · D-283.
 * 🎯 Renders: `kol-C-14-mail-open.png` · `kol-C-15-keyboard-start.png` ·
 * `kol-C-16-keyboard-next.png` · `kol-C-17-keyboard-branches.png`, drawn by `keyboard()`
 * and `compose_bar()` (`docs/design/msgs_ui.py:122-180`). Taken from there, grepped:
 *   · compose bar h=56 r=16, send key 52×44 r=12 on the physical right, chosen pills
 *     LTR from the left with a caret, placeholder `הרכב משפט מהבלוקים` (`:163-180`)
 *   · sheet: grip 40×4, `N המשכים אפשריים` on the left, `מה יכול לבוא עכשיו` + the
 *     category chip on the right, blocks flowing from the right, gap 8 (`:122-144`)
 *   · the back key 42×40 r=11 (`:145-149`) · footer `כל בחירה מחליפה את הסט הבא` (`:150`)
 * ⚠️ **Declared deviations:** block h=40 ⇒ **44** and back key 42×40 ⇒ **44×44** (the
 * 44px gate outranks the render); radius 11 ⇒ `rounded-xl` (12) and 16 ⇒ `rounded-2xl`
 * (five-value scale, D-102); background from the product, ⛔ not the dark render.
 * ⚠️ **Categories come from CEFR-J (D-283), ⛔ not from the render's labels** — the
 * render tags `the`/`a` as «חיבור»; CEFR-J says determiner, so they are neutral blocks.
 * ⚠️ **Every continuation is shown** — the sheet scrolls — because the counter must equal
 * the displayed set (T-461 walk). T-464: the set arrives most-taken first (the tree's own
 * order, counted over Tatoeba) and is shown ⛔ exactly as it comes — ⛔ never re-sorted here.
 */
export const COMPOSE_PLACEHOLDER_HE = 'הרכב משפט מהבלוקים';
export const NOW_HE = 'מה יכול לבוא עכשיו';
export const FOOTER_HE = 'כל בחירה מחליפה את הסט הבא';
const SEND_HE = 'שליחה';
const BACK_HE = 'מחיקת הבלוק האחרון';
const LOADING_HE = 'טוען המשכים…';

export type KeyboardStatus = 'loading' | 'ready' | 'error';

function PosBlock({ block, onPick }: { readonly block: Block; readonly onPick: () => void }) {
  const colour = colourOf(block.pos);
  return (
    <button
      type="button"
      onClick={onPick}
      data-pos={colour ?? 'none'}
      className="relative flex min-h-touch min-w-touch flex-col items-center justify-center rounded-xl border border-border-strong bg-surface px-3 py-1 text-ink"
    >
      {colour !== null ? (
        <span aria-hidden="true" data-pos-bar className="absolute right-1.5 top-1.5 h-2 w-1 rounded-full" />
      ) : null}
      <span className="text-sm font-semibold leading-5">
        <EnWord>{block.word}</EnWord>
      </span>
      <span data-pos-legend className="text-xs leading-4 text-ink-muted">
        {labelOf(block.pos)}
      </span>
    </button>
  );
}

export function ComposeBar({
  chosen,
  canSend,
  onSend,
}: {
  readonly chosen: readonly Block[];
  readonly canSend: boolean;
  readonly onSend?: () => void;
}) {
  return (
    <div
      data-compose-bar
      className="flex min-h-[56px] items-center gap-2 rounded-2xl border border-border-subtle bg-surface-raised p-1.5"
    >
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend || onSend === undefined}
        aria-label={SEND_HE}
        className="flex min-h-touch w-[52px] shrink-0 items-center justify-center rounded-xl bg-brand-surface text-brand-on disabled:opacity-40"
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
          <path d="M7 5v14l11-7z" />
        </svg>
      </button>
      {chosen.length === 0 ? (
        <span className="flex-1 text-sm text-ink-muted">{COMPOSE_PLACEHOLDER_HE}</span>
      ) : (
        <p dir="ltr" data-block-keyboard className="flex flex-1 flex-wrap items-center gap-1">
          {chosen.map((b, i) => (
            <span
              key={`${i}-${b.word}`}
              data-pos={colourOf(b.pos) ?? 'none'}
              className="flex flex-col items-center rounded-lg border border-border-strong px-2 py-0.5"
            >
              <span className="text-sm font-semibold leading-5">
                <EnWord>{b.word}</EnWord>
              </span>
              {/* T-201 · D-112: a chosen block is tinted by its category ⇒ it prints the
                  category too. `msgs_ui.py:163` draws the chip without it; the accessibility
                  gate (colour never the only channel) overrides the render here. */}
              <span data-pos-legend className="text-xs leading-4 text-ink-muted">
                {labelOf(b.pos)}
              </span>
            </span>
          ))}
          <span aria-hidden="true" className="h-6 w-0.5 rounded-full bg-brand-surface" />
        </p>
      )}
    </div>
  );
}

export function BlockKeyboardView({
  chosen,
  view,
  status,
  onPick = () => {},
  onBack = () => {},
  onRetry = () => {},
  onSend,
}: {
  readonly chosen: readonly Block[];
  readonly view: KeyboardView | null;
  readonly status: KeyboardStatus;
  readonly onPick?: (block: Block) => void;
  readonly onBack?: () => void;
  readonly onRetry?: () => void;
  readonly onSend?: () => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <ComposeBar chosen={chosen} canSend={view?.canSend ?? false} onSend={onSend} />
      <div data-block-keyboard className="rounded-2xl border border-border-subtle bg-surface-raised px-3 pb-3 pt-2">
        {/* Row 1 (`msgs_ui.py:126-128`): the grip centred, the counter on the physical left. */}
        <div className="relative flex min-h-[20px] items-center">
          <span aria-hidden="true" className="mx-auto block h-1 w-10 rounded-full bg-border-strong" />
          <p dir="ltr" className="absolute left-0 text-xs text-ink-muted" aria-live="polite">
            <span dir="rtl">{view ? countHe(view.count) : ''}</span>
          </p>
        </div>
        {/* Row 2 (`:129-135`): label + category chip on the right. ⚠️ Declared: the back
            key sits at this row's left end, ⛔ not after the last block row — the set
            scrolls, and a key below a scrolled list would leave the viewport. */}
        <div className="mt-1 flex items-center gap-2">
          <p className="whitespace-nowrap text-xs font-semibold text-ink-muted">{NOW_HE}</p>
          {view?.hintHe ? (
            <span className="whitespace-nowrap rounded-full border border-border-strong px-2 text-xs font-bold text-ink">
              {view.hintHe}
            </span>
          ) : null}
          <button
            type="button"
            onClick={onBack}
            disabled={chosen.length === 0}
            aria-label={BACK_HE}
            className="ms-auto flex min-h-touch min-w-touch items-center justify-center rounded-xl border border-border-strong bg-surface text-ink disabled:opacity-40"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              <path d="M16 6v12L7 12z" />
            </svg>
          </button>
        </div>
        {status === 'loading' ? <p className="mt-3 text-xs text-ink-muted">{LOADING_HE}</p> : null}
        {status === 'error' ? (
          <button
            type="button"
            onClick={onRetry}
            className="mt-3 min-h-touch rounded-xl bg-brand-surface px-4 font-semibold text-brand-on"
          >
            {RETRY_HE}
          </button>
        ) : null}
        {status === 'ready' && view ? (
          <div className="mt-3 flex max-h-[40dvh] flex-wrap gap-2 overflow-y-auto">
            {view.blocks.map((b) => (
              <PosBlock key={b.word} block={b} onPick={() => onPick(b)} />
            ))}
          </div>
        ) : null}
        <p className="mt-3 text-center text-xs text-ink-muted">{FOOTER_HE}</p>
      </div>
    </div>
  );
}

type ContinuationsBody = ({ ok: true } & NextBlocks) | { ok: false; code: string };

interface Step {
  readonly chosen: readonly Block[];
  readonly view: KeyboardView;
}

/**
 * The live keyboard. Each pick asks `GET /api/world/messages/continuations` for the next
 * set; the back key pops a stack, so the previous set returns ⛔ without a request.
 */
export default function BlockKeyboard({
  level,
  onChosen,
  onSend,
}: {
  readonly level: ContinuationLevel;
  readonly onChosen?: (words: readonly string[]) => void;
  readonly onSend?: (words: readonly string[]) => void;
}): React.JSX.Element {
  const [stack, setStack] = useState<readonly Step[]>([]);
  const [pending, setPending] = useState<readonly Block[]>([]);
  const [status, setStatus] = useState<KeyboardStatus>('loading');
  const request = useRef(0);

  const load = useCallback(
    async (chosen: readonly Block[]) => {
      const ticket = ++request.current;
      setPending(chosen);
      setStatus('loading');
      try {
        const prefix = encodeURIComponent(chosen.map((b) => b.word).join(' '));
        const body = await apiGet<ContinuationsBody>(`/api/world/messages/continuations?level=${level}&prefix=${prefix}`);
        if (ticket !== request.current) return;
        if (!body.ok) {
          setStatus('error');
          return;
        }
        setStack((s) => [...s, { chosen, view: keyboardView(body, chosen.length) }]);
        setStatus('ready');
      } catch {
        if (ticket === request.current) setStatus('error');
      }
    },
    [level],
  );

  useEffect(() => {
    void load([]);
  }, [load]);

  const top = stack[stack.length - 1];
  const chosen = status === 'ready' && top ? top.chosen : pending;

  useEffect(() => {
    onChosen?.(chosen.map((b) => b.word));
  }, [chosen, onChosen]);

  return (
    <BlockKeyboardView
      chosen={chosen}
      view={status === 'ready' ? (top?.view ?? null) : null}
      status={status}
      onPick={(b) => void load([...(top?.chosen ?? []), b])}
      onBack={() => {
        request.current += 1;
        if (status !== 'ready') {
          setStatus(top ? 'ready' : 'loading');
          return;
        }
        if (stack.length > 1) setStack((s) => s.slice(0, -1));
      }}
      onRetry={() => void load(pending)}
      onSend={onSend ? () => onSend(chosen.map((b) => b.word)) : undefined}
    />
  );
}
