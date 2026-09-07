import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * F-007 regression guard. The mobile harness measures every promise this
 * project makes about 375px layout, 44px tap targets and RTL. While it sat
 * outside `npm run verify`, `verify` went green without any of those being
 * checked — so the wiring itself is what has to be defended, not the checks.
 */
describe('check:mobile is part of the verify pipeline (F-007)', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as {
    scripts: Record<string, string>;
  };

  it('exposes check:mobile', () => {
    expect(pkg.scripts['check:mobile']).toBe('node scripts/verify-mobile.mjs');
  });

  it('runs check:mobile as part of verify', () => {
    expect(pkg.scripts.verify).toContain('check:mobile');
  });

  it('runs it after build, since it measures the production output', () => {
    const verify = pkg.scripts.verify ?? '';
    expect(verify.indexOf('check:mobile')).toBeGreaterThan(verify.indexOf('run build'));
  });
});

describe('the harness resolves a browser that exists on disk (F-007)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('probes for an installed Chromium instead of trusting playwright’s pinned build', () => {
    expect(source).toContain('resolveChromiumPath');
    expect(source).toContain('PLAYWRIGHT_BROWSERS_PATH');
  });

  it('always passes an explicit executablePath to chromium.launch', () => {
    expect(source).toMatch(/chromium\.launch\(\{\s*\n\s*executablePath,/);
  });

  it('can boot its own server so it needs no operator', () => {
    expect(source).toContain('startServer');
  });
});

describe('the harness guards the landing layout it just fixed (F-011 · T-027)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const page = readFileSync('app/page.tsx', 'utf8');

  it('measures the dead band above the heading', () => {
    expect(source).toContain('heading anchored to top');
  });

  it('locates the primary action by marker, not by document order', () => {
    expect(source).toContain('main [data-primary-action]');
    expect(page).toContain('data-primary-action');
  });
});

/**
 * C-0034. The scan measured every control's own box, so T-029's goal group —
 * a 20px radio dot centred in a 44px clickable row — reported three failures on
 * a layout that is correct: the browser activates a radio from anywhere in its
 * label, so the row IS the target. The danger in relaxing a barrier is that the
 * relaxation quietly covers more than it was meant to, which is why the
 * narrowing is asserted here and not only the substitution.
 */
describe('the tap-target scan measures the region that activates the control (C-0034)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  // Line comments are stripped before scanning. C-0032 measured this exact
  // hazard on the migration test: over raw text, the comment that EXPLAINS a
  // rule satisfies the assertion meant to prove the rule is implemented.
  const code = source.replace(/^[^\S\n]*\/\/.*$/gm, '');

  it('substitutes the enclosing label for a radio or checkbox', () => {
    expect(code).toContain("el.type === 'radio' || el.type === 'checkbox'");
    expect(code).toContain("el.closest('label')");
  });

  it('never lets a label stand in for a text-entry field', () => {
    const start = code.indexOf('const tapRect');
    const body = code.slice(start, code.indexOf('};', start));
    expect(start).toBeGreaterThan(-1);
    for (const widened of ['text', 'email', 'date', 'number', 'password']) {
      expect(body).not.toContain(`'${widened}'`);
    }
  });

  it('measures the substituted region, not the control, against the 44px floor', () => {
    expect(code).toContain('rect.width < min || rect.height < min');
  });
});

/**
 * F-027 — roy measured the bug on the live site: he signed up, landed on the
 * onboarding screen, and found no way forward and no way out. The screen was
 * not broken; it was 1090px tall at a 780px viewport, and BOTH controls sat
 * below the fold (submit y=852, sign-out y=928 at 375px). A learner who does
 * not think to scroll is stopped at the front door of the product.
 *
 * That defect was invisible to this harness for three compounding reasons, and
 * each one is asserted separately below, because fixing only the visible one
 * leaves the hole open:
 *
 *   1. The thumb-zone check names `/onboarding`, and `/onboarding` answers 307
 *      without Supabase env (TD-13) — so it has always measured `/login`. The
 *      file's own comment says "every ok /onboarding line is really the login
 *      screen", and the check was never moved to the fixture anyway.
 *   2. `/dev/onboarding` rendered the form ALONE. The real screen also renders
 *      the address band above it and the sign-out form below it, so the fixture
 *      was 126px shorter than the screen it stands for — measured: submit at
 *      y=726 in the old fixture vs y=852 in the real composition.
 *   3. The onboarding submit carries no `[data-primary-action]`, so the
 *      fallback selector (`main a[href], main button`) would have returned the
 *      address band's correction link, not the button that moves the learner
 *      forward. That exact substitution already fooled this check once on
 *      `/login`, where it returned the password-visibility toggle.
 *
 * roy's requirement, verbatim: "verify-mobile at 375 must require that every
 * screen in the flow contains an accessible primary action, otherwise the bug
 * comes back."
 */
describe('every flow screen carries one reachable primary action (F-027)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const code = source.replace(/^[^\S\n]*\/\/.*$/gm, '');

  it('names the flow screens as a set instead of an inline route disjunction', () => {
    expect(code).toContain('const FLOW_ROUTES');
    expect(code).toContain('FLOW_ROUTES.includes(route)');
  });

  it('measures the onboarding fixture, not the route that redirects to login', () => {
    const start = code.indexOf('const FLOW_ROUTES');
    const set = code.slice(start, code.indexOf(']', start));
    expect(set).toContain("'/dev/onboarding'");
    expect(set).not.toContain("'/onboarding'");
  });

  it('requires exactly one marked primary action, so the fallback cannot pick a decoy', () => {
    expect(code).toContain('exactly one primary action');
    expect(code).toContain("main [data-primary-action]");
  });

  it('hit-tests the primary action rather than trusting its rectangle', () => {
    expect(code).toContain('elementFromPoint');
    expect(code).toContain('primary action is hit-testable');
  });

  it('proves the action is reachable by scrolling when it starts below the fold', () => {
    expect(code).toContain('primary action reachable by scrolling');
    expect(code).toContain('scrollTo');
  });

  /**
   * A mutation caught this, and it is why the check has its present shape. The
   * first version ran `scrollIntoView` for the hit-test and only afterwards
   * asked whether the action could be scrolled to — reading a position its own
   * earlier line had produced. Pinning the document with
   * `overflow-y: hidden; height: 100dvh` on html and body, the exact CSS that
   * turns "below the fold" into "does not exist" for a finger, left all 30
   * reachability checks green. So the order is load-bearing: reachability is
   * measured from a scroll-reset page before anything scrolls it, and the clip
   * is read from computed style rather than inferred from a position, because
   * `scrollIntoView` moves a clipped document perfectly well and a thumb cannot.
   */
  it('reads the clip from computed style, since programmatic scrolling ignores it', () => {
    expect(code).toContain('overflowY');
    expect(code).toContain('clipped');
  });

  it('measures reachability before anything else scrolls the page', () => {
    // ⚠️ העוגן הוא `PRIMARY_ACTION_ROUTES` מאז C-0250 (T-091 · F-098), כי בלוק
    // ארבע בדיקות F-027 נחתך מ-`FLOW_ROUTES` כדי לכסות גם את שתי לשוניות
    // הפיקסטורה. ⛔ **הבדיקה ⛔ לא נחלשה ולו בתו אחד** — שתי האסרציות שמתחת
    // זהות, והשינוי היחיד הוא שהן מצביעות שוב על אותו קוד עצמו: עוגן שמצביע
    // על הבלוק השני היה הופך אותה לבדיקה חלולה שעוברת על כלום (F-100 · משפחת F-091).
    const start = code.indexOf('PRIMARY_ACTION_ROUTES.includes(route)');
    expect(start).toBeGreaterThan(-1);
    const block = code.slice(start, code.indexOf('report(`', start));
    expect(block).toContain('scrollIntoView');
    expect(block.indexOf('const reachable')).toBeLessThan(block.indexOf('scrollIntoView'));
  });

  it('reports the first-paint offset so the number is in the log, not in a comment', () => {
    expect(code).toContain('firstPaintTop');
  });
});

