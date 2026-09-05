/**
 * Pure module behind `npm run measure:amirnet-coverage` (T-244 · `plan/25-content-
 * commissions.md` K-007 ⓐ+ⓑ). Zero fs, zero network — every file read lives in
 * `scripts/measure-amirnet-coverage.mjs`.
 *
 * Three numbers, and only these three (K-007's own text): how many of the Tier 1+2
 * amirnet headwords already have >=1 sense in the bank ("existing / target"); of the
 * ones that ARE in the bank and ARE genuinely polysemous (per the CEFR source
 * profiles, not per the bank itself — see polysemousHeadwords), how many still carry
 * only one sense ("shallow"); and the delta of both against the previous run.
 *
 * ⛔ This module never decides a level and never writes to the bank — it measures.
 */

export interface AmirnetVocabRow {
  readonly headword: string;
  readonly pos: string;
  readonly cefr: string;
  readonly tier: 1 | 2 | 3 | 4;
}

export interface CefrProfileRow {
  readonly headword: string;
  readonly pos: string;
}

export interface BankSenseRecord {
  readonly headword: string;
  readonly senseIndex: number;
}

export interface CoverageCounts {
  readonly targetTotal: number;
  readonly existingCount: number;
  readonly polysemousTargetCount: number;
  readonly polysemousShallowCount: number;
}

export interface CoverageDelta {
  readonly existingDelta: number | null;
  readonly polysemousShallowDelta: number | null;
}

export interface PreviousCoverageReport {
  readonly existingCount: number;
  readonly polysemousShallowCount: number;
}

/** RFC4180-lite: quoted fields, embedded commas, "" escapes — same rule as
 *  scripts/build-amirnet-vocab.mjs's splitCsvLine, reimplemented here (not
 *  imported) so this module stays fs-free and that already-shipped script
 *  stays untouched. Any future drift between the two should be a deliberate,
 *  separately-reviewed refactor, not a side effect of this task. */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line[i];
    if (quoted) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"') {
      quoted = true;
    } else if (c === ',') {
      out.push(field);
      field = '';
    } else {
      field += c;
    }
  }
  out.push(field);
  return out;
}

function stripBom(text: string): string {
  return text.length > 0 && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function nonEmptyLines(text: string): string[] {
  return stripBom(text)
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '');
}

const VALID_TIER = new Set([1, 2, 3, 4]);

export function parseAmirnetVocabCsv(text: string): AmirnetVocabRow[] {
  const lines = nonEmptyLines(text);
  const rows: AmirnetVocabRow[] = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const headword = (cols[0] ?? '').trim();
    if (headword.toLowerCase() === 'headword') continue; // header row
    const pos = (cols[1] ?? '').trim();
    const cefr = (cols[2] ?? '').trim();
    const tierNum = Number((cols[3] ?? '').trim());
    if (headword === '' || !VALID_TIER.has(tierNum)) continue;
    rows.push({ headword, pos, cefr, tier: tierNum as 1 | 2 | 3 | 4 });
  }
  return rows;
}

const BAND_ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export function parseCefrProfileCsv(text: string): CefrProfileRow[] {
  const lines = nonEmptyLines(text);
  const rows: CefrProfileRow[] = [];
  for (const line of lines) {
    const cols = splitCsvLine(line);
    const headword = (cols[0] ?? '').trim();
    const pos = (cols[1] ?? '').trim().toLowerCase();
    const band = (cols[2] ?? '').trim().toUpperCase();
    if (headword === '') continue;
    if (headword.toLowerCase() === 'headword' && !BAND_ORDER.includes(band)) continue; // header row
    if (!BAND_ORDER.includes(band)) continue;
    rows.push({ headword, pos });
  }
  return rows;
}

/** A headword is polysemous here iff the CEFR source profiles record it under 2+
 *  DISTINCT `pos` values, at any band, in either file combined — e.g. "set" as both
 *  noun and verb. This is the only per-sense-of-speech signal in the repo; the
 *  already-deduplicated `data/amirnet-vocab.csv` cannot answer this question by
 *  itself (see this plan's "Live measurements" section). */
