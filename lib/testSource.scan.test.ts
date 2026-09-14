import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 🧪 **T-284 — the scanner that catches the 34th copy.** Continues `T-302`, and this is
 * the half that was left undone there: `T-302` wrote the correct stripper into
 * `lib/testSource.ts`, and ⛔ nothing stopped a test file from declaring its own.
 *
 * 🔬 **What was measured in this clone, ⛔ not assumed (C-0597):** **33** test files
 * declared `withoutComments` themselves, in **five** different expressions — and **13**
 * of them carried `/\{\s*\/\*[\s\S]*?\*\/\s*\}/`, whose `\s*` lets its `{` match a
 * declaration brace whose first token is a JSDoc block and then run to the next `*​/}`,
 * swallowing every identifier in between. A negative assertion
 * (`expect(CODE).not.toContain(…)`) on a string that lost a sixth of itself is green for
 * the **wrong reason**, and `npm run verify` was 9/9 the whole time. That is `F-064` and
 * `F-141`.
 *
 * ⚠️ **And the honest number, ⛔ measured rather than inherited from the row:** on the
 * **15** sources those 13 guards read, the old and the fixed expression produce
 * **identical** text today ⇒ **⛔ zero hollow guards among the 32 converted**, which is
 * why the suite stayed green through the conversion. The trap is live **elsewhere in the
 * same tree** — `ArenaHome` **4,812** chars · `AmirnetSimulation` 2,776 ·
 * `ArenaCharacterChoice` 2,390 · `MeScreen` 2,413 · `LevelScan` 1,395 · `ArenaSummary`
 * 958 — ⇒ the copy was ⛔ not harmless, it was **aimed at files that happen not to
 * trigger it yet**, and the 34th copy is the one that lands on a file that does.
 * ⛔ **That is what this file forbids**, and ⛔ not a hypothetical.
 *
 * **The rule this file enforces, and it is one line:** a test file that needs the source
 * of a component as text imports `withoutComments` from `@/lib/testSource`. ⛔ It ⛔ does
 * ⛔ not write its own — one module, one expression, one test that measures it.
 *
 * ⚠️ **⛔ This is ⛔ not a new gate** (`§ 0.31`: the gate numbers ⛔ do ⛔ not move here).
 * It is an ordinary `npm test` file, which is exactly where a guard about test files
 * belongs.
 *
 * ⚠️ **And what it deliberately ⛔ does ⛔ not measure yet:** a file that inlines the same
 * regex ⛔ without naming it `withoutComments` — measured **52** of those in this clone,
 * ⇒ `F-247` · `T-341`. Fencing the named class first is what makes that number
 * countable; widening this scanner to the anonymous form is the follow-up row, ⛔ not a
 * silent extension of this one.
 */

/** ⛔ Every root that carries test files, ⛔ and the repo root for `proxy.test.ts`. */
const ROOTS = ['.', 'app', 'components', 'lib', 'scripts'];

/**
 * ⛔ The two files that are ALLOWED to name it, and ⛔ the reason is not convenience:
 * `testSource.test.ts` measures the OLD expression against the new one — deleting its
 * copy would delete the measurement — and this scanner quotes the identifier in order
 * to look for it.
 */
const EXEMPT = new Set(['lib/testSource.test.ts', 'lib/testSource.scan.test.ts']);

/**
 * A local **stripper**: `function withoutComments(…)` or `const withoutComments = (…` /
 * `= function`.
 *
 * ⚠️ ⛔ **Deliberately ⛔ not every binding of the name.** `app/globals.test.ts:17` and
 * `scripts/verify-mobile.test.ts:696` bind `const withoutComments = CSS.replace(…)` — a
 * **string**, ⛔ not a function, and ⛔ not a second definition of anything. Matching
 * those would make the scanner demand an import a value-binding cannot use, which is how
 * a guard starts getting «fixed» by weakening it.
 */
const DECLARES =
  /^[ \t]*(?:export[ \t]+)?(?:function[ \t]+withoutComments[ \t]*\(|(?:const|let|var)[ \t]+withoutComments[ \t]*(?::[^=]*)?=[ \t]*(?:\(|function\b|async\b))/;

function testFiles(dir: string): readonly string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    if (entry === 'node_modules' || entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    const rel = full.startsWith('./') ? full.slice(2) : full;
    if (statSync(full).isDirectory()) {
      out.push(...testFiles(full));
      continue;
    }
    if (!rel.endsWith('.test.ts') && !rel.endsWith('.test.tsx')) continue;
    out.push(rel);
  }
  return out;
}

type Occurrence = { readonly file: string; readonly line: number; readonly text: string };

function scan(): readonly Occurrence[] {
  const seen = new Set<string>();
  const found: Occurrence[] = [];
  for (const root of ROOTS) {
    for (const file of testFiles(root)) {
      if (seen.has(file)) continue;
      seen.add(file);
      if (EXEMPT.has(file)) continue;
      const lines = readFileSync(file, 'utf8').split('\n');
      lines.forEach((text, i) => {
        if (DECLARES.test(text)) found.push({ file, line: i + 1, text: text.trim() });
      });
    }
  }
  return found;
}

describe('🧪 T-284 — one comment stripper, ⛔ and ⛔ not one per test file', () => {
  it('⛔ no test file declares its own `withoutComments`', () => {
    const hits = scan();
    const report = hits.map((h) => `  ${h.file}:${h.line}  ${h.text}`).join('\n');
    expect(
      hits,
      `⛔ ${hits.length} local copies of the stripper — import it from '@/lib/testSource':\n${report}`,
    ).toHaveLength(0);
  });

  /**
   * ⛔ A scanner that matches ⛔ nothing is a scanner nobody can trust. This asserts on
   * the DETECTOR, ⛔ not on the tree — the pattern above, run over the exact five shapes
   * measured in this clone plus the two that must ⛔ not match.
   */
  it('the detector matches every shape that was actually in the tree', () => {
    const matches = [
      'function withoutComments(source: string): string {',
      'const withoutComments = (src: string): string =>',
      'const withoutComments = (s: string) =>',
      '  const withoutComments = (s: string) => s;',
      'export function withoutComments(source: string): string {',
    ];
    for (const line of matches) expect(DECLARES.test(line), `⛔ missed: ${line}`).toBe(true);

    const misses = [
      "import { withoutComments } from '@/lib/testSource';",
      'const CODE = withoutComments(SRC);',
      ' * `withoutComments` is the stripper the source guards assert on.',
      "  const withoutComments = CSS.replace(/\\/\\*[\\s\\S]*?\\*\\//g, '');",
    ];
    for (const line of misses) expect(DECLARES.test(line), `⛔ false positive: ${line}`).toBe(false);
  });

  /**
   * ⛔ And the import is ⛔ not optional for a file that uses the name: a test that calls
   * `withoutComments` without declaring it and without importing it ⛔ does not compile,
   * so this measures that the conversion actually landed rather than trusting it.
   */
  it('every test file that uses the name imports it from the one module', () => {
    const seen = new Set<string>();
    const broken: string[] = [];
    for (const root of ROOTS) {
      for (const file of testFiles(root)) {
        if (seen.has(file)) continue;
        seen.add(file);
        if (EXEMPT.has(file)) continue;
        const src = readFileSync(file, 'utf8');
        if (!/\bwithoutComments\(/.test(src)) continue;
        if (!src.includes("from '@/lib/testSource'")) broken.push(file);
      }
    }
    expect(broken, `⛔ uses \`withoutComments\` without importing it:\n  ${broken.join('\n  ')}`).toHaveLength(
      0,
    );
  });
});
