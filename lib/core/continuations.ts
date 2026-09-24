/**
 * T-460 · D-283 — the continuation engine of the block keyboard (`39 § 3`).
 *
 * The keyboard offers ONLY a word that, appended to the learner's prefix, is still
 * the prefix of a sentence someone actually wrote (Tatoeba, S12), at the simulation's
 * level or below. ⛔ There is no backoff: D-283 measured that a two-word backoff
 * generates English nobody wrote in 87.5% of random walks — R-014/R-010 by another
 * name. ⇒ the tree is OBSERVED, ⛔ never composed.
 *
 * Pure: the caller reads the corpus and the profile, and passes the index in. The
 * generated index (`data/generated/continuations.json`) is built by
 * `scripts/build-continuations.mjs` and is loaded only by the messages screen.
 *
 * Node shape, chosen for gzip size (the file ships to a phone):
 *   Node = [endLevel, w1, l1, n1, w2, l2, n2, …]
 *     endLevel  lowest level of a sentence that ENDS here, or -1
 *     wN        index into `words`
 *     lN        lowest level of any sentence through that child
 *     nN        the child Node — or, one level past `maxDepth`, a bare number when
 *               that child had continuations the cut dropped: its endLevel, alone.
 *               ⇒ a cut is RECORDED (`truncated`), ⛔ never read as a sentence end.
 */
import { BAND_ORDER, type CefrBand, type LevelEntry } from './cefrLevels';
import type { Pos } from './contentSchema';
import { storyLemma } from './storyGate';

/** D-283: ≤12 words. ⛔ Not a tuning knob — the measured corpus is defined by it. */
export const MAX_SENTENCE_WORDS = 12;

export const CONTINUATION_LEVELS = ['A1', 'A2', 'B1', 'B2'] as const;
export type ContinuationLevel = (typeof CONTINUATION_LEVELS)[number];

export interface Block {
  readonly word: string;
  /** From the profile's `pos` column. A word with more than one pos is null — ⛔ never guessed. */
  readonly pos: Pos | null;
}

/** The «send» block. It appears exactly where an observed sentence ended. */
export const END_BLOCK: Block = Object.freeze({ word: '<END>', pos: null });

export interface NextBlocks {
  readonly blocks: readonly Block[];
  readonly count: number;
  /** Present only when the prefix ran past the depth the index was cut at. */
  readonly truncated?: true;
}

export type Node = readonly (number | Node)[];

export interface ContinuationIndex {
  readonly version: 1;
  readonly source: string;
  readonly levels: readonly ContinuationLevel[];
  readonly maxDepth: number;
  readonly sentences: number;
  readonly words: readonly string[];
  readonly pos: readonly (Pos | null)[];
  readonly root: Node;
}

export interface LexiconEntry {
  readonly band: CefrBand;
  readonly pos: Pos | null;
}

/**
 * lemma ⇒ lowest band + pos. Two different pos values (or one unknown) ⇒ pos null,
 * the same refusal to guess `cefrLevels.ts` makes.
 */
export function wordLexicon(entries: readonly LevelEntry[]): Map<string, LexiconEntry> {
  const out = new Map<string, { band: CefrBand; pos: Pos | null; mixed: boolean }>();
  for (const e of entries) {
    const prev = out.get(e.lemma);
    if (!prev) {
      out.set(e.lemma, { band: e.band, pos: e.pos, mixed: e.pos === null });
      continue;
    }
    if (BAND_ORDER.indexOf(e.band) < BAND_ORDER.indexOf(prev.band)) prev.band = e.band;
    if (e.pos === null || e.pos !== prev.pos) prev.mixed = true;
  }
  const lexicon = new Map<string, LexiconEntry>();
  for (const [lemma, v] of out) lexicon.set(lemma, { band: v.band, pos: v.mixed ? null : v.pos });
  return lexicon;
}

const lemmaSets = new WeakMap<ReadonlyMap<string, LexiconEntry>, ReadonlySet<string>>();
function lemmaSetOf(lexicon: ReadonlyMap<string, LexiconEntry>): ReadonlySet<string> {
  let set = lemmaSets.get(lexicon);
  if (!set) {
    set = new Set(lexicon.keys());
    lemmaSets.set(lexicon, set);
  }
  return set;
}

