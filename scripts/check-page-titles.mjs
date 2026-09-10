#!/usr/bin/env node
/**
 * T-264 / D-193 — guard ⓒ. A product route without its own `document.title` is the
 * bug this task closes: 18 product routes, 3 with `metadata`, 12 live screens
 * measuring `distinct document.title: 1` (Playwright, 375×780, 06/09).
 *
 * ⛔ `app/dev/**` is fixture, ⛔ not product — it is excluded on purpose (RULES § 0.22 —
 * `app/dev/**` is the harness, never shipped behind `PROTECTED_SCREENS` or the ring).
 *
 * A route owns a title when its own `page.tsx` exports `metadata` or
 * `generateMetadata`, OR a sibling `layout.tsx` in the same route folder does — the
 * second form exists for a route whose `page.tsx` is a Client Component
 * (`app/(tabs)/settings/`): Next.js refuses `metadata`/`generateMetadata` exports from
 * a Client Component page, so the title has to sit one level up, in a Server Component
 * layout that wraps just that one route.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

const APP_ROOT = 'app';
const OWN_TITLE = /export\s+(const\s+metadata\b|(async\s+)?function\s+generateMetadata\b)/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (entry === 'page.tsx') out.push(p);
  }
  return out;
}

function isDevFixture(p) {
  return relative(APP_ROOT, p).split('/')[0] === 'dev';
}

function hasOwnTitle(pageFile) {
  const src = readFileSync(pageFile, 'utf8');
  if (OWN_TITLE.test(src)) return true;
  const dir = dirname(pageFile);
  if (dir === APP_ROOT) return false; // the root layout is the shared default, ⛔ not a route's own title
  const siblingLayout = join(dir, 'layout.tsx');
  return existsSync(siblingLayout) && OWN_TITLE.test(readFileSync(siblingLayout, 'utf8'));
}

const pages = walk(APP_ROOT)
  .filter((p) => !isDevFixture(p))
  .sort();

const missing = pages.filter((p) => !hasOwnTitle(p));

console.log(`checked ${pages.length} routes (page.tsx under app/, excluding the dev fixtures)`);
if (missing.length > 0) {
  console.log(`⛔ ${missing.length} route(s) without their own title:`);
  for (const p of missing) console.log(`  ⛔ ${p}`);
  process.exit(1);
}
console.log('page titles: OK — every route owns one');
