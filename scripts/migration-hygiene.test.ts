import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The apply order of supabase/migrations/ is its filename order, and nothing
 * else records it. Two files under one number is not a typo — it is an
 * undefined order between two DDL scripts, and 0003_ was in exactly that state
 * from C-0029 until the rename on 2026-08-19 (see ORDER_TOKEN below). Same
 * reasoning as scripts/plan-hygiene.test.ts (F-025): a human reading a
 * directory will not catch the next collision either.
 */
const FILES = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();

/**
 * ⚠️ The 0003 collision was RESOLVED by rename on 2026-08-19, on Roy's live
 * instruction, and the exemption is gone. The reason it stood for so long —
 * "`supabase db push` records the filename in its own table, so re-hashing an
 * applied migration is worse than one documented pair" — was **measured and
 * found not to apply to this project**: there is no `supabase/config.toml` and
 * no linked CLI project, and `docs/SETUP.md` documents every migration as a
 * manual paste into the Supabase SQL editor. With no CLI bookkeeping there is
 * no hash to invalidate, so the rename costs nothing that the collision was
 * being tolerated to protect. Roy confirmed both files had already been run.
 *
 * The invariant is now stated as what it always meant: apply order is filename
 * order, so every file needs a UNIQUE ORDERING TOKEN — not merely a unique
 * number. `0003a_` and `0003b_` are distinct tokens that both still sort
 * between `0002_` and `0004_`, which is what an in-place ordering fix requires
 * when every later number is taken.
 */
const ORDER_TOKEN = /^(\d{4}[a-z]?)_[a-z0-9_]+\.sql$/;

function orderTokens(files: string[]): string[] {
  return files.map((f) => ORDER_TOKEN.exec(f)?.[1] ?? f);
}

function prefixes(files: string[]): number[] {
  return files.map((f) => Number(f.slice(0, 4)));
}

describe('supabase/migrations — apply order', () => {
  it('has files at all (guards the glob, not just the rule)', () => {
    // Without this every assertion below passes vacuously over an empty list.
    expect(FILES.length).toBeGreaterThanOrEqual(6);
  });

  it('names every file NNNN[a-z]_snake_case.sql', () => {
    for (const f of FILES) expect(f, `${f} is misnamed`).toMatch(ORDER_TOKEN);
  });

  it('uses each ordering token at most once — ⛔ no exemptions left', () => {
    const seen = new Map<string, number>();
    for (const t of orderTokens(FILES)) seen.set(t, (seen.get(t) ?? 0) + 1);
    const dupes = [...seen.entries()].filter(([, c]) => c > 1).map(([t, c]) => `${t}×${c}`);
    expect(dupes, 'two DDL scripts under one token have no defined order').toEqual([]);
  });

  it('a lettered token still sorts inside its own number, ⛔ not after the next one', () => {
    // The whole point of 0003a/0003b: an in-place fix when 0004+ are all taken.
    // If this ever stopped holding, the rename would have silently REORDERED the
    // schema instead of merely disambiguating it.
    expect(['0004_x.sql', '0003b_x.sql', '0003a_x.sql', '0002_x.sql'].sort()).toEqual([
      '0002_x.sql',
      '0003a_x.sql',
      '0003b_x.sql',
      '0004_x.sql',
    ]);
  });

  it('leaves no gap in the sequence', () => {
    const nums = [...new Set(prefixes(FILES))].sort((a, b) => a - b);
    expect(nums[0]).toBe(1);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
});

/**
 * F-051 · a `drop policy if exists` naming a policy that no migration ever created is a
 * silent no-op, and it reads exactly like a replacement. 0003 carried three of them, so
 * 0002's four content policies survived and every content table ended up with TWO live
 * SELECT policies. Postgres ORs permissive policies, so nothing broke — which is the
 * whole danger: the file states one rule and the database enforces another, and the
 * discrepancy cannot surface until someone reverts the policy they think is the only one.
 */
interface PolicyRef {
  readonly name: string;
  readonly table: string;
}

const CREATE_POLICY = /create\s+policy\s+"([^"]+)"\s+on\s+([\w.]+)/gi;
const DROP_POLICY = /drop\s+policy\s+if\s+exists\s+"([^"]+)"\s+on\s+([\w.]+)/gi;

