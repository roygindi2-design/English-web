import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BLANK,
  gateSense,
  locateTarget,
  POS_VALUES,
  RELATION_TYPES,
  targetForms,
} from './contentSchema';

const ok = {
  headword: 'deliberate',
  pos: 'adjective' as const,
  translationHe: 'מכוון',
  definitionEn: 'done on purpose rather than by accident',
  examples: {
    supportive: 'It was a deliberate choice, not an accident.',
    neutral: 'Her answer was deliberate.',
  },
  items: ['His silence was ____, not shy.', 'She made a ____ effort.', 'It was no accident — it was ____.'],
  distractors: [
    { word: 'accidental', relationType: 'semantic' as const },
    { word: 'delicate', relationType: 'orthographic' as const },
    { word: 'wooden', relationType: 'unrelated' as const },
    { word: 'careless', relationType: 'semantic' as const },
  ],
};

// NOTE (C-0008): the plan's fixture omitted 'for', 'hours' and 'quick'. That made three
// tests fail on *level drift* rather than on the thing they name — a subagent review
// proved the headword-presence check and the length check could both be deleted with the
// suite still green. Every word a test needs is listed here so each test can only fail
// for its own reason.
const allowed = [
  'it', 'was', 'a', 'choice', 'not', 'an', 'accident', 'her', 'answer', 'deliberate',
  'his', 'silence', 'shy', 'she', 'made', 'effort', 'no', 'for', 'hours', 'quick',
];
const opts = { allowedWords: new Set(allowed) };

