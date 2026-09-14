#!/usr/bin/env node
/**
 * T-184ⓑ · שלב 6 — **ארכוב על טריגר המיזוג.**
 *
 * ⛔ **הבעיה, נמדדה:** `plan/50-tasks.md` הוא **446KB** ו-`plan/60-findings.md`
 * **276KB**, והם רק גדלים. הרגיסטרים ⛔ אינם נקראים במלואם (יש אינדקס נגזר), אבל
 * `plan/00-control.md` **כן** נקרא בכל טיק — והוא נמצא ב-25/08 **661 בתים מעל
 * התקרה שלו**. ⇒ קובץ שגדל בלי בלם הוא קובץ שיישבר בהרצה לא מפוקחת.
 *
 * ⛔ **ומה שהסקריפט הזה ⛔ אינו עושה, וזו ההכרעה המרכזית:** הוא ⛔ **אינו מוחק
 * שורה ו⛔ אינו מסלק אותה מהרגיסטר.** הוא מחליף את גוף השורה הסגורה ב**גדם בן
 * שורה אחת** ומעביר את הנוסח המלא לארכיון, מילה במילה.
 *
 * ⚠️ **למה גדם ⛔ ולא הסרה — שלוש סיבות מדודות, וכל אחת מהן הייתה שוברת משהו:**
 *   1 · `loop:health` בדיקה 6 דורשת שכל תוכנית תצוטט **ברשם**. שורה סגורה נושאת
 *       ציטוטי תוכניות; הסרתה הייתה הופכת תוכניות ליתומות בן־לילה.
 *   2 · הפרומפטים מורים לסוכן `grep -n '^| T-185 |' plan/50-tasks.md`. שורה
 *       שנעלמה מחזירה **אפס**, והסוכן מסיק שהמשימה ⛔ אינה קיימת.
 *   3 · `measure:plan` סופר שורות. הסרה הייתה משנה כל מספר באינדקס.
 *
 * ⇒ הגדם נושא: **המזהה · תא אבן הדרך · גליף הסטטוס והמחזור · כל ציטוט קובץ
 * ותוכנית · והפניה לארכיון.** כלומר כל מה שמכונה קוראת — ו⛔ לא את הפרוזה.
 *
 * ⛔ **אידמפוטנטי.** שורה שכבר מוגדמת נושאת `⟨מואַרך⟩` ו⛔ אינה מטופלת שוב.
 * ⛔ **⛔ אינו נוגע בשורה פתוחה.** ⬜ · ⛔ · 🟣 · 🔵 ⇒ ⛔ אינן זזות לעולם.
 *
 *   npm run archive          ⇐ מריץ
 *   npm run archive -- --dry ⇐ מדווח ו⛔ אינו כותב
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.env.ARCHIVE_ROOT ?? '.';
const DRY = process.argv.includes('--dry');
const at = (...p) => join(ROOT, ...p);

/**
 * ⛔ **הגליף הראשון בתא הסטטוס מכריע, ⛔ ולא «התא מכיל».**
 * הפרוזה כאן מלאה ב-⛔ וב-⬜ בתוך משפטים («⛔ אינו…»), ולכן «התא מכיל גליף פתוח»
 * פסל **51 מתוך 81** שורות ממצא סגורות בגרסה הראשונה של הסקריפט — נמדד.
 * ⇒ אותה מוסכמה בדיוק שבה `docs/plan-open.md` מסווג כל שורה.
 */
const STATUS_GLYPH = /[✅🚫⬜⛔🟣🔵🧭]/u;
const firstGlyph = (cell) => STATUS_GLYPH.exec(cell)?.[0] ?? null;
const CLOSED = /[✅🚫]/u;
const STUB_MARK = '⟨מואַרך⟩';

/**
 * ⛔ מועתק במכוון מ-`lib/core/planTable.ts`: הסקריפט ⛔ אינו תלוי בשכבה הטהורה.
 *
 * 🔴 ⟦F-243 · 14/09⟧ **וההעתק ⛔ נשאר מאחור, ⇒ שני הפרסרים חלקו דעה על אינדקס התא —**
 * **בדיוק מה שההערה ב-`planTable.ts` מצהירה ש⛔ לעולם לא יקרה.**
 *
 * 🔬 **נמדד חי C-0593 (QA), ⛔ ולא שוער:** שורת `T-326` נושאת
 * `` `/world/amirnet/practice|simulation` `` — צינור **בתוך גרש בודד**, ותקין:
 * ‏`lib/core/planTable.ts` מדד **8** תאים, העותק כאן מדד **9**, השורה נדחתה למטה
 * ⛔ בשקט, ו-`npm run archive` הדפיס «8 שורות הוגדמו» ⛔ בלי `T-326` ביניהן —
 * למרות שהיא סומנה ✅ באותו קומיט. ⇒ **כל שורה שנסגרת ונושאת גרש עם צינור פנימי**
 * **בלתי-מוברח נשארת בגודלה המלא לנצח**, וה«N שורות הוגדמו» הוא תת-ספירה שקטה.
 *
 * ⇒ `codeSpans` הובא לכאן במלואו, ⛔ ולא «תוקן» ניסוח ההערה. החוזה של הפונקציה
 * הזאת ⛔ אינו זז: היא מחזירה תאים **⛔ לא-גזומים** ו⛔ בלי התא הריק שאחרי ה-`|`
 * האחרון — עליו נשענת בניית הגדם למטה.
 */
