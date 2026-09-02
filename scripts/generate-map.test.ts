import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⛔ Every assertion here runs against a fixture app tree, ⛔ never against the
 * real `app/` · `components/` · `lib/` — T-235's own requirement is that the
 * script fails loudly on a broken path (measured 31/08: `./src` would have
 * produced an empty map that never errors) rather than silently writing a lie.
 */

const fixture = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'generate-map-'));
  // madge errors if a given root does not exist at all — always provide the
  // three directories the real script points at, even when a fixture has no
  // files in one of them.
  for (const dir of ['app', 'components', 'lib']) {
    mkdirSync(join(root, dir), { recursive: true });
  }
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  return root;
};

const runGenerateMap = (root: string, out: string, minModules?: number) => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    GENERATE_MAP_ROOT: root,
    GENERATE_MAP_OUT: out,
  };
  if (minModules !== undefined) {
    env.GENERATE_MAP_MIN_MODULES = String(minModules);
  }
  return execFileSync('node', ['scripts/generate-map.mjs'], {
    encoding: 'utf8',
    env,
  });
};

describe('generate-map', () => {
  it('writes a dependency graph JSON when the tree has enough modules', () => {
    const files: Record<string, string> = { 'app/page.tsx': `export default function Page() { return null; }\n` };
    for (let i = 0; i < 25; i++) {
      files[`components/C${i}.tsx`] = `export default function C${i}() { return null; }\n`;
    }
    const root = fixture(files);
    const out = join(root, 'out.json');

    runGenerateMap(root, out, 20);

    expect(existsSync(out)).toBe(true);
    const graph = JSON.parse(readFileSync(out, 'utf8'));
    expect(Object.keys(graph).length).toBeGreaterThanOrEqual(20);
  });

  it('exits non-zero and writes nothing when the graph is under the module floor', () => {
    const root = fixture({
      'app/page.tsx': `export default function Page() { return null; }\n`,
    });
    const out = join(root, 'out.json');

    expect(() => runGenerateMap(root, out, 20)).toThrow();
    expect(existsSync(out)).toBe(false);
  });
});
