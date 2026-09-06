#!/usr/bin/env node
/**
 * K-003 · T-200 — **מדידת מנוע ההמשכים על הקורפוס שלנו**, לפני שנכתבת שורת קוד
 * אחת של מקלדת הבלוקים (`plan/39-messages-spec.md § 3`).
 *
 * ⛔ **למה זה קיים:** ההזמנה K-003 נפתחה ב-23/08 על סמך כותרת אחת — «4,273 רצפי
 * חלקי דיבר, מהם 63 שונים». המספר נכון, וה**מסקנה** ממנו לא נבדקה מעולם. שער
 * שאינו מצמצם דבר הוא ערובה חלולה, ובדיוק זה מה שהמדידה כאן בודקת: **בכמה
 * המשכים המנוע חוסם, ⛔ ולא בכמה הוא מציע.**
 *
 * ⛔ **קריאה בלבד** על `data/generated/`. ⛔ אינו כותב קובץ, ⛔ אינו מתקן דבר.
 * הפלט הוא stdout, כדי שהמספרים יהיו טריים בכל הרצה ו⛔ לא יירקבו בצילום מחויב.
 *
 * שלוש הכרעות מדידה, כל אחת מהן צמצום מכוון:
 *
 *   1 · **רק מילה חד-משמעית נספרת.** מילה שיש לה בבנק שלנו יותר מחלק דיבר אחד
 *       (`book` שם עצם ופועל) ⛔ אינה מקבלת ניחוש — היא יוצאת מהספירה. ⛔ אין כאן
 *       תיוג מורפולוגי, ⛔ ואין מנתח תחביר: יש **טבלת מילה→חלק דיבר שאנחנו כתבנו**.
 *   2 · **טוקן בלי חלק דיבר שובר את הרצף.** ⛔ הוא אינו מדולג בשקט — הרצף נחתך,
 *       כי «the ??? book» ⛔ אינו עדות לכך ש-determiner→noun נצפה.
 *   3 · **הלמטיזציה היא `storyLemma`** של `lib/core/storyGate.ts` — ⛔ מיובאת ולא
 *       מועתקת, כדי שההפחתה כאן תהיה בדיוק זו שהשערים אוכפים.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { registerHooks } from 'node:module';

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(specifier)) {
      try {
        return withTsFormat(nextResolve(`${specifier}.ts`, context));
      } catch {
        // Not a TypeScript sibling — fall through to the default resolver.
      }
    }
    return withTsFormat(nextResolve(specifier, context));
  },
});

function withTsFormat(resolved) {
  if (resolved && typeof resolved.url === 'string' && resolved.url.endsWith('.ts')) {
    return { ...resolved, format: 'module-typescript' };
  }
  return resolved;
}

const { storyLemma } = await import('../lib/core/storyGate.ts');

const DATA = process.env.CONTINUATIONS_DATA ?? join('data', 'generated');

/** § 39.3 מונה חמש קטגוריות צבועות. ⛔ הרשימה מועתקת משם ו⛔ אינה מומצאת כאן. */
const SPEC_CATEGORIES = new Set(['verb', 'noun', 'adjective', 'conjunction', 'pronoun']);
/** רצף שנצפה פעם אחת ⛔ אינו דפוס — המגבלה השלישית שנרשמה ב-`plan/25`. */
const MIN_OBSERVATIONS = 3;

const files = readdirSync(DATA).filter((f) => /^batch-.*\.jsonl$/.test(f)).sort();
if (files.length === 0) throw new Error(`measure-continuations: no batch files in ${DATA}`);

/** מילה → קבוצת חלקי הדיבר שראינו לה בבנק. גודל > 1 הוא **רב-משמעות מוצהרת**. */
const sensesOf = new Map();
const sentences = [];
let rows = 0;

