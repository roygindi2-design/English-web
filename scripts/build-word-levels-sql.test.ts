/**
 * T-010 · the emitter's contract. Every assertion here is about what the file MAY NOT
 * contain — an insert, a sense, a backslash escape, an id-keyed update — because the
 * whole point of the seed is that an outside profile lands beside our own label and
 * never on top of it.
 */
/**
 * ⚠️ MEASURED 2026-08-12T18:43Z — two mutations survive this file, and neither can be
 * killed from here. Recorded so the next agent does not read green and infer coverage:
 *
 *   ⓐ escaping `'` as `\'` instead of `''` — no headword in the 306-pair corpus contains
 *     an apostrophe, so both versions emit byte-identical SQL. The `not.toMatch(/\\'/)`
 *     assertion below is therefore vacuous TODAY and becomes real the first time a
 *     batch ships a word like "o'clock".
 *   ⓑ dropping `.sort()` on the batch filenames — readdir already returns them sorted
 *     here, so the pinned-first-headword test cannot see the difference. It fires on a
 *     filesystem that returns another order.
 *
 * A third — dropping the `if (w.profileBand === null) continue` guard — is unkillable
 * for a different and better reason: unmatched is 0. See the comment on that test.
 * The band→source rule was the fourth, and it was moved into lib/core/wordLevel.ts
 * rather than documented, because there it CAN be exercised.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeAll, describe, expect, it } from 'vitest';

const OUT = 'supabase/seed/0002_word_cefr_levels.sql';

/** F-048ⓑ · see the long note in scripts/build-ingest-sql.test.ts — same defect, same fix. */
const OUT_DIR = mkdtempSync(join(tmpdir(), 'seed-levels-'));
const FRESH = join(OUT_DIR, '0002_word_cefr_levels.sql');
const run = (): string =>
  execFileSync('node', ['scripts/build-word-levels-sql.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, SEED_OUT_DIR: OUT_DIR },
  });

let sql = '';

beforeAll(() => {
  run();
  // ⛔ Guarded, not bare — see the note in build-ingest-sql.test.ts: a throw here takes
  // the suite down before the SEED_OUT_DIR assertion can fire by name.
  sql = existsSync(FRESH) ? readFileSync(FRESH, 'utf8') : '';
}, 120_000);