/**
 * F-027 cause 2. A fixture shorter than the screen it stands for is worse than
 * no fixture: it reports "ok" for a layout nobody has measured. The two files
 * are compared by the elements they render, not by text, because the real page
 * additionally carries the session gate the fixture must not have (TD-13).
 */
describe('the onboarding fixture renders everything the real screen renders (F-027)', () => {
  const real = readFileSync('app/onboarding/page.tsx', 'utf8');
  const fixture = readFileSync('app/dev/onboarding/page.tsx', 'utf8');

  for (const element of ['RegisteredAddress', 'OnboardingForm', 'ONBOARDING_TITLE_HE']) {
    it(`renders <${element}> like the real screen does`, () => {
      expect(real).toContain(element);
      expect(fixture).toContain(element);
    });
  }

  it('carries the sign-out control that sits below the form on the real screen', () => {
    expect(real).toContain('action="/logout"');
    expect(fixture).toContain('action="/logout"');
  });

  it('still refuses the session gate, which is what makes it a fixture', () => {
    expect(real).toContain('createRouteClient');
    expect(fixture).not.toContain('createRouteClient');
  });
});

/**
 * F-027 cause 3. The marker is what tells the harness which control moves the
 * learner forward. Every other flow screen already carries it; onboarding was
 * skipped, which is why the check had nothing correct to grab.
 */
describe('the onboarding submit is marked as the primary action (F-027)', () => {
  const form = readFileSync('components/OnboardingForm.tsx', 'utf8');

  it('marks the submit button', () => {
    expect(form).toContain('data-primary-action');
  });

  it('marks the submit and not the optional-score field beside it', () => {
    const marker = form.indexOf('data-primary-action');
    const submit = form.indexOf('type="submit"');
    expect(marker).toBeGreaterThan(-1);
    expect(submit).toBeGreaterThan(-1);
    expect(Math.abs(marker - submit)).toBeLessThan(200);
  });
});

/**
 * Task 4 of the navigation-shell plan — the harness has to be able to SEE the
 * tab shell before any claim about its geometry means anything.
 *
 * `/studies` and `/me` read the session, so they answer 307 without Supabase
 * env (TD-13) and the harness would silently measure `/login` instead — F-027
 * cause 1, the reason roy's dead end was invisible for weeks. Two fixtures
 * stand in for them.
 *
 * ⚠️ Declared deviation from plan step 4.1, which said the fixtures "render the
 * same components as the real screens": at plan time neither screen HAD a
 * component — both were inline JSX inside a session-gated server component, so
 * "the same components" did not exist to render. Copying the JSX into a fixture
 * is F-027 cause 2 by construction (a fixture that drifts from the screen it
 * stands for reports "ok" for a layout nobody measured), so the presentation
 * was extracted into `components/StudiesScreen.tsx` and `components/MeScreen.tsx`
 * and BOTH the real screen and the fixture render it. The mirror below is then
 * a single symbol instead of a list of copied elements, and drift is impossible
 * rather than merely detectable. ⛔ No screen, label, route or flow changed.
 */
describe('the tab fixtures render what the real tab screens render (F-027 cause 2)', () => {
  const cases = [
    {
      name: 'studies',
      real: 'app/(tabs)/studies/page.tsx',
      fixture: 'app/dev/tabs/studies/page.tsx',
      component: 'StudiesScreen',
    },
    {
      name: 'cards',
      real: 'app/(tabs)/cards/page.tsx',
      fixture: 'app/dev/tabs/cards/page.tsx',
      component: 'LevelMapScreen',
      // ⚠️ Not in the plan. Step 4.3 named `/cards` as a directly measurable
      // route; measured in C-0075 it answers 307 → /login?expired=1, because
      // C-0073 added it to `PROTECTED_SCREENS`. It gets a fixture like the
      // other two, and `sessionGated` records which file holds the gate.
      sessionGated: 'proxy.ts',
    },
    {
      name: 'me',
      real: 'app/(tabs)/me/page.tsx',
      fixture: 'app/dev/tabs/me/page.tsx',
      component: 'MeScreen',
    },
  ];

  for (const { name, real, fixture, component, sessionGated } of cases) {
    describe(`/dev/tabs/${name}`, () => {
      it(`renders <${component}>, the same component the real screen renders`, () => {
        expect(readFileSync(real, 'utf8')).toContain(component);
        expect(readFileSync(fixture, 'utf8')).toContain(component);
      });

      it('still refuses the session gate, which is what makes it a fixture', () => {
        // Two gates exist: the screen's own `createRouteClient` read (F-003),
        // and `proxy.ts`'s PROTECTED_SCREENS list. `/cards` has only the second
        // — which is exactly as redirecting as the first, and was measured that
        // way. Either one makes the real route unmeasurable and the fixture
        // necessary; the fixture must carry neither.
        const realSrc = readFileSync(sessionGated ?? real, 'utf8');
        expect(realSrc).toMatch(sessionGated ? /PROTECTED_SCREENS/ : /createRouteClient/);
        if (sessionGated) expect(realSrc).toContain(`'/${name}'`);
        expect(readFileSync(fixture, 'utf8')).not.toContain('createRouteClient');
      });

      /**
       * The real screens sit inside `app/(tabs)`, so the bar arrives from the
       * route group's layout. The fixtures sit under `app/dev`, OUTSIDE that
       * group — which is the point of the group — so they have to name it. A
       * fixture without the bar measures a screen 4.5rem shorter than the one
       * the learner sees, and the tab-bar checks would have nothing to find.
       */
      it('carries the tab bar the route group gives the real screen for free', () => {
        expect(readFileSync(fixture, 'utf8')).toContain('TabBar');
        expect(readFileSync('app/(tabs)/layout.tsx', 'utf8')).toContain('TabBar');
      });

    });
  }

  /** One layout for both fixtures — a harness route must never be a search result. */
  it('is kept out of the index, like every other harness fixture', () => {
    const layout = readFileSync('app/dev/tabs/layout.tsx', 'utf8');
    expect(layout).toContain('robots');
    expect(layout).toContain('index: false');
  });
});

/**
 * Task 4.4 — the wiring itself, which is the part a refactor breaks silently.
 * D-028 ("a screen never carries both bars") is the one rule TWO separate
 * features can break from opposite directions, so it has to be greppable: the
 * check's own label is asserted here by name.
 */
