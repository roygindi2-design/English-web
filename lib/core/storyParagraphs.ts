/**
 * 📄 **T-508 · `D-297`ⓐ — the story reads as THREE paragraphs, ⛔ not one block.**
 *
 * 🔬 Measured in `C-0849`: every one of the 12 stories is 108–142 words and `body_en`
 * carries ⛔ no `\n` (`data/generated/stories-2026-08-21.jsonl`), so the screen drew a
 * single `<p>` of ~13 lines at 375px.
 *
 * ⇒ this takes the segments the screen ALREADY draws (`buildStorySegments`) and groups
 * them — ⛔ it never re-tokenises the text. That is the whole safety argument: every
 * segment lands in exactly one group, in order, so ⛔ no tap target can be split or lost,
 * and the collection path of `T-495` sees the same words it saw before.
 *
 * ⛔ **A cut happens ONLY after a sentence end** — a segment whose text ends in `.`/`!`/`?`
 * (optionally followed by a closing quote or bracket), that is ⛔ not an abbreviation
 * («Mr.», «Dr.»…), and that is followed by a word starting with a capital letter or a
 * digit. Anything else is ⛔ not a boundary.
 */

export interface StoryParagraphSegment {
  readonly text: string;
}

/** The segment's text marks the end of a sentence. */
const SENTENCE_END = /[.!?]["'”’)\]]*\s*$/u;

/** A word that opens a sentence — first letter a capital, or a digit. */
const SENTENCE_START = /^["'“‘(\[]*[\p{Lu}\p{N}]/u;

/**
 * Words whose full stop is part of the word, ⛔ not the end of a sentence. Compared on
 * the bare, lower-cased text of the segment that carries the stop.
 */
const ABBREVIATIONS: ReadonlySet<string> = new Set([
  'mr', 'mrs', 'ms', 'dr', 'st', 'prof', 'sr', 'jr', 'mt', 'vs', 'etc', 'e.g', 'i.e',
]);

/** How many paragraphs a story is cut into. */
export const STORY_PARAGRAPH_COUNT = 3;

function bare(text: string): string {
  return text.trim().toLowerCase().replace(/[^\p{L}\p{N}.]+/gu, '').replace(/\.+$/u, '');
}

/**
 * Splits `segments` into sentences: each sentence runs up to and INCLUDING its
 * terminating punctuation and the whitespace after it. Text after the last terminator
 * becomes a final sentence of its own.
 */
export function storySentences<T extends StoryParagraphSegment>(
  segments: readonly T[],
): T[][] {
  const texts = segments.map((s) => s.text);
  const isSpace = (k: number): boolean => (texts[k] ?? '').trim() === '';
  const out: T[][] = [];
  let current: T[] = [];
  let i = 0;
  while (i < segments.length) {
    const text = texts[i] ?? '';
    current.push(...segments.slice(i, i + 1));
    i++;
    if (!SENTENCE_END.test(text)) continue;

    // The word carrying the stop: the segment itself, or — since punctuation is its
    // own segment (`buildStorySegments`) — the one right before it.
    const own = bare(text);
    const carrier = own !== '' ? own : bare(texts[i - 2] ?? '');
    if (ABBREVIATIONS.has(carrier)) continue;

    // Skip the whitespace that follows, then require a sentence opener. The next token
    // may be split into a leading quote and a word, so it is read whole.
    let j = i;
    while (j < segments.length && isSpace(j)) j++;
    let next = '';
    for (let k = j; k < segments.length && !isSpace(k); k++) next += texts[k] ?? '';
    if (j < segments.length && !SENTENCE_START.test(next)) continue;

    current.push(...segments.slice(i, j));
    i = j;
    out.push(current);
    current = [];
  }
  const last = out[out.length - 1];
  if (current.some((s) => s.text.trim() !== '') || last === undefined) {
    if (current.length > 0) out.push(current);
  } else {
    last.push(...current);
  }
  return out;
}

/**
 * Groups `segments` into `STORY_PARAGRAPH_COUNT` paragraphs whose sentence counts differ
 * by at most one (earlier paragraphs take the extra sentence). Fewer sentences than
 * paragraphs ⇒ one paragraph per sentence. ⛔ No segment is dropped or duplicated:
 * `result.flat()` is `segments`, in order.
 */
export function storyParagraphs<T extends StoryParagraphSegment>(
  segments: readonly T[],
): T[][] {
  const sentences = storySentences(segments);
  if (sentences.length <= STORY_PARAGRAPH_COUNT) return sentences;

  const base = Math.floor(sentences.length / STORY_PARAGRAPH_COUNT);
  const extra = sentences.length % STORY_PARAGRAPH_COUNT;
  const out: T[][] = [];
  let at = 0;
  for (let p = 0; p < STORY_PARAGRAPH_COUNT; p++) {
    const take = base + (p < extra ? 1 : 0);
    out.push(sentences.slice(at, at + take).flat());
    at += take;
  }
  return out;
}
