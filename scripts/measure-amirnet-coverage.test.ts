import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

let root: string;
let vocabCsv: string;
let cefrjCsv: string;
let octanoveCsv: string;
let batchDir: string;
let reportOut: string;

const VOCAB_CSV = [
  'headword,pos,cefr,tier,tier_name,amirnet_level,is_connector,source',
  'set,verb,A2,1,ליבה,1-2,,CEFR-J v1.5',
  'about,preposition,A2,1,ליבה,1-2,true,CEFR-J v1.5',
  'abandon,verb,B1,2,ליבה מורחבת,2-3,,CEFR-J v1.5',
].join('\n');

const PROFILE_CSV = [
  'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold',
  'set,noun,A2,,,',
  'set,verb,A1,,,',
  'about,preposition,A2,,,',
  'about,adverb,B1,,,',
  'abandon,verb,B1,,,',
].join('\n');

function batchLine(headword: string, senseIndex: number, pos = 'noun') {
  return JSON.stringify({
    headword,
    pos,
    sense_index: senseIndex,
    definition_en: 'x',
    translation_he: 'x',
    cefr_level: 'A2',
    translation_confidence: 'high',
    examples: { supportive: `${headword} one`, neutral: `${headword} two` },
    items: [`____ one`],
    distractors: [
      { word: 'rest', relation_type: 'semantic' },
      { word: 'play', relation_type: 'semantic' },
      { word: 'word', relation_type: 'orthographic' },
      { word: 'window', relation_type: 'unrelated' },
    ],
    he_one_to_many_group: null,
    he_interference_note: null,
    n_letters: headword.length,
    n_syllables: 1,
    is_function_word: false,
    spot_check: false,
  });
}

function run(env: Record<string, string>) {
  return execFileSync('node', ['scripts/measure-amirnet-coverage.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'amirnet-coverage-'));
  vocabCsv = join(root, 'amirnet-vocab.csv');
  cefrjCsv = join(root, 'cefrj.csv');
  octanoveCsv = join(root, 'octanove.csv');
  batchDir = join(root, 'generated');
  reportOut = join(root, 'report.md');
  mkdirSync(batchDir, { recursive: true });
  writeFileSync(vocabCsv, VOCAB_CSV, 'utf8');
  writeFileSync(cefrjCsv, PROFILE_CSV, 'utf8');
  writeFileSync(octanoveCsv, 'headword,pos,CEFR,CoreInventory 1,CoreInventory 2,Threshold', 'utf8');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

function envFor() {
  return {
    AMIRNET_VOCAB_CSV: vocabCsv,
    CEFRJ_PROFILE_CSV: cefrjCsv,
    OCTANOVE_PROFILE_CSV: octanoveCsv,
    AMIRNET_BATCH_DIR: batchDir,
    AMIRNET_COVERAGE_REPORT_OUT: reportOut,
  };
}

describe('scripts/measure-amirnet-coverage.mjs', () => {
  it('prints the three K-007 numbers and writes the report, with no previous run', () => {
    writeFileSync(join(batchDir, 'batch-x.jsonl'), `${batchLine('set', 1)}\n${batchLine('set', 2)}\n${batchLine('about', 1)}\n`, 'utf8');

    const stdout = run(envFor());

    expect(stdout).toContain('2 / 3'); // existing: set + about, of 3 target headwords
    expect(stdout).toContain('shallow: 1'); // "about" only — "set" has 2 senses
    expect(stdout).toContain('אין דוח קודם');
    expect(existsSync(reportOut)).toBe(true);
    const report = readFileSync(reportOut, 'utf8');
    expect(report).toContain('MEASURED existingCount=2');
    expect(report).toContain('MEASURED polysemousShallowCount=1');
  });

  it('reports a delta against a previous report on the second run', () => {
    writeFileSync(join(batchDir, 'batch-x.jsonl'), `${batchLine('set', 1)}\n`, 'utf8');
    run(envFor()); // first run: existing=1/3 (set only; about/abandon missing) — this run's
    // own shallow count is not asserted here, only used to seed the report the second run diffs against.

    writeFileSync(join(batchDir, 'batch-y.jsonl'), `${batchLine('about', 1)}\n`, 'utf8');
    const stdout = run(envFor()); // second run: existing=2, delta +1

    expect(stdout).toContain('2 / 3');
    expect(stdout).toMatch(/existing.*\+1|\+1.*existing/i);
  });

  it('exits non-zero with a clear message when the vocab CSV is missing — never prints 0 as if empty', () => {
    rmSync(vocabCsv);
    expect.assertions(3);
    try {
      run(envFor());
    } catch (err: any) {
      expect(err.status).toBe(1);
      const output = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      expect(output).toContain(vocabCsv);
      expect(output).not.toMatch(/\b0 \/ 0\b/);
    }
  });
});