describe('gateSense', () => {
  it('accepts a well-formed sense', () => {
    expect(gateSense(ok, opts)).toEqual({ ok: true, reasons: [] });
  });

  it('rejects an example that does not contain the headword', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'Her answer was quick.' } }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('neutral');
    expect(r.reasons.join()).toContain('headword missing');
  });

  it('accepts an inflected form of the headword', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'She deliberated for hours.' } }, opts);
    expect(r).toEqual({ ok: true, reasons: [] });
  });

  it('rejects a stem that has no blank', () => {
    const r = gateSense({ ...ok, items: ['His silence was loud.', ...ok.items.slice(1)] }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('blank');
  });

  it('rejects a stem that leaks the answer', () => {
    const r = gateSense({ ...ok, items: ['A deliberate act is ____.', ...ok.items.slice(1)] }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('leaks');
  });

  it('rejects fewer than 3 items or 4 distractors', () => {
    expect(gateSense({ ...ok, items: ok.items.slice(0, 2) }, opts).reasons.join()).toContain('items: fewer than 3');
    expect(gateSense({ ...ok, distractors: ok.distractors.slice(0, 3) }, opts).reasons.join())
      .toContain('distractors: fewer than 4');
  });

  it('rejects a distractor equal to the headword', () => {
    const d = [...ok.distractors];
    d[0] = { word: 'deliberate', relationType: 'semantic' };
    expect(gateSense({ ...ok, distractors: d }, opts).reasons.join()).toContain('headword');
  });

  it('rejects a Hebrew translation that contains Latin letters', () => {
    expect(gateSense({ ...ok, translationHe: 'מכוון deliberate' }, opts).ok).toBe(false);
  });

  it('rejects a Hebrew translation carrying nikud', () => {
    // R-007: nikud breaks matching. 99.9% of Hebrew Wordnet lemmas carry it.
    expect(gateSense({ ...ok, translationHe: 'מְכֻוָּן' }, opts).reasons.join()).toContain('nikud');
  });

  it('rejects level drift — a sentence using words outside the allowed list', () => {
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'Her answer was deliberate notwithstanding.' } }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('level');
  });

  it('rejects an over-long example', () => {
    // Built only from allowed words, so the length check is the ONLY thing that can fire.
    const long = 'It was a deliberate choice ' + 'not an accident '.repeat(5);
    const r = gateSense({ ...ok, examples: { ...ok.examples, supportive: long } }, opts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('over');
    expect(r.reasons.join()).not.toContain('drift');
  });

  it('collects every reason, not just the first', () => {
    const r = gateSense({ ...ok, translationHe: 'abc', items: [] }, opts);
    expect(r.reasons.length).toBeGreaterThan(1);
  });

  // ── C-0008: findings from the subagent review, each proven against the old code ──

  it('stays in lock-step with the CHECK constraints of migration 0002', () => {
    // Parity asserted against the SQL itself, not against a copy of the list. A value
    // added on either side without the other now fails here instead of blowing up
    // half-way through a batch insert.
    const sql = readFileSync(new URL('../../supabase/migrations/0002_content_bank.sql', import.meta.url), 'utf8');
    const listAfter = (col: string) => {
      const m = sql.match(new RegExp(`${col}[\\s\\S]*?check \\(${col} in\\s*\\(([^)]*)\\)`));
      const body = m?.[1];
      if (body === undefined) return [];
      return [...body.matchAll(/'([a-z_]+)'/g)].map((x) => x[1] ?? '').sort();
    };
    expect(listAfter('pos')).toEqual([...POS_VALUES].sort());
    expect(listAfter('relation_type')).toEqual([...RELATION_TYPES].sort());
    expect(sql).toContain(`blank_token text not null default '${BLANK}'`);
  });

  it('rejects a part of speech the migration CHECK would refuse', () => {
    const r = gateSense({ ...ok, pos: 'gerund' as never }, opts);
    expect(r.reasons.join()).toContain('pos');
  });

  it('rejects a distractor relation type the migration CHECK would refuse', () => {
    const d = [...ok.distractors];
    d[0] = { word: 'accidental', relationType: 'phonetic' as never };
    expect(gateSense({ ...ok, distractors: d }, opts).reasons.join()).toContain('relationType');
  });

  // CRITICAL: `head.replace(/e$/,'') + startsWith` made the headword check vacuous for
  // short headwords — `note` matched "not", and `be` exempted every b-word from the
  // level check. Both examples below were ACCEPTED by the previous implementation.
  it('does not accept a near-miss word as the headword', () => {
    const near = {
      ...ok, headword: 'note', pos: 'noun' as const, translationHe: 'פתק',
      examples: { supportive: 'This is not important at all.', neutral: 'This is not important.' },
      items: ['She left a short ____.', 'He read the ____ twice.', 'They found a ____ on the desk.'],
    };
    const r = gateSense(near, { allowedWords: new Set(['this', 'is', 'not', 'important', 'at', 'all', 'she', 'left', 'short', 'he', 'read', 'the', 'twice', 'they', 'found', 'on', 'desk', 'a']) });
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('headword missing');
  });

  it('does not let a short headword smuggle out-of-level vocabulary past the drift check', () => {
    const be = {
      ...ok, headword: 'be', pos: 'verb' as const, translationHe: 'להיות',
      examples: { supportive: 'The bureaucracy behaved badly.', neutral: 'It will be here.' },
      items: ['It will ____ fine.', 'They should ____ here.', 'She wants to ____ ready.'],
    };
    const r = gateSense(be, { allowedWords: new Set(['the', 'it', 'will', 'here', 'they', 'should', 'she', 'wants', 'to', 'ready', 'fine']) });
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('drift');
  });

  it('does not report a false leak when a stem merely shares a prefix with the headword', () => {
    const care = {
      ...ok, headword: 'care', pos: 'noun' as const, translationHe: 'אכפתיות',
      examples: { supportive: 'She showed real care for them.', neutral: 'He took care of it.' },
      items: ['The ____ drove past the car.', 'She showed no ____.', 'They took good ____ of him.'],
    };
    const r = gateSense(care, { allowedWords: new Set(['she', 'showed', 'real', 'for', 'them', 'he', 'took', 'of', 'it', 'the', 'drove', 'past', 'car', 'no', 'they', 'good', 'him']) });
    expect(r.reasons.join()).not.toContain('leaks');
  });

  it('accepts a multi-word headword — phrasal verbs are core exam vocabulary', () => {
    const phrasal = {
      ...ok, headword: 'give up', pos: 'verb' as const, translationHe: 'לוותר',
      examples: { supportive: 'Do not give up before the end.', neutral: 'She gives up too fast.' },
      items: ['Do not ____ now.', 'He wanted to ____ early.', 'They never ____ at all.'],
    };
    const r = gateSense(phrasal, { allowedWords: new Set(['do', 'not', 'before', 'the', 'end', 'she', 'too', 'fast', 'now', 'he', 'wanted', 'to', 'early', 'they', 'never', 'at', 'all']) });
    expect(r).toEqual({ ok: true, reasons: [] });
  });

  it('rejects a distractor that is the headword wearing punctuation or whitespace', () => {
    for (const word of ['Deliberate ', 'deliberate.', 'deliberately']) {
      const d = [...ok.distractors];
      d[0] = { word, relationType: 'semantic' };
      expect(gateSense({ ...ok, distractors: d }, opts).ok, word).toBe(false);
    }
  });

  it('rejects an empty or multi-token distractor', () => {
    for (const word of ['', '   ', 'on purpose']) {
      const d = [...ok.distractors];
      d[0] = { word, relationType: 'semantic' };
      expect(gateSense({ ...ok, distractors: d }, opts).ok, JSON.stringify(word)).toBe(false);
    }
  });

  it('rejects duplicate distractors', () => {
    const d = [...ok.distractors];
    d[3] = { word: 'Accidental', relationType: 'semantic' };
    expect(gateSense({ ...ok, distractors: d }, opts).reasons.join()).toContain('duplicate');
  });

  it('does not count near_synonym toward the four scorable distractors', () => {
    // migration 0002: near_synonym is stored but EXCLUDED from scoring items.
    const d = ok.distractors.map((x) => ({ ...x, relationType: 'near_synonym' as const }));
    expect(gateSense({ ...ok, distractors: d }, opts).reasons.join()).toContain('fewer than 4');
  });

  it('rejects a translation with no Hebrew letters at all', () => {
    expect(gateSense({ ...ok, translationHe: '123' }, opts).reasons.join()).toContain('no Hebrew');
  });

  it('rejects a translation carrying characters from neither alphabet', () => {
    expect(gateSense({ ...ok, translationHe: 'מכוון 😀 Владимир' }, opts).ok).toBe(false);
  });

  it('accepts a hyphenated Hebrew compound — maqaf is punctuation, not nikud', () => {
    const r = gateSense({ ...ok, translationHe: 'בית־ספר' }, opts);
    expect(r).toEqual({ ok: true, reasons: [] });
  });

  it('rejects an empty definition', () => {
    expect(gateSense({ ...ok, definitionEn: '  ' }, opts).reasons.join()).toContain('definition');
  });

  it('rejects an empty headword instead of silently disabling the word checks', () => {
    const r = gateSense({ ...ok, headword: '  ' }, opts);
    expect(r.reasons.join()).toContain('headword: empty');
  });

  it('applies the level and length checks to item stems, not only to examples', () => {
    // Stems are shown to the learner exactly like examples.
    const drifty = gateSense({ ...ok, items: ['The obfuscatory ratiocination was ____.', ...ok.items.slice(1)] }, opts);
    expect(drifty.reasons.join()).toContain('drift');
    const empty = gateSense({ ...ok, items: ['____', ...ok.items.slice(1)] }, opts);
    expect(empty.ok).toBe(false);
  });

  it('rejects a stem with more than one blank — it is unanswerable with one key', () => {
    const r = gateSense({ ...ok, items: ['It was ____ and ____ shy.', ...ok.items.slice(1)] }, opts);
    expect(r.reasons.join()).toContain('blank');
  });

  it('does not trip the drift check on contractions and possessives', () => {
    const r = gateSense({
      ...ok,
      examples: { supportive: "Her answer was deliberate, wasn't it?", neutral: "The answer's tone was deliberate." },
    }, { allowedWords: new Set([...allowed, 'the', 'tone']) });
    expect(r).toEqual({ ok: true, reasons: [] });
  });

  it('reports every out-of-level word, not just the first', () => {
    // A repair loop that only ever learns one bad word at a time never converges.
    const r = gateSense({ ...ok, examples: { ...ok.examples, neutral: 'It was deliberate zebra xylophone.' } }, opts);
    expect(r.reasons.join()).toContain('zebra');
    expect(r.reasons.join()).toContain('xylophone');
  });
});

