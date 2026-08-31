#!/usr/bin/env node
/**
 * ארכוב `plan/30-architecture.md` — יומן הבנייה, ⛔ לא מרשם החוב.
 *
 * ⛔ **הבעיה, נמדדה 31/08:** הקובץ הוא **555,906 בתים** ב-**179 סעיפים**, ומתוכם
 * **427KB ב-114 סעיפים ישנים מ-`C-0300`** — יומן בנייה של מחזורים שנסגרו לפני
 * שבועיים ויותר. ⛔ אף סקריפט, ⛔ אף טסט ו⛔ אף פרומפט ⛔ אינו קורא אותם.
 *
 * ⛔ **ומה שהסקריפט הזה ⛔ אינו עושה, וזו אותה הכרעה בדיוק כמו ב-`archive-registers.mjs`:**
 * הוא ⛔ **אינו מוחק סעיף.** הוא משאיר את **הכותרת כלשונה** — כדי ש-`grep -n "C-0160"`
 * ימשיך להחזיר שורה — ומחליף את הגוף ב**גדם בן שורה אחת** שנושא:
 *   **כל ציטוט קובץ ותוכנית שהיה בגוף · תקציר בן ≤80 תווים · והפניה לארכיון.**
 * הנוסח המלא עובר **מילה במילה** ל-`plan/archive/architecture-archive.md`.
 *
 * ⚠️ **שלושה שומרים, וכל אחד מהם נמדד לפני שנכתב:**
 *   1 · **§ 3.2 · § 3.3 · § 3.4 ⛔ אינם נגעים לעולם.** ‏`scripts/plan-hygiene.test.ts`
 *       קורא את מרשם החוב, ו-**כל 36 שורות `| TD-nn |` יושבות ב-§ 3.4 בלבד** (נמדד).
 *       סעיף שמכיל שורת `| TD-` ⛔ מדולג בכל מקרה, גם אם הכותרת שלו ישנה.
 *   2 · **רק כותרת שנושאת `C-XXXX` נמוך מהחתך.** סעיף בלי מזהה מחזור ⛔ אינו זז —
 *       זה מה שמגן על § 3.2/3.3/3.4 ועל כל סעיף כללי אחר.
 *   3 · ⛔ **אידמפוטנטי.** סעיף מוגדם נושא `⟨מואַרך⟩` ו⛔ אינו מטופל שוב.
 *
 *   node scripts/archive-architecture.mjs --dry    ⇐ מדווח ו⛔ אינו כותב
 *   node scripts/archive-architecture.mjs          ⇐ מריץ
 *   ARCH_CUT=250 node scripts/archive-architecture.mjs   ⇐ חתך אחר
 */
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.ARCHIVE_ROOT ?? '.';
const CUT = Number(process.env.ARCH_CUT ?? 300);
const DRY = process.argv.includes('--dry');
const at = (...p) => join(ROOT, ...p);

const SRC = at('plan', '30-architecture.md');
const DST = at('plan', 'archive', 'architecture-archive.md');
const STUB_MARK = '⟨מואַרך⟩';

/** ⛔ מועתק במכוון מ-`archive-registers.mjs` — אותה מוסכמת ציטוט בדיוק. */
const CITE = /`((?:[a-z][\w.\-]*\/)+[\w.\-]*\.[a-z]+)(?::\d+(?:[-,]\d+)*)?`|\b(20\d\d-\d\d-\d\d-[\w-]+\.md)\b/g;
const citations = (body) => {
  const found = new Set();
  for (const m of body.matchAll(CITE)) found.add(m[1] ?? m[2]);
  return [...found];
};

const excerpt = (body) => {
  const flat = body
    .split('\n')
    .slice(1)
    .join(' ')
    .replace(/`[^`]*`/g, '')
    .replace(/[`|\\*>#]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= 80) return flat === '' ? '—' : flat;
  const cut = flat.slice(0, 80);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 40 ? cut.slice(0, sp) : cut).trim()}…`;
};

const lines = readFileSync(SRC, 'utf8').split('\n');
const heads = [];
for (let i = 0; i < lines.length; i += 1) if (/^#{2,3} /.test(lines[i])) heads.push(i);

const out = [];
const archived = [];
let cursor = 0;
let skippedTd = 0;
let alreadyStub = 0;

for (let k = 0; k < heads.length; k += 1) {
  const start = heads[k];
  const end = k + 1 < heads.length ? heads[k + 1] : lines.length;
  out.push(...lines.slice(cursor, start));
  cursor = end;

  const head = lines[start];
  const body = lines.slice(start, end).join('\n');
  const cycle = /C-(\d{4})/.exec(head);

  const guardTd = /^\|\s*TD-\d{1,3}\s*\|/m.test(body);
  const isStub = body.includes(STUB_MARK);
  const oldEnough = cycle !== null && Number(cycle[1]) < CUT;

  if (guardTd) skippedTd += 1;
  if (isStub) alreadyStub += 1;

  if (!oldEnough || guardTd || isStub) {
    out.push(...lines.slice(start, end));
    continue;
  }

  archived.push({ head, body, bytes: Buffer.byteLength(body) });
  const cites = citations(body);
  out.push(head);
  out.push('');
  out.push(
    `${STUB_MARK} ${excerpt(body)}` +
      (cites.length > 0 ? ` · ציטוטים: ${cites.map((c) => `\`${c}\``).join(' · ')}` : '') +
      ' · הנוסח המלא: `plan/archive/architecture-archive.md`',
  );
  out.push('');
}
out.push(...lines.slice(cursor));

const before = Buffer.byteLength(lines.join('\n'));
const after = Buffer.byteLength(out.join('\n'));
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

console.log(DRY ? 'ארכוב ארכיטקטורה — הרצה יבשה, ⛔ שום דבר לא נכתב\n' : 'ארכוב ארכיטקטורה\n');
console.log(`  חתך: מחזורים ישנים מ-C-${String(CUT).padStart(4, '0')}`);
console.log(`  30-architecture.md: ${archived.length} סעיפים הוגדמו · ${kb(before)} ⇐ ${kb(after)}`);
console.log(`  ⛔ דולגו: ${skippedTd} סעיפים עם שורת \`| TD- |\` · ${alreadyStub} כבר מוגדמים`);
console.log(`\n${archived.length} סעיפים · ${kb(before - after)} נחסכו`);
console.log('⛔ ⛔ אף סעיף לא נמחק — הכותרת נשארה, והנוסח המלא ב-`plan/archive/`.');

if (DRY || archived.length === 0) process.exit(0);

if (!existsSync(DST)) {
  writeFileSync(
    DST,
    '# ארכיון יומן הבנייה — `plan/30-architecture.md`\n\n' +
      '> נשלף מ-`plan/30-architecture.md` כדי לשמור עליו קטן. **קריאה בלבד, לתחקור בלבד.**\n' +
      '> ⛔ אף סעיף לא נמחק: הכותרת נשארה ברגיסטר החי כגדם, עם כל הציטוטים שלה.\n' +
      '> ⛔ § 3.2 · § 3.3 · § 3.4 (מרשם החוב) ⛔ אינם כאן ו⛔ לא נגעו.\n',
    'utf8',
  );
}
appendFileSync(
  DST,
  `\n\n---\n\n## הועבר ${new Date().toISOString().slice(0, 10)} · חתך C-${String(CUT).padStart(4, '0')} · ${archived.length} סעיפים\n\n` +
    archived.map((a) => a.body.trimEnd()).join('\n\n'),
  'utf8',
);
writeFileSync(SRC, out.join('\n'), 'utf8');
