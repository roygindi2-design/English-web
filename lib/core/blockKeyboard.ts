/**
 * T-461 · `39 § 3` — what the block keyboard paints, computed once so the sheet stays
 * a painter. The continuations themselves come from `continuations.ts` (T-460).
 *
 * ⛔ **Colour only for the five categories `39 § 3` names.** Any other profile pos
 * (determiner, preposition, adverb, …) and a word with more than one pos is a neutral
 * block with ⛔ no bar — D-283: `pos` from CEFR-J, ⛔ never guessed, and ⛔ never folded
 * into a neighbouring colour. Every block still carries a WRITTEN legend
 * («אין קידוד מצב בצבע בלבד»).
 */
import type { Pos } from './contentSchema';
import type { Block, NextBlocks } from './continuations';

export type PosColour = 'verb' | 'noun' | 'adjective' | 'conjunction' | 'pronoun';

/** `39 § 3` order — also the tie-break of the hint chip. */
const COLOURED: readonly PosColour[] = ['verb', 'noun', 'adjective', 'conjunction', 'pronoun'];

export function colourOf(pos: Pos | null): PosColour | null {
  return pos !== null && (COLOURED as readonly string[]).includes(pos) ? (pos as PosColour) : null;
}

export const POS_LABEL_HE: Readonly<Record<Pos | 'unknown', string>> = Object.freeze({
  verb: 'פועל',
  noun: 'שם עצם',
  adjective: 'תואר',
  conjunction: 'חיבור',
  pronoun: 'כינוי',
  adverb: 'תואר הפועל',
  preposition: 'מילת יחס',
  determiner: 'מגדיר',
  interjection: 'מילת קריאה',
  /** CEFR-J lists more than one pos for the word — said, ⛔ not resolved. */
  unknown: 'כמה תפקידים',
});

export function labelOf(pos: Pos | null): string {
  return POS_LABEL_HE[pos ?? 'unknown'];
}

export const OPENING_HE = 'פתיחה';

export interface KeyboardView {
  readonly blocks: readonly Block[];
  readonly count: number;
  readonly canSend: boolean;
  readonly hintHe: string | null;
}

export function keyboardView(next: NextBlocks, prefixLength: number): KeyboardView {
  const blocks = next.blocks.filter((b) => b.word !== '<END>');
  const canSend = blocks.length !== next.blocks.length;
  let hintHe: string | null = null;
  if (prefixLength === 0) hintHe = OPENING_HE;
  else {
    let best = 0;
    for (const colour of COLOURED) {
      const n = blocks.filter((b) => b.pos === colour).length;
      if (n > best) {
        best = n;
        hintHe = POS_LABEL_HE[colour];
      }
    }
  }
  return { blocks, count: blocks.length, canSend, hintHe };
}

export function countHe(n: number): string {
  if (n === 0) return 'אין המשכים';
  if (n === 1) return 'המשך אפשרי אחד';
  return `${n} המשכים אפשריים`;
}
