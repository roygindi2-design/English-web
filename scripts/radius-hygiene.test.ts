import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * T-068 · T-168 · constitution v2 layer B § ב2 · D-036 (the mapping) · D-102.
 *
 * The guard exists because before it, the product's most common radius was an
 * undeclared fourth value and nothing anywhere would ever have said so. That reason
 * still holds: without a test that fails, an undeclared value returns in the first
 * commit nobody reads.
 *
 * ⚠️ UPDATED 2026-08-23 (T-168). The old list was {md, lg, 2xl}, taken from
 * constitution v1 § 3, which was written 12/08 — two weeks before Roy's product
 * vision existed — and marked frozen. D-102 replaced it: layer B is derived from
 * plan/36-video-spec.md and the approved renders in docs/design/, and it declares a
 * FIVE-value scale. `rounded-full` in particular is now explicitly allowed for a
 * primary button, a chip, a progress bar and the world tab — every one of which is a
 * pill in the renders Roy signed off.
 *
 * ⛔ What did NOT change, and is the whole point of keeping this file: a single
 * uniform radius on every element stays banned. The scale is GRADED. Adding a sixth
 * value is still a finding — edit the constitution first, then this list.
 *
 * ═══════════════════════════════════════════════════════════════════════════════
 * 🔴 **⟦REWRITTEN 15/09 · `C-0624` · `T-365` · Roy's instruction: audit the gates⟧**
 *
 * Roy asked whether the gates that fired during the arena work are too strict, and
 * whether they should be scoped out of the game surfaces under the World tab.
 * 🔬 **This one is ⛔ not too strict. It had a HOLE, and in `C-0623` I walked
 * through it.** Both facts were measured, ⛔ not argued:
 *
 * ```
 * ⓐ `rounded-[50%]` ⇒ the old regex `rounded(?:-[a-z0-9]+)*` cannot match a `[`, so it
 *                     matched the bare word `rounded` and reported the ellipse as
 *                     "Tailwind's 4px, a fourth value".
 *                     ⇒ the gate was RIGHT to refuse it and WRONG about why.
 * ⓑ raw CSS         ⇒ `border-radius: 50%` in a `.css` file was **0 hits, forever**:
 *                     the scanner only ever read `rounded…` utilities. ⇒ moving the
 *                     ellipse into `arcade-tokens.css` was a **bypass**, ⛔ not
 *                     compliance — and the comment I left there says "the gate caught
 *                     me", which made it read like a fix.
 * ```
 *
 * ⇒ **The fix is a net TIGHTENING plus one named allowance, ⛔ not a loosening**, and
 * ⛔ **not** a blanket `app/arcade/**` exemption: `ArenaSummary` and `DeckSelector` are
 * ordinary UI living in that same folder and stay on the graded scale.
 *   ① arbitrary values (`rounded-[…]`) parse as themselves ⇒ the message stops lying;
 *   ② raw `border-radius:` in CSS is scanned ⇒ the hole is closed;
 *   ③ a shape that is genuinely ⛔ not a UI corner — the arena's elliptical shadow and
 *      its summoning circle — is DECLARED BY FILE AND SELECTOR, in the same shape as
 *      `DECLARED_KEYFRAME_EXCEPTIONS` in `scripts/check-motion.mjs`, ⛔ never a glob.
 */
const ALLOWED = new Set(['md', 'lg', 'xl', '2xl', 'full']);

/** Tailwind's logical and physical side segments, which are not radius VALUES. */
const SIDES = new Set(['t', 'b', 'l', 'r', 's', 'e', 'tl', 'tr', 'bl', 'br', 'ss', 'se', 'es', 'ee']);

/**
 * 🔴 **The declared shapes, and the reason they are ⛔ not a sixth radius.**
 *
 * A corner radius rounds a BOX. `border-radius: 50%` does ⛔ not round a box — it turns
 * it into an ELLIPSE, and on a 48×12 element that is a different shape from
 * `rounded-full` (9999px), which yields a stadium with two flat edges. The arena's cast
 * shadow and summoning circle are ellipses ON PURPOSE: they read as circles lying on a
 * receding floor (`37 § 13.5`, `docs/design/kol-B-03-battle.png`). A pill would pin them
 * back to the plane of the screen and undo the perspective the whole stage is built on.
 *
 * ⛔ **And the fences are the point, exactly as in the motion gate:**
 *   ⓐ file + selector, ⛔ never a folder glob — a third ellipse does ⛔ not enter quietly;
 *   ⓑ CSS only — in TSX the ellipse still belongs beside the gradient that draws it;
 *   ⓒ adding a row here edits a DECLARED list under review, which is exactly the cost of
 *      adding a value to `ALLOWED`, and exactly the reason neither is free.
 */
const DECLARED_SHAPES: readonly {
  readonly file: string;
  readonly selector: string;
  readonly value: string;
  readonly rule: string;
}[] = [
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-shadow]',
    value: '50%',
    rule: 'C-0624 · 37 § 13.5 — cast shadow: an ellipse on a receding floor, ⛔ not a pill',
  },
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-sigil]',
    value: '50%',
    rule: 'C-0624 · 37 § 13.5 — summoning circle: an ellipse on the floor, ⛔ not a pill',
  },
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-dust]',
    value: '50%',
    rule: 'C-0751 · 37 § 11 א8 · 37 § 13.5 — the impact dust: it spreads on the SAME '
      + 'receding floor as the shadow, the summoning circle, the lane marker and the '
      + 'streak halo, so it is an ellipse for the identical reason. A pill (9999px) is a '
      + 'stadium with two straight edges, which reads as a shape standing UP on the plane.',
  },
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-landdust]',
    value: '50%',
    rule: 'T-443 · 37 § 13.5 — the landing dust of the flying kick: it spreads on the '
      + 'SAME receding floor as the shadow, the impact dust and the streak halo, so it is '
      + 'an ellipse for the identical reason. ⛔ And it is a SEPARATE node from '
      + '[data-arena-dust], which fires on data-arena-hurt: a learner can be hit and cast '
      + 'in the same frame, and two animations on one property of one node do ⛔ not stack '
      + '— the later one overwrites. That is F-306.',
  },
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-halo]',
    value: '50%',
    rule: 'C-0750 · 37 § 8 ק1 · 37 § 13.5 — the streak halo: it lies around the figure '
      + 'on the SAME receding floor as the shadow and the summoning circle, so it is an '
      + 'ellipse for the identical reason. A pill (9999px) is a stadium with two straight '
      + 'edges, which reads as a shape standing UP on the screen plane.',
  },
  {
    file: 'app/arcade/arcade-tokens.css',
    selector: '[data-arena-scope] [data-arena-aim]',
    value: '50%',
    rule: 'C-0732 · T-434 · 37 § 13.5 — the aim marker: the THIRD ellipse on that same '
      + 'receding floor, and it earns the row for the identical reason as the other two. '
      + 'A pill (9999px) is a stadium with two straight edges, which reads as a shape '
      + 'standing UP on the screen plane; this one lies DOWN with the shadow and the '
      + 'summoning circle it sits between. ⛔ Not a sixth radius — the same declared 50%.',
  },
];