export function polysemousHeadwords(rows: readonly CefrProfileRow[]): Set<string> {
  const posByHeadword = new Map<string, Set<string>>();
  for (const { headword, pos } of rows) {
    const set = posByHeadword.get(headword) ?? new Set<string>();
    set.add(pos);
    posByHeadword.set(headword, set);
  }
  const result = new Set<string>();
  for (const [headword, posSet] of posByHeadword) {
    if (posSet.size >= 2) result.add(headword);
  }
  return result;
}

export function computeCoverage(args: {
  vocabRows: readonly AmirnetVocabRow[];
  profileRows: readonly CefrProfileRow[];
  bankRecords: readonly BankSenseRecord[];
}): CoverageCounts {
  const { vocabRows, profileRows, bankRecords } = args;
  const targetHeadwords = vocabRows.filter((r) => r.tier === 1 || r.tier === 2).map((r) => r.headword);
  const targetSet = new Set(targetHeadwords);

  const senseIndicesByHeadword = new Map<string, Set<number>>();
  for (const { headword, senseIndex } of bankRecords) {
    if (!targetSet.has(headword)) continue; // only the target set matters for these counts
    const set = senseIndicesByHeadword.get(headword) ?? new Set<number>();
    set.add(senseIndex);
    senseIndicesByHeadword.set(headword, set);
  }

  const existingCount = targetHeadwords.filter((h) => senseIndicesByHeadword.has(h)).length;

  const polysemous = polysemousHeadwords(profileRows);
  const polysemousTargetCount = targetHeadwords.filter((h) => polysemous.has(h)).length;

  let polysemousShallowCount = 0;
  for (const h of targetHeadwords) {
    if (!polysemous.has(h)) continue;
    const senseCount = senseIndicesByHeadword.get(h)?.size ?? 0;
    if (senseCount === 1) polysemousShallowCount += 1;
  }

  return {
    targetTotal: targetHeadwords.length,
    existingCount,
    polysemousTargetCount,
    polysemousShallowCount,
  };
}

export function diffCoverage(
  current: CoverageCounts,
  previous: PreviousCoverageReport | null,
): CoverageDelta {
  if (previous === null) return { existingDelta: null, polysemousShallowDelta: null };
  return {
    existingDelta: current.existingCount - previous.existingCount,
    polysemousShallowDelta: current.polysemousShallowCount - previous.polysemousShallowCount,
  };
}

function formatDelta(n: number | null): string {
  if (n === null) return 'אין דוח קודם';
  if (n === 0) return '±0';
  return n > 0 ? `+${n}` : `${n}`;
}

/** ⛔ Generated file — regenerated every run, never hand-edited (HARD INVARIANTS).
 *  The two `<!-- MEASURED ... -->` marker lines are the ONLY contract
 *  `parsePreviousCoverageReport` relies on; the prose around them is free to change. */
export function formatCoverageReport(
  counts: CoverageCounts,
  delta: CoverageDelta,
  measuredAtIso: string,
): string {
  return [
    '# דוח כיסוי אמירנ״ט',
    '',
    '⛔ קובץ נגזר — נכתב מחדש בכל הרצה של `npm run measure:amirnet-coverage`. אל תערוך ביד.',
    '',
    `נמדד: ${measuredAtIso}`,
    '',
    `- קיימות בבנק: **${counts.existingCount} / ${counts.targetTotal}** (Tier 1+2) — דלתא מההרצה הקודמת: ${formatDelta(delta.existingDelta)}`,
    `- כותרות רב-משמעיות ב-Tier 1+2 (לפי מאגרי ה-CEFR): **${counts.polysemousTargetCount}**`,
    `- מהן, נושאות משמעות אחת בלבד בבנק (רדודות): **${counts.polysemousShallowCount}** — דלתא מההרצה הקודמת: ${formatDelta(delta.polysemousShallowDelta)}`,
    '',
    `<!-- MEASURED existingCount=${counts.existingCount} -->`,
    `<!-- MEASURED polysemousShallowCount=${counts.polysemousShallowCount} -->`,
    '',
  ].join('\n');
}

export function parsePreviousCoverageReport(text: string): PreviousCoverageReport | null {
  const existingMatch = /<!-- MEASURED existingCount=(\d+) -->/.exec(text);
  const shallowMatch = /<!-- MEASURED polysemousShallowCount=(\d+) -->/.exec(text);
  if (existingMatch === null || shallowMatch === null) return null;
  return {
    existingCount: Number(existingMatch[1]),
    polysemousShallowCount: Number(shallowMatch[1]),
  };
}
