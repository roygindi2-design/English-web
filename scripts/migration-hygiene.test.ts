import { readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * The apply order of supabase/migrations/ is its filename order, and nothing
 * else records it. Two files under one number is not a typo — it is an
 * undefined order between two DDL scripts, and 0003_ has been in exactly that
 * state since C-0029. Same reasoning as scripts/plan-hygiene.test.ts (F-025):
 * a human reading a directory will not catch the next collision either.
 */
const FILES = readdirSync('supabase/migrations').filter((f) => f.endsWith('.sql')).sort();

/**
 * The one collision that already shipped. Both files only ALTER `senses`, which
 * 0002 creates, and they touch different columns (needs_human_review vs origin),
 * so their order does not matter TODAY — that is why this is an exemption and
 * not a rename. ⛔ Nothing may be added to this list: a rename is a filename
 * change that `supabase db push` records in its own table, and re-hashing an
 * already-applied migration is a bigger risk than one documented pair.
 */
const GRANDFATHERED = new Set(['0003_low_confidence_is_visible.sql', '0003_provenance_telemetry.sql']);

function prefixes(files: string[]): number[] {
  return files.map((f) => Number(f.slice(0, 4)));
}

describe('supabase/migrations — apply order', () => {
  it('has files at all (guards the glob, not just the rule)', () => {
    // Without this every assertion below passes vacuously over an empty list.
    expect(FILES.length).toBeGreaterThanOrEqual(6);
  });

  it('names every file NNNN_snake_case.sql', () => {
    for (const f of FILES) expect(f, `${f} is misnamed`).toMatch(/^\d{4}_[a-z0-9_]+\.sql$/);
  });

  it('uses each number at most once, outside the one grandfathered pair', () => {
    const seen = new Map<number, number>();
    for (const n of prefixes(FILES.filter((f) => !GRANDFATHERED.has(f)))) {
      seen.set(n, (seen.get(n) ?? 0) + 1);
    }
    const dupes = [...seen.entries()].filter(([, c]) => c > 1).map(([n, c]) => `${n}×${c}`);
    expect(dupes, 'two DDL scripts under one number have no defined order').toEqual([]);
  });

  it('keeps the exemption honest — every grandfathered name still exists', () => {
    // An exemption for a file that was since renamed is a hole nobody sees.
    for (const f of GRANDFATHERED) expect(FILES, `${f} is exempted but absent`).toContain(f);
  });

  it('leaves no gap in the sequence', () => {
    const nums = [...new Set(prefixes(FILES))].sort((a, b) => a - b);
    expect(nums[0]).toBe(1);
    expect(nums).toEqual(nums.map((_, i) => i + 1));
  });
});