/**
 * Raw CSS values that declare no shape of their own: they inherit the box's radius or
 * explicitly remove it. ⛔ A length is ⛔ not here — a `px` written straight into a
 * stylesheet is precisely the undeclared value this file exists against.
 */
const INERT_CSS_RADII = new Set(['inherit', 'initial', 'unset', 'revert', 'none', '0']);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(tsx|jsx|css)$/.test(p) && !/\.test\./.test(p)) out.push(p);
  }
  return out;
}

const FILES = [...walk('components'), ...walk('app')].sort();
const CSS_FILES = FILES.filter((f) => f.endsWith('.css'));

/**
 * Comments are stripped first. D-036 and the reasoning above both NAME the forbidden
 * values in prose, and a guard that cannot tell a violation from its own explanation
 * fails on the documentation that justifies it.
 */
function code(file: string): string {
  return withoutComments(readFileSync(file, 'utf8'));
}

/**
 * Every `rounded…` utility in a source string, as `{ token, value }`.
 *
 * ⚠️ **The alternation is the 15/09 fix and it is ⛔ not cosmetic:** an arbitrary value is
 * `rounded-[50%]`, and `[` is outside `[a-z0-9]`. The old pattern therefore stopped at the
 * word `rounded` and reported every arbitrary radius in the repo as a bare `rounded` —
 * refusing it for the right reason, under the wrong name.
 */
