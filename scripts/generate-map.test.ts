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

  /**
   * 🔴 ⟦T-335 · 14/09⟧ **`madge` ⛔ אינו פותר `@/` בלי `--ts-config`.**
   *
   * 🔬 נמדד C-0589 (PM) ונמדד שוב כאן לפני התיקון: `docs/architecture-map.json`
   * החזיק **509 רשומות · 345 מהן `[]` (68%)**, ו-`components/Flashcard.tsx` ⇒ `[]`
   * בעוד הקובץ מייבא **שבעה** מודולים דרך `@/`. הרשומות שכן נשאו קשתות הן אלה
   * שמייבאות **יחסית**.
   *
   * 🔴 **תרחיש הכישלון, ו⛔ אינו תיאורטי:** `PM.md` ו-`DEV.md` שולחים את הסוכן
   * למפה **במקום** ל-`plan/30-architecture.md` (169KB) בשאלה «מה מייבא את מה».
   * ⇒ סוכן ששואל «מי מייבא את `lib/core/studyTracks.ts`» מקבל תשובה **ריקה**,
   * מסיק ש⛔ אין צרכנים, ומשנה חתימה ששישה רכיבים קוראים.
   * **מפה ששיקרה על 68% מהרשומות גרועה ממפה שאינה קיימת** — לשון `DEV.md` STEP 7.
   */
  it('resolves the `@/` path alias through the tree tsconfig', () => {
    const files: Record<string, string> = {
      'tsconfig.json': JSON.stringify({
        compilerOptions: { moduleResolution: 'bundler', paths: { '@/*': ['./*'] } },
      }),
      'lib/target.ts': `export const target = 1;\n`,
      'components/Importer.tsx': `import { target } from '@/lib/target';\nexport default function Importer() { return target; }\n`,
    };
    for (let i = 0; i < 25; i++) {
      files[`components/C${i}.tsx`] = `export default function C${i}() { return null; }\n`;
    }
    const root = fixture(files);
    const out = join(root, 'out.json');

    runGenerateMap(root, out, 20);

    const graph = JSON.parse(readFileSync(out, 'utf8'));
    expect(
      graph['components/Importer.tsx'],
      '⛔ קשת דרך `@/` — בלי `--ts-config` היא ⛔ אינה נמדדת כלל',
    ).toContain('lib/target.ts');
  });

  /**
   * ⓑ ⛔ **והרגרסיה ⛔ אינה שקטה.** הבדיקה הזאת קוראת את **הפלט המחויב**, ⛔ ולא
   * פיקסטורה: אם המפה תיווצר שוב בלי הכינוי, `Flashcard` יחזור ל-`[]` וזה יאדים.
   */
  it('the committed map carries the `@/` edges — Flashcard.tsx is not empty', () => {
    const graph = JSON.parse(readFileSync('docs/architecture-map.json', 'utf8')) as Record<
      string,
      string[]
    >;
    expect(graph['components/Flashcard.tsx'], 'הרשומה עצמה חסרה מהמפה').toBeDefined();
    expect(
      graph['components/Flashcard.tsx']?.length ?? 0,
      '`components/Flashcard.tsx` מייבא שבעה מודולים דרך `@/` ⇒ ⛔ אינו יכול להיות `[]`',
    ).toBeGreaterThanOrEqual(1);
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
