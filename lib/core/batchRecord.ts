/**
 * batchRecord — the only place in the codebase where the Content agent's snake_case
 * jsonl shape is allowed to exist.
 *
 * A `data/generated/batch-*.jsonl` row is NOT a `GeneratedSense`: it is snake_case, it
 * carries eight fields the gate's type does not have, and `distractors[].relation_type`
 * is spelled differently from `relationType`. `JSON.parse(line) as GeneratedSense`
 * typechecks and is wrong at runtime — the gate would read `undefined` for every
 * distractor relation and quietly stop scoring them. Every field is therefore copied
 * by name, never spread.
 *
 * Pure: no fs, no network. File reading lives in `scripts/`.
 */
import {
  POS_VALUES,
  RELATION_TYPES,
  type GeneratedItem,
  type GeneratedSense,
  type Pos,
  type RelationType,
} from './contentSchema';

export const CONFIDENCE_VALUES = ['low', 'medium', 'high'] as const;
export type Confidence = (typeof CONFIDENCE_VALUES)[number];

export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
export type CefrLevel = (typeof CEFR_LEVELS)[number];

export interface BatchRecord {
  readonly sense: GeneratedSense;
  readonly senseIndex: number;
  readonly cefrLevel: CefrLevel;
  readonly confidence: Confidence;
  /** D-024: low confidence is SHOWN and MARKED, never hidden. */
  readonly needsHumanReview: boolean;
  readonly heInterferenceNote: string | null;
  readonly heOneToManyGroup: string | null;
  readonly spotCheck: boolean;
  /**
   * Word-level difficulty signals, carried because `public.words.n_letters` is
   * `not null` (migration 0002:51) — an ingest that omits them cannot insert a word
   * at all. They belong to the word, not to the sense, and are copied verbatim:
   * ⛔ `is_function_word` is never inferred here (see plan/03-for-roy.md item 8).
   */
  readonly nLetters: number;
  readonly nSyllables: number | null;
  readonly isFunctionWord: boolean;
}

type Row = Record<string, unknown>;

/**
 * Every thrown message names the SNAKE_CASE field, because the operator reading the
 * failure is looking at a jsonl file, not at our camelCase types.
 */
function field(raw: Row, name: string): unknown {
  const value = raw[name];
  if (value === undefined) throw new RangeError(`${name} is missing`);
  return value;
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw new RangeError(`${name}: ${JSON.stringify(value)} is not one of ${allowed.join('|')}`);
  }
  return value as T;
}

function text(raw: Row, name: string): string {
  const value = field(raw, name);
  if (typeof value !== 'string') throw new RangeError(`${name} is not a string`);
  return value;
}

function nullableText(raw: Row, name: string): string | null {
  const value = raw[name];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') throw new RangeError(`${name} is not a string or null`);
  return value;
}

function integer(raw: Row, name: string): number {
  const value = field(raw, name);
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new RangeError(`${name} is not an integer`);
  }
  return value;
}

function nullableInteger(raw: Row, name: string): number | null {
  const value = raw[name];
  if (value === undefined || value === null) return null;
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new RangeError(`${name} is not an integer or null`);
  }
  return value;
}

function boolean(raw: Row, name: string): boolean {
  const value = field(raw, name);
  if (typeof value !== 'boolean') throw new RangeError(`${name} is not a boolean`);
  return value;
}

function examples(raw: Row): { readonly supportive: string; readonly neutral: string } {
  const value = field(raw, 'examples');
  if (typeof value !== 'object' || value === null) throw new RangeError('examples is not an object');
  const obj = value as Row;
  return { supportive: text(obj, 'supportive'), neutral: text(obj, 'neutral') };
}

/**
 * D-141: an array element is either a legacy bare string (written before the
 * level/rationale rule existed — normalised to a declared-null, grandfathered
 * item) or a tagged object. Both shapes must keep parsing forever: 787 rows in
 * data/generated/batch-*.jsonl today use the bare-string shape, and re-running
 * `npm run build:ingest` over them must never throw or drop them.
 */
