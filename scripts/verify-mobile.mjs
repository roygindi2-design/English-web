#!/usr/bin/env node
/**
 * T-001 success-metric harness (project_plan.md 4.2).
 *
 * Lighthouse 13 removed the PWA category and the tap-targets audit, so the
 * mobile guarantees this project actually promises (MF-1..MF-5, PW-1..PW-3)
 * are measured here directly, against the production build.
 *
 * Usage: node scripts/verify-mobile.mjs [baseUrl]
 *
 * With no baseUrl it boots `next start` against the existing production build
 * and shuts it down afterwards, so it can run unattended inside `npm run
 * verify` (F-007: while it sat outside `verify`, every 375px/44px/RTL claim in
 * this repo was an unmeasured assertion).
 */
import { existsSync, readdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { chromium } from 'playwright';

const BASE_ARG = process.argv[2];
const PORT = Number(process.env.PORT) || 3000;
const BASE = BASE_ARG || `http://localhost:${PORT}`;
const WIDTHS = [320, 375, 414];
const ROUTES = [
  '/',
  '/signup',
  '/login',
  '/onboarding',
  '/offline',
  '/sources',
  '/study',
  // T-041 layout fixtures. noindex, unlinked, and deliberately not learning
  // content — they exist so the card is measured at 320/375/414 like every
  // other screen instead of being declared correct. BOTH directions, because a
  // review found the recognition-only fixture never put the answer input or its
  // submit button in the DOM while the 44px scan was running.
  '/dev/card',
  '/dev/card/typed',
  '/dev/card/swap',
  // T-065 task 8, and the same reason as the three above one level up: `/study` IS in this
  // list, but `next start` has no Supabase env, so the queue answers 503 by its own
  // contract and every `ok /study` line here has described the FAILURE state. The scrolling
  // deck — snap container, one card per viewport, the two grade buttons — has never been
  // rendered at 320/375/414 until this fixture.
  '/dev/deck',
  // T-055 · § 4.2ו — «המילה האחרונה — מסך סיום ולא מסך לבן». `/dev/deck` holds two
  // ungraded cards, so the finish branch is unreachable there; this fixture renders it
  // directly. Measured and ⛔ not asserted: "not blank" is a claim about pixels.
  '/dev/deck/done',
  // T-026 layout fixture, same reasoning: /onboarding redirects without Supabase
  // env, so the address band would otherwise be measured on the login screen.
  '/dev/identity',
  // T-029 layout fixture, same reasoning as /dev/identity: /onboarding redirects
  // without Supabase env (TD-13), so the goal form would otherwise be measured
  // on the login screen — every "ok /onboarding" line in this harness is really
  // the login screen, verified live in C-0013.
  '/dev/onboarding',
  // T-051 tab shell, through fixtures. All three real tab routes (`/studies`,
  // `/cards`, `/me`) are in `PROTECTED_SCREENS` (proxy.ts) and answer 307 to
  // `/login?expired=1` without Supabase env — measured live in C-0075, after
  // `tab bar is present` failed on `/cards` and the redirect turned out to be
  // the reason. Naming them here would print "ok /cards" for the login screen,
  // which is F-027 cause 1 (TD-13).
  '/dev/tabs/studies',
  '/dev/tabs/cards',
  '/dev/tabs/me',
  // T-063 task 9. The two real world routes are NOT in PROTECTED_SCREENS (proxy.ts), so
  // unlike the tabs above they DO render here — but with no Supabase env
  // `/api/world/posts` and `/api/world/bank` answer 503 by their own contract, so what
  // these two lines measure is the FAILURE state of each screen: the Hebrew message and
  // the way out. That is a state a learner can meet, so it is measured on purpose and
  // ⛔ not "for coverage".
  '/world',
  '/world/compose',
  // ...and the fixture, because that same 503 means the BANK — the chips, the draft, the
  // punctuation row, the publish bar — is never once on screen on either route above. It
  // is handed its bank as a prop and asks the server for nothing, which is why it needs no
  // EXPECTED_CONSOLE entry and why an entry appearing there later would mean this
  // measurement has silently gone back to reading the failure screen.
  '/dev/world',
  '/does-not-exist',
];
const MIN_TAP = 44;

/**
 * T-057: 44px targets that touch each other are still one mis-tap. 8px is the
 * floor the task row names, and it is the second step of the 4px scale the
 * constitution fixes (§ 4).
 */
const MIN_GAP = 8;

/**
 * F-027 — the screens a learner walks through to reach the product, in order:
 * landing, the two auth screens, the goal question, the study screen. Every one
 * of them must offer a marked way forward that a thumb can actually reach.
 *
 * `/dev/onboarding` and not `/onboarding`: the real route answers 307 without
 * Supabase env (TD-13), so naming it here measured the login screen instead —
 * one of the three reasons roy's dead end was invisible to this harness.
 *
 * `/sources` and `/offline` are deliberately absent: they are destinations, not
 * steps, and neither is on the path to first study.
 *
 * `/world/compose` joined C-0129 (T-063 task 9): § 4.2ה calls it a flow screen, D-028 gives
 * a flow screen an `<ActionBar>` and ⛔ no tab bar, and it is the only screen in the world
 * feature a learner walks THROUGH rather than lands on. Here it renders its 503 state, so
 * what this block asserts on it is that the failure state still offers exactly one marked
 * way out and puts it where a thumb can reach — which is precisely the F-027 dead end.
 */
const FLOW_ROUTES = ['/', '/signup', '/login', '/dev/onboarding', '/study', '/world/compose'];

/**
 * T-067 — where the primary action LEADS. `02-inbox` י׳, and the other half of F-027.
 *
 * Two thirds of the connectivity guarantee already exist above: every flow screen holds
 * exactly one marked primary action, it is hit-testable, and it paints inside the first
 * viewport. What was never measured is the tap itself — a button that is beautifully
 * placed and does nothing is the same dead end roy hit on the live site.
 *
 * ⛔ NOT "the page changed". Each route declares ONE destination and it is named:
 *   navigates — the URL becomes `to` and a marker only that screen holds is present.
 *   announces — an exact Hebrew sentence that was ABSENT before the tap is present after.
 *   refetches — the tap re-issues one named request (this is what «נסה שוב» is FOR).
 *
 * The kind is not a preference. `navigates` is the strong form and it is used wherever it
 * is reachable — which, measured and not assumed, is one route: this harness runs
 * `next start` with no Supabase env, so `/onboarding` answers 307 (TD-13) and every study
 * and world endpoint answers 503 by its own contract. ⛔ An entry may not weaken its kind
 * to make a screen pass: a screen whose tap produces NOTHING fails on every kind, which is
 * the whole point.
 */
const FLOW_ARRIVAL = {
  '/': {
    kind: 'navigates',
    to: '/signup',
    marker: 'input[name="email"]',
    why: 'the only flow screen whose primary action is a plain <Link> and needs no session',
  },
  '/signup': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'AUTH_MESSAGES_HE.invalid_email — checkCredentials rejects the empty form client-side, so the tap is measurable without ever reaching Supabase',
  },
  '/login': {
    kind: 'announces',
    text: 'כתובת האימייל לא נראית תקינה',
    why: 'same client-side rejection as /signup; the harness has no account to log in with',
  },
  '/dev/onboarding': {
    kind: 'announces',
    text: 'השמירה נכשלה. נסה שוב.',
    why: 'FAILURE_HE.save — the tap reaches POST /api/profile, which answers 503 without env (route.ts:24), and the form paints one Hebrew sentence',
    // The request THIS tap causes. See the settle loop below: naming it is what keeps the
    // 503 it logs inside this route instead of leaking onto the next one.
    settles: '/api/profile',
  },
  '/study': {
    kind: 'refetches',
    request: '/api/study/queue',
    why: 'without env the screen is in its failure state and its primary action is «נסה שוב», whose entire job is to re-issue this one request',
  },
  '/world/compose': {
    kind: 'refetches',
    request: '/api/world/bank',
    why: 'same failure state and same «נסה שוב», one route down',
  },
};