function radiiIn(source: string): { token: string; value: string }[] {
  return [...source.matchAll(/\brounded(?:-(?:\[[^\]\s]+\]|[a-z0-9]+))*/g)].map((m) => {
    const token = m[0];
    const parts = token.split('-').slice(1);
    if (parts.length > 1 && parts[0] !== undefined && SIDES.has(parts[0])) parts.shift();
    return { token, value: parts.join('-') };
  });
}

/** …and the same, read off a file. */
function radii(file: string): { token: string; value: string }[] {
  return radiiIn(code(file));
}

/**
 * Every raw `border-radius:` declaration in a CSS source, with the selector that owns it.
 * ⛔ The selector is read from the source, ⛔ never assumed: an exception that matched on
 * the FILE alone would exempt the whole stylesheet — which is exactly the blanket scoping
 * this rewrite refuses.
 */
export function cssRadiiIn(source: string): { selector: string; value: string }[] {
  const src = source.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const out: { selector: string; value: string }[] = [];
  for (const m of src.matchAll(/border-radius\s*:\s*([^;}]+)/g)) {
    const before = src.slice(0, m.index);
    const open = before.lastIndexOf('{');
    if (open === -1) continue;
    const head = before.slice(0, open);
    const cut = Math.max(head.lastIndexOf('}'), head.lastIndexOf('{'), head.lastIndexOf(';'));
    out.push({
      selector: head.slice(cut + 1).replace(/\s+/g, ' ').trim(),
      value: (m[1] ?? '').replace(/\s+/g, ' ').trim(),
    });
  }
  return out;
}

const declaredShape = (file: string, selector: string, value: string): boolean =>
  DECLARED_SHAPES.some((d) => d.file === file && d.selector === selector && d.value === value);