function items(raw: Row): readonly GeneratedItem[] {
  const value = field(raw, 'items');
  if (!Array.isArray(value)) throw new RangeError('items is not an array');
  return value.map((entry, i) => {
    if (typeof entry === 'string') return { stem: entry, level: null, levelRationale: null };
    if (typeof entry !== 'object' || entry === null) {
      throw new RangeError(`items[${i}] is not a string or an object`);
    }
    const obj = entry as Row;
    const stem = text(obj, 'stem');
    const rawLevel = obj.level;
    if (rawLevel !== undefined && rawLevel !== null && (typeof rawLevel !== 'number' || !Number.isInteger(rawLevel))) {
      throw new RangeError(`items[${i}].level is not an integer`);
    }
    const rawRationale = obj.level_rationale;
    if (rawRationale !== undefined && rawRationale !== null && typeof rawRationale !== 'string') {
      throw new RangeError(`items[${i}].level_rationale is not a string`);
    }
    return {
      stem,
      level: (rawLevel ?? null) as GeneratedItem['level'],
      levelRationale: rawRationale ?? null,
    };
  });
}

function distractors(raw: Row): readonly { readonly word: string; readonly relationType: RelationType }[] {
  const value = field(raw, 'distractors');
  if (!Array.isArray(value)) throw new RangeError('distractors is not an array');
  return value.map((entry, i) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new RangeError(`distractors[${i}] is not an object`);
    }
    const obj = entry as Row;
    // Built key by key: a spread would carry the snake_case `relation_type` alongside
    // the camelCase one and make the key-list assertion pass by accident.
    return {
      word: text(obj, 'word'),
      relationType: oneOf(field(obj, 'relation_type'), RELATION_TYPES, `distractors[${i}].relation_type`),
    };
  });
}

export function parseBatchRecord(raw: unknown): BatchRecord {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    throw new RangeError('row is not a JSON object');
  }
  const row = raw as Row;

  const confidence = oneOf(field(row, 'translation_confidence'), CONFIDENCE_VALUES, 'translation_confidence');

  // ⛔ No spread of `row` here: it would carry n_letters / is_function_word into the
  // object the gate receives and make the type a lie.
  const sense: GeneratedSense = {
    headword: text(row, 'headword'),
    pos: oneOf<Pos>(field(row, 'pos'), POS_VALUES, 'pos'),
    translationHe: text(row, 'translation_he'),
    definitionEn: text(row, 'definition_en'),
    examples: examples(row),
    items: items(row),
    distractors: distractors(row),
  };

  return {
    sense,
    senseIndex: integer(row, 'sense_index'),
    cefrLevel: oneOf(field(row, 'cefr_level'), CEFR_LEVELS, 'cefr_level'),
    confidence,
    // D-024, and NOT a copy of spot_check: they answer different questions, and today
    // they disagree (343 spot-checked, 1 needing review).
    needsHumanReview: confidence === 'low',
    heInterferenceNote: nullableText(row, 'he_interference_note'),
    heOneToManyGroup: nullableText(row, 'he_one_to_many_group'),
    spotCheck: boolean(row, 'spot_check'),
    nLetters: integer(row, 'n_letters'),
    nSyllables: nullableInteger(row, 'n_syllables'),
    isFunctionWord: boolean(row, 'is_function_word'),
  };
}

export function parseBatchFile(text_: string): BatchRecord[] {
  const out: BatchRecord[] = [];
  const lines = text_.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = (lines[i] ?? '').trim();
    if (line === '') continue;
    const lineNumber = i + 1;
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
    } catch (error) {
      throw new RangeError(`line ${lineNumber}: not valid JSON — ${(error as Error).message}`);
    }
    try {
      out.push(parseBatchRecord(parsed));
    } catch (error) {
      throw new RangeError(`line ${lineNumber}: ${(error as Error).message}`);
    }
  }
  return out;
}
