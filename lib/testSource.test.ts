import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { withoutComments, withoutCssComments, withoutSqlComments } from './testSource';

/**
 * 🧪 T-302 — the stripper deletes comments and ⛔ nothing else.
 *
 * 🔴 **The failure this file exists to catch is the SAFE-LOOKING one.** When the old
 * expression swallowed code in `C-0543` the suite went **red** (5 failures), and red is
 * survivable. The dangerous direction is a **negative** assertion —
 * `expect(CODE).not.toContain('ActionBar')` — passing on a string that lost 8,569
 * characters: the forbidden thing is in the component, and the guard says it is not.
 * ⇒ every test below plants a marker inside the region the old pattern ate and asserts
 * the marker SURVIVES. A stripper that eats it leaves these tests green ⛔ only if they
 * assert survival, which is why they do.
 */

/**
 * The exact shape that was measured, and ⛔ both halves of it are load-bearing: a props
 * brace whose first token is a JSDoc block OPENS the swallow, and the next JSX comment
 * CLOSES it — `*\/}` is the `\s*\}` the old lazy quantifier was hunting for. Everything
 * between the two, `ActionBar` included, is what disappeared.
 */
const PROPS_WITH_JSDOC = `export default function MeScreen({
  /** What the run measured. */
  goal,
}: {
  readonly goal: LearnerGoal;
}) {
  const bar = <ActionBar label="100%" />;
  return <div>{/* the tab body */}{bar}</div>;
}
`;

describe('🧪 T-302 — withoutComments deletes comments, ⛔ not code', () => {
  it('keeps every identifier inside a props type that opens with JSDoc', () => {
    const out = withoutComments(PROPS_WITH_JSDOC);
    for (const kept of ['goal: LearnerGoal', 'ActionBar', '100%', 'return <div>'])
      expect(out, `⛔ the stripper ate "${kept}"`).toContain(kept);
  });

  it('⛔ the length drops by the comments and by ⛔ nothing more', () => {
    const comments = ['/** What the run measured. *\/', '{/* the tab body *\/}'].map((c) =>
      c.replace('*\\/', '*/'),
    );
    const removed = comments.reduce((n, c) => n + c.length, 0);
    expect(PROPS_WITH_JSDOC.length - withoutComments(PROPS_WITH_JSDOC).length).toBe(removed);
  });

  /**
   * ⛔ The regression, stated as the thing that must ⛔ NOT happen. This is the old
   * expression verbatim; it is here so the difference is measured in this file rather
   * than remembered from a commit message.
   */
  it('the old `\\s*` expression DID eat the code — that is why this module exists', () => {
    const old = PROPS_WITH_JSDOC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
    expect(old, '⛔ the old pattern no longer misfires — re-measure before trusting this file').not.toContain(
      'ActionBar',
    );
    expect(withoutComments(PROPS_WITH_JSDOC)).toContain('ActionBar');
  });

  it('removes a JSX comment, spaced or not', () => {
    expect(withoutComments('<p>{/* hidden */}לומד</p>')).toBe('<p>לומד</p>');
    expect(withoutComments('<p>{ /* ⛔ אחסון חסום ⛔ אינו שגיאה */ }לומד</p>')).toBe('<p>לומד</p>');
  });

  it('⛔ never joins two JSX comments across the markup between them', () => {
    const src = '<a>{/* one */}KEEP_ME{/* two */}</a>';
    expect(withoutComments(src)).toBe('<a>KEEP_ME</a>');
  });

  it('removes a whole-line `//` comment and ⛔ not a URL', () => {
    // ⚠️ The blank line stays: the pass removes the COMMENT, ⛔ not the line it sat on —
    // deleting lines would move every `file:line` a guard reports.
    expect(withoutComments("  // gone\nconst u = 'https://example.test';\n")).toBe(
      "\nconst u = 'https://example.test';\n",
    );
  });

  it('strips block comments, JSDoc included', () => {
    expect(withoutComments('/** doc */\nconst a = 1;')).toBe('\nconst a = 1;');
  });

  /**
   * ⛔ Measured on the real file the row named, ⛔ not on a fixture: the three
   * identifiers `C-0543` found missing must be in the stripped text.
   */
  it('keeps `components/MeScreen.tsx` whole apart from its comments', () => {
    const src = readFileSync('components/MeScreen.tsx', 'utf8');
    const out = withoutComments(src);
    for (const kept of ['goal: LearnerGoal', 'apiGet<', 'primaryStudyTrack('])
      expect(out, `⛔ "${kept}" was stripped out of MeScreen.tsx`).toContain(kept);
    expect(out.length).toBeLessThan(src.length);
  });
});

describe('🧪 T-341 — the two non-TS strippers', () => {
  it('withoutCssComments removes a CSS block comment and ⛔ keeps a url with //', () => {
    const css = '/* token */\n.a { color: red; /* inline */ background: url(https://x/y.png); }\n';
    const out = withoutCssComments(css);
    expect(out).not.toContain('token');
    expect(out).not.toContain('inline');
    expect(out).toContain('url(https://x/y.png)');
    expect(out).toContain('color: red;');
  });

  it('withoutSqlComments removes block and `--` comments and ⛔ nothing else', () => {
    const sql = '/* header */\nupdate words set x = 1; -- why\n-- whole line\nselect 2;\n';
    const out = withoutSqlComments(sql);
    for (const gone of ['header', 'why', 'whole line']) expect(out).not.toContain(gone);
    for (const kept of ['update words set x = 1;', 'select 2;']) expect(out).toContain(kept);
  });
});
