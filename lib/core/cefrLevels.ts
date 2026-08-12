/**
 * CEFR level labels from the two profiles already in data/ (T-010, pure half).
 *
 * CEFR-J 1.5 covers Pre-A1..B2, Octanove 1.0 covers C1..C2, and both ship the
 * same first three columns: headword,pos,CEFR. Pure: the caller reads the file.
 *
 * ⛔ Nothing here guesses a POS. An unrecognised tag becomes null and stays
 * reachable through the lemma-only route — measured cost of dropping instead:
 * 62 CEFR-J rows, a 0.79% skip rate, above MAX_SKIP_RATE.
 */
import { POS_VALUES, type Pos } from './contentSchema';
import { normalizeEnglish } from './lexicon';

export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export const BAND_ORDER: readonly CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const BANDS = new Set<string>(BAND_ORDER);
const POS_SET = new Set<string>(POS_VALUES);

/** Only unambiguous grammatical spellings. ⛔ Do not add a guess here. */
export const POS_ALIASES: Readonly<Record<string, Pos>> = Object.freeze({
  'be-verb': 'verb',
  'do-verb': 'verb',
  'have-verb': 'verb',
  'modal auxiliary': 'verb',
});

export interface LevelEntry {
  readonly lemma: string;
  readonly pos: Pos | null;
  readonly band: CefrBand;
}

export interface LevelParseResult {
  readonly entries: readonly LevelEntry[];
  readonly rows: number;
  readonly skipped: number;
  readonly unknownPos: number;
}

export interface LevelMap {
  readonly byLemmaPos: ReadonlyMap<string, CefrBand>;
  readonly byLemma: ReadonlyMap<string, CefrBand>;
}

export type LevelHit =
  | { readonly band: CefrBand; readonly route: 'exact_pos' | 'lemma_only' }
  | null;

/** RFC4180 enough for these files: quoted fields, embedded commas, "" escapes. */
export function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') { field += '"'; i += 1; } else quoted = false;
      } else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ',') { out.push(field); field = ''; }
    else field += c;
  }
  out.push(field);
  return out;
}

function toPos(raw: string): Pos | null {
  const v = raw.trim().toLowerCase();
  if (POS_SET.has(v)) return v as Pos;
  return POS_ALIASES[v] ?? null;
}

export function parseCefrCsv(text: string): LevelParseResult {
  const entries: LevelEntry[] = [];
  let rows = 0;
  let skipped = 0;
  let unknownPos = 0;

  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const cols = splitCsvLine(line);
    const band = cols[2]?.trim().toUpperCase() ?? '';
    // The header is identified by its band column, not by line number: a file
    // that ships without one must not lose its first real row, and a real row
    // whose headword happens to be "headword" must survive.
    if (cols[0]?.trim().toLowerCase() === 'headword' && !BANDS.has(band)) continue;
    rows += 1;
    if (!BANDS.has(band)) { skipped += 1; continue; }

    const pos = toPos(cols[1] ?? '');
    // Counted once per row, not once per slash variant: these counters feed the
    // measured skip/unknown rates, and a 4-spelling row is still one row.
    if (pos === null) unknownPos += 1;

    for (const variant of (cols[0] ?? '').split('/')) {
      const lemma = normalizeEnglish(variant);
      if (lemma === '') continue;
      entries.push({ lemma, pos, band: band as CefrBand });
    }
  }

  return { entries, rows, skipped, unknownPos };
}

function lower(a: CefrBand, b: CefrBand): CefrBand {
  return BAND_ORDER.indexOf(a) <= BAND_ORDER.indexOf(b) ? a : b;
}

export function buildLevelMap(entries: readonly LevelEntry[]): LevelMap {
  const byLemmaPos = new Map<string, CefrBand>();
  const byLemma = new Map<string, CefrBand>();
  for (const e of entries) {
    if (e.pos !== null) {
      const k = `${e.lemma}#${e.pos}`;
      const prev = byLemmaPos.get(k);
      byLemmaPos.set(k, prev ? lower(prev, e.band) : e.band);
    }
    const prevLemma = byLemma.get(e.lemma);
    byLemma.set(e.lemma, prevLemma ? lower(prevLemma, e.band) : e.band);
  }
  return { byLemmaPos, byLemma };
}

export function levelOf(map: LevelMap, lemma: string, pos: Pos): LevelHit {
  const key = normalizeEnglish(lemma);
  const exact = map.byLemmaPos.get(`${key}#${pos}`);
  if (exact) return { band: exact, route: 'exact_pos' };
  const loose = map.byLemma.get(key);
  if (loose) return { band: loose, route: 'lemma_only' };
  return null;
}
