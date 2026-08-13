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
 */
const FLOW_ROUTES = ['/', '/signup', '/login', '/dev/onboarding', '/study'];

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
    page.on('console', (m) => {
      if (m.type() === 'error') consoleErrors.push(m.text());
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

      // A 404 route legitimately logs a 404; every other route must be silent.
      if (route !== '/does-not-exist') {
        check(
          consoleErrors.length === 0,
          `${at} clean console`,
          `errors: ${consoleErrors.join(' · ')}`,
        );
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