// F-020 (C-0011, deep review) — the bare suffixes `d`/`r`/`st`/`es`/`er` in inflections()
// were added to every token unconditionally, so real unrelated words were treated as
// "an inflection of the headword": car+d=card, be+st=best, care+er=career. That exempted
// them from the level check (false accept — the shipping failure) and rejected valid
// distractors (false reject). Each test below fails against the pre-fix function.
describe('gateSense · inflections are morphologically constrained (F-020)', () => {
  const carSense = {
    ...ok,
    headword: 'car',
    pos: 'noun' as const,
    translationHe: 'מכונית',
    definitionEn: 'a road vehicle with four wheels',
    examples: { supportive: 'She made a car choice.', neutral: 'The car was her answer.' },
    items: ['His ____ was silence.', 'She made a ____ effort.', 'It was no accident — a ____.'],
    distractors: [
      { word: 'accidental', relationType: 'semantic' as const },
      { word: 'delicate', relationType: 'orthographic' as const },
      { word: 'wooden', relationType: 'unrelated' as const },
      { word: 'careless', relationType: 'semantic' as const },
    ],
  };
  const carOpts = { allowedWords: new Set([...allowed, 'the', 'and', 'car']) };

  it('reports an out-of-level word that merely looks like headword+d (car → card)', () => {
    // The shipping failure: "card" is absent from allowedWords, so the learner would be
    // shown a word above their level. Pre-fix this returned { ok: true, reasons: [] }.
    const r = gateSense({ ...carSense, examples: { ...carSense.examples, neutral: 'The card was her answer.' } }, carOpts);
    expect(r.ok).toBe(false);
    expect(r.reasons.join()).toContain('"card"');
  });

  it('reports an out-of-level word that merely looks like headword+st (be → best)', () => {
    const beSense = {
      ...carSense,
      headword: 'be',
      pos: 'verb' as const,
      translationHe: 'להיות',
      definitionEn: 'to exist',
      examples: { supportive: 'It was a choice, not an accident to be.', neutral: 'Her answer was best.' },
    };
    const r = gateSense(beSense, { allowedWords: new Set([...allowed, 'the', 'to']) });
    expect(r.reasons.join()).toContain('"best"');
  });

  it('accepts a distractor that is a different word sharing the headword prefix (care → career)', () => {
    const careSense = {
      ...carSense,
      headword: 'care',
      pos: 'noun' as const,
      translationHe: 'אכפתיות',
      definitionEn: 'serious attention given to avoiding damage',
      examples: { supportive: 'She made a care choice.', neutral: 'Her answer was care.' },
      distractors: [
        { word: 'career', relationType: 'semantic' as const },
        { word: 'delicate', relationType: 'orthographic' as const },
        { word: 'wooden', relationType: 'unrelated' as const },
        { word: 'accidental', relationType: 'semantic' as const },
      ],
    };
    const r = gateSense(careSense, { allowedWords: new Set([...allowed, 'care']) });
    expect(r.reasons.join()).not.toContain('career');
  });

  it('still treats the real inflections of an e-final headword as the target (care → cared/cares/caring)', () => {
    const careOpts = { allowedWords: new Set([...allowed, 'care']) };
    for (const form of ['cared', 'cares', 'caring']) {
      const r = gateSense({
        ...carSense,
        headword: 'care',
        pos: 'verb' as const,
        translationHe: 'לדאוג',
        definitionEn: 'to feel concern',
        examples: { supportive: 'It was a choice, she cared.', neutral: `Her answer ${form} for it.` },
      }, careOpts);
      expect(r.reasons.join(), form).not.toContain('headword missing');
      expect(r.reasons.join(), form).not.toContain(`"${form}"`);
    }
  });

  it('keeps the -ing form of a two-letter e-final headword (be → being, see → seeing)', () => {
    // The stem-length guard that kills be→b+est=BEST must not also kill "being".
    const r = gateSense({
      ...carSense,
      headword: 'be',
      pos: 'verb' as const,
      translationHe: 'להיות',
      definitionEn: 'to exist',
      examples: { supportive: 'It was a choice, not an accident to be.', neutral: 'Her answer was being made.' },
    }, { allowedWords: new Set([...allowed, 'the', 'to', 'made']) });
    expect(r.reasons.join()).not.toContain('headword missing');
    expect(r.reasons.join()).not.toContain('"being"');
  });

  it('still treats a sibilant plural as the target (box → boxes) and does not invent one (car → cares)', () => {
    const boxOpts = { allowedWords: new Set([...allowed, 'the']) };
    const boxes = gateSense({
      ...carSense,
      headword: 'box',
      pos: 'noun' as const,
      translationHe: 'קופסה',
      definitionEn: 'a container with flat sides',
      examples: { supportive: 'It was a box, not an accident.', neutral: 'Her answer was boxes.' },
    }, boxOpts);
    expect(boxes.reasons.join()).not.toContain('headword missing');
    expect(boxes.reasons.join()).not.toContain('"boxes"');

    // "cares" is not a form of the noun "car" — it must be reported as drift.
    const cares = gateSense({ ...carSense, examples: { ...carSense.examples, neutral: 'The car and cares.' } }, carOpts);
    expect(cares.reasons.join()).toContain('"cares"');
  });
});