describe('the harness measures the tab shell (T-051 · D-027 · D-028)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('declares TAB_ROUTES beside FLOW_ROUTES', () => {
    expect(code).toMatch(/const TAB_ROUTES = \[/);
  });

  /**
   * C-0127 (task 7). `<TabBar>` renders on all three tab fixtures and now asks
   * `/api/world/status` whether the world tab is unlocked; with no Supabase env the endpoint
   * answers 503 by contract and Chromium logs it, so all three routes needed an
   * `EXPECTED_CONSOLE` entry. The allowance is the dangerous part of this change, ⛔ not the
   * fetch: an entry written one character wider — dropping the status, or matching the whole
   * route — would silence a real uncaught exception on three of the app's four screens, and
   * the clean-console check exists for nothing else. So the WIDTH is what is measured here.
   */
  for (const route of ['/dev/tabs/studies', '/dev/tabs/cards', '/dev/tabs/me']) {
    it(`allows the world-status 503 on ${route}, and ⛔ nothing wider`, () => {
      const block = code.slice(
        code.indexOf('const EXPECTED_CONSOLE = {'),
        code.indexOf('};', code.indexOf('const EXPECTED_CONSOLE = {')),
      );
      // ⚠️ The path inside a regex literal is written with escaped slashes (`api\/world\/`),
      // so a filter on the plain URL matches NOTHING and every assertion below it would
      // then be vacuously true over an empty string. Measured in this tick: that is exactly
      // what the first draft of this test did, and it failed loudly only because of the
      // `not.toBe('')` guard on the line beneath. That guard is the test's own F-039 check —
      // ⛔ do not remove it.
      const allowances = block
        .split('\n')
        .filter((line) => line.includes(String.raw`api\/world\/status`));
      expect(allowances.join('\n')).not.toBe('');
      // Every world-status allowance names the status, so a 401 or a 500 on the same URL is
      // still a failure. A route-wide wildcard would carry no path at all and would fall out
      // of the filter above, failing the guard.
      for (const line of allowances) expect(line).toContain('status of 503');
      expect(block).toContain(`'${route}'`);
    });
  }

  for (const route of ['/dev/tabs/studies', '/dev/tabs/cards', '/dev/tabs/me']) {
    it(`visits ${route}`, () => {
      const routes = code.slice(code.indexOf('const ROUTES = ['), code.indexOf('const MIN_TAP'));
      expect(routes).toContain(`'${route}'`);
    });

    it(`treats ${route} as a tab screen`, () => {
      const tabRoutes = code.slice(
        code.indexOf('const TAB_ROUTES = ['),
        code.indexOf('];', code.indexOf('const TAB_ROUTES = [')),
      );
      expect(tabRoutes).toContain(`'${route}'`);
    });
  }

  it('asserts the tab bar is present, complete and thumb-sized', () => {
    expect(code).toContain('tab bar is present');
    // ⚠️ ארבע ⇒ **חמש**, C-0314 (T-174 · `36 § 4`): `הגדרות` נוספה כדי שהעולם יעמוד
    // במרכז הגאומטרי המדויק. ⛔ המספר נשאר מדויק ו⛔ לא הוחלף ב-`>= 4`.
    expect(code).toContain('exactly five tabs');
    expect(code).toContain('tabs.count === 5');
    expect(code).toContain('every tab >= 44px');
  });

  it('asserts D-028 from the tab side — no action bar where the tab bar is', () => {
    expect(code).toContain('no action bar on a tab screen');
  });

  it('asserts D-028 from the flow side — no tab bar where a flow screen is', () => {
    expect(code).toContain('no tab bar on a flow screen');
  });
});

/**
 * Comments are prose, not markup. `app/page.tsx` and `app/sources/page.tsx` both
 * document the F-011 defect by quoting the offending class pair verbatim — the
 * measurement below has to read the JSX these files render, or it convicts a file
 * for describing the bug it was fixed for. Stripping is deliberately narrow: block
 * comments, and `//` only where it opens a line, so a `https://` inside a string
 * survives untouched.
 */
function markupOnly(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/.*$/gm, '');
}