/**
 * The console lines a route is ALLOWED to produce, per route and per exact request.
 *
 * Added C-0102 (T-065 task 6), and deliberately as narrow as it can be written. This
 * harness runs `next start` with no Supabase env, so `GET /api/study/queue` answers 503 by
 * its own contract, and Chromium logs every non-2xx resource as a console error. That log
 * is not a defect in the screen — the failure state it produces is precisely what this
 * harness measures on `/study` — but a blanket exemption for the route would also hide a
 * real uncaught exception, which is the whole reason the clean-console check exists.
 *
 * So the allowance is keyed to the one URL and the one status: anything else on `/study`,
 * including a 401 or a 500 from the same endpoint, still fails.
 * ⛔ Do NOT add an entry here to silence a screen. An entry is only correct when the harness
 * itself is the reason the request cannot succeed.
 */
const EXPECTED_CONSOLE = {
  '/study': [/status of 503[\s\S]*@\S*\/api\/study\/queue/],
  // C-0103 (T-065 task 7): `<CardsScreen>` became the deck selector and now reads both
  // decks for their counts. Same situation and same narrowness as `/study` above — the
  // fixture has no session and the harness has no Supabase env, so the queue answers 503
  // by its own contract and the browser logs it. Keyed to the two exact URLs the screen
  // requests and to that one status: a 401, a 500, or any other request on this route
  // still fails the check.
  '/dev/tabs/cards': [
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=due&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/study\/queue\?deck=unknown&limit=1/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  // C-0127 (task 7): `<TabBar>` now asks the server whether the world tab is unlocked, so
  // EVERY tab fixture makes this one request and the harness — which runs with no Supabase
  // env — answers 503 by the endpoint's own contract. ⚠️ This is the failure path the
  // component is written for and the harness therefore MEASURES it: a 503 leaves the tab
  // locked, and the 44px/no-scroll checks on these three routes are passing over exactly
  // that locked bar. Keyed to the one URL and the one status, like every entry above: a 401
  // (a real session that expired) or a 500 on the same URL still fails the check.
  '/dev/tabs/studies': [/status of 503[\s\S]*@\S*\/api\/world\/status/],
  '/dev/tabs/me': [/status of 503[\s\S]*@\S*\/api\/world\/status/],
  // C-0129 (T-063 task 9): the two real world routes. `/world` sits inside the `(tabs)`
  // group, so it makes BOTH requests — `<WorldFeed>` reads the feed and `<TabBar>` asks
  // whether the tab is unlocked — and `/world/compose` sits outside the group, so it makes
  // exactly one. Each entry is keyed to the URL and to the 503 the missing env forces, like
  // every entry above: a 401 or a 500 on the same URL still fails the check.
  // ⛔ There is deliberately NO entry for `/dev/world`: the fixture receives its bank as a
  // prop and issues no request at all, and that silence is what proves the harness is
  // measuring the bank rather than the failure screen.
  '/world': [
    /status of 503[\s\S]*@\S*\/api\/world\/posts/,
    /status of 503[\s\S]*@\S*\/api\/world\/status/,
  ],
  '/world/compose': [/status of 503[\s\S]*@\S*\/api\/world\/bank/],
  // T-067: the arrival block TAPS the onboarding fixture's submit, which reaches
  // POST /api/profile — and that route answers 503 without Supabase env by its own
  // contract (`app/api/profile/route.ts:24`). Keyed to the one URL and the one status
  // like every entry above: a 401 or a 500 on the same URL still fails the check.
  '/dev/onboarding': [/status of 503[\s\S]*@\S*\/api\/profile/],
};

/**
 * D-027 · § 4.2ב — the four-tab shell's screens, the other half of D-028.
 *
 * A flow screen carries a bottom-anchored ACTION bar and a tab screen carries
 * the TAB bar, and ⛔ no screen ever carries both: two bars stacked at the
 * bottom of a 375px phone is a learner who cannot tell which one moves them
 * forward. That rule is breakable from two directions — rendering `<TabBar />`
 * too high in the tree, or dropping an `<ActionBar>` into a tab screen — so it
 * is asserted from both sides, here and in the FLOW_ROUTES block below.
 *
 * `/dev/tabs/*` and not the real routes: all three are session-gated in
 * `proxy.ts` and answer 307 without Supabase env (TD-13, F-027 cause 1).
 */
const TAB_ROUTES = ['/dev/tabs/studies', '/dev/tabs/cards', '/dev/tabs/me'];

/**
 * Playwright pins a browser build number (1234 today); the sandbox and CI both
 * ship a different one (1194) and set PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1, so
 * chromium.executablePath() points at a directory that does not exist. Probe
 * for whatever Chromium is actually on disk instead of trusting the pin.
 */
function resolveChromiumPath() {
  const candidates = [];
  if (process.env.CHROME_PATH) candidates.push(process.env.CHROME_PATH);

  const root = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (root && existsSync(root)) {
    candidates.push(path.join(root, 'chromium'));
    const subPaths = [
      'chrome-linux/chrome',
      'chrome-linux64/chrome',
      'chrome-headless-shell-linux64/chrome-headless-shell',
      'chrome-linux/headless_shell',
    ];
    // Full Chromium before the headless shell — the shell cannot run the
    // service-worker and install-prompt checks below.
    const dirs = readdirSync(root)
      .filter((e) => e.startsWith('chromium'))
      .sort((a, b) => Number(a.includes('headless')) - Number(b.includes('headless')));
    for (const dir of dirs) for (const sub of subPaths) candidates.push(path.join(root, dir, sub));
  }

  try {
    candidates.push(chromium.executablePath());
  } catch {
    /* playwright has no registry entry at all — the probes below still apply */
  }
  candidates.push('/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome');

  return candidates.find((c) => c && existsSync(c)) ?? null;
}

async function isUp(url) {
  try {
    await fetch(url, { signal: AbortSignal.timeout(2000) });
    return true;
  } catch {
    return false;
  }
}

/** Boots `next start` on PORT and resolves once it answers. */
async function startServer() {
  const bin = path.resolve('node_modules/next/dist/bin/next');
  if (!existsSync(bin)) throw new Error('next is not installed — run npm install first');
  const child = spawn(process.execPath, [bin, 'start', '-p', String(PORT)], {
    stdio: ['ignore', 'ignore', 'inherit'],
    env: { ...process.env, NODE_ENV: 'production' },
  });
  let exited = false;
  child.on('exit', () => {
    exited = true;
  });

  for (let i = 0; i < 60; i += 1) {
    if (exited) throw new Error(`next start exited before serving ${BASE}`);
    if (await isUp(BASE)) return child;
    await new Promise((r) => setTimeout(r, 500));
  }
  child.kill('SIGTERM');
  throw new Error(`next start did not answer on ${BASE} within 30s`);
}

const failures = [];
const notes = [];

/**
 * @param ok        did the guarantee hold?
 * @param label     what was checked (printed on success)
 * @param onFailure what went wrong (printed on failure)
 */
function check(ok, label, onFailure) {
  if (ok) notes.push(`  ok   ${label}`);
  else failures.push(`${label} — ${onFailure}`);
}

/**
 * A measurement that is printed but does not gate the run. F-027 needs one: how
 * far below the fold the primary action starts is the number the whole finding
 * turns on, and the moment it lives only in a comment it stops being true.
 * `check` cannot carry it — a threshold here would encode a product decision
 * Dev is not the one making.
 *
 * @param line the measurement, already formatted
 */
function report(line) {
  notes.push(`  ..   ${line}`);
}

const executablePath = resolveChromiumPath();
if (!executablePath) {
  console.error(
    '✗ no Chromium executable found. Set CHROME_PATH, or install one with `npx playwright install chromium`.',
  );
  process.exit(1);
}

// Only own the server if the caller did not point us at one.
const server = BASE_ARG || (await isUp(BASE)) ? null : await startServer();
if (server) console.log(`  ..   started next start on ${BASE} (pid ${server.pid})`);

const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage'],
});

