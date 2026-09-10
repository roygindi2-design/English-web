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

/**
 * `### 0.6 …` and `#### 0.6א …` are anchors; so is a lettered clause under a numbered
 * parent — written **either** as a heading (`#### א׳ · …`) **or** as a bold line
 * (`**א׳ · …**`).
 *
 * 🔬 **⛔ Why the bold form counts, and it is a MEASUREMENT.** ‏`§ 0.29` writes its six
 * clauses as `**א׳ · …**`, ⛔ not as `####` headings. Until 09/09 the parser ⛔ could not
 * see them ⇒ eleven live citations to `§ 0.29ב` · `§ 0.29ג` · `§ 0.29ו` resolved ⛔ only
 * through the bare-parent fallback below. ⇒ the fallback was ⛔ not a courtesy, it was
 * **the only thing holding a third of the lettered citations up** — and it held the
 * wrong ones up too.
 */
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
    const letter = /^(?:#### |\*\*)([א-ת])׳ ·/.exec(line);
    if (letter !== null && parent !== null) out.add(parent + letter[1]);
  }
  return out;
}

/**
 * 🔴 ⛔ **THE SAME NUMBER TWICE IS ⛔ NOT A TYPO — IT IS AN AMBIGUOUS CITATION.**
 * ‏`anchorsOf` returns a **Set**, so a heading written twice is invisible to it and the
 * gate reports `0 שבורים` while every reader of that number lands on whichever of the
 * two sections they happen to scroll to first. Measured 09/09: `#### 0.6ד` existed
 * twice — the surfaces inventory and, added the same day, the PM's narrow code licence —
 * and the three live citations to it all meant the first.
 */
export function duplicateAnchors(text) {
  const seen = new Map();
  let parent = null;
  for (const line of text.split('\n')) {
    const top = /^### (0\.\d+(?:\.\d+)?[א-ת]?)/.exec(line);
    const sub = /^#### (0\.\d+(?:\.\d+)?[א-ת]?)/.exec(line);
    const letter = /^(?:#### |\*\*)([א-ת])׳ ·/.exec(line);
    let ref = null;
    if (top !== null) {
      parent = top[1];
      ref = parent;
    } else if (sub !== null) ref = sub[1];
    else if (letter !== null && parent !== null) ref = parent + letter[1];
    if (ref !== null) seen.set(ref, (seen.get(ref) ?? 0) + 1);
  }
  return [...seen].filter(([, n]) => n > 1).map(([ref]) => ref);
}

/** Every `§ 0.x` / `§ 0.xא` in one file, with the line it sits on. */
export function citationsIn(text) {
  const out = [];
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i] ?? '';
    // 🔴 ⛔ **הרווח לפני האות ⛔ אינו סגנון — הוא היה חור בשער.**  ⟦נמדד 10/09⟧
    // עד היום התבנית דרשה שהאות תיצמד למספר ⇒ `§ 0.1 ז׳` נקרא כציטוט להורה `0.1`
    // בלבד, והאות ⛔ לא אומתה מעולם. 🔬 נמדד: **150** ציטוטים בצורה המרווחת מול **98**
    // בצורה הצמודה ⇒ **רוב הציטוטים המאותיינים במאגר עקפו את השער שנבנה בדיוק נגדם.**
    // ⛔ הגרש אחרי האות הוא קישוט עברי, ⛔ ואינו חלק מהמזהה.
    for (const m of line.matchAll(/§\s*(0\.\d+(?:\.\d+)?)(?:([א-ת])|\s+([א-ת])׳)?/g)) {
      const before = line.slice(Math.max(0, (m.index ?? 0) - 40), m.index);
      if (NOT_A_RULES_CITATION.test(before)) continue;
      // ⚠️ **והגרש הוא מה שמבדיל, ⛔ לא הרווח.** «`§ 0.4 נסיגה`» היא פסקה שמתחילה
      // במילה, ⛔ ולא ציטוט ל-`0.4נ`. ⇒ אות **צמודה** נספרת תמיד; אות **מרווחת**
      // נספרת ⛔ רק כשהיא נושאת גרש, שהוא הסימן שהיא מזהה ו⛔ לא תחילת מילה.
      const letter = m[2] ?? m[3] ?? '';
      out.push({ ref: `${m[1]}${letter}`, bare: m[1], line: i + 1 });
    }
  }
  return out;
}

/**
 * 🔴 ⛔ **A LETTERED CITATION RESOLVES ⛔ ONLY AGAINST ITS OWN LETTER.** Until 09/09 this
 * also accepted the bare parent, and the hole was ⛔ not theoretical: the old number
 * `0.17ח` — written here ⛔ without its `§`, because this gate scans its own source —
 * sat in `scripts/loop-health.mjs` (twice), `docs/agents/roster.json` and two registers,
 * pointing at «the PM task ceiling» — while the rule it meant, «the prompts live in the
 * repo», had been `§ 0.23ח` since C-0376. **Six live citations sending every reader to
 * the wrong rule, and the gate built against exactly that reported `0 שבורים`.**
 * ⇒ the parent is ⛔ no longer a stand-in.
 */
export function resolves(anchors, citation) {
  return anchors.has(citation.ref);
}

/**
 * ⛔ **THE SCAN RUNS ONLY AS A COMMAND.** Same guard as `check-motion.mjs`: the test
 * imports `anchorsOf`/`citationsIn`, and a top-level `process.exit(1)` on import would
 * kill the test run before a single assertion — which is exactly what happened once.
 */
export function main() {
  const rules = readFileSync(RULES, 'utf8');
  const anchors = anchorsOf(rules);

  const duplicated = duplicateAnchors(rules);
  if (duplicated.length > 0) {
    console.error(
      `⛔ ${duplicated.length} מספרי סעיף מוכרזים יותר מפעם אחת ב-${RULES}: ` +
        `${duplicated.join(' · ')}\n⇒ ציטוט אליהם ⛔ אינו חד-משמעי.`,
    );
    process.exitCode = 1;
    return;
  }

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
      if (!resolves(anchors, c)) broken.push(`${f}:${c.line} — § ${c.ref}`);
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
