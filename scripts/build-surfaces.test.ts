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

  /**
   * ⛔ **T-265ⓑ — pins the `/studies` half of D-192/D-193.** `{track.labelHe}` is
   * a PROPERTY READ on a loop variable, ⛔ not a bare `{NAME}` — a real Hebrew
   * string, sitting in the imported `lib/core` array literal the loop iterates,
   * ⛔ not runtime data this scanner would have to fetch. `npm run build:surfaces`
   * must print it as a real action, ⛔ not `⛔ —`.
   */
  it('T-265: resolves a label read off a loop variable, sourced from an array in `lib/core`', () => {
    const md = run(
      fixture({
        ...BASE,
        'lib/core/tracks.ts': `export const TRACKS: readonly { id: string; labelHe: string }[] = [
  { id: 'reading', labelHe: 'הבנת הנקרא' },
];
`,
        'components/TrackTabs.tsx': `import { TRACKS } from '@/lib/core/tracks';
export default function TrackTabs() {
  return (
    <div>
      {TRACKS.map((track) => (
        <button key={track.id} type="button" onClick={() => console.log(track.id)}>
          {track.labelHe}
        </button>
      ))}
      {items.length === 0 ? <p>עוד אין כלום</p> : null}
    </div>
  );
}
`,
        'app/tracks/page.tsx': `import TrackTabs from '@/components/TrackTabs';
export default function TracksPage() { return <TrackTabs />; }
`,
      }),
    );
    expect(md).toMatch(/\| `\/tracks` \| `הבנת הנקרא` \|/);
    expect(md).not.toMatch(/`\/tracks` — ⛔ אף פעולה בהקשה/);
  });

  /**
   * ⛔ **T-265ⓑ — pins the `/world` half.** The real label sits two hoists away
   * from the tag: a `_HE`-suffixed `Record` in `lib/core` seeds a `.labelHe`
   * field, a local `const label = (…)` wraps it in markup, a SECOND local
   * `const inner = (…)` picks `label` or `null` by a ternary depending on which
   * side of the icon it renders, and the tag itself renders only `{inner}`.
   * ⛔ Every hop is a literal in the source, ⛔ never data fetched at runtime —
   * this pins that the chain resolves end to end, ⛔ not just one hop of it.
   */
  it('T-265: resolves a label hoisted through a local JSX const and a ternary, sourced from a `_HE` dictionary', () => {
    const md = run(
      fixture({
        ...BASE,
        'lib/core/ringLabels.ts': `export const RING_LABEL_HE: Readonly<Record<string, string>> = {
  arena: 'זירת קרב',
};
`,
        'components/RingNode.tsx': `import { RING_LABEL_HE } from '@/lib/core/ringLabels';
type Node = { readonly id: string; readonly labelHe: string };
function Item({ node, above }: { readonly node: Node; readonly above: boolean }) {
  const label = (
    <span>{node.labelHe}</span>
  );
  const inner = (
    <>
      {above ? label : null}
      {above ? null : label}
    </>
  );
  return (
    <a href="/world/ring" onClick={() => console.log(node.id)}>
      {inner}
    </a>
  );
}
export default function RingNode() {
  return <Item node={{ id: 'arena', labelHe: RING_LABEL_HE.arena }} above />;
}
`,
        'app/ring/page.tsx': `import RingNode from '@/components/RingNode';
export default function RingPage() { return <RingNode />; }
`,
      }),
    );
    expect(md).toMatch(/\| `\/ring` \| `זירת קרב.*` \|/);
    expect(md).not.toMatch(/`\/ring` — ⛔ אף פעולה בהקשה/);
  });

  /**
   * ⛔ **GATE ON THE REAL TREE, ⛔ NOT ON A FIXTURE — this is the one test in this
   * file that runs against `app/` itself.** T-263 (`D-191`) measured **13 flags**
   * live on 05/09. The task's own hypothesis was six phantoms (depth-0 scanning
   * missing a deeper button/empty-state); **measured while building the fix, ⛔
   * not assumed: only FOUR of those six are actually phantoms of the kind this
   * scanner can fix** — `/cards`·`/arcade` "no action", `/arcade` "no empty
   * state", and `/offline` "no action" (the page's own `RETRY_HE` import from
   * `lib/core/failure`, resolved only once depth-1 lib-core constants are read
   * off the PAGE too, not only off a screen component — `/offline` has none).
   * `/studies` and `/world` "no action" were ⛔ **NOT** phantoms of this class:
   * their real labels are `{track.labelHe}` / property access, ⛔ not a
   * `NAME_HE` constant or a deeper component — no import-depth fix reached
   * those. ⇒ 13 − 4 = **9**, ⛔ not 7, *as measured on 05/09*.
   * 🔵 **T-265, measured live in this clone, ⛔ not guessed: both close for
   * real.** Neither was runtime data — `{track.labelHe}` is a literal Hebrew
   * string sitting in an imported `lib/core` array, and `{node.labelHe}`
   * traces, through a local JSX const and a ternary, to a literal in a
   * `_HE`-suffixed `lib/core` dictionary. `npm run build:surfaces` on this
   * clone now prints `9 → 7` flags, and the two closed are exactly `/studies`
   * and `/world` "no action" — see the two fixture tests above that pin each
   * hop. ⇒ **9 − 2 = 7**, and the ceiling drops with it.
   * ⛔ **A DISCOVERED, ⛔ NOT HIDDEN, REGRESSION AVOIDED ALONG THE WAY:** an
   * earlier version of this fix folded the WHOLE imported `lib/core/*` file
   * into the surface (not just its exported constants), and `lib/core/auth.ts`
   * (imported by `AuthForm`/`RegisteredAddress`, i.e. `/login`·`/signup`·
   * `/onboarding`) contains an unrelated `password.length === 0` check that
   * satisfied the generic `EMPTY` regex — silently flipping THREE real
   * «⛔ no empty state» flags to a false ✅. That version measured 7, not 9,
   * and was wrong. ⇒ `lib/core` depth-1 folding is constants-only (see the
   * block comment above `childLibConstantsOf`); `components/*` depth-1 folding
   * stays whole-file, because there the full markup is the point.
   * ⛔ **CEILING, ⛔ not a target.** A number above 7 means a phantom flag came
   * back — the scanner regressed, ⛔ not that a real product screen broke (a
   * real regression is caught by `check:mobile`/`verify`, not by this file).
   * Lower the ceiling only when a flag closes for real, never raise it to make
   * a red run green. The remaining 7 are `/offline` "not reachable by taps"
   * (real — pulled by the service worker) plus six "no empty state" left for
   * judgment (`login`·`offline`·`onboarding`·`/`·`signup`·`sources`).
   */
  it('gate: phantom flags on the real app tree may only go down, never back up (D-191 · T-263 · T-265)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'surfaces-real-'));
    const out = join(dir, 'real.md');
    execFileSync('node', ['scripts/build-surfaces.mjs'], {
      encoding: 'utf8',
      env: { ...process.env, SURFACES_OUT: out },
    });
    const md = readFileSync(out, 'utf8');
    const match = /### דגלים — (\d+)/.exec(md);
    expect(match).not.toBeNull();
    const flagCount = Number(match?.[1]);
    expect(flagCount).toBeLessThanOrEqual(7);
  });
});
