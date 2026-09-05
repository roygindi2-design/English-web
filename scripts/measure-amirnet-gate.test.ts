import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const OUT_DIR = mkdtempSync(join(tmpdir(), 'amirnet-gate-report-'));
const FRESH = join(OUT_DIR, 'amirnet-gate-report.md');
const ITEMS_DIR = mkdtempSync(join(tmpdir(), 'amirnet-items-'));

afterEach(() => {
  rmSync(ITEMS_DIR, { recursive: true, force: true });
  mkdirSync(ITEMS_DIR, { recursive: true });
});

// ⚠️ Points AMIRNET_VOCAB_CSV at a path that never exists, so loadVocabTiers()
// always returns an empty map here: the real data/generated/amirnet-vocab.csv
// carries thousands of real English words at real tiers, and the fixtures
// below reuse ordinary words (`report`, `committee`, `merger`...) that could
// silently land above the fixture's level in a future re-derivation of that
// file (T-222 is allowed to change its numbers). vocab_above_tier itself is
// exercised in isolation by lib/core/amirnetItemGate.test.ts against a fixed,
// tiny tier map — this file only proves the CLI wiring, not the gate logic.
const NO_VOCAB_CSV = join(ITEMS_DIR, 'no-such-vocab.csv');

const run = (): string =>
  execFileSync('node', ['scripts/measure-amirnet-gate.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      AMIRNET_GATE_REPORT_OUT: FRESH,
      AMIRNET_ITEMS_DIR: ITEMS_DIR,
      AMIRNET_VOCAB_CSV: NO_VOCAB_CSV,
    },
  });

describe('scripts/measure-amirnet-gate.mjs', () => {
  it('reports zero files cleanly — content is still blocked on K-006', () => {
    const stdout = run();
    expect(stdout).toContain('0 amirnet item files found');
    expect(stdout).not.toMatch(/error|exception/i);
    const fresh = readFileSync(FRESH, 'utf8');
    expect(fresh).toContain('0 files');
  });

  it('gates a well-formed sc item file and reports it green', () => {
    const item = {
      type: 'sc',
      level: 1,
      stemEn: 'The store was ______ so we came back later.',
      passageEn: '',
      options: [
        { textEn: 'closed', reason: 'correct — matches "came back later"' },
        { textEn: 'open', reason: 'contradicts the reason given' },
        { textEn: 'noisy', reason: 'unrelated' },
        { textEn: 'painted', reason: 'unrelated' },
      ],
      correctIndex: 0,
      levelRationale: 'one blank, common vocabulary',
      source: 'original',
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-sc-2026-09-05.jsonl'), `${JSON.stringify(item)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 amirnet item files found');
    expect(stdout).toContain('1 items gated');
    expect(stdout).toContain('0 items rejected');
  });

  it('gates a broken item and reports the rejection, non-zero-exiting nothing (report-only, R-014)', () => {
    const item = {
      type: 'sc',
      level: 1,
      stemEn: 'The store was ______ so we came back later.',
      passageEn: '',
      options: [{ textEn: 'closed', reason: 'correct' }],
      correctIndex: 0,
      levelRationale: 'one blank',
      source: 'original',
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-sc-broken.jsonl'), `${JSON.stringify(item)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 items rejected');
    expect(stdout).toContain('wrong_option_count');
  });

  it('gates an rc chapter file (the questions[] wrapper shape), 5 questions at once', () => {
    // 188 words — same fixture passage as lib/core/amirnetChapterGate.test.ts.
    const passageEn =
      'The committee spent three months preparing its final report on the ' +
      'proposed merger between the two regional transport companies. Members ' +
      'disagreed sharply on almost every point under discussion, and the ' +
      'disagreements grew more public as the deadline approached, with several ' +
      'members giving interviews that hinted at the internal disputes long ' +
      'before the report was due. In the end the committee\'s final report was ' +
      'deliberately ambiguous, allowing both sides of the dispute to claim ' +
      'afterward that their position had been endorsed by the group as a ' +
      'whole. Critics called the decision a failure of leadership, arguing ' +
      'that a clear recommendation, even an unpopular one, would have served ' +
      'the public better than a document that satisfied no one fully. ' +
      'Supporters described it as the only realistic way to keep the group ' +
      'from splitting apart entirely over a single disputed clause about ' +
      'ticket pricing. Neither side has changed its account of the meeting ' +
      'since the report was published two months ago, and no further ' +
      'statement is expected before the board\'s review in the spring, which ' +
      'several members now say they expect to be delayed regardless of what ' +
      'the report ultimately recommends.';
    const q = (n: number, correctIndex: number) => ({
      stemEn: `Question ${n} about the passage?`,
      options: [
        { textEn: 'correct answer text', reason: 'correct — matches the passage' },
        { textEn: 'distractor one', reason: 'plausible but unstated' },
        { textEn: 'distractor two', reason: 'confuses a later detail' },
        { textEn: 'distractor three', reason: 'contradicts the passage' },
      ].map((o, i) => (i === correctIndex ? o : { textEn: `${o.textEn} ${n}`, reason: o.reason })),
      correctIndex,
      levelRationale: 'academic topic, 180-230 words',
      source: 'original',
    });
    const chapter = {
      type: 'rc',
      level: 3,
      passageEn,
      questions: [q(1, 0), q(2, 1), q(3, 2), q(4, 3), q(5, 1)],
    };
    writeFileSync(join(ITEMS_DIR, 'amirnet-items-rc-2026-09-05.jsonl'), `${JSON.stringify(chapter)}\n`, 'utf8');
    const stdout = run();
    expect(stdout).toContain('1 amirnet item files found');
    expect(stdout).toContain('5 items gated');
    expect(stdout).toContain('0 items rejected');
  });
});