describe('page containers are anchored to the top, never centred (F-011 · F-016)', () => {
  const files = ['app/loading.tsx', 'app/error.tsx', 'app/page.tsx', 'app/study/page.tsx'];
  for (const file of files) {
    it(`${file} does not centre its page container`, () => {
      const src = markupOnly(readFileSync(file, 'utf8'));
      // `items-center justify-center` inside a button/link centres a LABEL and is fine;
      // `flex-1 … justify-center` on the page column is the dead-band defect.
      expect(src).not.toMatch(/flex-1[^"'`]*justify-center/);
    });
  }

  it('strips prose without blinding itself to markup', () => {
    expect(markupOnly('/* `flex-1 justify-center` was the bug */')).not.toMatch(
      /flex-1[^"'`]*justify-center/,
    );
    expect(markupOnly('  // `flex-1 justify-center` was the bug')).not.toMatch(
      /flex-1[^"'`]*justify-center/,
    );
    expect(markupOnly('<div className="flex flex-1 flex-col justify-center" />')).toMatch(
      /flex-1[^"'`]*justify-center/,
    );
    expect(markupOnly('const u = "https://x.example/a";')).toContain('https://x.example/a');
  });
});

/**
 * T-057 — constitution § 4. `MIN_TAP = 44` alone lets two perfectly sized
 * controls sit flush against each other: the thumb that means the second one
 * lands on the first, and the harness prints green. The gap is what the learner
 * actually aims into, so it has to be measured, not assumed from the box size.
 */
describe('adjacent tap targets are separated, not merely large (T-057 · constitution § 4)', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('declares the floor as a named constant beside MIN_TAP', () => {
    expect(SRC).toMatch(/const MIN_GAP = 8;/);
  });

  it('measures the gap on the flow screens, where the mis-taps happen', () => {
    expect(SRC).toMatch(/FLOW_ROUTES\.includes\(route\)/);
    expect(SRC).toContain('adjacent tap targets');
  });

  /**
   * The trap this test exists for: two controls that OVERLAP have a NEGATIVE
   * gap, which is the worst case there is — one control painted over another.
   * `Math.abs()` anywhere on that number turns the worst case into the
   * safest-looking one (a -100px overlap reads as 100px of clearance), so the
   * subtraction and both comparisons stay signed.
   *
   * ⚠️ Measured, not assumed (C-0085): the guard the plan shipped —
   * `not.toMatch(/Math\.abs\([^)]*gap[^)]*\)\s*>=/)` — only covers the `>=`
   * break line. The mutation that actually hides an overlap is
   * `if (Math.abs(gap) < min)` on the REPORT line, and that form walks straight
   * past a `>=`-anchored regex. `Math.abs` on the gap is banned outright here.
   */
  it('compares a signed gap, so an overlap can never read as a pass', () => {
    expect(SRC).not.toMatch(/Math\.abs\(\s*gap/);
    expect(SRC).toMatch(/const gap = b\.r\.top - a\.r\.bottom;/);
    expect(SRC).toMatch(/gap\s*<\s*min\b/);
  });

  /**
   * The scan runs inside the page, where the module scope does not exist, so it
   * takes its floor as an argument. A literal there would be a second, silent
   * floor that `MIN_GAP = 8` no longer governs — and the mutation in step 8
   * (set `MIN_GAP = 0`) would stop reaching the code it is meant to test.
   */
  it('hands the named constant to the in-page scan, never a literal', () => {
    expect(SRC).toMatch(/\}, MIN_GAP\);/);
  });

  it('ignores pairs that do not overlap on the cross axis', () => {
    expect(SRC).toContain('overlapsHorizontally');
  });

  /**
   * ⚠️ Measured, not assumed (C-0085). Run exactly as the plan wrote it, the
   * scan reported 13 failures and every one was a NEGATIVE gap — an overlap,
   * never a tight gap — from one of two structural pairs:
   *
   *   `a"מקורות הנתונים ו" ↔ a"בואו נתחיל" -40px`  (footer licence link vs the
   *   primary action inside `ActionBar`, which is `fixed inset-x-0 bottom-0`)
   *   `input"" ↔ button"הצג" -54px`  (the password toggle, `absolute inset-y-0
   *   right-0`, inside the field it belongs to)
   *
   * Neither is a spacing defect and neither has a `gap-*` to widen. Comparing a
   * fixed bar's rectangle at scroll 0 against the document underneath it
   * measures the overlay, which is the bar's whole purpose; whether it CLEARS
   * that content is asserted separately, from a scrolled page, by "action bar
   * does not cover the licence link". These two tests are what keep the two
   * exclusions honest — each names the property it turns on, so an exclusion
   * cannot later widen into "skip the pairs that fail".
   */
  it('never compares a fixed overlay against the document beneath it', () => {
    expect(SRC).toContain('overlayRoot');
    expect(SRC).toMatch(/p === 'fixed' \|\| p === 'sticky'/);
    expect(SRC).toMatch(/a\.overlay !== b\.overlay/);
  });

  it('treats an absolute control lying inside a field as that field, not a neighbour', () => {
    expect(SRC).toContain('encloses');
    // The exclusion is granted to `position: absolute` alone. Widening it to any
    // enclosed pair would hide a real control painted over another.
    expect(SRC).toMatch(/a\.absolute && encloses/);
    expect(SRC).toMatch(/b\.absolute && encloses/);
  });
});

/**
 * T-065 task 8 — the deck's geometry is measured, not declared.
 *
 * `/study` is already in `ROUTES`, and that is exactly why this fixture is needed: with no
 * Supabase env the queue answers 503 by its own contract, so every `ok /study` line this
 * harness has ever printed described the FAILURE state — the scrolling deck itself has
 * never once been rendered at 320/375/414. Same reasoning that produced `/dev/card` and
 * `/dev/tabs/*` (TD-13), and the same rule applies: ⛔ a red run here is a finding on the
 * component, ⛔ never a reason to drop the route from the list.
 */
describe('the harness measures the scrolling deck (T-065 · § 4.2ו)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const fixture = readFileSync('app/dev/deck/page.tsx', 'utf8');

  it('visits /dev/deck, beside the other card fixtures', () => {
    const routes = code.slice(code.indexOf('const ROUTES = ['), code.indexOf('const MIN_TAP'));
    expect(routes).toContain("'/dev/deck'");
    expect(routes.indexOf("'/dev/deck'")).toBeGreaterThan(routes.indexOf("'/dev/card'"));
  });

  it('renders <CardDeck>, the same component /study renders', () => {
    expect(fixture).toContain('CardDeck');
    expect(readFileSync('components/StudyDeckScreen.tsx', 'utf8')).toContain('CardDeck');
  });

  /**
   * The fixture exists BECAUSE the real screen cannot render without env. A fixture that
   * fetched would land in the same 503 state it was written to escape, and the harness
   * would print `ok /dev/deck` for a screen with no deck on it.
   */
  it('touches no network and no session, which is what makes it measurable', () => {
    expect(fixture).not.toContain('createRouteClient');
    expect(fixture).not.toContain('apiGet');
    expect(fixture).not.toContain('StudyDeckScreen');
    expect(fixture).not.toMatch(/\bfetch\(/);
  });

  /**
   * Two cards and not one: «one card per screen» is unfalsifiable on a deck that only ever
   * held one card, and the snap container's height is only wrong when there is a second
   * card to push out of the viewport.
   *
   * T-086 (§ 4.2ח ⓑ · 2026-08-20) — הפיקסטורה גדלה מ-2 ל-5 כדי להוכיח שכרטיס 3, 4, 5
   * גם מחוץ למסך: פגם `h-full` בתוך `flex-1` היה נעצר על כרטיס 2 ומחזיר את כרטיס 3
   * ל-`min-content`. חמישה הוא מספר קונקרטי — ההארנס סורק את כל הפריטים ומאמת שכל
   * אחד ממלא את ה-snap viewport ושכל כרטיס משני והלאה מתחיל מתחת לקצה התחתון.
   */
  it('hard-codes exactly five cards (T-086)', () => {
    expect(fixture.match(/word_id:/g) ?? []).toHaveLength(5);
  });

  /**
   * Same non-content as the sibling fixtures — R-010/R-013 forbid sourced content and the
   * loop forbids invented content.
   *
   * ⛔ And ⛔ no note paragraph above the deck, unlike `/dev/card`: `<CardDeck>` is `h-dvh`,
   * so one line of chrome the real route does not have pushes the card down and this harness
   * starts measuring the fixture instead of the component. The declaration lives in the doc
   * comment, where it costs no pixels.
   */
  it('teaches nothing, and renders nothing but the deck', () => {
    expect(fixture).toContain('אינו תוכן לימודי');
    expect(fixture).not.toMatch(/<p[\s>]/);
  });

  it('is kept out of the index, like every other harness fixture', () => {
    const layout = readFileSync('app/dev/deck/layout.tsx', 'utf8');
    expect(layout).toContain('robots');
    expect(layout).toContain('index: false');
  });

  /**
   * The three measurements the task names, asserted by the label the harness prints. A
   * check nobody can grep for is a check the next hand deletes by accident.
   */
  it('measures one card per screen', () => {
    expect(code).toContain('one card per screen');
  });

  it('measures both grade buttons at the tap floor', () => {
    expect(code).toContain('both grade buttons');
  });

  /**
   * T-259ⓕ (07/09) — the two buttons are the ACCESSIBLE channel now: measured sr-only at rest
   * (≤1px) and ≥44px the moment one is focused. The pre-07/09 gap measurement described a
   * visible pair that no longer exists and is deliberately ⛔ not quoted.
   */
  it('measures the two grade buttons as the accessible channel: sr-only at rest, ≥44px focused', () => {
    const start = code.indexOf("route === '/dev/deck'");
    const block = code.slice(start, code.indexOf('clean console', start));
    expect(block).toContain('both grade buttons are sr-only at rest');
    expect(block).toContain('page.focus(`[data-grade="${grade}"]`)');
    expect(block).toContain('is a ≥${MIN_TAP}px target');
  });

  /**
   * The deck block is keyed to the exact route. `startsWith('/dev/card')` owns the reveal /
   * marker / verdict assertions, and `/dev/deck` must not fall into them — nor they into it.
   */
  it('keys the deck block to the exact route, not a prefix', () => {
    expect(code).toContain("route === '/dev/deck'");
    expect(code).toMatch(/route\.startsWith\('\/dev\/card'\)/);
  });

  /**
   * The floors are the named constants, ⛔ never re-typed literals that can drift apart.
   *
   * ⚠️ The first version of this test asserted only that `MIN_TAP` and `MIN_GAP` appear in
   * the block — and stayed GREEN when the argument was mutated to `[44, 8]`, because both
   * names still appear in the check LABELS. It now measures the argument itself, and the
   * same mutation turns it red.
   */
  it('hands the named floor to the focused-button measurement', () => {
    const start = code.indexOf("route === '/dev/deck'");
    const block = code.slice(start, code.indexOf('clean console', start));
    expect(block).toMatch(/box\.height >= MIN_TAP && box\.width >= MIN_TAP/);
    expect(block).not.toMatch(/>=\s*44\b/);
  });
});

/**
 * T-063 task 9 — the world screens enter the harness.
 *
 * ⚠️ **The assertions below are deliberately NOT the ones the plan prints.** F-039: a
 * `toContain("'/world'")` on the whole file is green when the string appears in a comment,
 * in a console allowance, or in a route that was added and then commented out. Each check
 * here parses the array it is about and compares EXACT entries, so a mutation that moves a
 * route out of `ROUTES` (or into a comment) turns it red.
 */
describe('the world screens are measured and not assumed (T-063 task 9)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  /** The entries of a top-level array literal, with comment lines stripped first. */
  function entriesOf(name: string): readonly string[] {
    const body = code.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n?\\];`))?.[1] ?? '';
    const withoutComments = body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    return [...withoutComments.matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '');
  }

  it('walks the real world routes, so their failure state is measured like every other screen', () => {
    const routes = entriesOf('ROUTES');
    expect(routes).toContain('/world');
    expect(routes).toContain('/world/compose');
    // C-0205 (T-106) — «שרשרת הכתיבה», the third real route in the feature.
    expect(routes).toContain('/world/chain');
  });

  it('walks the /dev/world fixture, which is where the bank and the draft are actually rendered', () => {
    expect(entriesOf('ROUTES')).toContain('/dev/world');
  });

  it('treats /world/compose as a FLOW screen — one primary action, reachable', () => {
    expect(entriesOf('FLOW_ROUTES')).toContain('/world/compose');
  });

  /**
   * The console allowance is the one place where "this screen is broken" and "this harness
   * cannot let it succeed" look identical, so the entry has to name the request AND the
   * status. An allowance keyed to the route alone would also swallow a 500 or an uncaught
   * exception on the same screen.
   */
  it('allows the world routes only the documented 503, keyed to the request that makes it', () => {
    const block = code.match(/const EXPECTED_CONSOLE = \{([\s\S]*?)\n\};/)?.[1] ?? '';
    const worldEntries = [...block.matchAll(/'(\/world[^']*)':\s*\[([\s\S]*?)\],/g)];
    expect(worldEntries.length).toBeGreaterThan(0);
    // ⚠️ C-0205 (T-106): this used to be the literal list `['/world', '/world/compose']`,
    // and a third real world route made it fail — ⛔ a hand-kept list is a guard that has
    // to be edited every time it is right. It is DERIVED now, and that is strictly
    // stronger, ⛔ not weaker: every walked `/world*` route must carry an allowance (silence
    // on one leaves that screen's console permanently red or unmeasured), and an allowance
    // may ⛔ not exist for a route the harness never walks (a rule nobody was checking
    // before). `/dev/world*` fixtures are excluded by their own prefix and stay silent.
    const walked = entriesOf('ROUTES').filter((route) => route.startsWith('/world'));
    expect(walked.length).toBeGreaterThan(2);
    expect(worldEntries.map(([, route]) => route).sort()).toEqual([...walked].sort());
    for (const [, route, allowances] of worldEntries) {
      // The allowances are regex literals, so their path separators arrive escaped.
      const named = `${route} ${allowances}`.replace(/\\/g, '');
      expect(named).toContain('503');
      expect(named).toMatch(/\/api\/world\//);
    }
  });

  /**
   * The fixture is handed its bank as a prop and therefore asks the server for NOTHING. If
   * it ever needs an allowance, it has started fetching — which means the harness went back
   * to measuring the 503 failure state instead of the bank (the C-0104 lesson this whole
   * task exists for), and this test is the alarm.
   */
  it('⛔ grants the /dev/world fixture no console allowance at all — it makes no request', () => {
    const block = code.match(/const EXPECTED_CONSOLE = \{([\s\S]*?)\n\};/)?.[1] ?? '';
    expect(block).not.toContain("'/dev/world'");
  });
});

describe('every flow screen declares where its primary action leads (T-067)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  function block(name: string): string {
    return (
      code
        .match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`))?.[1]
        ?.replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^[ \t]*\/\/[^\n]*$/gm, '') ?? ''
    );
  }

  /** The entries of a top-level array literal, comments stripped. */
  function entriesOf(name: string): readonly string[] {
    const body = code.match(new RegExp(`const ${name} = \\[([\\s\\S]*?)\\n?\\];`))?.[1] ?? '';
    const withoutComments = body
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/^[ \t]*\/\/[^\n]*$/gm, '');
    return [...withoutComments.matchAll(/'([^']*)'/g)].map((m) => m[1] ?? '');
  }

  /** Route keys of the FLOW_ARRIVAL object — the keys only, never a value. */
  function arrivalRoutes(): string[] {
    return [...block('FLOW_ARRIVAL').matchAll(/^\s*'([^']+)':\s*\{/gm)].map((m) => m[1] ?? '');
  }

  it('declares an arrival for EVERY flow route — a new screen cannot arrive unmeasured', () => {
    // ⚠️ מאז C-0250 (T-091) הקבוצה היא **האיחוד** של `FLOW_ROUTES` ושתי לשוניות
    // הפיקסטורה שנוספו ל-`PRIMARY_ACTION_ROUTES`. ⛔ **⛔ אינה החלשה** — היא
    // הרחבה: השוויון עדיין דו-כיווני, ולכן ⛔ אין רשומת נחיתה בלי מסלול, ⛔ ואין
    // מסלול שנמדדת עליו פעולה מסומנת בלי יעד נקוב. `entriesOf` קורא רק מחרוזות
    // במרכאות, ולכן ה-spread ב-`PRIMARY_ACTION_ROUTES` ⛔ אינו נספר פעמיים (F-100).
    expect(arrivalRoutes().sort()).toEqual(
      [...entriesOf('FLOW_ROUTES'), ...entriesOf('PRIMARY_ACTION_ROUTES')].sort(),
    );
  });

  it('gives each entry one of the three kinds, and a reason', () => {
    const entries = [...block('FLOW_ARRIVAL').matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\},/g)];
    expect(entries.length).toBe(arrivalRoutes().length);
    for (const [, route, body] of entries) {
      expect(`${route} ${body}`).toMatch(/kind:\s*'(navigates|announces|refetches)'/);
      // ⛔ An entry without a reason is an exemption wearing a table's clothes.
      expect(`${route} ${body}`).toMatch(/why:/);
    }
  });

  it('asserts the one screen that CAN reach the next one actually does', () => {
    const landing = block('FLOW_ARRIVAL').match(/'\/':\s*\{([\s\S]*?)\n\s*\},/)?.[1] ?? '';
    expect(landing).toContain("kind: 'navigates'");
    expect(landing).toContain("to: '/signup'");
  });

  it('measures the tap and not the markup — the block clicks', () => {
    expect(code).toMatch(/FLOW_ARRIVAL\[route\]/);
    expect(code).toMatch(/\.click\(/);
  });

  it('runs the arrival block BEFORE the clean-console check, so the tap’s own errors are judged', () => {
    // A tap that fires a request the harness cannot satisfy produces a console error. If
    // the console were read first, that error would be invisible — and an invisible error
    // is how a 500 hides behind a documented 503.
    expect(code.indexOf('FLOW_ARRIVAL[route]')).toBeLessThan(code.indexOf('clean console'));
  });

  /**
   * C-0134 regression guard. `waitForRequest` resolves before the response exists, so the
   * console error the tap causes was attributed to the NEXT route in `ROUTES` — the harness
   * blamed `/dev/card` and `/dev/world` for requests they never made. ⛔ Reverting to
   * `waitForRequest` here re-opens that cross-route leak silently, so it is asserted.
   */
  it('waits for the refetch RESPONSE, so the tap’s 503 is judged on the route that caused it', () => {
    expect(code).toContain('page.waitForResponse((r) => r.url().includes(arrival.request)');
    expect(code).not.toContain('page.waitForRequest');
  });

  it('allows /dev/onboarding exactly the 503 its own tap causes, keyed to that request', () => {
    const allowed = block('EXPECTED_CONSOLE');
    const entry = allowed.match(/'\/dev\/onboarding':\s*\[([\s\S]*?)\],/)?.[1] ?? '';
    const named = entry.replace(/\\/g, '');
    expect(named).toContain('503');
    expect(named).toContain('/api/profile');
  });
});

