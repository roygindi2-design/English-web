/**
 * PURE. No React, no DOM, no fetch, no process.env.
 *
 * T-039 · R-014 — the deterministic gate that stands between a content-generation run
 * and the content bank. It exists because LLMs asked to write an example for a
 * *specified* sense hit only 60–76% accuracy (GPT-4o, aclanthology 2025.emnlp-main.1720),
 * and Hebrew is mid-resource, so expect the lower tier. Cross-model agreement is not a
 * usable gate — models share correlated errors (arXiv 2607.08065). Cheap deterministic
 * checks first, human spot-check second (T-042).
 *
 * Bias: a false rejection costs one regeneration; a false acceptance ships wrong content
 * to a learner. Every ambiguous case therefore rejects.
 *
 * POS_VALUES, RELATION_TYPES and BLANK mirror the CHECK constraints and column defaults
 * of supabase/migrations/0002_content_bank.sql. That parity is asserted against the SQL
 * file itself in the test — a value added on one side without the other fails there.
 * ⚠️ Parity is partial by design: senses.cefr_level, senses.translation_confidence and
 * words.origin are not fields of GeneratedSense yet, so those constraints are still
 * enforced only by Postgres. Closing that gap belongs to the batch loader (T-042).
 */

export const POS_VALUES = [
  'noun', 'verb', 'adjective', 'adverb', 'preposition',
  'conjunction', 'pronoun', 'determiner', 'interjection',
] as const;
export type Pos = (typeof POS_VALUES)[number];

export const RELATION_TYPES = [
  'semantic', 'orthographic', 'collocational', 'unrelated', 'near_synonym',
] as const;
export type RelationType = (typeof RELATION_TYPES)[number];

/** The blank marker in an item stem. Pinned to sense_items.blank_token's default. */
export const BLANK = '____';

/** near_synonym is stored for analysis but is NOT a scorable option (migration 0002). */
const SCORABLE = (r: RelationType): boolean => r !== 'near_synonym';

export interface GeneratedSense {
  readonly headword: string;
  readonly pos: Pos;
  readonly translationHe: string;
  readonly definitionEn: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly items: readonly string[];
  readonly distractors: readonly { readonly word: string; readonly relationType: RelationType }[];
}

export interface GateOptions {
  /** Every non-target token in a sentence must appear here — this is the level check. */
  readonly allowedWords: ReadonlySet<string>;
  readonly maxExampleWords?: number;
  /** Minimum non-blank words in an item stem. A bare "____" is not an exam item. */
  readonly minStemWords?: number;
}

export interface GateResult {
  readonly ok: boolean;
  readonly reasons: readonly string[];
}

