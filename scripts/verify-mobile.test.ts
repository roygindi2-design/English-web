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
    const start = code.indexOf('FLOW_ROUTES.includes(route)');
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
      component: 'CardsScreen',
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
    expect(code).toContain('exactly four tabs');
    expect(code).toContain('every tab >= 44px');
  });

  it('asserts D-028 from the tab side — no action bar where the tab bar is', () => {
    expect(code).toContain('no action bar on a tab screen');
  });

  it('asserts D-028 from the flow side — no tab bar where a flow screen is', () => {
    expect(code).toContain('no tab bar on a flow screen');
  });
});