/**
 * ‏T-089 — בלי שתי השורות האלה בארנס, אנטומיית מסך השיעור ⛔ מעולם לא נמדדת
 * ב-320/375/414, והטענה «אפס גלילה אופקית» עליה היא הצהרה ⛔ ולא מדידה.
 */
describe('the lesson anatomy is measured at all three widths (T-089)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('names both lesson fixtures in ROUTES', () => {
    expect(source).toContain("'/dev/lesson',");
    expect(source).toContain("'/dev/lesson/done',");
  });

  /**
   * ⛔ אין להן רשומת EXPECTED_CONSOLE, וזה השקט שמוכיח שהן מקבלות את הפריטים
   * כ-prop ו⛔ אינן מבקשות מהשרת דבר. רשומה שתופיע כאן מאוחר יותר פירושה
   * שהפיקסטורה התחילה לרשת — כלומר שהמדידה חזרה בשקט למסך הכשל.
   *
   * ⚠️ עודכן ב-T-143: הבדיקה חייבת להיעצר ב-`}` הסוגר של האובייקט עצמו,
   * ⛔ ולא לקרוא עד סוף הקובץ — שער `route === '/dev/lesson'` שהמשימה הזאת
   * הוסיפה (ל-`check:mobile`, אחרי בלוק `/dev/deck/done`) מזכיר את המחרוזת
   * `/dev/lesson` לגיטימית וזה **אינו** רשומת EXPECTED_CONSOLE.
   */
  it('⛔ grants them no console allowance — they request nothing', () => {
    const start = source.indexOf('const EXPECTED_CONSOLE');
    const end = source.indexOf('\n};', start);
    const expected = source.slice(start, end);
    expect(expected).not.toContain('/dev/lesson');
  });
});