describe('radius hygiene (T-068 · T-168 · constitution v2 layer B § ב2)', () => {
  it('scans a real set of files (guards the walker, not just the regex)', () => {
    // Without this, a broken glob turns every assertion below into a vacuous pass.
    expect(FILES.length).toBeGreaterThan(20);
    expect(FILES.some((f) => f.endsWith('components/AuthForm.tsx'))).toBe(true);
    // …and the CSS arm has something to read, or the raw-CSS assertion below is vacuous.
    expect(CSS_FILES).toContain('app/arcade/arcade-tokens.css');
  });

  it('finds radii at all (guards the regex)', () => {
    expect(FILES.flatMap((f) => radii(f)).length).toBeGreaterThan(20);
  });

  it('uses only the five radii constitution v2 layer B allows', () => {
    const offenders = FILES.flatMap((file) =>
      radii(file)
        .filter(({ value }) => !ALLOWED.has(value))
        .map(({ token }) => `${file}: ${token}`),
    );
    // The message IS the fix list. Layer B § ב2 allows md (6px, fields and tags),
    // lg (8px, buttons), xl (12px, secondary controls and counter tiles),
    // 2xl (16px, the card default — the most common value in the renders) and
    // full (pill: primary button, chip, progress bar, the world tab).
    // D-036 maps a role to a group. ⛔ A sixth value is a finding, not a fix.
    expect(offenders).toEqual([]);
  });

  /**
   * ⚠️ **Rewritten C-0314 (T-174), and the reason is why the old form was fragile.** It
   * asserted that `components/TabBar.tsx` contains a `2xl` — which was true only because
   * the world sheet in that file carried `rounded-t-2xl`. D-117 deleted the sheet, and the
   * check then failed for a file with ⛔ no radius defect at all: it was measuring one
   * screen's markup while claiming to measure the PARSER. ⇒ the side-stripping is now
   * proven directly, exactly as the `rounded` edge case below already is, and it can no
   * longer be broken by an unrelated screen losing a corner.
   */
  it('accepts a side-clipped form of an allowed value (D-036 ⓔ)', () => {
    for (const side of ['t', 'b', 's', 'e', 'tl', 'br']) {
      expect(radiiIn(`class="rounded-${side}-2xl"`)).toEqual([
        { token: `rounded-${side}-2xl`, value: '2xl' },
      ]);
    }
    // …and a side segment ⛔ never swallows the value itself: `rounded-t` alone is Tailwind's
    // 4px on one side, which is ⛔ not in ALLOWED.
    expect(radiiIn('rounded-t')[0]?.value).toBe('t');
  });

  it('⛔ never accepts a bare `rounded` — that is Tailwind’s 4px, a fourth value', () => {
    // Proves the parser's own edge case rather than trusting it: `rounded` alone yields
    // an empty value, which is not in ALLOWED.
    const parsed = radiiIn('<div className="rounded" />');
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.value).toBe('');
    expect(ALLOWED.has('')).toBe(false);
  });

  /**
   * 🔴 **⟦NEW 15/09 · `C-0624`⟧ The lie, named.** The old parser could not see a `[`, so
   * `rounded-[50%]`, `rounded-[4px]` and `rounded` were the SAME token to it ⇒ every
   * arbitrary radius in the repo was refused under a message pointing at the wrong defect.
   */
  it('parses an arbitrary value AS ITSELF, ⛔ and not as a bare `rounded`', () => {
    expect(radiiIn('className="rounded-[50%]"')).toEqual([
      { token: 'rounded-[50%]', value: '[50%]' },
    ]);
    expect(radiiIn('className="rounded-[4px]"')).toEqual([
      { token: 'rounded-[4px]', value: '[4px]' },
    ]);
    // …a side segment still strips, so it is the VALUE that gets judged.
    expect(radiiIn('className="rounded-t-[50%]"')[0]?.value).toBe('[50%]');
    // …and all three stay findings: an arbitrary CORNER is still a sixth value.
    for (const v of ['[50%]', '[4px]', '']) expect(ALLOWED.has(v)).toBe(false);
  });

  /**
   * 🔴 **⟦NEW 15/09 · `C-0624`⟧ The hole, closed.** Until this assertion existed, a
   * `border-radius:` written straight into a stylesheet was invisible to the gate ⇒
   * "move it to CSS" made **any** radius legal, and 🔬 **I used that in `C-0623` and
   * called it a fix.** A stylesheet may now carry a radius only when it is inert, a
   * declared token (`var(--…)`), or a DECLARED SHAPE named above.
   */
  it('⛔ raw `border-radius:` in CSS is inert, a token, or a DECLARED shape', () => {
    const offenders = CSS_FILES.flatMap((file) =>
      cssRadiiIn(readFileSync(file, 'utf8'))
        .filter(({ selector, value }) => {
          if (INERT_CSS_RADII.has(value)) return false;
          if (/^var\(--[-\w]+\)$/.test(value)) return false;
          return !declaredShape(file, selector, value);
        })
        .map(({ selector, value }) => `${file}: ${selector} { border-radius: ${value} }`),
    );
    // ⛔ The fix is ⛔ not "add a row to DECLARED_SHAPES". A CORNER belongs to the graded
    // scale and is written as a Tailwind utility; only a genuine SHAPE — an ellipse, which
    // `rounded-full` cannot express on a non-square box — is ever declared.
    expect(offenders).toEqual([]);
  });

  it('⛔ a declared shape is pinned to its selector, ⛔ never to its folder', () => {
    // The whole reason this is not `app/arcade/**`: the arena's own stylesheet is ⛔ not a
    // free zone, and the screens beside it stay on the graded scale.
    for (const d of DECLARED_SHAPES) {
      expect(d.selector, 'a declared shape names a selector').toMatch(/\[data-[-\w]+\]/);
      expect(d.file.endsWith('.css'), 'declared shapes are CSS-only').toBe(true);
    }
    expect(declaredShape('app/arcade/arcade-tokens.css', '[data-arena-scope] [data-arena-shadow]', '50%')).toBe(true);
    // …the same value under any OTHER selector in the very same file is a finding.
    expect(declaredShape('app/arcade/arcade-tokens.css', '[data-arena-card]', '50%')).toBe(false);
    // …and the same selector in another file is a finding too.
    expect(declaredShape('app/globals.css', '[data-arena-scope] [data-arena-shadow]', '50%')).toBe(false);
  });

  it('reads the selector that owns a raw CSS radius (guards the CSS parser)', () => {
    expect(
      cssRadiiIn('a { color: red; }\n[data-x] [data-y] {\n  border-radius: 50%;\n  opacity: .5;\n}'),
    ).toEqual([{ selector: '[data-x] [data-y]', value: '50%' }]);
    // …a comment ⛔ never becomes a declaration, and ⛔ never becomes a selector.
    expect(cssRadiiIn('/* border-radius: 50% */\n.z { border-radius: inherit; }')).toEqual([
      { selector: '.z', value: 'inherit' },
    ]);
  });
});