// U+0591–U+05C7 minus the marks that are punctuation rather than vocalisation:
// U+05BE maqaf (בית־ספר), U+05C0 paseq, U+05C3 sof pasuq, U+05C6 nun hafukha.
const NIKUD = /[֑-ׇֽֿׁׂׅׄ]/;
const HEBREW_LETTER = /[א-ת]/;
const LATIN = /[A-Za-z]/;
/** Whitelist, not blacklist: emoji and Cyrillic slip through any blacklist. */
const HEBREW_TEXT_ALLOWED = /^[א-ת׳״־ \-–,.()/"']+$/;

const MAX_DRIFT_REPORTED = 3;

const tokens = (s: string): string[] => s.toLowerCase().match(/[a-z']+/g) ?? [];

const CONTRACTION_STEMS: Readonly<Record<string, string>> = { wo: 'will', ca: 'can', sha: 'shall' };

/**
 * Strips the clitics an allowed-word list (an NGSL lemma set) will never contain, so
 * "wasn't" is checked as "was" and "teacher's" as "teacher" instead of drifting.
 */
function normalise(token: string): string {
  let t = token.replace(/^'+|'+$/g, '');
  if (t.endsWith("n't")) {
    const base = t.slice(0, -3);
    t = CONTRACTION_STEMS[base] ?? base;
  } else if (t.endsWith("'s")) {
    t = t.slice(0, -2);
  }
  return t;
}

/** English spells `-es` only after a sibilant: box→boxes, watch→watches, buzz→buzzes. */
const SIBILANT_FINAL = /(?:s|x|z|ch|sh)$/;
/** Shortest remainder after dropping a silent `e` that still behaves like a stem. */
const MIN_INFLECTION_STEM = 3;

/**
 * The regular inflections of one token. A CLOSED set on purpose: the previous open
 * prefix match ("startsWith(stem)") let `note` match "not" and let `be` exempt every
 * b-word from the level check. Irregular forms (gave, went) are not generated and will
 * be rejected — a regeneration, not bad content.
 *
 * F-020: every suffix is now conditioned on the stem's shape. Bare `${w}d` `${w}r`
 * `${w}st` `${w}es` used to be added to EVERY token, so unrelated real words were
 * claimed as inflections — car+d=card, be+st=best, care+er=career. Because
 * `isTargetToken` drives both the presence check and the level exemption, that was a
 * false ACCEPT: an out-of-level word inside the target's own sentence was waved
 * through to the learner. The `e`-final branch already produces the correct forms
 * (care→cared/carer/carest via base+ed/er/est), so the bare variants bought nothing.
 * The rule: a suffix starting with a vowel drops a final silent `e`; a suffix starting
 * with a consonant does not.
 */
function inflections(token: string): Set<string> {
  const w = token.toLowerCase();
  const out = new Set<string>([w]);
  const add = (...xs: string[]) => xs.forEach((x) => out.add(x));
  add(`${w}s`, `${w}ly`);
  if (SIBILANT_FINAL.test(w)) add(`${w}es`);
  if (w.endsWith('e')) {
    // `-ing` never collides here (careing, useing, heing are not words) and it rescues
    // the two-letter stems below: be→being, see→seeing.
    add(`${w}ing`);
    const base = w.slice(0, -1);
    // A one- or two-letter remainder is not an English stem, and dropping the `e` from
    // one turns the word into an unrelated one: be→b+est=BEST, see→se+ed=SEED / se+ing=SING.
    // Those are the same false-accept as F-020, so the branch is gated on stem length.
    // Cost: an e-final headword of 3 letters (use, age) loses used/using/user — a false
    // REJECT, which per this file's bias costs one regeneration. See TD-12.
    if (base.length >= MIN_INFLECTION_STEM) {
      add(`${base}ing`, `${base}ed`, `${base}er`, `${base}est`, `${base}y`);
    }
  } else {
    add(`${w}ed`, `${w}ing`, `${w}er`, `${w}est`);
  }
  if (w.endsWith('y')) {
    const base = w.slice(0, -1);
    add(`${base}ies`, `${base}ied`, `${base}ier`, `${base}iest`, `${base}ily`);
  }
  if (/[^aeiou][aeiou][^aeiouwxy]$/.test(w)) {
    const doubled = w + w.slice(-1);
    add(`${doubled}ed`, `${doubled}ing`, `${doubled}er`, `${doubled}est`);
  }
  return out;
}

/** Every surface form that counts as "the target word" — used for BOTH the presence
 *  check and the level exemption, so the two can never disagree. */
function targetForms(headword: string): Set<string>[] {
  return tokens(headword).map(inflections);
}

/**
 * True when the sentence contains the headword, or a regular inflection of it. For a
 * multi-word headword (phrasal verbs: "give up") every token must appear in order.
 */
function containsHeadword(sentence: string, forms: Set<string>[]): boolean {
  const first = forms[0];
  if (!first) return false;
  let next = 0;
  for (const raw of tokens(sentence)) {
    const w = normalise(raw);
    const expected = forms[next];
    if (expected?.has(w)) {
      next += 1;
      if (next === forms.length) return true;
    } else if (next > 0 && first.has(w)) {
      next = 1;
    }
  }
  return false;
}

const isTargetToken = (w: string, forms: Set<string>[]): boolean => forms.some((f) => f.has(w));

/** Reports EVERY out-of-level word (capped), so a repair loop converges in one round. */
function driftIn(sentence: string, forms: Set<string>[], allowed: ReadonlySet<string>): string[] {
  const bad: string[] = [];
  for (const raw of tokens(sentence)) {
    const w = normalise(raw);
    if (!w || isTargetToken(w, forms) || allowed.has(w)) continue;
    if (!bad.includes(w)) bad.push(w);
    if (bad.length === MAX_DRIFT_REPORTED) break;
  }
  return bad;
}

export function gateSense(input: GeneratedSense, opts: GateOptions): GateResult {
  const reasons: string[] = [];
  const maxWords = opts.maxExampleWords ?? 14;
  const minStemWords = opts.minStemWords ?? 3;
  const head = input.headword.trim().toLowerCase();
  const forms = targetForms(head);

  // --- vocabulary parity with migration 0002 ---
  if (!(POS_VALUES as readonly string[]).includes(input.pos)) {
    reasons.push(`pos: "${input.pos}" is not one of ${POS_VALUES.join('|')}`);
  }

  // --- headword & definition ---
  if (forms.length === 0) reasons.push('headword: empty');
  if (input.definitionEn.trim() === '') reasons.push('definition: empty');

  // --- Hebrew translation ---
  const he = input.translationHe;
  if (!HEBREW_LETTER.test(he)) reasons.push('translation: no Hebrew letters');
  if (LATIN.test(he)) reasons.push('translation: contains Latin letters');
  if (NIKUD.test(he)) reasons.push('translation: contains nikud (R-007)');
  if (!HEBREW_TEXT_ALLOWED.test(he)) reasons.push('translation: contains characters outside the Hebrew set');

  /** Examples and item stems are both read by the learner, so both get both checks. */
  const checkSentence = (label: string, text: string, limit: number): void => {
    if (tokens(text).length > limit) reasons.push(`${label}: over ${limit} words`);
    const drift = driftIn(text, forms, opts.allowedWords);
    if (drift.length > 0) reasons.push(`${label}: level drift on ${drift.map((w) => `"${w}"`).join(', ')}`);
  };

  // --- examples ---
  for (const kind of ['supportive', 'neutral'] as const) {
    const text = input.examples[kind];
    if (!containsHeadword(text, forms)) reasons.push(`example ${kind}: headword missing`);
    checkSentence(`example ${kind}`, text, maxWords);
  }

  // --- items ---
  if (input.items.length < 3) reasons.push('items: fewer than 3');
  input.items.forEach((stem, i) => {
    const blanks = stem.split(BLANK).length - 1;
    if (blanks === 0) reasons.push(`item ${i}: no blank`);
    else if (blanks > 1) reasons.push(`item ${i}: more than one blank`);
    const body = stem.replaceAll(BLANK, ' ');
    if (containsHeadword(body, forms)) reasons.push(`item ${i}: leaks the answer`);
    if (tokens(body).length < minStemWords) reasons.push(`item ${i}: fewer than ${minStemWords} words`);
    checkSentence(`item ${i}`, body, maxWords);
  });

  // --- distractors ---
  const seen = new Set<string>();
  let scorable = 0;
  for (const d of input.distractors) {
    const w = d.word.trim().toLowerCase().replace(/[.,;:!?]+$/, '');
    if (w === '') reasons.push('distractors: one is empty');
    else if (/\s/.test(w)) reasons.push(`distractors: "${w}" is more than one word`);
    if (isTargetToken(w, forms)) reasons.push(`distractors: "${w}" is the headword or an inflection of it`);
    if (seen.has(w)) reasons.push(`distractors: duplicate "${w}"`);
    if (!(RELATION_TYPES as readonly string[]).includes(d.relationType)) {
      reasons.push(`distractors: relationType "${d.relationType}" is not one of ${RELATION_TYPES.join('|')}`);
    } else if (SCORABLE(d.relationType)) scorable += 1;
    seen.add(w);
  }
  if (scorable < 4) reasons.push('distractors: fewer than 4 scorable (near_synonym does not count)');

  return { ok: reasons.length === 0, reasons };
}