/**
 * ‏T-091 · F-098 — שתי לשוניות הפיקסטורה מקבלות את שלוש בדיקות F-027, ⛔ ובלי
 * שאף בדיקה קיימת תיחלש.
 *
 * ⚠️ הסתירה שנמדדה בטיק התכנון: `no tab bar on a flow screen` יושבת באותו בלוק,
 * ושתי הלשוניות מרנדרות `<TabBar />` (‏`data-tab-bar`) — כלומר הוספה ל-FLOW_ROUTES
 * מפילה אותה בוודאות, בשש נקודות. הבדיקה שלמטה היא מה שמונע מהיד הבאה «לפתור»
 * את זה בהחלשה.
 */
describe('the F-027 primary-action checks cover the tab fixtures (T-091 · F-098)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  // ⚠️ T-246 (C-0381): `/dev/tabs/studies` יצא מהרשימה הזאת. המסך הפך לבורר
  // ארבעת המסלולים — ארבעה `role="tab"`, ⛔ לא יעד `data-primary-action` יחיד —
  // וחוזר לכאן כש-T-247 (נתיב המודולים) נותן למסלול הנבחר יעד לחיצה אמיתי.
  it('declares a list that is FLOW_ROUTES plus the one remaining tab fixture', () => {
    expect(source).toMatch(
      /const PRIMARY_ACTION_ROUTES = \[\s*\.\.\.FLOW_ROUTES,\s*'\/dev\/tabs\/cards',?\s*\]/,
    );
    expect(source).not.toMatch(/PRIMARY_ACTION_ROUTES = \[[^\]]*'\/dev\/tabs\/studies'/);
  });

  it('gates the primary-action block on that list and ⛔ not on FLOW_ROUTES', () => {
    expect(source).toContain('if (PRIMARY_ACTION_ROUTES.includes(route)) {');
    expect(source).toContain('exactly one primary action');
  });

  /**
   * ⛔ THE POINT OF THIS WHOLE TASK. `no tab bar on a flow screen` is a claim
   * about a FLOW screen (D-028) and a tab screen is a destination, not a step.
   * If a later hand moves it under PRIMARY_ACTION_ROUTES it fails six times and
   * the cheapest way out is to delete it. This pins it where it belongs.
   */
  it('keeps "no tab bar on a flow screen" bound to FLOW_ROUTES', () => {
    expect(source).toContain('if (FLOW_ROUTES.includes(route)) {');
    const flowOnly = source.slice(source.lastIndexOf('if (FLOW_ROUTES.includes(route)) {'));
    expect(flowOnly).toContain('no tab bar on a flow screen');
    const primaryBlock = source.slice(
      source.indexOf('if (PRIMARY_ACTION_ROUTES.includes(route)) {'),
      source.lastIndexOf('if (FLOW_ROUTES.includes(route)) {'),
    );
    expect(primaryBlock).not.toContain('no tab bar on a flow screen');
    expect(primaryBlock).toContain('exactly one primary action');
  });
});

/**
 * ‏T-091, החצי השני של F-027: ההקשה **מגיעה** לאיפשהו. `02-inbox` פריט 9.
 * ‏`FLOW_ARRIVAL` נקרא ב-`const arrival = FLOW_ARRIVAL[route]` בלי תנאי חברות
 * ב-`FLOW_ROUTES`, ולכן שתי הרשומות האלה נמדדות בזכות עצמן.
 */
describe('both tab fixtures declare where their tap lands (T-091)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const arrival = source.slice(
    source.indexOf('const FLOW_ARRIVAL'),
    source.indexOf('const EXPECTED_CONSOLE'),
  );

  // ⚠️ T-246 (C-0381): הרשומה `'/dev/tabs/studies'` הוסרה מ-`FLOW_ARRIVAL` בכוונה —
  // הבורר אינו מנווט לשום מקום, הוא state מקומי בין ארבעה שבבים. T-247 מחזיר
  // יעד אמיתי ואת הרשומה יחד אתו.
  it('⛔ /dev/tabs/studies has no FLOW_ARRIVAL entry — the selector does not navigate', () => {
    expect(arrival).not.toContain("'/dev/tabs/studies':");
  });

  it('/dev/tabs/cards names /study and the request that landing fires', () => {
    const entry = arrival.slice(arrival.indexOf("'/dev/tabs/cards':"));
    expect(entry).toContain("kind: 'navigates'");
    expect(entry).toContain("to: '/study'");
    expect(entry).toContain("marker: '[data-action-bar]'");
    // T-225 (D-142, closes F-140): the level tile carries a non-null count from
    // render (`unseen: 314`), so it is `enabled: true` without a request and
    // becomes the primary action — the tap now settles on `deck=level`, ⛔ not
    // the old all-tiles-dead fallback's `deck=due`.
    expect(entry).toContain("settles: '/api/study/queue?deck=level'");
  });

  /**
   * ⛔ NOT a blanket exemption for the route. The landing on `/study` fires ONE
   * request the harness itself makes impossible, and the entry is keyed to that
   * exact URL and pinned with `$` so it cannot also swallow `?deck=due&limit=1`
   * — the request `<DeckSelector>` makes on the route itself.
   */
  it('allows exactly the one 503 that landing on /study causes', () => {
    const expected = source.slice(source.indexOf('const EXPECTED_CONSOLE'));
    const block = expected.slice(expected.indexOf("'/dev/tabs/cards':"));
    expect(block).toContain('\\/api\\/study\\/queue\\?deck=level$');
  });
});

/**
 * ‏C-0250 · F-101 — מירוץ בבדיקת הנחיתה עצמה, נמדד ⛔ ולא שוער.
 *
 * ענף `navigates` קרא את הסמן ב-`.count()` **מיד** אחרי `waitForURL`, בלי להמתין
 * לו ולו רגע. נמדד בהרצת הארנס (‏C-0250, שלושת הרוחבים): בנחיתה על `/study`
 * הכתובת וה-`<h1>` כבר במקום ב-`t=0`, ואילו `[data-action-bar]` ו-
 * `[data-primary-action]` מופיעים תוך **300ms** — כלומר הבדיקה נכשלה על מסך
 * שרונדר בפועל. כל הרשומות שקדמו עברו רק משום שיעדן רונדר סינכרונית.
 *
 * ⛔ ההמתנה ⛔ אינה החלשה: מסך שלעולם ⛔ אינו מרנדר את הסמן עדיין נופל בתום
 * הפסק, בדיוק כמו קודם. זו אותה תבנית שענף `announces` כבר משתמש בה שורות
 * ספורות מתחת, ואותו לקח בדיוק כמו C-0134 — למדוד אחרי שהדבר הגיע, ⛔ ולא לפניו.
 */