const bare = (qualified: string): string => qualified.split('.').at(-1) ?? qualified;
const key = (ref: PolicyRef): string => `${ref.table}.${ref.name}`;

function matches(text: string, pattern: RegExp): PolicyRef[] {
  const found: PolicyRef[] = [];
  for (const m of text.matchAll(new RegExp(pattern))) {
    const name = m[1];
    const table = m[2];
    // noUncheckedIndexedAccess: a group that did not participate is not a match we can use.
    if (name === undefined || table === undefined) continue;
    found.push({ name, table: bare(table) });
  }
  return found;
}

const SOURCES = FILES.map((f) => ({
  file: f,
  text: readFileSync(join('supabase/migrations', f), 'utf8'),
}));

/** Replays every create/drop in apply order and returns what is still live at the end. */
function livePolicies(): PolicyRef[] {
  const live = new Map<string, PolicyRef>();
  for (const { text } of SOURCES) {
    for (const line of text.split('\n')) {
      for (const ref of matches(line, DROP_POLICY)) live.delete(key(ref));
      for (const ref of matches(line, CREATE_POLICY)) live.set(key(ref), ref);
    }
  }
  return [...live.values()];
}

/**
 * The three no-ops that already shipped in 0003a. ⚠️ The old justification here cited
 * supabase's bookkeeping hash — the same claim the rename above measured and discarded —
 * so the honest reason is the narrower one: these three drops are no-ops, deleting them
 * changes no behaviour on a fresh rebuild and changes nothing on the live database either,
 * which makes the edit pure churn against an applied file. 0011 fixes the CONSEQUENCE.
 * This list exists to stop a FOURTH no-op drop being written. ⛔ Nothing may be added here.
 */
const GRANDFATHERED_NOOP_DROPS = new Set([
  '0003a_low_confidence_is_visible.sql:senses.read approved content',
  '0003a_low_confidence_is_visible.sql:sense_distractors.read distractors',
  '0003a_low_confidence_is_visible.sql:sense_items.read items',
]);

const CONTENT_TABLES = ['senses', 'sense_examples', 'sense_items', 'sense_distractors'];

describe('supabase/migrations — policy replacement', () => {
  it('never drops a policy name that no earlier migration created', () => {
    const createdBefore = new Set<string>();
    const orphans: string[] = [];
    for (const { file, text } of SOURCES) {
      const createdHere = new Set(matches(text, CREATE_POLICY).map(key));
      for (const [i, line] of text.split('\n').entries()) {
        for (const ref of matches(line, DROP_POLICY)) {
          const id = `${file}:${key(ref)}`;
          if (
            !createdHere.has(key(ref)) &&
            !createdBefore.has(key(ref)) &&
            !GRANDFATHERED_NOOP_DROPS.has(id)
          ) {
            orphans.push(`${file}:${i + 1} "${ref.name}" on ${ref.table}`);
          }
        }
      }
      for (const k of createdHere) createdBefore.add(k);
    }
    expect(orphans, 'a drop that matches no create is a no-op that reads as a replacement').toEqual(
      [],
    );
  });

  it('leaves exactly one live SELECT policy on each content table', () => {
    const live = livePolicies();
    for (const table of CONTENT_TABLES) {
      const names = live
        .filter((p) => p.table === table)
        .map((p) => p.name)
        .sort();
      expect(names, `${table} carries ${names.length} read rules: ${names.join(', ')}`).toHaveLength(
        1,
      );
    }
  });

  it('still lets a learner read a low-confidence sense and its example — D-024 survives the cleanup', () => {
    const live = livePolicies().map((p) => `${p.table}.${p.name}`);
    expect(live).toContain('senses.read all senses');
    expect(live).toContain('sense_examples.read examples');
  });

  it('still withholds scoring material tied to a low-confidence sense — D-024 the other way', () => {
    const live = livePolicies().map((p) => `${p.table}.${p.name}`);
    expect(live).toContain('sense_items.read verified items');
    expect(live).toContain('sense_distractors.read verified distractors');
  });
});
