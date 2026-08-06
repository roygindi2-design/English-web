import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards F-010 / T-024.
 *
 * Deleting `lib/supabase/server.ts` removed the dead helper that imported
 * `SUPABASE_SERVICE_ROLE_KEY`. The finding is not that the file leaked the key
 * today — it did not — but that it sat in the tree as a ready-made way to
 * bypass RLS, one stray import away from shipping to the browser.
 *
 * A deletion without a guard is undone by the next agent who needs a
 * privileged client. So this test scans every shipped source file and fails if
 * the service_role key reappears anywhere in application code. When it is
 * genuinely needed, it gets written deliberately — and this test has to be
 * amended in the same commit, which is exactly the review moment we want.
 *
 * Docs, .env.example and plan/ are excluded on purpose: they must keep naming
 * the variable so operators know to set it. What is forbidden is *reading* it:
 * a prose comment such as the one in lib/supabase/auth.ts, which states that
 * the key is deliberately not imported there, is the opposite of the problem.
 */
const SHIPPED_ROOTS = ['app', 'components', 'lib'];
const SHIPPED_FILES = ['proxy.ts'];
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];
const FORBIDDEN = /process\s*\.\s*env\s*\.\s*SUPABASE_SERVICE_ROLE_KEY|env\s*\[\s*['"`]SUPABASE_SERVICE_ROLE_KEY/;

function sourceFilesUnder(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFilesUnder(path));
    } else if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      found.push(path);
    }
  }
  return found;
}

describe('service_role key is absent from shipped code', () => {
  it('no longer has a server client helper holding it', () => {
    expect(existsSync('lib/supabase/server.ts')).toBe(false);
  });

  it('scans a non-empty set of files, so a passing run means something', () => {
    const scanned = SHIPPED_ROOTS.flatMap(sourceFilesUnder);
    expect(scanned.length).toBeGreaterThan(5);
  });

  it('never reads the service_role key in app, components, lib or proxy.ts', () => {
    const scanned = [
      ...SHIPPED_ROOTS.flatMap(sourceFilesUnder),
      ...SHIPPED_FILES.filter((file) => existsSync(file)),
    ];
    const offenders = scanned.filter((file) => {
      const contents = readFileSync(file, 'utf8');
      // This test file names the variable in its own documentation.
      if (file.endsWith('serviceRole.test.ts')) return false;
      return FORBIDDEN.test(contents);
    });
    expect(offenders).toEqual([]);
  });
});
