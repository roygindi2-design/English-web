import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Guards the RLS contract of T-002 at the only place we can guard it without a
 * live project: the migration itself.
 *
 * What this proves: the migration we ship enables RLS on `profiles` and scopes
 * every policy to `auth.uid() = id`, so no policy can hand one learner another
 * learner's row. What it does not prove: that the migration was applied to a
 * given Supabase project. That check belongs to the deployment step in
 * docs/SETUP.md, and it is why the file lists it as a required manual step.
 *
 * The anon key ships to the browser. Without these lines, `profiles` is public.
 */
const MIGRATION = readFileSync('supabase/migrations/0001_profiles.sql', 'utf8');

describe('profiles migration', () => {
  it('enables row level security', () => {
    expect(MIGRATION).toMatch(/alter\s+table\s+public\.profiles\s+enable\s+row\s+level\s+security/i);
  });

  it('scopes every policy on profiles to the row owner', () => {
    const policies = MIGRATION.match(/create policy[\s\S]*?;/gi) ?? [];
    expect(policies.length).toBeGreaterThanOrEqual(3);
    for (const policy of policies) {
      expect(policy).toMatch(/auth\.uid\(\)\s*=\s*id/i);
    }
  });

  it('never opens profiles to everyone', () => {
    // `using (true)` or a policy granted to `public`/`anon` would defeat the
    // whole thing while still looking like RLS is on.
    expect(MIGRATION).not.toMatch(/using\s*\(\s*true\s*\)/i);
    expect(MIGRATION).not.toMatch(/\bto\s+(public|anon)\b/i);
  });

  it('covers select, insert and update', () => {
    for (const verb of ['select', 'insert', 'update']) {
      expect(MIGRATION.toLowerCase()).toContain(`for ${verb}`);
    }
  });

  it('puts every learner on the amiram track by default (D-016)', () => {
    expect(MIGRATION).toMatch(/track_id\s+text\s+not null\s+default\s+'amiram'/i);
  });
});