try {
  // ---- 1. manifest is valid and complete (PW-1) -----------------------------
  {
    const page = await browser.newPage();
    const res = await page.goto(`${BASE}/manifest.webmanifest`);
    const manifest = JSON.parse(await res.text());
    check(manifest.display === 'standalone', 'manifest display=standalone', `got "${manifest.display}"`);
    check(Boolean(manifest.theme_color), 'manifest theme_color', 'missing');
    check(manifest.dir === 'rtl' && manifest.lang === 'he', 'manifest lang=he dir=rtl', `got lang="${manifest.lang}" dir="${manifest.dir}"`);
    for (const size of ['192x192', '512x512']) {
      check(
        manifest.icons?.some((i) => i.sizes === size),
        `manifest ${size} icon declared`,
        'not declared',
      );
    }
    check(
      manifest.icons?.some((i) => String(i.purpose).includes('maskable')),
      'manifest maskable icon declared',
      'not declared',
    );
    for (const icon of manifest.icons ?? []) {
      const iconRes = await page.request.get(`${BASE}${icon.src}`);
      check(iconRes.ok(), `manifest icon ${icon.src} reachable`, `HTTP ${iconRes.status()}`);
    }
    await page.close();
  }

  // ---- 2. per-width layout guarantees (MF-1, MF-2, MF-4) -------------------
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 780 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    let consoleErrors = [];
    // The URL travels with the text: Chromium's "Failed to load resource" message names the
    // status but NOT the resource, and the allowance below has to be able to say WHICH
    // request is expected to fail rather than "any error on this screen".
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(`${m.text()} @${m.location().url}`);
    });
    page.on('requestfailed', (r) => consoleErrors.push(`request failed: ${r.url()}`));

    for (const route of ROUTES) {
      consoleErrors = [];
      await page.goto(`${BASE}${route}`, { waitUntil: 'networkidle' });

      const at = `${route} @${width}px`;

      // Horizontal scroll (MF-4)
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      check(overflow <= 0, `${at} no horizontal scroll`, `overflows by ${overflow}px`);

      // RTL direction survives on every route (MF-3)
      const dir = await page.evaluate(() => document.documentElement.dir);
      check(dir === 'rtl', `${at} dir=rtl`, `got "${dir}"`);

      const lang = await page.evaluate(() => document.documentElement.lang);
      check(lang === 'he', `${at} lang=he`, `got "${lang}"`);

      // Touch targets (MF-2) — real interactive elements only.
      const small = await page.evaluate((min) => {
        const sel = 'a[href], button, input, select, textarea, [role="button"]';
        // C-0034: the tap target is the region that ACTIVATES the control, and
        // that is not always the control's own box. Clicking anywhere in a
        // radio's or checkbox's label toggles it — the browser does this, we do
        // not implement it — so a 20px dot inside a 44px row is a 44px target,
        // and measuring the dot reported a false failure on T-029's goal group.
        // The substitution is deliberately limited to those two input types: a
        // text field is only reachable by hitting the field itself, so
        // measuring ITS label (help text and all) would overstate the target
        // and silently weaken this scan on every form in the product.
        const tapRect = (el) => {
          if (el instanceof HTMLInputElement && (el.type === 'radio' || el.type === 'checkbox')) {
            const label =
              el.closest('label') ??
              (el.id ? document.querySelector(`label[for="${CSS.escape(el.id)}"]`) : null);
            if (label) return { rect: label.getBoundingClientRect(), viaLabel: true };
          }
          return { rect: el.getBoundingClientRect(), viaLabel: false };
        };
        return [...document.querySelectorAll(sel)]
          .filter((el) => {
            const own = el.getBoundingClientRect();
            // A control with no box of its own is hidden, not undersized.
            if (own.width <= 0 || own.height <= 0) return false;
            const { rect } = tapRect(el);
            return rect.width < min || rect.height < min;
          })
          .map((el) => {
            const { rect, viaLabel } = tapRect(el);
            const via = viaLabel ? ' (its label)' : '';
            return `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 20)}"${via} ${Math.round(rect.width)}x${Math.round(rect.height)}`;
          });
      }, MIN_TAP);
      check(small.length === 0, `${at} all tap targets >= ${MIN_TAP}px`, `too small: ${small.join(' · ')}`);

      // Primary action reachable by thumb (MF-5). Once a screen carries
      // interactive content above the call to action (T-027's preview card),
      // "the first link in main" stops meaning "the primary action" — so the
      // page marks it, and we fall back to the old rule only if it does not.
      // T-028 widened this too. /login and /signup were never checked, and
      // /onboarding only passed because AuthForm's `flex-1 justify-center`
      // pushed the whole form below the fold — the fallback selector was
      // returning the password-visibility toggle, not the submit button.
      // Both auth screens now mark their real primary action.
      // T-041 added `/dev/card*`: the card's own comment claims "actions live in the
      // lower half for thumb reach", and that claim was false — `mt-auto` inside a
      // section with no `flex-1` has no free space to consume, so the reveal button
      // measured y=243 on a 780px screen. An unchecked claim is how it got there.
      // F-027 cause 1: `/onboarding` answers 307 without Supabase env (TD-13),
      // so naming it here measured /login twice and the goal form never once.
      // The fixture is the only place the onboarding layout exists in this run.
      if (
        route === '/' ||
        route === '/dev/onboarding' ||
        route === '/login' ||
        route === '/signup' ||
        route.startsWith('/dev/card')
      ) {
        const y = await page.evaluate(() => {
          const el =
            document.querySelector('main [data-primary-action]') ??
            document.querySelector('main a[href], main button');
          return el ? el.getBoundingClientRect().top : -1;
        });
        check(y >= 780 / 2, `${at} primary action in thumb zone`, `sits at y=${Math.round(y)}`);
      }

      // F-027 — the connectivity guarantee roy asked for after signing up on the
      // live site and finding the onboarding screen had no way forward and no
      // way out: "verify-mobile at 375 must require that every screen in the
      // flow contains an accessible primary action, otherwise the bug comes
      // back." Three separate failures can produce that dead end, so three
      // separate things are measured — a screen that passes one and fails
      // another is still a dead end to the learner standing in front of it.
      //
      // D-028 (40-decisions § 4.2ג) settled the half that used to be reported
      // and not asserted: the action must paint inside the first viewport.
      if (FLOW_ROUTES.includes(route)) {
        const primary = await page.evaluate(() => {
          const all = document.querySelectorAll('main [data-primary-action]');
          if (all.length !== 1) return { count: all.length };
          const el = all[0];

          // ORDER IS LOAD-BEARING. Reachability is measured first, from a page
          // nothing has scrolled yet — an earlier version measured it after the
          // hit-test's scrollIntoView and was therefore reading a position it
          // had just produced itself. See the mutation recorded in
          // verify-mobile.test.ts.
          window.scrollTo(0, 0);
          const atRest = el.getBoundingClientRect();
          const firstPaintTop = Math.round(atRest.top);
          const belowTheFold = atRest.bottom > window.innerHeight;

          // A finger scrolls the document; `scrollIntoView` scrolls it even when
          // it is pinned, so the clip has to be read and not inferred. This pair
          // — `overflow-y: hidden` with a viewport-height root — is what turns
          // "below the fold" into "does not exist" for a learner.
          const clipY = (node) => {
            const value = getComputedStyle(node).overflowY;
            return value === 'hidden' || value === 'clip';
          };
          const clipped = clipY(document.documentElement) || clipY(document.body);

          window.scrollTo(0, document.documentElement.scrollHeight);
          const afterScroll = el.getBoundingClientRect();
          const scrolledIntoView =
            afterScroll.top >= 0 && afterScroll.bottom <= window.innerHeight;
          const reachable = !belowTheFold || (!clipped && scrolledIntoView);

          // Hit-testing, not rectangle-reading: a control can hold a perfectly
          // good box and still be unclickable behind an overlay, and a box says
          // nothing about an ancestor that painted over it.
          el.scrollIntoView({ block: 'center' });
          const box = el.getBoundingClientRect();
          const hit = document.elementFromPoint(
            Math.round(box.left + box.width / 2),
            Math.round(box.top + box.height / 2),
          );
          window.scrollTo(0, 0);

          return {
            count: all.length,
            firstPaintTop,
            belowTheFold,
            clipped,
            hitTested: hit !== null && (hit === el || el.contains(hit)),
            reachable,
            viewportHeight: window.innerHeight,
            text: (el.textContent || '').trim().slice(0, 24),
          };
        });

        check(
          primary.count === 1,
          `${at} exactly one primary action`,
          `found ${primary.count} elements matching main [data-primary-action]`,
        );
        if (primary.count === 1) {
          check(
            primary.hitTested,
            `${at} primary action is hit-testable`,
            `"${primary.text}" is covered or clipped at its own centre point`,
          );
          check(
            primary.reachable,
            `${at} primary action reachable by scrolling`,
            primary.clipped
              ? `"${primary.text}" starts below the fold and the document is clipped (overflow-y), so a finger can never bring it in`
              : `"${primary.text}" never enters the viewport, even scrolled to the bottom`,
          );
          // F-027, the half that was a PM decision until D-028 settled it: the
          // action must be IN the first viewport, not merely reachable from it.
          // roy measured 852 against 780 on /onboarding and read the product as
          // broken. The lower bound (`y >= 780/2`, thumb reach) is still checked
          // above; this is the upper bound, and a bar that satisfies both can
          // only be bottom-anchored.
          check(
            primary.firstPaintTop < primary.viewportHeight,
            `${at} primary action visible without scrolling`,
            `"${primary.text}" first paints at y=${primary.firstPaintTop} on a ${primary.viewportHeight}px viewport`,
          );
          report(
            `${at} primary action "${primary.text}" firstPaintTop=${primary.firstPaintTop}px` +
              (primary.belowTheFold ? ' (below the fold — scroll required)' : ''),
          );
        }

        // The bar is `fixed`, so it covers a strip of the document. The rejected
        // alternative — a spacer inside <main> — moves that strip onto <footer>
        // instead of clearing it, because the footer holding the /sources link
        // (T-011, required on every screen) is a sibling AFTER <main>. This is
        // the check that makes the difference measurable rather than argued.
        const footer = await page.evaluate(() => {
          const bar = document.querySelector('[data-action-bar]');
          if (!bar) return { noBar: true };
          window.scrollTo(0, document.documentElement.scrollHeight);
          const link = document.querySelector('footer a[href="/sources"]');
          if (!link) return { noLink: true };
          const l = link.getBoundingClientRect();
          const b = bar.getBoundingClientRect();
          window.scrollTo(0, 0);
          return {
            clear: Math.round(l.bottom) <= Math.round(b.top) + 1,
            linkBottom: Math.round(l.bottom),
            barTop: Math.round(b.top),
          };
        });
        if (!footer.noBar && !footer.noLink) {
          check(
            footer.clear,
            `${at} action bar does not cover the licence link`,
            `link bottom ${footer.linkBottom} vs bar top ${footer.barTop}`,
          );
        }

        // D-028, from the flow side. The tab bar is rendered by
        // `app/(tabs)/layout.tsx` and the route group is what makes that
        // structural — but a future hand can still move it into the root layout,
        // and a `<TabBar />` on `/signup` is a learner offered four destinations
        // while they are supposed to be finishing one form.
        const strayTabBar = await page.evaluate(
          () => document.querySelectorAll('[data-tab-bar]').length,
        );
        check(strayTabBar === 0, `${at} no tab bar on a flow screen`, `found ${strayTabBar}`);

        // T-057. Only vertically stacked pairs that actually share horizontal
        // space are compared: two controls side by side in a row are separated
        // by their own layout, and treating them as "adjacent" would report a
        // failure the learner's thumb never meets.
        const tooClose = await page.evaluate((min) => {
          const sel = 'a[href], button, input, select, textarea, [role="button"]';

          // The nearest `fixed`/`sticky` ancestor, or null for flow content.
          // Two controls are neighbours only inside the SAME layer: a fixed bar
          // is painted over the document on purpose, so its viewport rectangle
          // at scroll 0 says nothing about what a thumb can reach.
          const overlayRoot = (el) => {
            for (let n = el; n; n = n.parentElement) {
              const p = getComputedStyle(n).position;
              if (p === 'fixed' || p === 'sticky') return n;
            }
            return null;
          };

          const boxes = [...document.querySelectorAll(sel)]
            .map((el) => ({
              el,
              r: el.getBoundingClientRect(),
              overlay: overlayRoot(el),
              absolute: getComputedStyle(el).position === 'absolute',
              label: `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 16)}"`,
            }))
            .filter(({ r }) => r.width > 0 && r.height > 0)
            .sort((a, b) => a.r.top - b.r.top);

          const overlapsHorizontally = (a, b) =>
            Math.min(a.right, b.right) - Math.max(a.left, b.left) > 0;
          // 1px of tolerance: sub-pixel layout, not a licence to swallow a real
          // neighbour — an adornment sits wholly inside the field it belongs to.
          const encloses = (outer, inner) =>
            inner.left >= outer.left - 1 &&
            inner.right <= outer.right + 1 &&
            inner.top >= outer.top - 1 &&
            inner.bottom <= outer.bottom + 1;

          const found = [];
          for (let i = 0; i < boxes.length - 1; i += 1) {
            for (let j = i + 1; j < boxes.length; j += 1) {
              const a = boxes[i];
              const b = boxes[j];
              // Nested controls (a button inside a label inside a link) are one
              // target, not two — a contained box is never its own neighbour.
              if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
              // Different layers. Whether the fixed bar clears the content under
              // it is a real question, and it is measured by its own check
              // ("action bar does not cover the licence link") from a page that
              // has been scrolled — which is the only position where the answer
              // means anything.
              if (a.overlay !== b.overlay) continue;
              // An absolutely positioned control lying wholly inside another
              // control's box is that control's adornment — the password
              // visibility toggle inside its input (C-0005), one composite
              // target. Separating them would be undoing the design, not fixing
              // a gap.
              if ((a.absolute && encloses(b.r, a.r)) || (b.absolute && encloses(a.r, b.r)))
                continue;
              if (!overlapsHorizontally(a.r, b.r)) continue;
              const gap = b.r.top - a.r.bottom;
              if (gap >= min) break; // sorted by top: everything later is further
              if (gap < min) found.push(`${a.label} ↔ ${b.label} ${Math.round(gap)}px`);
            }
          }
          return found;
        }, MIN_GAP);
        check(
          tooClose.length === 0,
          `${at} adjacent tap targets >= ${MIN_GAP}px apart`,
          `too close: ${tooClose.join(' · ')}`,
        );
      }

      // D-027 · § 4.2ב — the tab shell itself: present, complete, thumb-sized,
      // and alone at the bottom of the screen.
      if (TAB_ROUTES.includes(route)) {
        const tabs = await page.evaluate(() => {
          const bar = document.querySelector('[data-tab-bar]');
          if (!bar) return { present: false };
          const items = [...bar.querySelectorAll('a,button')];
          return {
            present: true,
            count: items.length,
            small: items
              .map((el) => el.getBoundingClientRect())
              .filter((r) => r.width < 44 || r.height < 44).length,
            actionBars: document.querySelectorAll('[data-action-bar]').length,
          };
        });
        check(tabs.present, `${at} tab bar is present`, 'no [data-tab-bar] in the document');
        if (tabs.present) {
          check(tabs.count === 4, `${at} exactly four tabs`, `found ${tabs.count}`);
          check(tabs.small === 0, `${at} every tab >= 44px`, `${tabs.small} tabs below the floor`);
          // D-028: a screen never carries both bars.
          check(tabs.actionBars === 0, `${at} no action bar on a tab screen`, `found ${tabs.actionBars}`);
        }
      }

      // Content anchored to the top (F-011). The landing screen used to centre
      // its heading inside the whole flexible area, leaving a 267px dead band
      // above it; a regression here is invisible in a diff but obvious on a
      // phone. Measured against the header, not the viewport top.
      // T-028: widened from `/` to EVERY screen that has a heading. Scoping it
      // to one route is why F-016 survived in /onboarding and why AuthForm sat
      // at a measured 139px band on /login and 109px on /signup — the same
      // `flex-1 justify-center` wrapper, in a file nobody re-measured.
      {
        const gap = await page.evaluate(() => {
          const h1 = document.querySelector('main h1');
          if (!h1) return -1;
          const header = document.querySelector('header');
          const top = header ? header.getBoundingClientRect().bottom : 0;
          return h1.getBoundingClientRect().top - top;
        });
        if (gap >= 0) {
          check(gap <= 48, `${at} heading anchored to top`, `dead band of ${Math.round(gap)}px above the heading`);
        }
      }

      // Password visibility (F-013). Email confirmation is off (Q-001 ⓑ), so
      // there is no recovery path: one unseen typo is an account the learner
      // can never enter again. That makes the toggle a measured guarantee and
      // not a styling detail — the tap-target check above already holds the
      // new button to 44px on its own.
      if (route === '/signup' || route === '/login') {
        // F-015: the mobile keyboard's action key. Invisible in a screenshot and
        // in a diff — the attribute is read off the live DOM or it is not known.
        const hints = await page.evaluate(() => ({
          email: document.querySelector('input[name="email"]')?.getAttribute('enterkeyhint') ?? null,
          password:
            document.querySelector('input[name="password"]')?.getAttribute('enterkeyhint') ?? null,
          emailDir: document.querySelector('input[name="email"]')?.getAttribute('dir') ?? null,
        }));
        check(hints.email === 'next', `${at} email keyboard offers "next"`, `enterkeyhint=${hints.email}`);
        check(hints.password === 'go', `${at} password keyboard offers "go"`, `enterkeyhint=${hints.password}`);
        check(hints.emailDir === 'ltr', `${at} email field is still ltr after the refactor`, `dir=${hints.emailDir}`);

        const toggle = page.locator('[data-password-toggle]');
        const present = (await toggle.count()) === 1;
        check(present, `${at} password toggle present`, 'no [data-password-toggle] button');
        if (present) {
          const field = page.locator('input[name="password"]');
          const typeNow = () => field.getAttribute('type');
          check(
            (await typeNow()) === 'password',
            `${at} password hidden by default`,
            `type is "${await typeNow()}"`,
          );
          await toggle.click();
          check(
            (await typeNow()) === 'text',
            `${at} toggle reveals the password`,
            `type stayed "${await typeNow()}"`,
          );
          // The button must fit inside the padding the field reserves for it,
          // in BOTH label states — "הסתר" is wider than "הצג", and an
          // auto-width button in the wider state lands on top of the last
          // typed characters. Measured, because it is invisible in a diff.
          for (const state of ['revealed', 'hidden']) {
            const fit = await page.evaluate(() => {
              const input = document.querySelector('input[name="password"]');
              const button = document.querySelector('[data-password-toggle]');
              if (!input || !button) return null;
              return {
                reserved: parseFloat(getComputedStyle(input).paddingRight),
                width: button.getBoundingClientRect().width,
                label: (button.textContent || '').trim(),
              };
            });
            check(
              fit !== null && fit.width + 4 <= fit.reserved,
              `${at} toggle fits its reserved space (${state})`,
              fit === null
                ? 'field or button missing'
                : `"${fit.label}" is ${Math.round(fit.width)}px wide but only ${Math.round(fit.reserved)}px is reserved`,
            );
            if (state === 'revealed') await toggle.click();
          }

          check(
            (await typeNow()) === 'password',
            `${at} toggle hides it again`,
            `type stayed "${await typeNow()}"`,
          );
        }
      }

      // T-026: the address band is the only thing standing between a typo and a
      // permanently lost account while email confirmation is off (Q-001 ⓑ), so
      // it is measured rather than asserted. Measured on the fixture route
      // because /onboarding redirects without Supabase env (TD-13).
      if (route === '/dev/identity') {
        const band = page.locator('[data-registered-email]');
        const present = (await band.count()) === 1;
        check(present, `${at} registered address band present`, 'no [data-registered-email]');
        if (present) {
          // allInnerTexts(), not innerText(): C-0015 measured innerText() timing
          // out on exactly this shape of node.
          const shown = (await band.allInnerTexts()).join(' ');
          check(
            shown.includes('fixture@example.com'),
            `${at} the address itself is on screen`,
            `band read "${shown.trim().replace(/\s+/g, ' ')}"`,
          );
          const wrapped = await page.evaluate(() => {
            const el = document.querySelector('[data-registered-email] [lang="en"]');
            if (!el) return null;
            const style = getComputedStyle(el);
            return {
              dir: el.getAttribute('dir'),
              bidi: style.unicodeBidi,
              text: (el.textContent || '').trim(),
            };
          });
          check(
            wrapped !== null &&
              wrapped.dir === 'ltr' &&
              wrapped.bidi.includes('isolate') &&
              wrapped.text === 'fixture@example.com',
            `${at} the address travels through <EnWord>`,
            wrapped === null
              ? 'no [lang="en"] element inside the band'
              : `dir=${wrapped.dir} unicode-bidi=${wrapped.bidi} text="${wrapped.text}"`,
          );
          const fix = page.locator('[data-registered-email] form button[type="submit"]');
          check(
            (await fix.count()) === 1,
            `${at} one-tap correction present`,
            'no submit button inside the band',
          );
        }
      }

      // T-029 / TD-13: the goal question is the one screen where the DEFAULT is
      // the product decision (R-012 · E3), so it is measured, not asserted.
      if (route === '/dev/onboarding') {
        const group = page.locator('[data-daily-minutes]');
        const present = (await group.count()) === 1;
        check(present, `${at} daily-minutes group present`, 'no [data-daily-minutes]');
        if (present) {
          const radios = group.locator('input[type="radio"]');
          const count = await radios.count();
          check(count === 3, `${at} three goal options`, `found ${count}`);

          const checkedValue = await page.evaluate(() => {
            const el = document.querySelector(
              '[data-daily-minutes] input[type="radio"]:checked',
            );
            return el instanceof HTMLInputElement ? el.value : null;
          });
          check(
            checkedValue === '5',
            `${at} the modest goal is preselected`,
            `preselected value was ${checkedValue === null ? 'nothing' : `"${checkedValue}"`}`,
          );

          // The clickable row, not the 20px radio dot, is the tap target — so
          // measure the label the learner actually hits.
          const rows = group.locator('label');
          const rowCount = await rows.count();
          for (let i = 0; i < rowCount; i += 1) {
            const box = await rows.nth(i).boundingBox();
            check(
              box !== null && box.height >= MIN_TAP,
              `${at} goal option ${i + 1} is >= ${MIN_TAP}px tall`,
              box === null ? 'no box' : `height ${Math.round(box.height)}px`,
            );
          }
        }

        const scoreLabel = await page.evaluate(() => {
          const input = document.querySelector('input[name="target_score"]');
          if (!(input instanceof HTMLInputElement)) return null;
          return { dir: input.getAttribute('dir'), inputMode: input.getAttribute('inputmode') };
        });
        check(
          scoreLabel !== null && scoreLabel.dir === 'ltr' && scoreLabel.inputMode === 'numeric',
          `${at} the optional score field is a Latin numeric input`,
          scoreLabel === null
            ? 'no input[name="target_score"]'
            : `dir=${scoreLabel.dir} inputmode=${scoreLabel.inputMode}`,
        );
      }

      // T-041: the card is anchored, the reveal is instant, and the grade
      // controls never rely on colour (measured deutan ΔE 4.1 — see palette.ts).
      if (route.startsWith('/dev/card')) {
        const before = await page.locator('[data-card-back]').count();
        check(before === 0, `${at} answer hidden before reveal`, 'the back was in the DOM already');

        // Measured against the CARD, not the heading text above it: the previous
        // version measured [data-card-front], which sits ~44px lower because of the
        // fixture's own note line, and then allowed 120px — so it had 23px of slack
        // and was calibrated on chrome that does not exist in production. Same 48px
        // rule every other screen is held to.
        const gap = await page.evaluate(() => {
          const header = document.querySelector('header');
          const card = document.querySelector('[data-flashcard]');
          if (!header || !card) return Number.NaN;
          return card.getBoundingClientRect().top - header.getBoundingClientRect().bottom;
        });
        check(gap >= 0 && gap <= 48, `${at} card anchored to top`, `dead band of ${Math.round(gap)}px`);

        if (route === '/dev/card/swap') {
          // Reveal card A, grade it, and demand that card B arrives HIDDEN. The
          // fixture deliberately passes no `key`, so this measures the component's
          // own reset and not the consumer's discipline. Before the fix, card B
          // rendered revealed with no reveal button.
          await page.locator('[data-reveal]').click();
          const aFront = await page.locator('[data-card-front]').innerText();
          await page.locator('[data-grade="good"]').click();

          const bFront = await page.locator('[data-card-front]').innerText();
          check(bFront.trim() !== aFront.trim(), `${at} grading advances to the next card`, `still on "${bFront}"`);
          check(
            (await page.locator('[data-card-back]').count()) === 0,
            `${at} the next card arrives hidden`,
            'card B was revealed before the learner tried to recall it',
          );
          check(
            (await page.locator('[data-reveal]').count()) === 1,
            `${at} the next card can be revealed`,
            'no reveal button on card B — the learner is stuck',
          );
        } else if (route === '/dev/card') {
          await page.locator('[data-reveal]').click();
          const back = await page.locator('[data-card-back]').count();
          check(back === 1, `${at} reveal shows the answer`, 'still hidden after clicking');

          // allInnerTexts(), not innerText(): when the target cannot be located core
          // degrades to an unmarked segment ON PURPOSE, and innerText() then waited
          // 30s and threw a bare TimeoutError — losing every ok line printed so far
          // and naming neither route nor width.
          const marks = await page.locator('[data-card-back] strong').allInnerTexts();
          check(
            marks.length === 1 && (marks[0] ?? '').trim() === 'Lorem',
            `${at} target word marked in the example`,
            `marked ${JSON.stringify(marks)}`,
          );

          // T-045 · D-024. This fixture is the only one built from an unverified
          // sense, and this is the only place in the whole suite where a real
          // engine paints the marker: the unit tests measure the boolean and the
          // source, neither of which can see a paragraph that renders empty or
          // lands outside the revealed block.
          const flag = page.locator('[data-card-back] [data-card-unverified]');
          check(
            (await flag.count()) === 1,
            `${at} the unverified translation is marked on the back`,
            'no [data-card-unverified] inside the revealed block',
          );
          const flagText = (await flag.allInnerTexts()).join('').replace(/[◇\s]/g, '');
          check(
            flagText.length > 0,
            `${at} the unverified marker carries text, not a glyph alone`,
            `marker read "${flagText}"`,
          );
          check(
            (await page.locator('[data-card-front] [data-card-unverified]').count()) === 0,
            `${at} the marker never appears on the front`,
            'the learner is told the QUESTION is unreliable',
          );

          for (const grade of ['again', 'good']) {
            const label = (await page.locator(`[data-grade="${grade}"]`).allInnerTexts()).join('');
            check(
              label.replace(/[✓✕\s]/g, '').length > 0,
              `${at} grade "${grade}" carries a text label, not colour alone`,
              `label was "${label}"`,
            );
          }
        } else {
          // The typed direction is auto-graded, so the ONLY way the learner learns
          // anything is the verdict on screen. Before this ran, submitting left a
          // screen with zero controls and no correct/incorrect state at all.
          await page.locator('input[id]').fill('wrong');
          await page.locator('button[type="submit"]').click();

          const verdict = await page.locator('[data-verdict]').allInnerTexts();
          check(verdict.length === 1, `${at} typed answer produces a verdict`, 'no [data-verdict]');
          check(
            (verdict[0] ?? '').replace(/[✓✕\s]/g, '').length > 0,
            `${at} verdict carries a text label, not colour alone`,
            `verdict was ${JSON.stringify(verdict)}`,
          );
          check(
            (await page.locator('[data-continue]').count()) === 1,
            `${at} there is a way forward after answering`,
            'no [data-continue] button — the card dead-ends',
          );
        }
      }

      // T-065 · § 4.2ו — the scrolling deck. Three promises, measured on the component and
      // ⛔ not on the screen above it: one card fills the screen, and the two grade buttons
      // are both thumb-sized AND separated. `/dev/deck` and not `/study`: the real route
      // renders its failure state without Supabase env (TD-13), so the deck itself would
      // never be in the DOM while this ran.
      if (route === '/dev/deck') {
        const deck = await page.evaluate(() => {
          const scroller = document.querySelector('[data-deck-scroll]');
          const cards = [...document.querySelectorAll('[data-flashcard]')];
          if (!scroller || cards.length < 2) return { count: cards.length, scroller: Boolean(scroller) };
          const box = scroller.getBoundingClientRect();
          // The snap UNIT is the scroller's own child, ⛔ not `[data-flashcard]` inside it:
          // the card sits under the article's `pt-4`, so measuring the inner section reported
          // 567px inside a 583px viewport and convicted the deck of a 16px gutter that is the
          // spacing the design asks for. What must fill the viewport is the thing that snaps.
          const items = [...scroller.children];
          const first = items[0].getBoundingClientRect();
          const second = items[1].getBoundingClientRect();
          return {
            count: cards.length,
            scroller: true,
            // Rounded: sub-pixel layout is not a defect, and comparing raw floats turns a
            // 0.5px rounding into a red run nobody can act on.
            top: Math.round(box.top),
            bottom: Math.round(box.bottom),
            height: Math.round(box.height),
            firstHeight: Math.round(first.height),
            secondTop: Math.round(second.top),
            viewportHeight: window.innerHeight,
          };
        });
        check(
          deck.count === 2 && deck.scroller,
          `${at} the deck holds both fixture cards`,
          `found ${deck.count} cards and ${deck.scroller ? 'a' : 'no'} [data-deck-scroll]`,
        );
        if (deck.count === 2 && deck.scroller) {
          // Measured against the SNAP VIEWPORT and ⛔ not against the window: the container
          // clips, so a card whose rectangle runs past `innerHeight` may be perfectly
          // invisible while a card 40px short of it is half on screen. Three properties,
          // and «one card per screen» is only true when all three hold.
          //
          // ⓐ The snap viewport itself is entirely on screen — otherwise its bottom edge,
          //    where the two grade buttons live, is below the fold (F-027 by another route).
          check(
            deck.top >= 0 && deck.bottom <= deck.viewportHeight,
            `${at} the deck fits on screen`,
            `the snap viewport occupies ${deck.top}..${deck.bottom} of a ${deck.viewportHeight}px viewport`,
          );
          // ⓑ Card 1 FILLS it. 1px of tolerance for sub-pixel layout, and no more: a card
          //    shorter than its viewport is the `min-h-dvh`/`flex-1` collapse measured in
          //    C-0104, where card 2 sat visible under card 1 and snapping meant nothing.
          check(
            deck.firstHeight >= deck.height - 1,
            `${at} one card per screen`,
            `card 1 is ${deck.firstHeight}px inside a ${deck.height}px snap viewport`,
          );
          // ⓒ Card 2 begins at or after that bottom edge — the other half of the same claim.
          check(
            deck.secondTop >= deck.bottom - 1,
            `${at} the next card waits off screen`,
            `card 2 starts at y=${deck.secondTop}, above the snap viewport's bottom edge at ${deck.bottom}`,
          );
        }

        // The grade buttons only exist after the answer is revealed — measuring the front of
        // the card would have printed green on a screen with no controls at all.
        await page.locator('[data-reveal]').first().click();
        const grades = await page.evaluate(
          ([minTap, minGap]) => {
            const buttons = [...document.querySelectorAll('[data-grade]')].slice(0, 2);
            if (buttons.length < 2) return { count: buttons.length };
            const boxes = buttons
              .map((el) => el.getBoundingClientRect())
              .sort((a, b) => a.left - b.left);
            return {
              count: buttons.length,
              small: boxes.filter((r) => r.width < minTap || r.height < minTap).length,
              // The pair sits side by side in a two-column grid, so the gap that a thumb
              // aims into is the HORIZONTAL one — the flow-screen scan measures vertical
              // neighbours and would have had nothing to say about this pair.
              gap: Math.round(boxes[1].left - boxes[0].right),
              floors: { minTap, minGap },
            };
          },
          [MIN_TAP, MIN_GAP],
        );
        check(
          grades.count === 2,
          `${at} both grade buttons are on the revealed card`,
          `found ${grades.count} [data-grade] controls`,
        );
        if (grades.count === 2) {
          check(
            grades.small === 0,
            `${at} both grade buttons >= ${MIN_TAP}px`,
            `${grades.small} of the two are below the floor`,
          );
          check(
            grades.gap >= MIN_GAP,
            `${at} grade buttons are separated by >= ${MIN_GAP}px`,
            `they sit ${grades.gap}px apart — one thumb, two answers`,
          );
        }
      }

      // T-055 — the finish state. Three properties, and «מסך סיום ולא מסך לבן» is only true
      // when all three hold: the node is there, it actually paints something, and the one
      // way out is a real touch target rather than a link the thumb cannot land on.
      if (route === '/dev/deck/done') {
        const done = await page.evaluate(() => {
          const node = document.querySelector('[data-deck-done]');
          if (!node) return { present: false };
          const box = node.getBoundingClientRect();
          const exits = [...node.querySelectorAll('[data-primary-action="true"]')];
          const exit = exits[0]?.getBoundingClientRect();
          return {
            present: true,
            // Rounded: sub-pixel layout is not a defect (same rule as the deck block above).
            height: Math.round(box.height),
            // The rendered text, ⛔ not the markup: a section full of empty boxes has height
            // and would pass a height-only check while showing the learner nothing.
            text: (node.textContent ?? '').trim().length,
            exits: exits.length,
            exitWidth: exit ? Math.round(exit.width) : 0,
            exitHeight: exit ? Math.round(exit.height) : 0,
          };
        });
        check(done.present, `${at} the finish state is in the DOM`, 'no [data-deck-done]');
        if (done.present) {
          check(
            done.height > 0 && done.text > 0,
            `${at} the finish state is not a blank screen`,
            `height ${done.height}px, ${done.text} chars of text`,
          );
          check(
            done.exits === 1,
            `${at} the finish state offers exactly one way out`,
            `found ${done.exits} [data-primary-action]`,
          );
          check(
            done.exitWidth >= MIN_TAP && done.exitHeight >= MIN_TAP,
            `${at} the way out clears ${MIN_TAP}px`,
            `${done.exitWidth}×${done.exitHeight}`,
          );
        }
      }

      // T-067 — the third of the three connectivity checks: the tap ARRIVES somewhere.
      // Last in the route block on purpose: `navigates` leaves this URL behind, and every
      // measurement above has to happen on the screen it names.
      const arrival = FLOW_ARRIVAL[route];
      if (arrival) {
        const action = page.locator('main [data-primary-action]');
        if ((await action.count()) === 1) {
          // The request this tap causes, and how many times its failure has ALREADY been
          // logged on this screen. `/study` and `/world/compose` both fetch on load and are
          // sitting in their 503 failure state, so "has the message arrived" is false from
          // the start — the only honest question is whether ONE MORE has arrived since.
          const settles = arrival.request ?? arrival.settles;
          const loggedBefore = settles
            ? consoleErrors.filter((line) => line.includes(settles)).length
            : 0;
          if (arrival.kind === 'navigates') {
            await action.click();
            await page.waitForURL(`**${arrival.to}`, { timeout: 5000 }).catch(() => {});
            const url = new URL(page.url()).pathname;
            check(url === arrival.to, `${at} tap arrives at ${arrival.to}`, `landed on ${url}`);
            // The URL alone is a claim about the router; the marker is a claim about the
            // screen. A route that renders an error boundary has the right URL too.
            const marker = await page.locator(arrival.marker).count();
            check(
              marker > 0,
              `${at} ${arrival.to} really rendered`,
              `no element matching ${arrival.marker}`,
            );
          } else if (arrival.kind === 'announces') {
            const said = () => page.locator('main').innerText();
            const before = await said();
            check(
              !before.includes(arrival.text),
              `${at} the answer is not on screen before the tap`,
              'the assertion below would pass without the tap',
            );
            await action.click();
            await page
              .locator('main', { hasText: arrival.text })
              .waitFor({ timeout: 5000 })
              .catch(() => {});
            const after = await said();
            check(
              after.includes(arrival.text),
              `${at} tap answers with "${arrival.text}"`,
              'the tap produced no visible answer — this is the F-027 dead end',
            );
          } else {
            // The RESPONSE and not the request: a response proves the request went out, so
            // the assertion is strictly stronger, and it is also the first half of keeping
            // the 503 inside this route (see the settle loop below).
            const seen = page.waitForResponse((r) => r.url().includes(arrival.request), {
              timeout: 5000,
            });
            await action.click();
            const fired = await seen.then(() => true).catch(() => false);
            check(
              fired,
              `${at} tap re-issues ${arrival.request}`,
              'the retry button issued no request at all',
            );
          }
          // ⚠️ Measured C-0134, and ⛔ not a precaution. A tap starts work that outlives this
          // iteration unless it is waited for, and the loop rebinds `consoleErrors` at the
          // top of the next one — so anything late is logged against the WRONG route. Both
          // halves were observed, and both were intermittent, which is worse than wrong:
          //   · Chromium delivers the console message for a failed resource on its own event,
          //     AFTER the response promise resolves ⇒ the harness blamed `/dev/card` for
          //     `/study`'s queue, and `/dev/world` — the fixture that requests nothing at
          //     all — for `/world/compose`'s bank.
          //   · The tap on `/` lands on `/signup`, whose favicon was still in flight when the
          //     next `goto` aborted it ⇒ the abort was logged against `/signup`.
          // ⛔ The fix is NOT an EXPECTED_CONSOLE entry on the innocent route: an entry on
          // `/dev/world` would silence the exact alarm its comment above exists to raise.
          // So the tap waits here, inside the route that caused it, until the page is quiet
          // and the message it is responsible for has actually been delivered — condition
          // based and bounded, and ⛔ never a blind sleep.
          await page.waitForLoadState('networkidle').catch(() => {});
          if (settles) {
            for (let i = 0; i < 100; i += 1) {
              const logged = consoleErrors.filter((line) => line.includes(settles)).length;
              if (logged > loggedBefore) break;
              await page.waitForTimeout(20);
            }
          }
          report(`${at} arrival: ${arrival.kind} — ${arrival.why}`);
        }
      }

      // A 404 route legitimately logs a 404; every other route must be silent — except for
      // the one request this harness itself makes impossible (see EXPECTED_CONSOLE).
      if (route !== '/does-not-exist') {
        const unexpected = consoleErrors.filter(
          (line) => !(EXPECTED_CONSOLE[route] ?? []).some((allowed) => allowed.test(line)),
        );
        check(unexpected.length === 0, `${at} clean console`, `errors: ${unexpected.join(' · ')}`);
      }
    }

    await context.close();
  }

  // ---- 2b. dark mode is measured, not declared (T-028) --------------------
  // Dark mode is a claim about pixels, so measure pixels. One route, one width:
  // the tokens are global, so if `/` flips, every screen flips.
  {
    const darkCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'dark',
    });
    const darkPage = await darkCtx.newPage();
    await darkPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const dark = await darkPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    await darkCtx.close();

    const lightCtx = await browser.newContext({
      viewport: { width: 375, height: 812 },
      colorScheme: 'light',
    });
    const lightPage = await lightCtx.newPage();
    await lightPage.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const light = await lightPage.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, fg: s.color };
    });
    await lightCtx.close();

    check(dark.bg !== light.bg, 'dark mode changes the page background', `both are ${dark.bg}`);
    check(dark.fg !== light.fg, 'dark mode changes the body text colour', `both are ${dark.fg}`);
    check(dark.bg === 'rgb(15, 23, 42)', 'dark surface is the --surface token', `got ${dark.bg}`);
  }

  // ---- 3. install offer timing (UX plan T-001) ----------------------------
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });
    const onLoad = await page.locator('aside[aria-label="הוספה למסך הבית"]').count();
    check(onLoad === 0, 'install offer hidden on page load', 'it rendered before any interaction');
    await context.close();
  }

  // ---- 4. service worker registers and serves offline (PW-2) --------------
  {
    const context = await browser.newContext({
      viewport: { width: 375, height: 780 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(`${BASE}/`, { waitUntil: 'networkidle' });

    const registered = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return false;
      if (reg.active) return true;
      await new Promise((resolve) => {
        const sw = reg.installing || reg.waiting;
        if (!sw) return resolve();
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
        setTimeout(resolve, 5000);
      });
      return Boolean((await navigator.serviceWorker.getRegistration())?.active);
    });
    check(registered, 'service worker registers and activates', 'no active registration');

    if (registered) {
      await context.setOffline(true);
      await page.reload({ waitUntil: 'domcontentloaded' }).catch(() => {});
      const body = await page.evaluate(() => document.body.innerText);
      check(
        body.includes('אין חיבור כרגע') || body.includes('אנגלית'),
        'offline reload serves a real Hebrew screen',
        `got: ${body.slice(0, 120)}`,
      );
      await context.setOffline(false);
    }
    await context.close();
  }
} finally {
  await browser.close();
  if (server) server.kill('SIGTERM');
}

console.log(notes.join('\n'));
if (failures.length) {
  console.error(`\n✗ ${failures.length} mobile/PWA guarantee(s) failed:`);
  for (const f of failures) console.error('  - ' + f);
  process.exit(1);
}
console.log(`\n✓ all mobile/PWA guarantees hold (${notes.length} checks, widths ${WIDTHS.join('/')}px)`);