function codeSpans(line) {
  const runs = [];
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\') {
      const next = line[i + 1];
      if (next === '|' || next === '\\' || next === '`') i += 1;
      continue;
    }
    if (ch !== '`') continue;
    const start = i;
    while (line[i + 1] === '`') i += 1;
    runs.push({ start, length: i + 1 - start });
  }

  const spans = [];
  for (let a = 0; a < runs.length; a += 1) {
    const open = runs[a];
    for (let b = a + 1; b < runs.length; b += 1) {
      const close = runs[b];
      if (close.length !== open.length) continue;
      spans.push([open.start, close.start + close.length]);
      a = b;
      break;
    }
  }
  return spans;
}

const insideSpan = (spans, at) => spans.some(([start, end]) => at >= start && at < end);

function splitRow(line) {
  const spans = codeSpans(line);
  const out = [];
  let cur = '';
  for (let i = 1; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\' && line[i + 1] === '|') {
      cur += '\\|';
      i += 1;
      continue;
    }
    if (ch === '|' && insideSpan(spans, i)) {
      cur += ch;
      continue;
    }
    if (ch === '|') {
      out.push(cur);
      cur = '';
      continue;
    }
    cur += ch;
  }
  return out;
}

/** ציטוט = נתיב קובץ עם תיקייה, או שם תוכנית. שניהם נשמרים בגדם. */
/**
 * ⛔ **`:12` אחרי הסיומת הוא הצורה הרגילה בממצאים** — `` `lib/core/x.ts:12` `` —
 * והגרסה הראשונה של הביטוי דרשה שהגרש ייסגר מיד אחרי הסיומת, ולכן החזירה **אפס
 * ציטוטים לכל שורת ממצא**. נמדד על פיקסטורה, ⛔ לא שוער.
 */
const CITE = /`((?:[a-z][\w.\-]*\/)+[\w.\-]*\.[a-z]+)(?::\d+(?:[-,]\d+)*)?`|\b(20\d\d-\d\d-\d\d-[\w-]+\.md)\b/g;
const citations = (row) => {
  const found = new Set();
  for (const m of row.matchAll(CITE)) found.add(m[1] ?? m[2]);
  return [...found];
};

/**
 * ⛔ **קיצור שאינו שובר את השורה — וזה ⛔ אינו זהירות תיאורטית.**
 * הגרסה הראשונה חתכה ב-`slice(0, 90)` והפילה שתי בדיקות בהרצה החיה: חיתוך בתוך
 * ``code span`` הותיר גרש בודד, ומתוכו נולדה **טענת נתיב מזויפת** (`bank/route.ts`
 * ⇐ בדיקה 2), ו-**26 שורות נעשו פגומות** (בדיקה 5) כשהחיתוך נחת בתוך `\|` מוברח.
 * ⇒ הקיצור מסלק גרשיים וצינורות **לפני** החיתוך, וחותך על גבול מילה.
 */
const excerpt = (cell) => {
  const flat = cell
    .replace(/`[^`]*`/g, '')
    .replace(/[`|\\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat.length <= 80) return flat === '' ? '—' : flat;
  const cut = flat.slice(0, 80);
  const at = cut.lastIndexOf(' ');
  return `${(at > 40 ? cut.slice(0, at) : cut).trim()}…`;
};

/** גליף הסטטוס והמחזור — «✅ **C-0155 — …»  ⇒  «✅ C-0155». */
function statusDigest(cell) {
  const glyph = firstGlyph(cell) ?? '✅';
  const cycle = /\bC-\d{4}\b/.exec(cell)?.[0];
  return cycle === undefined ? glyph : `${glyph} ${cycle}`;
}

const REGISTERS = [
  /**
   * ⛔ **`citeIndex` ⛔ אינו נגזר, והוא מוצהר לכל רגיסטר בנפרד.** הגרסה הראשונה
   * גזרה אותו כ-`cells - 2`, ובממצאים זה **בדיוק תא הסטטוס** — הציטוטים דרסו
   * אותו, F-040 נקרא כפתוח, ו-`loop:health` בדיקה 2 האדימה על נתיב מת בשורה
   * שהייתה סגורה שנתיים. נמדד בהרצה החיה, ⛔ לא שוער.
   */
  { file: '50-tasks.md', id: /^\| *(T-\d+) *\|/, statusIndex: 4, citeIndex: 6, descIndex: 2, cells: 8, archive: 'tasks-archive.md' },
  { file: '60-findings.md', id: /^\| *(F-\d+) *\|/, statusIndex: 6, citeIndex: 2, descIndex: 3, cells: 8, archive: 'findings-archive.md' },
];

