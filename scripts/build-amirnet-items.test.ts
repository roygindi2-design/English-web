import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SQL = 'supabase/seed/0006_amirnet_items.sql';
const DATA = join('data', 'generated');

/**
 * `T-310` — the ingest that carries `K-006`'s items from files into `public.amirnet_items`.
 *
 * Same shape as `build-ingest-sql.test.ts`, and for the same measured reason (`F-048ⓑ`): the
 * generator writes wherever `SEED_OUT_DIR` points, this suite points it at a throwaway
 * directory, asserts against THAT, and then asserts the committed file is byte-identical.
 * ⇒ a seed that has fallen behind `data/generated/` is a RED TEST, ⛔ not a silence that
 * repairs itself on the next agent's `npm test`.
 *
 * ⚠️ The script exits **non-zero** whenever it refused an item, and it refuses 10 today
 * (`F-235` — the 10 `rc` questions carry no `vocab_band`). So `run()` ⛔ cannot use a bare
 * `execFileSync`: a refusal is an expected, reported state of this bank, ⛔ not a crash.
 */
const OUT_DIR = mkdtempSync(join(tmpdir(), 'seed-amirnet-'));
const FRESH = join(OUT_DIR, '0006_amirnet_items.sql');

interface Run {
  readonly stdout: string;
  readonly stderr: string;
  readonly status: number;
}

function run(env: Record<string, string> = {}): Run {
  try {
    const stdout = execFileSync('node', ['scripts/build-amirnet-items.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, SEED_OUT_DIR: OUT_DIR, ...env },
    });
    return { stdout, stderr: '', status: 0 };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string; status?: number };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', status: err.status ?? 1 };
  }
}

const first = run();
const sql = (): string => readFileSync(FRESH, 'utf8');

/** Every item in every file, flattened the way the table stores them. */
function sourceItems(): { id: string; type: string; stemEn: string; band: unknown }[] {
  const out: { id: string; type: string; stemEn: string; band: unknown }[] = [];
  for (const file of readdirSync(DATA).filter((f) => /^amirnet-items-.*\.jsonl$/.test(f)).sort()) {
    for (const line of readFileSync(join(DATA, file), 'utf8').split('\n').filter((l) => l.trim() !== '')) {
      const rec = JSON.parse(line) as Record<string, unknown>;
      if (rec.type === 'rc' && Array.isArray(rec.questions)) {
        for (const q of rec.questions as Record<string, unknown>[]) {
          out.push({ id: String(q.id), type: 'rc', stemEn: String(q.stemEn), band: q.vocab_band });
        }
      } else {
        out.push({ id: String(rec.id), type: String(rec.type), stemEn: String(rec.stemEn), band: rec.vocab_band });
      }
    }
  }
  return out;
}

describe('build-amirnet-items — the bank stops being a file nobody reads (T-310)', () => {
  it('writes only where SEED_OUT_DIR points — `npm test` ⛔ never dirties the repo (F-048ⓑ)', () => {
    expect(existsSync(FRESH), `${FRESH} — generator ignored SEED_OUT_DIR`).toBe(true);
  });

  it('every COMPLETE item lands, ⛔ and none is silently dropped', () => {
    const complete = sourceItems().filter((i) => [1000, 2000, 3000].includes(Number(i.band)));
    expect(complete.length).toBeGreaterThan(0);
    for (const item of complete) {
      // The stem as SQL sees it — the doubling is the whole of the escaping.
      expect(sql(), item.id).toContain(item.stemEn.replaceAll("'", "''"));
    }
    expect(first.stdout).toContain(`${complete.length} items emitted`);
  });

  it('⛔ REFUSES an item the TABLE cannot take, loudly, by name and by reason (ⓑ)', () => {
    const incomplete = sourceItems().filter((i) => ![1000, 2000, 3000].includes(Number(i.band)));
    expect(incomplete.length, 'nothing incomplete ⇒ this assertion has stopped measuring').toBeGreaterThan(0);
    for (const item of incomplete) {
      expect(first.stderr, item.id).toContain(item.id);
      expect(sql(), `${item.id} was emitted despite being incomplete`).not.toContain(item.stemEn.replaceAll("'", "''"));
    }
    expect(first.stderr).toContain('vocab_band absent');
    // ⛔ Loud is not a word — it is the exit code.
    expect(first.status).not.toBe(0);
  });

  it('⛔ NEVER invents the missing field — the refused item appears in ⛔ no form in the SQL', () => {
    // `R-010`: a band the script chose would be a statistic about a learner's vocabulary
    // that ⛔ nobody measured. The absence must survive the build.
    expect(first.stderr).toContain('⛔ NOT inferred here');
    expect(sql()).not.toContain('rc-l1-chapter-01');
  });

  it('a SECOND run over the same input is byte-identical, and inserts nothing twice (ⓒ)', () => {
    const before = sql();
    run();
    expect(sql()).toBe(before);
    expect(before).toContain('on conflict (type, level, stem_en) do nothing;');
  });

  it('every emitted row carries `original` — ⛔ nothing is ever copied from a commercial bank (R-010)', () => {
    const sources = [...sql().matchAll(/, '([a-z]+)'\)(?:,|\n)/g)].map((m) => m[1]);
    expect(sources.length).toBeGreaterThan(0);
    expect(new Set(sources)).toEqual(new Set(['original']));
  });

  it('⛔ refuses an item file that ⛔ no manifest declares — provenance is a STOP, ⛔ not a default', () => {
    const dir = mkdtempSync(join(tmpdir(), 'amirnet-undeclared-'));
    writeFileSync(join(dir, 'amirnet-items-2026-01-01-sc.jsonl'), '{"id":"x","type":"sc"}\n', 'utf8');
    const r = run({ AMIRNET_ITEMS_DIR: dir });
    expect(r.status).not.toBe(0);
    expect(`${r.stdout}${r.stderr}`).toContain('no amirnet manifest declares');
  });

  it('the COMMITTED seed is byte-identical to a fresh build — staleness is a red test', () => {
    expect(existsSync(SQL), `${SQL} — run \`npm run build:amirnet-items\``).toBe(true);
    expect(readFileSync(SQL, 'utf8')).toBe(sql());
  });
});
