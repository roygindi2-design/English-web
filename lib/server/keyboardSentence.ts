import { isSendable, MAX_SENTENCE_WORDS, type ContinuationLevel } from '@/lib/core/continuations';
import { continuationsTree } from '@/lib/server/continuationsTree';

const WORD = /^[a-z']+$/i;

/**
 * The words a block-keyboard send carries (`39 § 1`: ⛔ no free typing). ONE parser for
 * every route that accepts a composed sentence — `POST /api/world/messages/[id]/answer`
 * (T-462) and the class wall (T-472) — so the two ⛔ cannot drift.
 * 1–12 plain words; anything else ⇒ null.
 */
export function parseWords(body: unknown): string[] | null {
  const words = (body as { words?: unknown } | null)?.words;
  if (!Array.isArray(words) || words.length === 0 || words.length > MAX_SENTENCE_WORDS) return null;
  if (!words.every((w): w is string => typeof w === 'string' && WORD.test(w))) return null;
  return words;
}

/** The words end where an observed sentence ended, in the SAME tree the keyboard reads. */
export function fromKeyboard(words: readonly string[], level: ContinuationLevel): boolean {
  return isSendable(continuationsTree(), words, level);
}
