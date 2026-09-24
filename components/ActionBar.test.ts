import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * C-0032/C-0034 lesson, re-measured here: over RAW text, the comment that
 * EXPLAINS a rule satisfies the assertion meant to prove the rule is
 * implemented — and, in the negative direction, the comment that FORBIDS a
 * string fails an assertion the code itself passes. Both happened in this file:
 * the header of `ActionBar.tsx` documents why it is not a client component, and
 * writing that sentence is what turned the server-component check red. Comments
 * are stripped before every scan below, so each assertion reads code only.
 *
 * `'use client'` inside a block comment is inert either way — a directive is
 * only a directive as the first statement — so stripping cannot hide a real
 * violation here.
 */
const stripComments = (source: string): string =>
  withoutComments(source);

const bar = stripComments(readFileSync('components/ActionBar.tsx', 'utf8'));
const css = stripComments(readFileSync('app/globals.css', 'utf8'));

describe('the flow-screen action bar (D-028 · F-027)', () => {
  it('anchors to the window, not to the end of the content', () => {
    expect(bar).toMatch(/fixed[^"'`]*bottom-0/);
  });

  it('marks itself, so the harness and the page padding can both find it', () => {
    expect(bar).toContain('data-action-bar');
  });

  it('keeps clear of the home indicator', () => {
    expect(bar).toContain('env(safe-area-inset-bottom)');
  });

  it('separates with a hairline and never with a shadow (constitution § 6)', () => {
    expect(bar).toContain('border-t');
    expect(bar).not.toMatch(/shadow-(sm|md|lg|xl|2xl)/);
  });

  it('pads the scroll container, not <main> — the footer link sits after <main>', () => {
    expect(css).toContain('body:has([data-action-bar])');
    expect(css).toMatch(/body:has\(\[data-action-bar\]\)[^}]*env\(safe-area-inset-bottom\)/);
  });

  /**
   * 🟠 F-082, and the root cause as it was MEASURED (C-0214) — ⛔ not as it was
   * guessed. The finding read the regression as "the page shortened". It did
   * not: `footer a[href="/sources"]` bottoms out at **676px on every flow
   * route**, `/study` included. The one number that moved is the bar's own
   * height — **77px** on `/`, `/signup`, `/onboarding`, `/world/compose` and
   * **135px** on `/study` — because C-0211 (T-124) stacked a second control
   * («נסה שוב» + the way out) inside it. The reservation below was the constant
   * `5rem = 80px`, which covers 77 and ⛔ does not cover 135.
   *
   * ⇒ the defect class is **one constant standing in for a content-dependent
   * height**, and raising 5rem to 9rem alone would fix today's number and break
   * again on the next bar that grows. So the bar now DECLARES its shape in the
   * attribute the padding already keys off, and this test is the thing that
   * makes the two sides impossible to separate: every value the components
   * actually emit must have a reservation, ⛔ and the stacked one must reserve
   * strictly more than the single one. A third shape with no rule fails HERE,
   * at `npm test`, and ⛔ not silently in `check:mobile` three ticks later.
   */
  const reservations = new Map(
    [...css.matchAll(/body:has\(\[data-action-bar(?:=['"]?([\w-]+)['"]?)?\]\)\s*\{[^}]*?calc\(\s*([\d.]+)rem/g)].map(
      (m) => [m[1] ?? '*', Number(m[2])],
    ),
  );

  it('reserves document space for every bar shape the components emit', () => {
    // The shapes the component can emit are its `layout` union — reading the
    // union and ⛔ not the JSX is what makes a shape that is declared but not
    // yet used by any screen still require a reservation.
    const union = /layout\?:\s*([^;]+);/.exec(bar)?.[1] ?? '';
    const shapes = [...union.matchAll(/'([\w-]+)'/g)]
      .map((m) => m[1])
      .filter((v): v is string => Boolean(v));
    // ⚠️ The unkeyed `body:has([data-action-bar])` rule is the reservation for
    // the DEFAULT shape and for that shape only. An earlier draft of this
    // assertion accepted it as cover for ANY shape — a mutation adding a third
    // shape with no rule survived, i.e. the guard was decorative. Every
    // non-default shape must carry its own keyed rule.
    const fallback = /layout\s*=\s*'([\w-]+)'/.exec(bar)?.[1];
    expect(fallback).toBeDefined();
    expect(shapes).toContain(fallback);
    expect(shapes.length).toBeGreaterThan(1);
    for (const shape of shapes) {
      const covered = shape === fallback ? reservations.has('*') : reservations.has(shape);
      expect(covered, `no padding reservation for data-action-bar="${shape}"`).toBe(true);
    }
  });

  it('reserves more for a stacked bar than for a single-row one (135px vs 77px, measured)', () => {
    const single = reservations.get('*');
    const stacked = reservations.get('stacked');
    expect(single).toBeDefined();
    expect(stacked).toBeDefined();
    // 135px measured at 320 · 375 · 414 — the height is width-independent, so
    // one number covers all three. 9rem = 144px clears it with the same slack
    // the single-row rule keeps over its own 77px.
    expect((stacked as number) * 16).toBeGreaterThanOrEqual(135);
    expect(stacked as number).toBeGreaterThan(single as number);
  });

  it('is a server component: the sign-out form on /onboarding must work without JS', () => {
    expect(bar).not.toContain("'use client'");
  });
});

/**
 * The bar is only a fix if the screens actually use it. A component that exists
 * and is imported nowhere is exactly the shape F-027 had before it was found:
 * correct in isolation, absent from the product.
 */
describe('every flow screen routes its primary action through the bar', () => {
  for (const file of [
    'components/AuthForm.tsx',
    'components/OnboardingForm.tsx',
    // ⚠️ MOVED C-0102 (T-065 task 6) from `app/study/page.tsx`. `/study` is still the flow
    // screen `FLOW_ROUTES` measures; what changed is that its bar now lives with the states
    // it belongs to, inside the client component that knows which one the learner is in —
    // retry on a failure, sign-in again on an expired session, the way out of an empty
    // queue. Naming the page file here after that move would assert the bar is in a file
    // that no longer renders one, i.e. it would go red on correct code; deleting the entry
    // instead would drop `/study` out of the F-027 guard entirely, which is the exact
    // failure that guard exists to prevent.
    // ⛔ The card state deliberately has no bar: `ActionBar` is `fixed` to the bottom edge
    // and would sit on top of the two grade buttons, which ARE that state's way forward.
    'components/StudyDeckScreen.tsx',
    'app/page.tsx',
  ]) {
    it(`${file} wraps its primary action in <ActionBar>`, () => {
      const src = stripComments(readFileSync(file, 'utf8'));
      // ⚠️ FIXED C-0214 (F-082) and ⛔ NOT weakened: the literal `'<ActionBar>'`
      // this asserted goes red the moment the bar takes a prop, which F-082
      // required of `StudyDeckScreen`. What the assertion protects — a flow
      // screen whose primary action is inside the bar — is unchanged; only the
      // opening tag is now allowed to carry attributes.
      const open = src.search(/<ActionBar[\s>]/);
      expect(open).toBeGreaterThanOrEqual(0);
      const close = src.indexOf('</ActionBar>', open);
      expect(close).toBeGreaterThan(open);
      expect(src.slice(open, close)).toContain('data-primary-action');
    });
  }

  it('keeps the onboarding submit attached to its form after leaving it', () => {
    const src = stripComments(readFileSync('components/OnboardingForm.tsx', 'utf8'));
    expect(src).toContain('id="onboarding-form"');
    expect(src).toContain('form="onboarding-form"');
  });
});
