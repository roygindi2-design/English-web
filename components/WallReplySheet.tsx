'use client';

import type { ReactNode } from 'react';
import BlockKeyboard from '@/components/BlockKeyboard';
import EnWord from '@/components/EnWord';
import { RETRY_HE } from '@/lib/core/failure';

/**
 * The reply sheet of the class wall (T-474 · `39 § 3` · `39 § 5` · D-288).
 * 🎯 Render: docs/design/kol-C-12-wall-reply.png — the block keyboard rises as a sheet and
 * the POST STAYS VISIBLE above it: the sheet is capped at 62dvh and repeats the question
 * in its own head, so the learner never answers a question they cannot see.
 *
 * ⛔ No second keyboard: this is `components/BlockKeyboard.tsx`, as is.
 * 🔴 The draft survives a failed send: the parent HIDES the sheet while a send is in
 * flight and ⛔ never unmounts it, so on a failure the same keyboard — with the same six
 * picks — comes back with `NOT_SENT_HE`.
 * The whole tree (A1–B2) is offered: a class carries ⛔ no level, and the server fences on
 * the same tree (`lib/server/keyboardSentence.ts`).
 */
export const REPLY_TITLE_HE = 'תגובה מהבלוקים';
export const QUESTION_TITLE_HE = 'שאלה חדשה';
export const NOT_SENT_HE = `לא נשלח — ${RETRY_HE}`;
export const CLOSE_HE = 'סגירה';

export function WallReplySheet({
  open,
  hidden = false,
  kind,
  questionEn,
  failed = false,
  onSend,
  onClose,
  keyboard,
}: {
  readonly open: boolean;
  /** Sending: kept mounted (the draft lives in the keyboard) but ⛔ not shown. */
  readonly hidden?: boolean;
  readonly kind: 'reply' | 'question';
  readonly questionEn?: string;
  readonly failed?: boolean;
  readonly onSend: (words: readonly string[]) => void;
  readonly onClose: () => void;
  /** Tests and the dev fixture inject a keyboard; the live screen uses `<BlockKeyboard>`. */
  readonly keyboard?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      data-wall-sheet
      role="dialog"
      aria-modal="false"
      aria-label={kind === 'reply' ? REPLY_TITLE_HE : QUESTION_TITLE_HE}
      hidden={hidden}
      className="fixed inset-x-0 bottom-0 z-30 rounded-t-2xl border-t border-surface-raised bg-surface px-4 pb-4 pt-2 shadow-lg"
    >
      {/*
        ⚠️ `fixed` lifts the sheet OUT of `<main>` and its single gutter (D-206), so the
        outer box carries the padding and this inner one the column width — ⛔ never both.
      */}
      <div className="mx-auto flex max-h-[62dvh] w-full max-w-md flex-col">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-ink">{kind === 'reply' ? REPLY_TITLE_HE : QUESTION_TITLE_HE}</span>
        <button type="button" onClick={onClose} className="inline-flex min-h-touch items-center px-2 text-sm font-semibold text-ink-muted">
          {CLOSE_HE}
        </button>
      </div>
      {questionEn ? <p className="truncate text-sm text-ink-muted"><EnWord>{questionEn}</EnWord></p> : null}
      {failed ? <p role="alert" className="mt-1 text-sm font-semibold text-danger">{NOT_SENT_HE}</p> : null}
      <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
        {keyboard ?? <BlockKeyboard level="B2" onSend={(w) => onSend(w)} />}
      </div>
      </div>
    </div>
  );
}

export default WallReplySheet;
