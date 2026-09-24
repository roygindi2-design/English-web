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

/**
 * T-465 · `39 § 3` — the category row: «שורת קטגוריות לעיון: `פתיחה` · `פעלים` ·
 * `שמות עצם` · `תארים` · `חיבור`». Spec order and spec strings.
 * ⚠️ `פתיחה` is ⛔ not a pos; the render paints it in the pronoun colour
 * (`docs/design/msgs_ui.py:119-120`, `"פתיחה": "P"`) ⇒ it narrows to pronouns, which is
 * what the opening set is made of (T-464: `I · he · she · you · … · we · they`).
 * ⛔ No chip for determiner/preposition/adverb, and `pos: null` sits in ⛔ no chip.
 */
export const CATEGORY_CHIPS: readonly { readonly colour: PosColour; readonly he: string }[] = Object.freeze([
  { colour: 'pronoun', he: OPENING_HE },
  { colour: 'verb', he: 'פעלים' },
  { colour: 'noun', he: 'שמות עצם' },
  { colour: 'adjective', he: 'תארים' },
  { colour: 'conjunction', he: 'חיבור' },
]);

/** The set narrowed to one colour, in the order it came (T-464) — `null` is no filter. */
export function filterBlocks(blocks: readonly Block[], colour: PosColour | null): readonly Block[] {
  return colour === null ? blocks : blocks.filter((b) => b.pos === colour);
}

/** The chips worth offering for this set — ⛔ a chip that would empty the sheet is dropped. */
export function chipsFor(blocks: readonly Block[]): { colour: PosColour; he: string; count: number }[] {
  return CATEGORY_CHIPS.map((c) => ({ ...c, count: filterBlocks(blocks, c.colour).length })).filter((c) => c.count > 0);
}