/** Plain prose only: letters, spaces, apostrophes, commas, one closing mark. */
const PLAIN = /^[a-z' ,]+[.!?]?$/;

/**
 * The lower-cased word tokens of a sentence and its level (its HIGHEST word), or
 * null when any word is outside the profile — via `storyLemma`, the same lemmatiser
 * the content gates enforce, imported and ⛔ not copied.
 */
export function sentenceTokens(
  text: string,
  lexicon: ReadonlyMap<string, LexiconEntry>,
): { tokens: string[]; level: ContinuationLevel } | null {
  const s = text.replace(/[’‘]/g, "'").trim().toLowerCase();
  if (!PLAIN.test(s)) return null;
  const tokens = s.match(/[a-z']+/g) ?? [];
  if (tokens.length === 0 || tokens.length > MAX_SENTENCE_WORDS) return null;
  const lemmas = lemmaSetOf(lexicon);
  let level = 0;
  for (const token of tokens) {
    const lemma = storyLemma(token, lemmas);
    if (lemma === null) return null;
    const band = lexicon.get(lemma)!.band;
    const at = (CONTINUATION_LEVELS as readonly string[]).indexOf(band);
    if (at === -1) return null;
    if (at > level) level = at;
  }
  return { tokens, level: CONTINUATION_LEVELS[level] ?? 'B2' };
}

interface MutableNode {
  end: number;
  /** A sentence ran on past this node and the cut dropped the rest. */
  cut: boolean;
  children: Map<number, { level: number; node: MutableNode }>;
}

function freeze(node: MutableNode): Node | number {
  if (node.cut) return node.end;
  const out: (number | Node)[] = [node.end];
  const kids = [...node.children].sort(([a], [b]) => a - b);
  for (const [word, child] of kids) out.push(word, child.level, freeze(child.node));
  return out;
}

export function buildContinuationIndex(
  sentences: Iterable<string>,
  lexicon: ReadonlyMap<string, LexiconEntry>,
  opts: { readonly maxDepth: number; readonly source: string },
): ContinuationIndex {
  const words: string[] = [];
  const pos: (Pos | null)[] = [];
  const wordId = new Map<string, number>();
  const lemmas = lemmaSetOf(lexicon);
  const root: MutableNode = { end: -1, cut: false, children: new Map() };
  let kept = 0;

  for (const text of sentences) {
    const hit = sentenceTokens(text, lexicon);
    if (hit === null) continue;
    kept += 1;
    const level = CONTINUATION_LEVELS.indexOf(hit.level);
    let node = root;
    // The first maxDepth + 1 words are stored: every prefix up to maxDepth words
    // then knows all of its observed continuations, and whether they end there.
    const stored = Math.min(hit.tokens.length, opts.maxDepth + 1);
    for (const token of hit.tokens.slice(0, stored)) {
      let id = wordId.get(token);
      if (id === undefined) {
        id = words.length;
        wordId.set(token, id);
        words.push(token);
        pos.push(lexicon.get(storyLemma(token, lemmas)!)!.pos);
      }
      let child = node.children.get(id);
      if (!child) {
        child = { level, node: { end: -1, cut: false, children: new Map() } };
        node.children.set(id, child);
      } else if (level < child.level) child.level = level;
      node = child.node;
    }
    if (hit.tokens.length > stored) node.cut = true;
    else if (node.end === -1 || level < node.end) node.end = level;
  }

  return {
    version: 1,
    source: opts.source,
    levels: CONTINUATION_LEVELS,
    maxDepth: opts.maxDepth,
    sentences: kept,
    words,
    pos,
    root: freeze(root) as Node,
  };
}

/** «i» is a key; the block a learner reads is «I». ⛔ Nothing else is re-cased. */
function display(word: string): string {
  return word === 'i' || word.startsWith("i'") ? `I${word.slice(1)}` : word;
}

/**
 * The blocks that may follow `prefix` at `level` or below, sorted by word, with
 * `END_BLOCK` last when a sentence ended there. An unseen prefix is `count: 0` —
 * ⛔ never a throw and ⛔ never a guess.
 */
export function nextBlocks(
  index: ContinuationIndex,
  prefix: readonly string[],
  level: ContinuationLevel,
): NextBlocks {
  const max = CONTINUATION_LEVELS.indexOf(level);
  let node: Node | number = index.root;
  for (const raw of prefix) {
    if (typeof node === 'number') return { blocks: [], count: 0, truncated: true };
    const key = raw.toLowerCase();
    let next: Node | number | undefined;
    for (let i = 1; i < node.length; i += 3) {
      if (index.words[node[i] as number] === key) {
        if ((node[i + 1] as number) <= max) next = node[i + 2];
        break;
      }
    }
    if (next === undefined) return { blocks: [], count: 0 };
    node = next;
  }

  if (typeof node === 'number') {
    const end = node !== -1 && node <= max ? [END_BLOCK] : [];
    return { blocks: end, count: end.length, truncated: true };
  }
  const blocks: Block[] = [];
  for (let i = 1; i < node.length; i += 3) {
    if ((node[i + 1] as number) > max) continue;
    const w = node[i] as number;
    blocks.push({ word: display(index.words[w] ?? ''), pos: index.pos[w] ?? null });
  }
  blocks.sort((a, b) => a.word.localeCompare(b.word));
  const end = node[0] as number;
  if (end !== -1 && end <= max) blocks.push(END_BLOCK);
  return { blocks, count: blocks.length };
}

/**
 * Whether `word` can be typed as one of the first `depth` blocks of some observed
 * sentence at `level` or below. T-460's check on a simulation's required words:
 * a word the tree cannot reach is a CONTENT finding (T-193), ⛔ never an engine change.
 * Exact surface match — `visit` is not satisfied by `visited`.
 */
export function reachableWithin(
  index: ContinuationIndex,
  word: string,
  depth: number,
  level: ContinuationLevel,
): boolean {
  const max = CONTINUATION_LEVELS.indexOf(level);
  const target = index.words.indexOf(word.toLowerCase());
  if (target === -1) return false;
  let frontier: Node[] = [index.root];
  for (let d = 0; d < depth && frontier.length > 0; d += 1) {
    const next: Node[] = [];
    for (const node of frontier) {
      for (let i = 1; i < node.length; i += 3) {
        if ((node[i + 1] as number) > max) continue;
        if (node[i] === target) return true;
        const child = node[i + 2];
        if (child !== undefined && typeof child !== 'number') next.push(child);
      }
    }
    frontier = next;
  }
  return false;
}