for (const file of files) {
  for (const line of readFileSync(join(DATA, file), 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    let record;
    try {
      record = JSON.parse(trimmed);
    } catch {
      throw new SyntaxError(`measure-continuations: ${file} has a line that is not JSON`);
    }
    rows += 1;
    const { headword, pos } = record;
    if (typeof headword === 'string' && typeof pos === 'string') {
      const key = headword.toLowerCase();
      if (!sensesOf.has(key)) sensesOf.set(key, new Set());
      sensesOf.get(key).add(pos);
    }
    for (const kind of ['supportive', 'neutral']) {
      const s = record.examples?.[kind];
      if (typeof s === 'string') sentences.push(s);
    }
    if (Array.isArray(record.items)) {
      for (const s of record.items) {
        if (typeof s === 'string') sentences.push(s);
        else if (s && typeof s === 'object' && typeof s.stem === 'string') sentences.push(s.stem);
      }
    }
  }
}

const unambiguous = new Map();
let ambiguous = 0;
for (const [word, set] of sensesOf) {
  if (set.size === 1) unambiguous.set(word, [...set][0]);
  else ambiguous += 1;
}
const lemmas = new Set(unambiguous.keys());

const wordsByPos = new Map();
for (const [word, pos] of unambiguous) {
  if (!wordsByPos.has(pos)) wordsByPos.set(pos, []);
  wordsByPos.get(pos).push(word);
}

/** רצף = מקטע רצוף של טוקנים שלכולם חלק דיבר ידוע. טוקן לא ידוע **חותך**. */
const runs = [];
let tokens = 0;
let mapped = 0;
for (const sentence of sentences) {
  let current = [];
  for (const token of sentence.toLowerCase().match(/[a-z']+/g) ?? []) {
    tokens += 1;
    const lemma = storyLemma(token, lemmas);
    const pos = lemma === null ? undefined : unambiguous.get(lemma);
    if (pos === undefined) {
      if (current.length > 0) runs.push(current);
      current = [];
      continue;
    }
    mapped += 1;
    current.push(pos);
  }
  if (current.length > 0) runs.push(current);
}

/** מפה: מצב → חלק דיבר הבא → כמה פעמים נצפה. */
function transitions(order) {
  const out = new Map();
  for (const run of runs) {
    for (let i = order; i < run.length; i += 1) {
      const state = run.slice(i - order, i).join('|');
      if (!out.has(state)) out.set(state, new Map());
      const next = out.get(state);
      next.set(run[i], (next.get(run[i]) ?? 0) + 1);
    }
  }
  return out;
}

function fanOut(model) {
  const perState = [];
  for (const [state, next] of model) {
    const kept = [...next].filter(([, n]) => n >= MIN_OBSERVATIONS);
    const categories = kept.length;
    const blocks = kept.reduce((sum, [pos]) => sum + (wordsByPos.get(pos)?.length ?? 0), 0);
    const specCategories = kept.filter(([pos]) => SPEC_CATEGORIES.has(pos)).length;
    perState.push({ state, categories, blocks, specCategories });
  }
  perState.sort((a, b) => a.categories - b.categories || a.state.localeCompare(b.state));
  return perState;
}

const median = (nums) =>
  nums.length === 0 ? 0 : [...nums].sort((a, b) => a - b)[Math.floor(nums.length / 2)];

const pct = (n, d) => (d === 0 ? '0.0' : ((n / d) * 100).toFixed(1));

console.log('מנוע ההמשכים — נמדד על הקורפוס שלנו · K-003 · T-200\n');
console.log(`מקור: ${files.length} קבצי אצווה · ${rows} שורות משמעות · ${sentences.length} משפטים`);
console.log(`לקסיקון: ${sensesOf.size} מילים · ${unambiguous.size} חד-משמעיות · ${ambiguous} רב-משמעיות (⛔ יוצאות)`);
console.log(`כיסוי טוקנים: ${mapped}/${tokens} = ${pct(mapped, tokens)}%`);
console.log(`רצפים רצופים: ${runs.length} · אורך ממוצע ${(runs.reduce((s, r) => s + r.length, 0) / runs.length).toFixed(1)} טוקנים`);
console.log(`\nסף דפוס: רצף חייב להיצפות לפחות ${MIN_OBSERVATIONS} פעמים.\n`);

const totalBlocks = unambiguous.size;
for (const order of [1, 2]) {
  const model = transitions(order);
  const states = fanOut(model);
  const cats = states.map((s) => s.categories);
  const blocks = states.map((s) => s.blocks);
  const label = order === 1 ? 'סדר 1 — חלק דיבר אחד אחורה' : 'סדר 2 — שני חלקי דיבר אחורה';
  console.log(`${label}`);
  console.log(`  מצבים: ${model.size}`);
  console.log(`  קטגוריות המשך למצב: חציון ${median(cats)} · מינימום ${Math.min(...cats)} · מקסימום ${Math.max(...cats)}`);
  console.log(`  בלוקים למצב: חציון ${median(blocks)} מתוך ${totalBlocks} = ${pct(median(blocks), totalBlocks)}% מהלקסיקון`);
  console.log(`  מצבים ללא המשך כלל: ${cats.filter((n) => n === 0).length}`);
  console.log(`  צמצום: המנוע פוסל ${pct(totalBlocks - median(blocks), totalBlocks)}% מהבלוקים במצב החציוני\n`);
}

const missingColour = [...wordsByPos.keys()].filter((pos) => !SPEC_CATEGORIES.has(pos)).sort();
console.log('חלקי דיבר בלקסיקון שאין להם צבע ב-§ 39.3:');
for (const pos of missingColour) console.log(`  ${pos} — ${wordsByPos.get(pos).length} מילים`);
console.log(`\n⛔ בלוק בלי צבע מוצהר ⛔ אינו ניתן להצגה («פס צבע וגם מקרא», § 39.3),`);
console.log('   ולכן ⛔ אינו המשך אפשרי. זו הכרעת מוצר לרוי, ⛔ ולא החלטת סוכן.');
