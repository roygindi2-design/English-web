#!/usr/bin/env node
/**
 * ⟦NEW 11/09 · הוראת רוי⟧ **ארכוב מחלקות סגורות — התקרה נשמרת בלי לחסום פתיחה.**
 *
 * 🔴 **הבעיה, נמדדה 11/09:** `plan/05-departments.md` הגיע ל-**4,085 בתים מתוך 4,096**
 * ⇒ **11 בתים פנויים**. הטיק הבא שפותח מחלקה או יעד היה מפיל את בדיקה 19.
 * ⛔ **והפתרון הפסול הוא להעלות את התקרה או לאסור פתיחת מחלקה** — פתיחת מחלקה חדשה
 * היא בדיוק מה שהלופ אמור לעשות. ⇒ מה שיוצא הוא **מה שנסגר**, ⛔ לא מה שנפתח.
 *
 * ⇒ אותו דפוס בדיוק של `archive-registers.mjs`: הנוסח המלא עובר **מילה במילה**
 * ל-`plan/archive/departments-archive.md`, והקובץ החי נשאר עם מה שפתוח **בפועל**.
 *
 * ⚠️ **ההגדרה של «נסגרה», ו⛔ היא ⛔ אינה «⛔ אין ⬜»:** מחלקה נסגרת כשהיא **חתומה**.
 * ⛔ **וזו ⛔ אינה קפדנות יתר — היא נמדדה:** `cards` · `arena` · `studies` כולן נושאות
 * «⛔ אין ⬜» **ו⛔ אינן סגורות** — כל אחת מהן מחזיקה חסם חי (‏`env` · `T-246`) שהוא
 * בדיוק המידע ש-DEV ו-PM קוראים את הקובץ בשבילו. כלל «⛔ אין ⬜» היה מארכב את שלושתן
 * ומוחק שלושה חסמים חיים.
 *
 * ⇒ **שני תנאים, ו⛔ אחד ⛔ אינו מספיק:**
 *   ① תא היעדים נושא `חתומה`  — המילה שמסמנת מחלקה שנסגרה
 *   ② ⛔ ואין בו ולו סימן יעד פתוח אחד — `T-NNN` · ①②③④⑤ · `חסומ`
 *
 * ⛔ **אידמפוטנטי:** שורה שכבר אורכבה ⛔ אינה בקובץ החי ⇒ ריצה שנייה ⛔ אינה עושה דבר.
 *
 *   npm run archive            ⇐ רץ יחד עם ארכוב הרגיסטרים
 *   node scripts/archive-departments.mjs --dry   ⇐ מדווח ו⛔ אינו כותב
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';

const ROOT = process.env.ARCHIVE_ROOT ?? '.';
const DRY = process.argv.includes('--dry');
const at = (...p) => join(ROOT, ...p);

const LIVE = at('plan', '05-departments.md');
const ARCHIVE = at('plan', 'archive', 'departments-archive.md');

/** סימני יעד פתוח. ⛔ כל אחד מהם לבדו מספיק כדי ש**⛔ לא** נארכב. */
const OPEN_MARKS = [/\bT-\d{3}\b/, /[①②③④⑤⑥⑦⑧⑨]/, /חסומ/];

export function isSealedRow(goalsCell) {
  if (!/חתומה/.test(goalsCell)) return false;
  return !OPEN_MARKS.some((re) => re.test(goalsCell));
}

/** ⛔ תא היעדים הוא התא ה**אחרון**, ⛔ ולא «השלישי»: שורה פגומה ⛔ לא תזיז אינדקס. */
export function goalsCellOf(line) {
  const cells = line.replace(/^\||\|$/g, '').split('|');
  return cells.length >= 3 ? cells[cells.length - 1].trim() : '';
}

export function splitDepartments(text) {
  const keep = [];
  const archived = [];
  for (const line of text.split('\n')) {
    const isRow = /^\|\s*`/.test(line);
    if (isRow && isSealedRow(goalsCellOf(line))) archived.push(line);
    else keep.push(line);
  }
  return { keep: keep.join('\n'), archived };
}

function main() {
  if (!existsSync(LIVE)) {
    console.log('⛔ לא נמדד — plan/05-departments.md ⛔ אינו בקלון');
    return 0;
  }
  const text = readFileSync(LIVE, 'utf8');
  const before = Buffer.byteLength(text, 'utf8');
  const { keep, archived } = splitDepartments(text);
  if (archived.length === 0) {
    console.log(`departments: 0 נסגרו · ${before} בתים מתוך 4096`);
    return 0;
  }
  const after = Buffer.byteLength(keep, 'utf8');
  console.log(`departments: ${archived.length} אורכבו · ${before} ⇢ ${after} בתים מתוך 4096`);
  for (const row of archived) console.log(`  ⇢ ${goalsCellOf(row).slice(0, 60)}`);
  if (DRY) return 0;
  mkdirSync(dirname(ARCHIVE), { recursive: true });
  const head = existsSync(ARCHIVE)
    ? readFileSync(ARCHIVE, 'utf8')
    : '# ארכיון המחלקות — מחלקות שנסגרו, בנוסחן המלא\n\n' +
      '> ⛔ **הקובץ החי הוא `plan/05-departments.md`** והוא נטו. כאן יושב הנוסח\n' +
      '> המלא של כל מחלקה שנחתמה, מילה במילה, כדי שהתקרה של 4KB תישמר ⛔ בלי\n' +
      '> לחסום פתיחת מחלקה חדשה — הראיה חיה גם ב-`git log`.\n\n' +
      '| מחלקה | מה הלומד מקבל שם | המצב בעת החתימה |\n|---|---|---|\n';
  writeFileSync(ARCHIVE, `${head.replace(/\n+$/, '')}\n${archived.join('\n')}\n`, 'utf8');
  writeFileSync(LIVE, keep, 'utf8');
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('archive-departments.mjs')) process.exit(main());
