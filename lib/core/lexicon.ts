/**
 * Lexical normalisation and the damaged-record filter (T-017 · R-007 · D-013).
 *
 * Everything here is pure. The policy question "is a `!` record loaded at all?"
 * is deliberately NOT answered in this file — see F-021. classifyGloss reports
 * facts (flags, confidence); the caller decides what to do with them.
 */

export type TranslationConfidence = 'high' | 'low';
export type GlossFlag = 'bang_prefix' | 'pointed';

/**
 * A gloss straight out of a source file, before filtering.
 *
 * The brand is load-bearing: a value of this type cannot be rendered, because
 * the only route to a plain string is displayableGloss(), which returns null
 * for GAP and for `!`. T-017 asks for a test that fails if such a record
 * reaches the display layer; this makes it a compile error instead.
 */
export type RawGloss = string & { readonly __rawGloss: unique symbol };

export function asRawGloss(s: string): RawGloss {
  return s as RawGloss;
}

export type GlossVerdict =
  | {
      readonly kind: 'drop';
      readonly reason: 'gap_record' | 'pseudo_gap' | 'empty';
    }
  | {
      readonly kind: 'keep';
      readonly confidence: TranslationConfidence;
      readonly display: string;
      readonly match: string;
      readonly flags: readonly GlossFlag[];
    };

/**
 * Hebrew points and cantillation marks ONLY.
 *
 * The naive range ֑-ׇ is wrong: it swallows U+05BE MAQAF (a joining
 * hyphen, part of the word), U+05C0 PASEQ, U+05C3 SOF PASUQ and U+05C6 NUN
 * HAFUKHA — all real characters, not points. They are excluded by hand below.
 */
const NIQQUD = /[֑-ׇֽֿׁׂׅׄ]/g;

/** Latin combining diacritics, for the English side. */
const LATIN_MARKS = /[̀-ͯ]/g;

const WHITESPACE = /\s+/g;

export function stripNiqqud(s: string): string {
  // NFKD first: U+FB2A (SHIN WITH SHIN DOT) and friends are single code points
  // that a range scan cannot see into. Decomposing turns them into base+mark.
  return s.normalize('NFKD').replace(NIQQUD, '').normalize('NFC');
}

export function hasNiqqud(s: string): boolean {
  // Fresh regex each call: NIQQUD is /g and carries lastIndex across .test().
  return new RegExp(NIQQUD.source).test(s.normalize('NFKD'));
}

export function normalizeHebrew(s: string): string {
  return stripNiqqud(s).replace(WHITESPACE, ' ').trim();
}

export function normalizeEnglish(s: string): string {
  return s
    .normalize('NFKD')
    .replace(LATIN_MARKS, '')
    .normalize('NFC')
    .toLowerCase()
    .replace(WHITESPACE, ' ')
    .trim();
}

/**
 * `GAP` as a standalone token — not a word that merely starts with those
 * letters. "GAPE" is a legitimate gloss; "GAP no lexical item" is not.
 *
 * ⚠️ `!` is part of the terminator set, and that is not cosmetic. Measured on
 * the real export (`data/h1-hebrew-wordnet.tsv`, 2026-08-12, C-0052): the file
 * carries **702** lines spelled exactly `GAP!` and **zero** spelled `GAP` or
 * `GAP <note>`. Without the `!`, D-025's "GAP is not loaded" silently loaded
 * all 702 as high-confidence Hebrew — and the trailing `!` is not a leading
 * one, so they were not even marked `low`.
 */
const GAP_RECORD = /^GAP(!|\s|$)/;

/**
 * The wordnet's second marker, 3 lines in the same file. Kept as its own reason
 * rather than folded into `gap_record`: D-025 names `GAP` and only `GAP`, so
 * the counts must stay separable for the PM to rule on it. It is dropped either
 * way — measured, it carries zero Hebrew characters, so the only alternative is
 * putting the literal string "PSEUDOGAP!" in front of a learner.
 */
const PSEUDO_GAP_RECORD = /^PSEUDOGAP(!|\s|$)/;

export function classifyGloss(raw: RawGloss): GlossVerdict {
  const trimmed = String(raw).trim();
  if (trimmed === '') return { kind: 'drop', reason: 'empty' };
  if (PSEUDO_GAP_RECORD.test(trimmed)) {
    return { kind: 'drop', reason: 'pseudo_gap' };
  }
  if (GAP_RECORD.test(trimmed)) return { kind: 'drop', reason: 'gap_record' };

  const flags: GlossFlag[] = [];
  let body = trimmed;
  if (body.startsWith('!')) {
    flags.push('bang_prefix');
    body = body.slice(1).trim();
  }
  if (body === '') return { kind: 'drop', reason: 'empty' };

  if (hasNiqqud(body)) flags.push('pointed');

  return {
    kind: 'keep',
    // Pointing is a spelling property, not a reliability one — it does NOT
    // lower confidence. Only the `!` marker does (T-017 ב).
    confidence: flags.includes('bang_prefix') ? 'low' : 'high',
    display: body,
    match: normalizeHebrew(body),
    flags,
  };
}

/** D-013: a dropped record and a `low` record are both invisible to the learner. */
export function displayableGloss(raw: RawGloss): string | null {
  const v = classifyGloss(raw);
  if (v.kind === 'drop') return null;
  if (v.confidence === 'low') return null;
  return v.display;
}