describe('the arrival marker is waited for, not raced (F-101)', () => {
  const source = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const code = source.replace(/^[^\S\n]*\/\/.*$/gm, '');

  it('waits for the marker before counting it', () => {
    const start = code.indexOf("if (arrival.kind === 'navigates') {");
    expect(start).toBeGreaterThan(-1);
    const block = code.slice(start, code.indexOf("} else if (arrival.kind === 'announces')", start));
    // ⛔ רגקס ו⛔ לא מחרוזת: השרשור מפוצל לשורות בידי המעצב, ומחרוזת אחת הייתה
    // בדיקה ששוברת עצמה על ריווח ⛔ ולא על התנהגות.
    expect(block).toMatch(/page\s*\.locator\(arrival\.marker\)\s*\.first\(\)\s*\.waitFor\(/);
    expect(block.indexOf('.waitFor(')).toBeLessThan(block.indexOf('.count()'));
  });

  /**
   * ⛔ הפסק חייב להישאר סופי. `waitFor` בלי `timeout` היה תולה את הארנס על מסך
   * מת במקום להפיל אותו — כלומר הופך כישלון נמדד לריצה שלא נגמרת.
   */
  it('keeps the wait bounded, so a dead screen still fails instead of hanging', () => {
    const start = code.indexOf("if (arrival.kind === 'navigates') {");
    const block = code.slice(start, code.indexOf("} else if (arrival.kind === 'announces')", start));
    expect(block).toMatch(/waitFor\(\{\s*timeout:\s*5000\s*\}\)/);
    expect(block).toContain('.catch(() => {})');
  });
});

describe('T-099 · D-042 — the deck gesture is measured, ⛔ not declared', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');

  it('measures all three claims: before reveal · after reveal · edge zone', () => {
    for (const label of [
      'swipe before reveal ⛔ does not grade',
      'swipe right grades the card',
      'edge-zone swipe ⛔ does not grade (D-042ⓐ)',
    ]) {
      expect(SRC, `${label} — בדיקה חסרה בארנס`).toContain(label);
    }
  });

  it('the block runs last for that route — it mutates the page', () => {
    // ⛔ הטענה היא סדר: בלוק שמסמן כרטיס ורץ באמצע היה משאיר לכל שאר
    // הבדיקות דף אחר ממה שהן חושבות שהן מודדות.
    expect(SRC.indexOf("route === '/dev/deck'")).toBeGreaterThan(SRC.indexOf('no horizontal scroll'));
  });
});

/**
 * C-0252 — «לפני החשיפה» היא טענה על **מצב**, והמצב הזה ⛔ אינו מובן מאליו:
 * בלוק יעדי המגע (`grade targets`) חושף את הכרטיס הראשון קודם, ולכן ההרצה
 * הראשונה הפילה את «swipe before reveal» עם `remaining moved 5 → 4` בשלושת
 * הרוחבים. הטעינה מחדש היא מה שמבסס את התנאי, והספירה היא מה שמונע מהבדיקה
 * לעבור ריק ביום שבו בלוק אחר יחשוף שוב.
 */
describe('C-0252 — the gesture block establishes its own precondition', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  // הבלוק של המחווה הוא **האחרון** מבין בלוקי `/dev/deck` — הוא רץ בסוף גוף
  // הלולאה בכוונה, ולכן `lastIndexOf` הוא ההיצמדות הנכונה ⛔ ולא הראשונה.
  const BLOCK = SRC.slice(SRC.lastIndexOf("route === '/dev/deck'"));

  it('reloads the fixture before claiming the card is unrevealed', () => {
    expect(BLOCK).toContain('deck starts unrevealed — the precondition is measured');
    expect(
      BLOCK.indexOf('page.reload'),
      'הטעינה מחדש חייבת לקדום למחווה «לפני החשיפה» — אחרת הטענה מודדת דף אחר',
    ).toBeLessThan(BLOCK.indexOf('swipe before reveal ⛔ does not grade'));
  });

  it('⛔ and the precondition is a real count, ⛔ not a comment', () => {
    expect(BLOCK).toMatch(/\[data-reveal\]'\)\.count\(\)/);
  });
});

it('T-100 — the harness measures the decay level AND its Hebrew label', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  expect(SRC).toContain('overdue card decays');
  expect(SRC).toContain('decay carries its Hebrew label');
  // ⛔ הסדר: בדיקת הדעיכה קודמת למחוות, שמסירות את הכרטיס הראשון מה-DOM.
  expect(SRC.indexOf('overdue card decays')).toBeLessThan(SRC.indexOf('swipe right grades the card'));
});

/**
 * T-183 · `plan/36-video-spec.md § 3`.
 *
 * The harness now grants exactly one exemption from the 44px floor, and an
 * exemption is the most dangerous thing to add to a barrier: the failure mode is
 * that it quietly covers more than it was meant to, and nothing ever says so.
 * (C-0034 documents the same hazard one relaxation earlier, on radio labels.)
 *
 * So what is asserted here is the NARROWNESS and the TRADE, ⛔ not that the
 * exemption exists. The conditions themselves are executed against real geometry
 * in `scripts/story-tap-audit.test.ts` — this block only defends the wiring, which
 * a real Chromium run is the only other way to see.
 */
describe('the 44px exemption is narrow and it is paid for (T-183 · 36 § 3)', () => {
  const SRC = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  // C-0032: over raw text, the comment that EXPLAINS a rule satisfies the
  // assertion meant to prove the rule is implemented. Strip comments first.
  const CODE = SRC.replace(/^[^\S\n]*\/\/.*$/gm, '');

  it('exempts a story word ONLY inside a story paragraph', () => {
    expect(CODE).toContain("const STORY_TAP_EXEMPT = '[data-story-body] [data-story-word]'");
  });

  it('⛔ never exempts a bare [data-story-word] on its own', () => {
    // A descendant selector is the whole guarantee: drop the `[data-story-body] `
    // prefix and the attribute becomes a way to buy any button out of 44px.
    expect(CODE).not.toMatch(/STORY_TAP_EXEMPT\s*=\s*'\[data-story-word\]'/);
  });

  it('applies the exemption inside the 44px scan and nowhere else', () => {
    expect(CODE).toContain('if (el.matches(exempt)) return false;');
    expect(CODE.match(/STORY_TAP_EXEMPT/g) ?? []).toHaveLength(3);
  });

  it('pays for it by auditing every story paragraph against all four conditions', () => {
    expect(CODE).toContain("import { auditStoryBody } from './story-tap-audit.mjs'");
    expect(CODE).toContain('auditStoryBody(storyBody)');
    expect(CODE).toContain('hold all four conditions of 36 § 3');
  });

  it('triggers the audit from the markup, ⛔ not from a route list that can drift', () => {
    expect(CODE).toContain("document.querySelectorAll('[data-story-body]')");
    expect(CODE).not.toContain('STORY_ROUTES');
  });

  it('collects the geometry all four conditions need, including the translation', () => {
    for (const measured of [
      'data-story-translation',
      's.paddingTop',
      's.paddingBottom',
      's.paddingLeft',
      's.paddingRight',
      's.marginLeft',
      's.marginRight',
      'bodyStyle.lineHeight',
    ]) {
      expect(CODE, `${measured} is not collected, so a condition of 36 § 3 cannot be measured`).toContain(
        measured,
      );
    }
  });

  it('proves condition 4 by tapping between two words, ⛔ not by trusting an attribute', () => {
    expect(CODE).toContain('page.mouse.click');
    expect(CODE).toContain('data-story-ambiguity-chip');
    expect(CODE).toContain('never a guess (36 § 3.4)');
  });

  it('runs the audit inside the width loop, so it is measured at 320/375/414', () => {
    expect(CODE.indexOf('for (const route of ROUTES)')).toBeLessThan(CODE.indexOf('auditStoryBody(storyBody)'));
  });
});

/**
 * T-251 — measured live, three runs on the same clone: with `next dev -p
 * 3000` already answering on the port, `npm run verify` reported `exit 1`,
 * and the only failure was "service worker registers and activates — no
 * active registration". After `pkill -f "next dev"` alone, with no code
 * change, the same command was `exit 0`. The cause is `scripts/verify-mobile.mjs`
 * silently adopting whatever already answers on the port when no --base-url
 * is given, instead of owning a fresh `next start`. A `next dev` server never
 * registers a service worker (PWA is production-only), so the adopted server
 * produced a false PWA defect — and that exact false-defect class already
 * cost the loop a whole emergency tick once (F-180 · T-250).
 *
 * ⇒ the harness must refuse to adopt a server it did not start, and it must
 * refuse BEFORE it launches a browser or runs a single check, so the failure
 * is legible by name instead of surfacing as an unrelated PWA finding three
 * checks later.
 */
