/**
 * Text -> entries. Pure: these functions take the CONTENTS of a file, never a
 * path. All file reading lives in scripts/measure-coverage.mjs.
 *
 * Every parser reports `skipped`. No agent in this loop has seen the real
 * source files (TD-17 blocks every data domain), so a parser that quietly
 * yields nothing would produce a "0% coverage" headline that is a bug report
 * about us, not a fact about Hebrew. The runner refuses to print a percentage
 * above MAX_SKIP_RATE.
 */

import type { CoverageReport, SourceEntry } from './coverage';

export interface ParseResult {
  readonly entries: readonly SourceEntry[];
  readonly lines: number;
  readonly skipped: number;
}

/** A parser that misses more than 0.5% of its input is broken, not lossy. */
export const MAX_SKIP_RATE = 0.005;

export function skipRate(r: ParseResult): number {
  if (r.lines === 0) return 0;
  return r.skipped / r.lines;
}

/** U+FEFF, written as an escape so it is visible in a diff. */
const BOM = /^﻿/;

function dataLines(text: string): string[] {
  return text
    .replace(BOM, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '' && !l.trimStart().startsWith('#'));
}

const TSV_HEADER = /^(en|english|source|word|headword)\t/i;

export function parsePairsTsv(text: string): ParseResult {
  const entries: SourceEntry[] = [];
  let lines = 0;
  let skipped = 0;

  for (const line of dataLines(text)) {
    if (TSV_HEADER.test(line)) continue;
    lines += 1;
    const cols = line.split('\t');
    const en = (cols[0] ?? '').trim();
    const he = (cols[1] ?? '').trim();
    if (en === '' || he === '') {
      skipped += 1;
      continue;
    }
    entries.push({ en, he });
  }

  return { entries, lines, skipped };
}

interface KaikkiTranslation {
  lang_code?: unknown;
  code?: unknown;
  word?: unknown;
}

/** Both spellings appear in wiktextract dumps depending on the vintage. */
function translationLang(t: KaikkiTranslation): string {
  if (typeof t.lang_code === 'string') return t.lang_code;
  if (typeof t.code === 'string') return t.code;
  return '';
}

export function parseKaikkiJsonl(text: string, targetLang: string): ParseResult {
  const entries: SourceEntry[] = [];
  let lines = 0;
  let skipped = 0;

  for (const line of dataLines(text)) {
    lines += 1;
    let doc: unknown;
    try {
      doc = JSON.parse(line);
    } catch {
      skipped += 1;
      continue;
    }
    if (typeof doc !== 'object' || doc === null) {
      skipped += 1;
      continue;
    }
    const record = doc as { word?: unknown; translations?: unknown };
    const en = typeof record.word === 'string' ? record.word.trim() : '';
    if (en === '') {
      skipped += 1;
      continue;
    }
    // A word with no Hebrew translation is a genuine absence, not a parse
    // failure — it is exactly what we are here to count.
    if (!Array.isArray(record.translations)) continue;

    for (const raw of record.translations as readonly unknown[]) {
      if (typeof raw !== 'object' || raw === null) continue;
      const t = raw as KaikkiTranslation;
      if (translationLang(t) !== targetLang) continue;
      const he = typeof t.word === 'string' ? t.word.trim() : '';
      if (he === '') continue;
      entries.push({ en, he });
    }
  }

  return { entries, lines, skipped };
}

/**
 * `charAt` and not `line[i]`: under `noUncheckedIndexedAccess` the index form is
 * `string | undefined`, and `field += undefined` appends the literal text
 * "undefined" to a field instead of failing loudly. `charAt` returns '' past the
 * end, which is what the lookahead below actually wants.
 */
function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const c = line.charAt(i);
    if (quoted) {
      if (c === '"' && line.charAt(i + 1) === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') {
        quoted = false;
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
  return out.map((f) => f.trim());
}

export function parseNgslCsv(text: string): {
  readonly headwords: readonly string[];
  readonly rows: number;
} {
  const lines = text
    .replace(BOM, '')
    .split(/\r?\n/)
    .filter((l) => l.trim() !== '');
  const headerLine = lines[0];
  if (headerLine === undefined) throw new Error('NGSL file is empty');

  const header = splitCsvLine(headerLine).map((h) => h.toLowerCase());
  const col = header.indexOf('headword');
  if (col === -1) {
    throw new Error(
      `NGSL file has no headword column — found [${header.join(', ')}]. See data/README.md`,
    );
  }

  const headwords: string[] = [];
  for (const line of lines.slice(1)) {
    const value = (splitCsvLine(line)[col] ?? '').trim();
    if (value !== '') headwords.push(value);
  }
  return { headwords, rows: headwords.length };
}

function policyRows(report: CoverageReport): string {
  const rows = report.perSource.map(
    (s) =>
      `| ${s.id} | ${s.label} | ${s.covered} / ${s.total} | **${s.percent}%** | ${s.acceptedGlosses} | ${s.rejectedGlosses} |`,
  );
  rows.push(
    `| — | **משולב (איחוד)** | ${report.combined.covered} / ${report.combined.total} | **${report.combined.percent}%** | — | — |`,
  );
  return rows.join('\n');
}

export function renderReportMarkdown(
  strict: CoverageReport,
  lenient: CoverageReport,
  generatedAt: string,
): string {
  return `# מדידת כיסוי עברית — R-005

> נוצר אוטומטית על ידי \`npm run measure:coverage\` בתאריך ${generatedAt}.
> ⛔ **זו מדידה בלבד (T-013 · T-016).** אין כאן בחירת מקור ואין כאן תרגום —
> ההכרעה על מקור התרגום היא של ה-PM על בסיס המספרים האלה. R-005.
> שני המספרים מוצגים כי \`plan/15-syllabus-digest.md\` § 2 ו-T-017 סותרים זה את זה — ראה F-021.

## STRICT — לפי התמצית § 2 (רשומת \`!\` ורשומה מנוקדת אינן נטענות)

| מקור | שם | מכוסות | אחוז | גלוסות שהתקבלו | גלוסות שנדחו |
|---|---|---|---|---|---|
${policyRows(strict)}

## LENIENT — לפי T-017 (ב)+(ג) ו-D-013 (נטענות, ומסוננות בתצוגה)

| מקור | שם | מכוסות | אחוז | גלוסות שהתקבלו | גלוסות שנדחו |
|---|---|---|---|---|---|
${policyRows(lenient)}

## מילים שאף מקור אינו מכסה (STRICT) — ${strict.uncovered.length}

${strict.uncovered.length === 0 ? '_אין._' : strict.uncovered.map((w) => `- ${w}`).join('\n')}
`;
}