let totalRows = 0;
let totalSaved = 0;
const report = [];

for (const reg of REGISTERS) {
  const path = at('plan', reg.file);
  if (!existsSync(path)) throw new Error(`archive: ⛔ אין ${path}`);
  const before = readFileSync(path, 'utf8');
  const lines = before.split('\n');
  const moved = [];

  for (const [i, line] of lines.entries()) {
    const m = reg.id.exec(line);
    if (m === null) continue;
    if (line.includes(STUB_MARK)) continue;
    const cells = splitRow(line);
    if (cells.length !== reg.cells) {
      // 🔴 ⟦F-243⟧ ⛔ **הדילוג נשאר, וה⛔שקט ⛔ אינו.** «⛔ שורה פגומה ⛔ אינה נוגעים
      // בה» היא הכרעה נכונה (`F-078`) — ⛔ אבל היא הודפסה בשום מקום, ⇒ שורה סגורה
      // שנפלה כאן נראתה בדיוק כמו שורה שאין מה לעשות בה. ⇒ דילוג **מדווח**.
      console.warn(
        `⛔ archive: דילוג על ${m[1]} ב-${reg.file} — ${cells.length} תאים במקום ${reg.cells}.`,
      );
      continue;
    }
    const status = cells[reg.statusIndex] ?? '';
    const glyph = firstGlyph(status);
    if (glyph === null || !CLOSED.test(glyph)) continue;

    const cites = citations(line);
    const stubCells = cells.map(() => '');
    stubCells[0] = ` ${m[1]} `;
    stubCells[1] = cells[1] ?? ' — ';
    stubCells[reg.descIndex] = ` ${excerpt(cells[reg.descIndex] ?? '')} `;
    stubCells[reg.statusIndex] = ` ${statusDigest(status)} ${STUB_MARK} `;
    const citeCell = cites.length === 0 ? ' — ' : ` ${cites.map((c) => `\`${c}\``).join(' · ')} `;
    /* ⛔ שלושת התאים חייבים להיות שונים, אחרת אחד דורס את השני בשקט —
     * וזה בדיוק מה שקרה ב-25/08 כשהציטוטים דרסו את הסטטוס בממצאים. */
    const slots = new Set([reg.statusIndex, reg.citeIndex, reg.descIndex]);
    if (slots.size !== 3) throw new Error(`archive: ⛔ ${reg.file} — שני תאים מתנגשים`);
    stubCells[reg.citeIndex] = citeCell;
    for (let k = 0; k < stubCells.length; k += 1) if (stubCells[k] === '') stubCells[k] = ' — ';
    const stub = `|${stubCells.join('|')}|`;

    moved.push(line);
    totalSaved += Buffer.byteLength(line, 'utf8') - Buffer.byteLength(stub, 'utf8');
    lines[i] = stub;
    totalRows += 1;
  }

  if (moved.length === 0) {
    report.push(`  ${reg.file}: ⛔ אין שורות סגורות לארכוב`);
    continue;
  }

  const after = lines.join('\n');
  const archivePath = at('plan', 'archive', reg.archive);
  const head = existsSync(archivePath)
    ? readFileSync(archivePath, 'utf8')
    : `<!-- ארכיון נגזר של \`plan/${reg.file}\`. ⛔ נוצר על ידי \`npm run archive\`, ⛔ ואינו נערך ביד.\n     כל שורה כאן היא **הנוסח המלא** של שורה שהוגדמה ברגיסטר החי. ⛔ אפס מחיקה. -->\n\n# ארכיון — ${reg.file}\n`;
  const block = `\n<!-- ${moved.length} שורות -->\n${moved.join('\n')}\n`;

  const kb = (n) => `${(n / 1024).toFixed(1)}KB`;
  report.push(
    `  ${reg.file}: ${moved.length} שורות הוגדמו · ${kb(Buffer.byteLength(before, 'utf8'))} ⇐ ${kb(Buffer.byteLength(after, 'utf8'))}`,
  );

  if (!DRY) {
    writeFileSync(archivePath, head + block, 'utf8');
    writeFileSync(path, after, 'utf8');
  }
}

console.log(DRY ? 'ארכוב — הרצה יבשה, ⛔ שום דבר לא נכתב\n' : 'ארכוב רגיסטרים\n');
for (const r of report) console.log(r);
console.log(`\n${totalRows} שורות · ${(totalSaved / 1024).toFixed(1)}KB נחסכו`);
console.log('⛔ ⛔ אף שורה לא נמחקה — הנוסח המלא ב-`plan/archive/`.');
if (!DRY && totalRows > 0) console.log('⚠️ הרץ `npm run measure:plan` בקומיט הזה.');