describe('build-word-levels-sql', () => {
  /**
   * ⚠️ The plan asserted `sql.trimStart().startsWith('begin;')`, which contradicts the
   * plan's own emitter: it writes a five-line provenance header first, and a later test
   * in this same file requires that header to name both sources. Both cannot hold. The
   * intent behind the assertion — everything that writes is inside ONE transaction, so a
   * partial apply is impossible — is what is asserted instead, and it is strictly
   * stronger: a second `begin;` or an update after `commit;` now fails.
   */
  it('wraps every write in exactly one transaction', () => {
    const lines = sql.split('\n');
    const begins = lines.filter((l) => l.trim() === 'begin;');
    const commits = lines.filter((l) => l.trim() === 'commit;');
    expect({ begins: begins.length, commits: commits.length }).toEqual({ begins: 1, commits: 1 });

    const first = lines.findIndex((l) => l.trim() === 'begin;');
    const last = lines.findIndex((l) => l.trim() === 'commit;');
    expect(last).toBeGreaterThan(first);
    for (const [i, l] of lines.entries()) {
      if (!l.startsWith('update ')) continue;
      expect(i, l).toBeGreaterThan(first);
      expect(i, l).toBeLessThan(last);
    }
    // Nothing but the header may precede the transaction.
    for (const l of lines.slice(0, first)) expect(l === '' || l.startsWith('--'), l).toBe(true);
    expect(sql.trimEnd().endsWith('commit;')).toBe(true);
  });

  it('only ever updates — it never inserts a word', () => {
    expect(sql).not.toMatch(/insert\s+into/i);
    expect(sql).toMatch(/update public\.words/);
  });

  it('never touches senses.cefr_level', () => {
    expect(sql).not.toMatch(/senses/);
    expect(sql).not.toMatch(/\bcefr_level\b/);
  });

  it('keys every update on (headword, pos) — the unique pair, not an id', () => {
    for (const stmt of sql.split('\n').filter((l) => l.startsWith('update public.words'))) {
      expect(stmt, stmt).toMatch(/where headword = '.*' and pos = '.*';$/);
    }
  });

  it('never writes a band without its source, or a source without its band', () => {
    for (const stmt of sql.split('\n').filter((l) => l.startsWith('update public.words'))) {
      expect(stmt, stmt).toMatch(
        /set cefr_profile_band = '(A1|A2|B1|B2|C1|C2)', cefr_profile_source = '(cefr-j-1\.5|octanove-1\.0)' /,
      );
    }
  });

  it('attributes C1/C2 to Octanove and everything else to CEFR-J', () => {
    for (const stmt of sql.split('\n').filter((l) => l.startsWith('update public.words'))) {
      const band = /cefr_profile_band = '([A-C][12])'/.exec(stmt)?.[1];
      const source = /cefr_profile_source = '([^']+)'/.exec(stmt)?.[1];
      expect(source, stmt).toBe(band === 'C1' || band === 'C2' ? 'octanove-1.0' : 'cefr-j-1.5');
    }
  });

  it('escapes a quote by doubling it and never by a backslash', () => {
    expect(sql).not.toMatch(/\\'/);
  });

  it('states both sources in the header', () => {
    expect(sql).toMatch(/cefr-j-1\.5/);
    expect(sql).toMatch(/octanove-1\.0/);
  });

  it('is byte-identical across two runs', () => {
    const first = sql;
    run();
    expect(readFileSync(FRESH, 'utf8')).toBe(first);
  });

  /**
   * The plan flagged that mutation 5 (dropping .sort() on the batch filenames) may
   * survive when readdir order happens to be stable, and asked for a pin. This is it:
   * the first update's headword is fixed by the earliest batch file, so an unsorted
   * read reorders the whole file.
   */
  it('pins the first emitted headword, so an unsorted batch read is visible', () => {
    const first = sql.split('\n').find((l) => l.startsWith('update public.words'));
    expect(first).toMatch(/where headword = 'work' and pos = 'noun';$/);
  });

  /**
   * ⚠️ The plan's test here was *emits no row for an unmatched word*, pinned on
   * 'program'/noun. It is deleted, not weakened: re-measured with the real
   * levelOf (2026-08-12T18:39Z) the profiles cover **all 306 pairs — unmatched is 0**,
   * 'program' included, so that assertion would have failed for the right reason and
   * passing it would have required pretending a word is uncovered. What replaces it is
   * the invariant the guard actually maintains: one update line per word the profile
   * covers. ⛔ Today unmatched is 0, so this cannot catch a dropped guard — it catches
   * it the day a batch adds a word the profiles miss. The null contract itself is held
   * by lib/core/wordLevel.test.ts, where an unmatched word can be constructed.
   */
  it('emits exactly one update per covered word, and none for the rest', () => {
    const header = /(\d+) words · \d+ exact_pos · \d+ lemma_only · (\d+) unmatched/.exec(sql);
    expect(header, 'report line missing from header').not.toBeNull();
    const covered = Number(header?.[1]) - Number(header?.[2]);
    const updates = sql.split('\n').filter((l) => l.startsWith('update public.words'));
    expect(updates).toHaveLength(covered);
  });

  it('prints the measured report to stdout', () => {
    expect(run()).toMatch(
      /\d+ words · \d+ exact_pos · \d+ lemma_only · \d+ unmatched · \d+ agree · \d+ disagree/,
    );
  });

  it('leaves the output file in the repo', () => {
    expect(existsSync(OUT)).toBe(true);
  });

  it('writes only where SEED_OUT_DIR points — `npm test` never dirties the repo (F-048ⓑ)', () => {
    // Drop the override in the generator and this path is never created.
    expect(existsSync(FRESH), `${FRESH} — generator ignored SEED_OUT_DIR`).toBe(true);
  });

  it('keeps the committed seed in step with data/generated — a stale seed is content no learner ever sees (F-048ⓐ)', () => {
    expect(
      readFileSync(OUT).equals(readFileSync(FRESH)),
      `${OUT} is behind data/generated — run \`npm run build:levels\` and commit it in the same commit as the batch`,
    ).toBe(true);
  });
});
