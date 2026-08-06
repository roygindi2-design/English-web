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
const ROUTES = ['/', '/signup', '/login', '/onboarding', '/offline', '/does-not-exist'];
const MIN_TAP = 44;

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
        return [...document.querySelectorAll(sel)]
          .filter((el) => {
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0 && (r.width < min || r.height < min);
          })
          .map((el) => {
            const r = el.getBoundingClientRect();
            return `${el.tagName.toLowerCase()}"${(el.textContent || '').trim().slice(0, 20)}" ${Math.round(r.width)}x${Math.round(r.height)}`;
          });
      }, MIN_TAP);
      check(small.length === 0, `${at} all tap targets >= ${MIN_TAP}px`, `too small: ${small.join(' · ')}`);

      // Primary action reachable by thumb (MF-5). Once a screen carries
      // interactive content above the call to action (T-027's preview card),
      // "the first link in main" stops meaning "the primary action" — so the
      // page marks it, and we fall back to the old rule only if it does not.
      if (route === '/' || route === '/onboarding') {
        const y = await page.evaluate(() => {
          const el =
            document.querySelector('main [data-primary-action]') ??
            document.querySelector('main a[href], main button');
          return el ? el.getBoundingClientRect().top : -1;
        });
        check(y >= 780 / 2, `${at} primary action in thumb zone`, `sits at y=${Math.round(y)}`);
      }

      // Content anchored to the top (F-011). The landing screen used to centre
      // its heading inside the whole flexible area, leaving a 267px dead band
      // above it; a regression here is invisible in a diff but obvious on a
      // phone. Measured against the header, not the viewport top.
      if (route === '/') {
        const gap = await page.evaluate(() => {
          const h1 = document.querySelector('main h1');
          if (!h1) return -1;
          const header = document.querySelector('header');
          const top = header ? header.getBoundingClientRect().bottom : 0;
          return h1.getBoundingClientRect().top - top;
        });
        check(gap >= 0 && gap <= 48, `${at} heading anchored to top`, `dead band of ${Math.round(gap)}px above the heading`);
      }

      // Password visibility (F-013). Email confirmation is off (Q-001 ⓑ), so
      // there is no recovery path: one unseen typo is an account the learner
      // can never enter again. That makes the toggle a measured guarantee and
      // not a styling detail — the tap-target check above already holds the
      // new button to 44px on its own.
      if (route === '/signup' || route === '/login') {
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
