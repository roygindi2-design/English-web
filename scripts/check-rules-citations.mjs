#!/usr/bin/env node
/**
 * ⛔ **EVERY `RULES § x.y` IN THE LIVE REPO RESOLVES TO A REAL SECTION.**
 *
 * 🔴 **Why this exists, and it is ⛔ not theoretical.** On 31/08 (C-0375) a proposal to
 * renumber `plan/RULES.md` was deliberately NOT taken in the same commit as the cut,
 * with the reason written down: «קיצוץ ומספור מחדש באותו קומיט שוברים ציטוט בשקט».
 * **בשקט** is the whole problem — a citation that points at a section which no longer
 * exists ⛔ does not fail a build, ⛔ does not redden a test, and ⛔ does not stop an agent.
 * It just quietly sends the next tick to the wrong rule, forever.
 *
 * ⇒ C-0376 did renumber the file (`§ 0.0` carries the map), and this gate is what makes
 * «⛔ no citation broke» a **measurement** instead of a claim.
 *
 * WHAT IT SCANS. Everything `git ls-files` returns, minus:
 *   `plan/archive/**` · `docs/superpowers/plans/**`  — 🗄️ HISTORY. A document written on
 *     14/08 cites the numbers that existed on 14/08. ⛔ Rewriting it would be forging the
 *     record, and `§ 0.0` is the bridge for anyone reading it.
 *   `skills/**` — third-party skill text, ⛔ not ours to edit.
 *   `node_modules` · `.next` — ⛔ not the repo.
 *
 * Usage: node scripts/check-rules-citations.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const RULES = 'plan/RULES.md';
const SKIP_PREFIX = ['plan/archive/', 'docs/superpowers/plans/', 'skills/'];
/** ⛔ `plan/00-control.md § 0.1` is the handoff log — ⛔ a different document's own § 0.1. */
/**
 * Two things that look like a citation and ⛔ are not:
 *   `00-control` — `plan/00-control.md § 0.1` is the handoff log, a ⛔ different
 *     document's own § 0.1.
 *   `לשעבר` — the `⟨לשעבר § 0.14ב⟩` marker on every renumbered heading is a
 *     **deliberate pointer at a number that ⛔ no longer exists**. It is the whole
 *     bridge for anyone reading a document written before C-0376.
 */
const NOT_A_RULES_CITATION = /00-control|לשעבר/;

/** `### 0.6 …` and `#### 0.6א …` are anchors; so are `#### א׳ …` under a numbered parent. */
export function anchorsOf(text) {
  const out = new Set();
  let parent = null;
  for (const line of text.split('\n')) {
    const top = /^### (0\.\d+(?:\.\d+)?[א-ת]?)/.exec(line);
    if (top !== null) {
      parent = top[1];
      out.add(parent);
      continue;
    }
    const sub = /^#### (0\.\d+(?:\.\d+)?[א-ת]?)/.exec(line);
    if (sub !== null) {
      out.add(sub[1]);
      continue;
    }
    const letter = /^#### ([א-ת])׳/.exec(line);
    if (letter !== null && parent !== null) out.add(parent + letter[1]);
  }
  return out;
}

/** Every `§ 0.x` / `§ 0.xא` in one file, with the line it sits on. */
export function citationsIn(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    for (const m of line.matchAll(/§\s*(0\.\d+(?:\.\d+)?)([א-ת]?)/g)) {
      const before = line.slice(Math.max(0, (m.index ?? 0) - 40), m.index);
      if (NOT_A_RULES_CITATION.test(before)) continue;
      out.push({ ref: `${m[1]}${m[2] ?? ''}`, bare: m[1], line: i + 1 });
    }
  }
  return out;
}

/**
 * ⛔ **THE SCAN RUNS ONLY AS A COMMAND.** Same guard as `check-motion.mjs`: the test
 * imports `anchorsOf`/`citationsIn`, and a top-level `process.exit(1)` on import would
 * kill the test run before a single assertion — which is exactly what happened once.
 */
export function main() {
  const anchors = anchorsOf(readFileSync(RULES, 'utf8'));
  const files = execFileSync('git', ['ls-files'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f !== '' && !SKIP_PREFIX.some((p) => f.startsWith(p)));

  const broken = [];
  let scanned = 0;
  for (const f of files) {
    let text;
    try {
      text = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (!text.includes('§')) continue;
    for (const c of citationsIn(text)) {
      scanned += 1;
      // ⛔ `§ 0.23ט` resolves if either the lettered child or its parent exists — a citation
      // ⛔ may name a subsection this gate has ⛔ no heading for (the ⓐ/ⓑ inline markers).
      if (!anchors.has(c.ref) && !anchors.has(c.bare)) broken.push(`${f}:${c.line} — § ${c.ref}`);
    }
  }

  if (broken.length > 0) {
    console.error(`⛔ ${broken.length} ציטוטי RULES שבורים מתוך ${scanned} שנסרקו:`);
    for (const b of broken) console.error(`  - ${b}`);
    console.error(`\n⇒ העוגנים הקיימים ב-${RULES}: ${[...anchors].join(' · ')}`);
    process.exit(1);
  }
  console.log(`✓ RULES citations: ${scanned} ציטוטים · ${anchors.size} עוגנים · 0 שבורים`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
