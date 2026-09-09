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

/** D-141 · 41 § 6.2 — difficulty 1-4. Mirrors migration 0021's CHECK (asserted in the test). */
export const ITEM_LEVELS = [1, 2, 3, 4] as const;
export type ItemLevel = (typeof ITEM_LEVELS)[number];

/** near_synonym is stored for analysis but is NOT a scorable option (migration 0002). */
const SCORABLE = (r: RelationType): boolean => r !== 'near_synonym';

/**
 * D-141 — a practice-sentence stem, tagged with a difficulty level at write time.
 * `level`/`levelRationale` are BOTH null together (written before D-141 — a
 * declared legal, ungraded state) or BOTH set together (a real 1-4 level with
 * its § 6.2 criterion named) — never one without the other; see `gateSense`.
 */
export interface GeneratedItem {
  readonly stem: string;
  readonly level: ItemLevel | null;
  readonly levelRationale: string | null;
}

export interface GeneratedSense {
  readonly headword: string;
  readonly pos: Pos;
  readonly translationHe: string;
  readonly definitionEn: string;
  readonly examples: { readonly supportive: string; readonly neutral: string };
  readonly items: readonly GeneratedItem[];
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

/**
 * 🔴 **THE IRREGULAR FORMS, KEYED BY LEMMA — CLOSED, HAND-WRITTEN, ⛔ NOT DERIVED.**
 *
 * ⛔ **Why this had to exist, and it is a MEASUREMENT.** `inflections()` below is purely
 * suffix-driven, so `targetForms('go')` produced `go · gos · goly · goed · going · goer ·
 * goest` — and ⛔ not `went`. ⇒ `containsHeadword` rejected **"She went home before dark."**
 * for the headword `go` with «example supportive: headword missing». The same for
 * `be` (⛔ no is/was/were/been), `good` (⛔ no better/best), `child` (⛔ no children),
 * `take` · `see` · `buy` · `write` · `have` · `man` — measured 09/09 on a live clone by
 * printing `targetForms` for each.
 *
 * ⚠️ **And these are exactly the words the bank needs most.** Tier 1 of
 * `data/amirnet-vocab.csv` is the A2 core, 1,243 headwords, and the irregular verbs and
 * nouns sit at the top of it. The file's own note said a rejection here costs «a
 * regeneration, not bad content» — ⛔ that is ⛔ not what it costs. For `go` there is
 * ⛔ no past-tense sentence that passes, at any number of regenerations, so the writer
 * either abandons the headword or writes a worse sentence to satisfy the checker.
 *
 * ⛔ **AND THIS ⛔ DOES ⛔ NOT REOPEN `F-020`.** F-020 was a **false ACCEPT** born of
 * *guessing*: an open prefix match let `car` claim `card` and `be` exempt every b-word.
 * This table guesses ⛔ nothing — every pair is written out by hand, so it can ⛔ never
 * manufacture an unrelated real word. The bias of the file is unchanged: ⛔ no word
 * enters a learner's sentence unless it is the target or in the allow-list.
 *
 * 📎 **⛔ And it is ⛔ not a second source of truth.** `lib/core/storyGate.ts` carried the
 * same knowledge as a form→lemma map since T-134ⓑ; it now derives that map from this
 * one, so the two gates ⛔ cannot drift apart.
 */
export const IRREGULAR_FORMS: Readonly<Record<string, readonly string[]>> = {
  be: ['am', 'is', 'are', 'was', 'were', 'been'],
  have: ['has', 'had'],
  do: ['does', 'did', 'done'],
  go: ['went', 'gone'],
  say: ['said'],
  see: ['saw', 'seen'],
  make: ['made'],
  take: ['took', 'taken'],
  get: ['got', 'gotten'],
  come: ['came'],
  know: ['knew', 'known'],
  think: ['thought'],
  give: ['gave', 'given'],
  find: ['found'],
  tell: ['told'],
  become: ['became'],
  leave: ['left'],
  feel: ['felt'],
  mean: ['meant'],
  keep: ['kept'],
  begin: ['began', 'begun'],
  show: ['shown'],
  hear: ['heard'],
  run: ['ran'],
  bring: ['brought'],
  write: ['wrote', 'written'],
  sit: ['sat'],
  stand: ['stood'],
  lose: ['lost'],
  pay: ['paid'],
  meet: ['met'],
  hold: ['held'],
  buy: ['bought'],
  understand: ['understood'],
  speak: ['spoke', 'spoken'],
  eat: ['ate', 'eaten'],
  drink: ['drank', 'drunk'],
  sleep: ['slept'],
  teach: ['taught'],
  catch: ['caught'],
  sell: ['sold'],
  send: ['sent'],
  spend: ['spent'],
  build: ['built'],
  win: ['won'],
  drive: ['drove', 'driven'],
  choose: ['chose', 'chosen'],
  break: ['broke', 'broken'],
  wear: ['wore', 'worn'],
  fly: ['flew', 'flown'],
  grow: ['grew', 'grown'],
  throw: ['threw', 'thrown'],
  draw: ['drew', 'drawn'],
  feed: ['fed'],
  rise: ['rose', 'risen'],
  fall: ['fell', 'fallen'],
  forget: ['forgot', 'forgotten'],
  hide: ['hid', 'hidden'],
  ride: ['rode', 'ridden'],
  wake: ['woke', 'woken'],
  steal: ['stole', 'stolen'],
  fight: ['fought'],
  seek: ['sought'],
  lead: ['led'],
  lay: ['laid'],
  sing: ['sang', 'sung'],
  swim: ['swam', 'swum'],
  child: ['children'],
  man: ['men'],
  woman: ['women'],
  person: ['people'],
  foot: ['feet'],
  tooth: ['teeth'],
  good: ['better', 'best'],
  bad: ['worse', 'worst'],
  far: ['further', 'furthest', 'farther', 'farthest'],
  many: ['more', 'most'],
  much: ['more', 'most'],
  little: ['less', 'least'],
};

/** English spells `-es` only after a sibilant: box→boxes, watch→watches, buzz→buzzes. */
const SIBILANT_FINAL = /(?:s|x|z|ch|sh)$/;
/** Shortest remainder after dropping a silent `e` that still behaves like a stem. */
const MIN_INFLECTION_STEM = 3;

/**
 * The regular inflections of one token, plus the hand-declared irregulars above. A
 * CLOSED set on purpose: the previous open prefix match ("startsWith(stem)") let `note`
 * match "not" and let `be` exempt every b-word from the level check. ⟦09/09: the
 * irregular forms are ⛔ no longer absent — see `IRREGULAR_FORMS` and why.⟧
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
  add(...(IRREGULAR_FORMS[w] ?? []));
  return out;
}

/** Every surface form that counts as "the target word" — used for BOTH the presence
 *  check and the level exemption, so the two can never disagree. */
export function targetForms(headword: string): Set<string>[] {
  return tokens(headword).map(inflections);
}

export interface TextSpan {
  readonly start: number;
  readonly end: number;
}

/**
 * Tokens with their offsets. Mirrors `tokens()` on every input reachable through
 * real content — with exactly two known exceptions, found by sweeping the BMP:
 * U+0130 `İ` and U+212A `K` (Kelvin sign) lowercase INTO the ASCII range, so
 * `tokens()` sees them and this does not. They are left divergent on purpose:
 * matching them would mean lowercasing before scanning, and `'İ'.toLowerCase()`
 * is two code points, which shifts every offset after it — the span would then
 * point at the wrong characters, which is worse than not marking. Neither code
 * point survives the drift check against an NGSL lemma set, so neither reaches a
 * learner. Do not read the "identical walks" note below as covering them.
 */
function tokensWithSpans(s: string): { raw: string; start: number; end: number }[] {
  const out: { raw: string; start: number; end: number }[] = [];
  const re = /[A-Za-z']+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    out.push({ raw: m[0].toLowerCase(), start: m.index, end: m.index + m[0].length });
  }
  return out;
}

/**
 * How many tokens a marked span may cover beyond the headword's own token count.
 *
 * This is a DISPLAY bound, not a pedagogical one: `containsHeadword` deliberately
 * never resets on a mismatch so a separable phrasal verb still counts ("give it
 * up"), and the object between the verb and its particle is one to three words in
 * practice. Without a bound the same walk reports the whole stretch as "the target
 * word" — a review measured "Please give the book to the man up there." bolding 27
 * characters. Over the bound we fall back to no highlight, which is the degraded
 * card `splitAroundTarget` already handles; a wrong highlight teaches a wrong
 * collocation, a missing one teaches nothing.
 */
const MAX_TARGET_SPAN_EXTRA_TOKENS = 3;

/** Mirrors `normalise`'s outer-apostrophe strip, on the SPAN instead of the text, so a
 *  quoted word marks as `bank` and not as `'bank'`. Inner clitics ("teacher's") stay. */
function trimQuotes(sentence: string, start: number, end: number): TextSpan {
  let s = start;
  let e = end;
  while (s < e && sentence[s] === "'") s += 1;
  while (e > s && sentence[e - 1] === "'") e -= 1;
  return { start: s, end: e };
}

/**
 * Where the target word sits inside a sentence — TD-11.
 *
 * The walk is deliberately identical to `containsHeadword`, including its one
 * subtlety: a mismatch does NOT reset progress, because phrasal verbs separate
 * ("give it up"). Two walks that disagree would mean the gate accepts a sentence
 * the card then cannot mark, so they share `targetForms` and the same loop shape.
 * If you change one, change both, and the tests here and there will tell you.
 */
export function locateTarget(sentence: string, headword: string): TextSpan | null {
  const forms = targetForms(headword);
  const first = forms[0];
  if (!first) return null;
  const maxTokens = forms.length + MAX_TARGET_SPAN_EXTRA_TOKENS;
  const all = tokensWithSpans(sentence);
  let next = 0;
  let start = -1;
  let startIdx = -1;
  for (let i = 0; i < all.length; i += 1) {
    const t = all[i];
    if (!t) continue;
    const w = normalise(t.raw);
    const expected = forms[next];
    if (expected?.has(w)) {
      if (next === 0) {
        start = t.start;
        startIdx = i;
      }
      next += 1;
      if (next === forms.length) {
        // Too far apart to be one phrase: abandon THIS match and keep scanning, so a
        // tighter occurrence later in the sentence is still found.
        if (i - startIdx + 1 <= maxTokens) return trimQuotes(sentence, start, t.end);
        next = 0;
        start = -1;
        startIdx = -1;
      }
    } else if (next > 0 && first.has(w)) {
      next = 1;
      start = t.start;
      startIdx = i;
    }
  }
  return null;
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
  input.items.forEach((item, i) => {
    const stem = item.stem;
    const blanks = stem.split(BLANK).length - 1;
    if (blanks === 0) reasons.push(`item ${i}: no blank`);
    else if (blanks > 1) reasons.push(`item ${i}: more than one blank`);
    const body = stem.replaceAll(BLANK, ' ');
    if (containsHeadword(body, forms)) reasons.push(`item ${i}: leaks the answer`);
    if (tokens(body).length < minStemWords) reasons.push(`item ${i}: fewer than ${minStemWords} words`);
    checkSentence(`item ${i}`, body, maxWords);

    // D-141: level and level_rationale are tagged together (a real 1-4 level with its
    // § 6.2 criterion named) or both absent (a declared-legal, written-before-D-141
    // item) — never one without the other.
    const { level, levelRationale } = item;
    if (level === null || levelRationale === null) {
      if (level !== null || levelRationale !== null) {
        reasons.push(`item ${i}: level and level_rationale must both be present or both be absent (D-141)`);
      }
    } else {
      if (!(ITEM_LEVELS as readonly number[]).includes(level as number)) {
        reasons.push(`item ${i}: level "${level}" is not one of ${ITEM_LEVELS.join('|')}`);
      }
      if (levelRationale.trim() === '') {
        reasons.push(`item ${i}: level_rationale is empty`);
      }
    }
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
