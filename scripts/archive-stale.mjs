#!/usr/bin/env node
/**
 * D-170 · **הקפאת ממצא פתוח שלא זז 14 יום.** אישור מפורש של רוי, 31/08/2026,
 * `03-for-roy` פריט 82.
 *
 * ⛔ **מה שהוא ⛔ אינו עושה:** ⛔ אינו מוחק שורה, ⛔ אינו מסלק אותה מהרגיסטר,
 * ו⛔ אינו נוגע בפרוזה. הוא מקדים לתא הסטטוס `🚫 ⟨מוקפא Nי · <תאריך>⟩` —
 * הנוסח המקורי נשאר בשורה, מילה במילה, אחרי מקף.
 *
 * ⛔ **«לא זז» ⛔ אינו «השורה לא נערכה».** עריכת פרוזה מאפסת שעון בלי שדבר קרה.
 * המדד הוא **גליף הסטטוס**: הקומיט האחרון שבו הגליף של אותו ממצא **השתנה**,
 * נמדד בהליכה על היסטוריית `plan/60-findings.md`.
 *
 * שלוש הגדרות, ⛔ ואף אחת מהן ⛔ אינה נתונה לשיקול דעת:
 *   1 · ⛔ לעולם לא 🔴 CRITICAL.
 *   2 · ⛔ לעולם לא ממצא שמוזכר ב-`50-tasks.md` או ב-`00-control.md` —
 *       ממצא שחוסם שורה כתובה ⛔ אינו «ללא מענה», הוא ממתין להיפוך תא.
 *   3 · ⛔ לעולם לא ממצא שתא הסטטוס שלו נושא `D-xxx` — הוא כבר נענה.
 *
 *   npm run archive:stale            ⇐ 14 יום, כותב
 *   npm run archive:stale -- --dry   ⇐ מדווח ו⛔ אינו כותב
 *   npm run archive:stale -- --days=21
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const FILE = 'plan/60-findings.md';
const STATUS_GLYPH = /[✅🚫⬜⛔🟣🔵🧭]/u;
const CLOSED = /[✅🚫]/u;
export const FREEZE_MARK = 'מוקפא';

/** ⛔ מועתק במכוון מ-`archive-registers.mjs`: ⛔ אין תלות בין שני הסקריפטים. */
export function splitRow(line) {
  const out = [];
  let cur = '';
  for (let i = 1; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '\\' && line[i + 1] === '|') { cur += '\\|'; i += 1; continue; }
    if (ch === '|') { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  return out;
}

export const firstGlyph = (cell) => STATUS_GLYPH.exec(cell)?.[0] ?? null;

/**
 * ⛔ **הפונקציה הזאת היא כל ההכרעה, והיא טהורה בכוונה** — היא ⛔ אינה נוגעת ב-git
 * וב-fs, ולכן `scripts/archive-stale.test.ts` בודק אותה על נתונים מומצאים.
 */
export function shouldFreeze({ id, severityCell, statusCell, ageDays, days, citedElsewhere }) {
  if (ageDays === null || ageDays <= days) return { freeze: false, why: 'טרי' };
  const glyph = firstGlyph(statusCell);
  if (glyph !== null && CLOSED.test(glyph)) return { freeze: false, why: 'כבר סגור' };
  if (statusCell.includes(FREEZE_MARK)) return { freeze: false, why: 'כבר מוקפא' };
  if (/🔴/u.test(severityCell)) return { freeze: false, why: '🔴 CRITICAL — ⛔ לעולם לא בגלל גיל' };
  if (citedElsewhere) return { freeze: false, why: 'חוסם שורה כתובה — ממתין להיפוך תא' };
  if (/\bD-\d{3}\b/.test(statusCell)) return { freeze: false, why: 'כבר נענה בהכרעה כתובה' };
  return { freeze: true, why: `${ageDays} יום בלי שינוי סטטוס`, id };
}

/** התאריך של הקומיט האחרון שבו גליף הסטטוס של כל ממצא השתנה. */
export function lastStatusMove(file = FILE) {
  const statuses = (txt) => {
    const m = new Map();
    for (const line of txt.split('\n')) {
      const id = /^\| *(F-\d+) *\|/.exec(line);
      if (id === null) continue;
      const c = splitRow(line);
      if (c.length !== 8) continue;
      m.set(id[1], firstGlyph(c[6] ?? '') ?? '?');
    }
    return m;
  };
  const log = execSync(`git log --format='%H %ct' --reverse -- ${file}`, { maxBuffer: 1 << 30 })
    .toString().trim().split('\n').filter(Boolean);
  const seen = new Map();
  let prev = new Map();
  for (const row of log) {
    const [sha, ct] = row.split(' ');
    let txt;
    try { txt = execSync(`git show ${sha}:${file}`, { maxBuffer: 1 << 30 }).toString(); } catch { continue; }
    const cur = statuses(txt);
    for (const [id, g] of cur) if (prev.get(id) !== g) seen.set(id, Number(ct));
    prev = cur;
  }
  return seen;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const DRY = process.argv.includes('--dry');
  const days = Number(/--days=(\d+)/.exec(process.argv.join(' '))?.[1] ?? 14);
  const tasks = readFileSync('plan/50-tasks.md', 'utf8');
  const control = readFileSync('plan/00-control.md', 'utf8');
  const moved = lastStatusMove();
  const today = new Date().toISOString().slice(0, 10);
  const NOW = Math.floor(Date.now() / 1000);

  const lines = readFileSync(FILE, 'utf8').split('\n');
  const frozen = [];
  const skipped = [];
  lines.forEach((line, i) => {
    const m = /^\| *(F-\d+) *\|/.exec(line);
    if (m === null) return;
    const cells = splitRow(line);
    if (cells.length !== 8) return;               // ⛔ שורה פגומה ⛔ אינה נוגעים בה (T-245)
    const id = m[1];
    const t = moved.get(id);
    const ageDays = t === undefined ? null : Math.floor((NOW - t) / 86400);
    const verdict = shouldFreeze({
      id,
      severityCell: cells[1] ?? '',
      statusCell: cells[6] ?? '',
      ageDays,
      days,
      citedElsewhere: tasks.includes(id) || control.includes(id),
    });
    if (!verdict.freeze) {
      if (ageDays !== null && ageDays > days && verdict.why !== 'כבר סגור') skipped.push(`${id} — ${verdict.why}`);
      return;
    }
    cells[6] = ` 🚫 ⟨${FREEZE_MARK} ${days}י · ${today}⟩ — ${(cells[6] ?? '').trim()} `;
    lines[i] = `|${cells.join('|')}|`;
    frozen.push(`${id} (${ageDays}י)`);
  });

  console.log(DRY ? `הקפאה — הרצה יבשה, ⛔ שום דבר לא נכתב (סף ${days} יום)\n` : `הקפאת ממצאים תקועים (סף ${days} יום)\n`);
  console.log(`  הוקפאו: ${frozen.length}${frozen.length ? ' — ' + frozen.join(' · ') : ''}`);
  for (const s of skipped) console.log(`  ⛔ לא הוקפא: ${s}`);
  if (!DRY && frozen.length > 0) {
    writeFileSync(FILE, lines.join('\n'), 'utf8');
    console.log('\n⛔ אף שורה לא נמחקה — הנוסח המלא נשאר בשורה אחרי המקף.');
    console.log('⚠️ הרץ `npm run measure:plan` בקומיט הזה, וכתוב שורה ל-`plan/61-deferred.md`.');
  }
}
