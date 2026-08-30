import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⛔ **EVERY ASSERTION HERE RUNS AGAINST A FIXTURE APP, ⛔ not against `app/`.**
 * A generator observed only on the real tree is a generator whose bugs are
 * indistinguishable from the tree's own shape — and this one was wrong four times
 * while it was being written, each time in a way that LOOKED plausible in the
 * output: the first import mistaken for the screen, test files counted as
 * entrances, hrefs declared as data missed entirely, and Hebrew labels hoisted to
 * constants thrown away. ⛔ Each of those produced a confident, wrong register.
 */
const run = (root: string): string => {
  const out = join(root, 'out.md');
  execFileSync('node', ['scripts/build-surfaces.mjs'], {
    encoding: 'utf8',
    env: { ...process.env, SURFACES_ROOT: root, SURFACES_OUT: out },
  });
  return readFileSync(out, 'utf8');
};

const fixture = (files: Record<string, string>): string => {
  const root = mkdtempSync(join(tmpdir(), 'surfaces-'));
  for (const [rel, body] of Object.entries(files)) {
    const full = join(root, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, body, 'utf8');
  }
  return root;
};

const BASE = {
  'app/page.tsx': `import Home from '@/components/Home';
export default function Page() { return <Home />; }
`,
  'components/Home.tsx': `const START_HE = 'בואו נתחיל';
export default function Home() {
  return (
    <div>
      <a href="/studies"><span>{START_HE}</span></a>
      {items.length === 0 ? <p>עוד אין כלום</p> : null}
    </div>
  );
}
`,
  'app/(tabs)/studies/page.tsx': `import StudiesScreen from '@/components/StudiesScreen';
export default function StudiesPage() { return <StudiesScreen />; }
`,
  'components/StudiesScreen.tsx': `const GO_HE = 'התחלת מנה יומית';
export default function StudiesScreen() {
  return <button type="button">{GO_HE}</button>;
}
`,
};

describe('scripts/build-surfaces.mjs', () => {
  it('derives one row per page and strips the route group from the URL', () => {
    const md = run(fixture(BASE));
    // `(tabs)` is a folder convention and carries ⛔ no URL segment.
    expect(md).toContain('| `/studies` |');
    expect(md).not.toContain('(tabs)');
    expect(md).toContain('| `/` |');
  });

  it('reads a label hoisted to a constant — the house style, ⛔ not the exception', () => {
    // ⛔ THE BUG THIS PINS: stripping `{…}` reported «⛔ no tappable action» on twelve
    // of eighteen real screens, including two that are nothing but buttons.
    const md = run(fixture(BASE));
    expect(md).toContain('התחלת מנה יומית');
    expect(md).toContain('בואו נתחיל');
  });

  it('counts an entrance from a route declared as DATA, ⛔ not only as an href attribute', () => {
    // ⛔ THE SECOND BUG: the tab bar declares `{ id: 'world', href: '/world' }`, and an
    // attribute-only regex called every tab unreachable.
    const md = run(
      fixture({
        ...BASE,
        'components/TabBar.tsx': `export const TABS = [{ id: 'studies', href: '/studies', labelHe: 'לימודים' }];\n`,
      }),
    );
    expect(md).toContain('components/TabBar.tsx');
  });

  it('flags a screen no source reaches — and ⛔ does not flag one that is reached', () => {
    const md = run(
      fixture({
        ...BASE,
        'app/orphan/page.tsx': `export default function Orphan() { return <p>שלום</p>; }\n`,
      }),
    );
    expect(md).toMatch(/`\/orphan` — ⛔ אף מסך ⛔ אינו מקשר אליו/);
    expect(md).not.toMatch(/`\/studies` — ⛔ אף מסך ⛔ אינו מקשר אליו/);
  });

  it('flags a screen with ⛔ no written empty state, and passes one that has it', () => {
    const md = run(fixture(BASE));
    expect(md).toMatch(/`\/studies` — ⛔ אין מצב ריק כתוב/);
    expect(md).not.toMatch(/`\/` — ⛔ אין מצב ריק כתוב/);
  });

  it('🔴 raises a FINDING when one destination carries three different names', () => {
    // ⛔ This is the defect the register exists for, and it is invisible in any single
    // file: three screens each name the same destination differently, and ⛔ nothing
    // in the loop could see it because ⛔ no register held the screens side by side.
    const md = run(
      fixture({
        ...BASE,
        'components/A.tsx': `export const A = () => <Link href="/studies">לימודים</Link>;\n`,
        'components/B.tsx': `export const B = () => <Link href="/studies">חזרה ללימודים</Link>;\n`,
        'components/C.tsx': `export const C = () => <Link href="/studies">המסלול שלי</Link>;\n`,
      }),
    );
    expect(md).toMatch(/🔴 `\/studies` — \*\*3 שמות שונים לאותה פעולה/);
  });

  it('keeps `/dev/*` fixtures in their own table and out of the flags', () => {
    const md = run(
      fixture({
        ...BASE,
        'app/dev/probe/page.tsx': `export default function Probe() { return <p>בדיקה</p>; }\n`,
      }),
    );
    expect(md).toContain('| `/dev/probe` |');
    expect(md).not.toMatch(/`\/dev\/probe` — ⛔ אף מסך/);
  });

  it('declares itself generated, so ⛔ nobody hand-edits it', () => {
    expect(run(fixture(BASE))).toMatch(/⛔ GENERATED by scripts\/build-surfaces\.mjs/);
  });
});