describe('the harness refuses to silently adopt a server it did not start (T-251)', () => {
  it('exits naming the busy port — ⛔ not "service worker" — when something else already answers there and no --base-url was given', async () => {
    const decoy = createServer((_req, res) => {
      res.end('not next — just something answering on the port, like a leftover `next dev`');
    });
    // No explicit host: bind every interface, the same as `next start`/`next
    // dev` do, so `fetch('http://localhost:PORT')` — which may resolve to
    // ::1 or 127.0.0.1 depending on the machine — reaches it either way.
    const port = await new Promise<number>((resolve, reject) => {
      decoy.once('error', reject);
      decoy.listen(0, () => resolve((decoy.address() as AddressInfo).port));
    });

    try {
      // ⛔ Deliberately `spawn`, not `execFileSync`: the decoy server above runs
      // in THIS process, and a synchronous spawn blocks this process's event
      // loop until the child exits — which means the decoy could never accept
      // the child's connection at all, and `isUp` would fail for a reason that
      // has nothing to do with the behaviour under test.
      const { status, stderr } = await new Promise<{ status: number | null; stderr: string }>(
        (resolve, reject) => {
          const child = spawn('node', ['scripts/verify-mobile.mjs'], {
            env: { ...process.env, PORT: String(port) },
          });
          let err = '';
          child.stderr.on('data', (d) => {
            err += String(d);
          });
          const timer = setTimeout(() => {
            child.kill('SIGKILL');
            reject(new Error('scripts/verify-mobile.mjs did not exit within 20s'));
          }, 20_000);
          child.on('error', reject);
          child.on('close', (code) => {
            clearTimeout(timer);
            resolve({ status: code, stderr: err });
          });
        },
      );

      expect(status, `expected the script to refuse the busy port; stderr:\n${stderr}`).toBe(1);
      expect(stderr).toMatch(/port .*(busy|already in use)/i);
      expect(stderr).not.toContain('service worker');
    } finally {
      await new Promise<void>((resolve) => decoy.close(() => resolve()));
    }
  });
});

/**
 * T-227 · plan/docs/superpowers/plans/2026-08-30-journey-walk.md. `FLOW_ARRIVAL`
 * measures one screen at a time; `JOURNEYS` crosses them — a learner's actual
 * path from one fixed screen to the next, three of them, declared here and never
 * inferred by the harness at runtime.
 */
describe('journey walks cross screens instead of measuring one at a time (T-227)', () => {
  const CODE = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const pkg = JSON.parse(readFileSync('package.json', 'utf8')) as { scripts: Record<string, string> };

  it('declares the three journeys — join, learn, play — and leaves FLOW_ARRIVAL untouched', () => {
    expect(CODE).toContain('const FLOW_ARRIVAL = {');
    expect(CODE).toContain('const JOURNEYS = {');
    expect(CODE).toMatch(/join:\s*\{/);
    expect(CODE).toMatch(/learn:\s*\{/);
    expect(CODE).toMatch(/play:\s*\{/);
  });

  it('exposes walk:journey, and only walk:journey skips the rest of the suite', () => {
    expect(pkg.scripts['walk:journey']).toBe('node scripts/verify-mobile.mjs --journeys-only');
    expect(CODE).toContain("JOURNEYS_ONLY = ARGV.includes('--journeys-only')");
  });

  it('the JOURNEYS table names a real selector on every step, ⛔ except the journey’s own arrival', () => {
    const start = CODE.indexOf('const JOURNEYS = {');
    const end = CODE.indexOf('\n};\n', start);
    expect(start).toBeGreaterThan(0);
    expect(end).toBeGreaterThan(start);
    const table = CODE.slice(start, end);

    // ⛔ Declared, ⛔ never inferred (plan § 2): four routes per journey, three of
    // which carry a selector to tap — the fourth is the arrival, checked below.
    const routeCount = [...table.matchAll(/route: '[^']+'/g)].length;
    const actionCount = [...table.matchAll(/action: '[^']+'/g)].length;
    expect(routeCount).toBe(12); // 3 journeys × 4 routes
    expect(actionCount).toBeGreaterThan(0);
    expect(actionCount).toBeLessThan(routeCount); // every journey has an arrival with none

    for (const journeyName of ['join', 'learn', 'play']) {
      const journeyStart = table.indexOf(`${journeyName}: {`);
      expect(journeyStart, `journey "${journeyName}" missing`).toBeGreaterThan(-1);
    }
  });

  it('reads the way-back control by name, ⛔ never by a bare "contains חזרה" that would also catch the cards review chip', () => {
    expect(CODE).toContain('BACK_CONTROL_RE');
    expect(CODE).toMatch(/BACK_CONTROL_RE\s*=\s*\/\^חזרה/);
  });

  it('the baseline is born as a note, ⛔ never a failing check, on its first measured run', () => {
    const walkSection = CODE.slice(CODE.indexOf('journey walks — crossing screens'));
    expect(walkSection).toContain('report(');
    expect(walkSection).not.toMatch(/check\(\s*\n?\s*result\./);
  });

  it('never launches a second browser for the walk — reuses the one already open for the checks above', () => {
    const walkerBody = CODE.slice(
      CODE.indexOf('async function walkJourney'),
      CODE.indexOf('\n}\n', CODE.indexOf('async function walkJourney')),
    );
    expect(walkerBody).not.toContain('chromium.launch');
  });

  it('driftingNames is imported from lib/core, ⛔ not reimplemented inline', () => {
    expect(CODE).toContain("await import('../lib/core/journeyDrift.ts')");
  });
});

/**
 * T-276 · D-198 — the finish state with a round summary is a SECOND branch of the same
 * screen, and `/dev/deck/done` (`cards={[]}`, no grades) can never reach it: the summary is
 * state that only grading produces. Same reasoning as `/dev/deck` vs `/dev/deck/done`
 * (`phase` is a prop; the block is unreachable from the route above it). Without this
 * fixture the two new sentences would ⛔ never be measured at 320/375/414 — T-276 ⓔ.
 */
describe('the harness measures the finish state WITH a round summary (T-276 · D-198)', () => {
  const code = readFileSync('scripts/verify-mobile.mjs', 'utf8');
  const fixture = readFileSync('app/dev/deck/done/due/page.tsx', 'utf8');

  it('visits /dev/deck/done/due right after /dev/deck/done', () => {
    const routes = code.slice(code.indexOf('const ROUTES = ['), code.indexOf('const MIN_TAP'));
    expect(routes).toContain("'/dev/deck/done/due'");
    expect(routes.indexOf("'/dev/deck/done/due'")).toBeGreaterThan(routes.indexOf("'/dev/deck/done'"));
  });

  it('seeds a finished DUE round with both grades, so both sentences render (the widest text)', () => {
    expect(fixture).toContain('CardDeck');
    expect(fixture).toContain('deck="due"');
    expect(fixture).toContain('cards={[]}');
    expect(fixture).toMatch(/initialGrades=\{\[[^\]]*'good'[^\]]*\]\}/);
    expect(fixture).toMatch(/initialGrades=\{\[[^\]]*'again'[^\]]*\]\}/);
  });

  it('touches no network and no session', () => {
    expect(fixture).not.toMatch(/\bfetch\(/);
    expect(fixture).not.toContain('apiGet');
    expect(fixture).not.toContain('supabase');
  });

  it('runs the T-055 finish-state checks on BOTH done routes, and adds the summary to the second', () => {
    expect(code).toContain("DONE_ROUTES.has(route)");
    expect(code).toContain("const DONE_ROUTES = new Set(['/dev/deck/done', '/dev/deck/done/due'])");
    expect(code).toContain("'[data-round-summary]'");
    expect(code).toContain("route === '/dev/deck/done/due'");
  });
});
