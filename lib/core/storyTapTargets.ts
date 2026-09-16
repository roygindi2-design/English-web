/**
 * PURE — T-187 · `36 § 3`. ⛔ Zero React, DOM, network, clock, env.
 *
 * Turns a story body plus a gloss map into the segment list the paragraph renders,
 * marking which segments are tap targets and which the learner already marked «ידעתי».
 *
 * ⛔ **Segmentation is by character offset, ⛔ never by `split(' ')`.** The invariant
 * `segments.map(s => s.text).join('') === bodyEn` is the same one `components/EnWord.tsx`
 * states in its own doc comment, and a producer that trims renders words glued together
 * on the learner's screen. Every segment carries its OWN surrounding whitespace.
 *
 * ⚠️ **`FUNCTION_WORD_FLOOR` and `normalizeWord` are MIRRORED from
 * `scripts/story-tap-audit.mjs`, ⛔ not imported** — that file is `.mjs` for the Playwright
 * harness and importing it here would drag the harness into `/lib/core`. The mirror is
 * safe in one direction only, and that is the direction it is used in: the audit is the
 * judge, this file is the producer, and a producer that is STRICTER than the judge can
 * never produce a target the judge rejects. `storyTapTargets.test.ts` asserts the two
 * lists agree.
 */
import { storyLemma } from './storyGate';

export interface StoryGloss {
  readonly translationHe: string;
  readonly posHe: string;
}

export interface StorySegment {
  /** The segment's text, **including its own surrounding whitespace**. */
  readonly text: string;
  readonly lemma: string | null;
  readonly isTarget: boolean;
  readonly isKnown: boolean;
}

/**
 * `36 § 3.1`, the negative half: «`of · the · a · to` never». Mirrored verbatim from
 * `FUNCTION_WORD_FLOOR` in `scripts/story-tap-audit.mjs`. ⛔ A FLOOR, ⛔ not a definition
 * of «content word»: it can only make this producer stricter, so it can ⛔ never create a
 * target the audit would then reject.
 */
export const FUNCTION_WORD_FLOOR: ReadonlySet<string> = new Set([
  'a', 'an', 'the',
  'of', 'to', 'in', 'on', 'at', 'by', 'for', 'with', 'from', 'into', 'onto',
  'over', 'under', 'about', 'after', 'before', 'between', 'through', 'during',
  'against', 'above', 'below', 'up', 'down', 'out', 'off', 'across',
  'and', 'or', 'but', 'nor', 'so', 'yet', 'if', 'than', 'because', 'while',
  'that', 'though', 'although', 'unless', 'until', 'as',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
  'my', 'your', 'his', 'its', 'our', 'their', 'this', 'these', 'those',
  'who', 'whom', 'whose', 'which', 'what', 'some', 'any', 'each', 'every',
  'am', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'have', 'has', 'had',
  'will', 'would', 'can', 'could', 'shall', 'should', 'may', 'might', 'must',
  'not', 'no', 'there', 'here', 'then', 'too', 'very', 'just',
]);

/** Mirrored from `normalizeWord` in `scripts/story-tap-audit.mjs`. */
export function normalizeWord(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFC')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/[^\p{L}\p{N}]+$/u, '');
}

/** Runs of whitespace and runs of non-whitespace, in order, with nothing dropped. */
const RUN = /(\s+|\S+)/g;

/**
 * ⛔ **The punctuation is its OWN segment, and that is a measured decision, ⛔ not tidiness.**
 * `36 § 3.3` asks for a hit area «centred on the word»; a target whose text is `river.`
 * centres the hit area on the word PLUS the full stop, i.e. off-centre by half a period —
 * and `auditStoryBody` measures that centring. Splitting also keeps the rendered glyphs
 * identical, because the three pieces are concatenated back with nothing between them.
 */
const SPLIT_TOKEN = /^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u;

export function buildStorySegments(
  bodyEn: string,
  glosses: ReadonlyMap<string, StoryGloss>,
  knownLemmas: ReadonlySet<string>,
): readonly StorySegment[] {
  const allowed = new Set(glosses.keys());
  const out: StorySegment[] = [];
  for (const run of bodyEn.match(RUN) ?? []) {
    if (/^\s+$/.test(run)) {
      out.push({ text: run, lemma: null, isTarget: false, isKnown: false });
      continue;
    }
    const parts = SPLIT_TOKEN.exec(run);
    const lead = parts?.[1] ?? '';
    const core = parts?.[2] ?? run;
    const trail = parts?.[3] ?? '';
    const bare = normalizeWord(core);
    // ⛔ Condition 1 is BOTH halves: the word must not be a function word, AND it must
    // have a translation. A word we cannot translate is simply ⛔ not a target — there is
    // ⛔ no «no translation» state on the screen, and ⛔ no fabricated gloss.
    const lemma = bare === '' || FUNCTION_WORD_FLOOR.has(bare) ? null : storyLemma(core, allowed);
    const isTarget = lemma !== null && glosses.has(lemma);
    if (lead !== '') out.push({ text: lead, lemma: null, isTarget: false, isKnown: false });
    if (core !== '') {
      out.push({
        text: core,
        lemma: isTarget ? lemma : null,
        isTarget,
        isKnown: isTarget && lemma !== null && knownLemmas.has(lemma),
      });
    }
    if (trail !== '') out.push({ text: trail, lemma: null, isTarget: false, isKnown: false });
  }
  return out;
}

/**
 * `36 § 3.4` — **the ambiguity test as PURE geometry, ⛔ not as a DOM sweep.**
 *
 * 🔬 **T-232ⓑ, measured in `C-0371` and re-measured here:** the tap handler used to run
 * `querySelectorAll('[data-story-word]')` and then `getBoundingClientRect()` on **every
 * word in the paragraph**, ⛔ inside the interaction — one forced layout plus N rect reads
 * per tap, on every tap, ⛔ not only on an ambiguous one. `apple-design § 1` names exactly
 * that: «be vigilant about every latency … anything on the input path that isn't essential
 * is a regression».
 *
 * ⇒ the boxes are read **once per layout** by the caller and handed here in
 * **container-local** coordinates, so a scroll ⛔ cannot invalidate them; the tap converts
 * one viewport point into the same space and this function does the rest with ⛔ no DOM
 * access at all.
 *
 * ⛔ **The RULE itself ⛔ does not move:** a point inside **two** boxes returns **both**,
 * in DOM order, and the caller shows the chip with both. ⛔ It ⛔ never guesses.
 */
export interface StoryWordBox {
  readonly left: number;
  readonly right: number;
  readonly top: number;
  readonly bottom: number;
}

/**
 * Every box containing `(x, y)`, in the order given. Bounds are **inclusive** on all four
 * sides — that is what makes two boxes sharing an edge read as ambiguous rather than as a
 * silent pick, and it is the same comparison the DOM sweep used.
 */
export function hitStoryWordBoxes<T extends StoryWordBox>(
  boxes: readonly T[],
  x: number,
  y: number,
): readonly T[] {
  return boxes.filter((b) => x >= b.left && x <= b.right && y >= b.top && y <= b.bottom);
}