describe('locateTarget (TD-11)', () => {
  const at = (sentence: string, headword: string) => {
    const span = locateTarget(sentence, headword);
    return span ? sentence.slice(span.start, span.end) : null;
  };

  it('finds the exact headword', () => {
    expect(at('The bank was closed.', 'bank')).toBe('bank');
  });

  it('finds a regular inflection, not the lemma', () => {
    expect(at('She deliberated for hours.', 'deliberate')).toBe('deliberated');
    expect(at('He is running late.', 'run')).toBe('running');
  });

  it('is case-insensitive but returns the surface form as written', () => {
    expect(at('Bank on it.', 'bank')).toBe('Bank');
  });

  it('spans a separable phrasal verb from first token to last', () => {
    expect(at('Please give it up now.', 'give up')).toBe('give it up');
  });

  it('does not match a word that merely starts the same — the T-039 prefix bug', () => {
    expect(at('That is not true.', 'note')).toBeNull();
    expect(at('The behaviour was odd.', 'be')).toBeNull();
  });

  it('returns null for an irregular form, which the gate rejects anyway', () => {
    expect(at('He went home.', 'go')).toBeNull();
  });

  it('returns null when the word is absent', () => {
    expect(at('Nothing here.', 'bank')).toBeNull();
  });

  it('exposes the same forms the gate uses, so the two can never disagree', () => {
    expect(targetForms('run')[0]?.has('running')).toBe(true);
  });
});

describe('locateTarget bounds what it dares call "the target word" (review C-0015)', () => {
  const at = (sentence: string, headword: string) => {
    const span = locateTarget(sentence, headword);
    return span ? sentence.slice(span.start, span.end) : null;
  };

  it('refuses to mark a stretch too wide to be one phrase', () => {
    // The gate ACCEPTS this sentence (containsHeadword never resets on a mismatch),
    // so it is reachable content. Measured before the bound: 27 characters bolded
    // as "the target word" — "give the book to the man up".
    expect(at('Please give the book to the man up there.', 'give up')).toBeNull();
  });

  it('keeps scanning after abandoning a too-wide match', () => {
    expect(at('Give the book to the man up, then give it up.', 'give up')).toBe('give it up');
  });

  it('excludes surrounding quote marks but keeps an inner clitic', () => {
    expect(at("He said 'bank' loudly.", 'bank')).toBe('bank');
    expect(at("The teacher's desk was clean.", 'teacher')).toBe("teacher's");
  });

  it('still marks a normal separable phrasal verb', () => {
    expect(at('Please give it up now.', 'give up')).toBe('give it up');
    expect(at('Turn the small light off.', 'turn off')).toBe('Turn the small light off');
  });
});
