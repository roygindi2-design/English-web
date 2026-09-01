#!/usr/bin/env node
/**
 * `npm run gc:memory` — **פינוי אשפה דטרמיניסטי לזיכרון הלופ.**
 * הוראה מפורשת של רוי, 01/09/2026, לפני ההדלקה מחדש.
 *
 * ⛔ **חל איסור מוחלט על LLM כאן.** אין סיכום, אין ניסוח מחדש, אין שיקול דעת.
 * כל פעולה היא רג׳קס, השוואת מספרים והדבקה מילה במילה. ⇒ אותה קלט ⇒ אותו פלט,
 * בכל הרצה, ⛔ ובלי טוקן אחד.
 *
 * ═══ מה הוא עושה, בשני שלבים ═══
 *
 * **שלב א׳ — התורים (`50-tasks` · `60-findings`).** ⛔ הוא ⛔ אינו כותב לוגיקה
 * חדשה: הוא **מריץ את `scripts/archive-registers.mjs`**, שכבר קיים, כבר נבדק,
 * וכבר מוסכם על הלופ. ⚠️ **וזו ההכרעה החשובה ביותר בקובץ הזה, והיא ⛔ אינה
 * עצלות:** ההוראה המקורית ביקשה «לגזור את הבלוק המלא מהקובץ החי». הלופ ⛔ אינו
 * יכול לחיות עם זה, ושלוש הסיבות **נמדדו** ומתועדות בראש `archive-registers.mjs`:
 *   1 · `loop:health` בדיקה 6 דורשת שכל תוכנית ב-`docs/superpowers/plans/`
 *       תצוטט ב-`plan/*.md` כלשהו. שורה שנעלמת מייתמת תוכניות בן־לילה.
 *   2 · הפרומפטים מורים לסוכן `grep -n '^| T-185 |' plan/50-tasks.md`. שורה
 *       שנמחקה מחזירה **אפס**, והסוכן מסיק שהמשימה ⛔ אינה קיימת מעולם.
 *   3 · `measure:plan` סופר שורות. מחיקה משנה כל מספר באינדקס.
 * ⇒ ולכן: **גדם בן שורה אחת ברגיסטר החי + הנוסח המלא בארכיון.** זהו בדיוק
 * «גזור והדבק לארכיון» — אבל בצורה שהלופ שורד אותה. ⛔ אפס מחיקה, לעולם.
 *
 * **שלב ב׳ — מצבות להחלטות (`40-decisions`).** ⚠️ **זה החלק שלא היה קיים, וזה
 * גם הקובץ הגדול ביותר בתוכנית.** ההחלטות ה-`KEEP_N` האחרונות (לפי מספר D)
 * וכל החלטה שנגעו בה ב-`KEEP_DAYS` הימים האחרונים — נשארות **בשלמותן**.
 * לכל השאר: הדיון המלא נגזר ל-`plan/archive/decisions-archive.md`, ובקובץ החי
 * נשארת **כותרת + מצבה בת שורה אחת**:
 *
 *     > [D-137] <כותרת ההחלטה> ⟨הדיון המלא הועבר לארכיון · מואַרך DD/MM/YYYY⟩
 *     **ציטוטים שנשמרו:** `lib/core/x.ts` · `2026-08-20-arena-completion.md`
 *
 * ⚠️ **הכותרת נשארת, ⛔ והיא ⛔ אינה קישוט.** `D-137` מצוטט בעשרות מקומות
 * ברגיסטרים ובפרומפטים; כותרת שנמחקת הופכת כל ציטוט כזה ליתום שקט.
 * ⚠️ **ושורת הציטוטים ⛔ אינה קישוט אף היא** — היא מה ששומר על בדיקה 6 ירוקה.
 * ⛔ **אידמפוטנטי:** סעיף שכבר נושא `⟨מואַרך` ⛔ אינו מטופל שוב לעולם.
 *
 * ═══ חוק הברזל ═══
 * ⛔ `plan/RULES.md` ו-`plan/35-design-constitution.md` ⛔ **אינם נפתחים לכתיבה,
 * ⛔ אינם נקראים לצורך שינוי, ו⛔ אינם משתנים.** זה ⛔ אינו הבטחה בתגובה — הסקריפט
 * מודד את ה-SHA-256 שלהם לפני ואחרי, וזורק אם השתנה אפילו בית אחד.
 *
 *   npm run gc:memory              ⇐ מריץ וכותב
 *   npm run gc:memory -- --dry     ⇐ מדווח, ⛔ ואינו כותב דבר
 *   npm run gc:memory -- --keep=30 --days=21 --today=2026-09-01
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { join } from 'node:path';

const ROOT = process.env.GC_ROOT ?? '.';
const at = (...p) => join(ROOT, ...p);
const argOf = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit === undefined ? fallback : hit.slice(name.length + 3);
};
const DRY = process.argv.includes('--dry');
const KEEP_N = Number(argOf('keep', '20'));
const KEEP_DAYS = Number(argOf('days', '14'));
const TODAY = argOf('today', new Date().toISOString().slice(0, 10));

/** ⛔ **חוק ברזל.** ⛔ אין דגל שפותח אותם, ⛔ ואין ארגומנט שמוסיף לרשימה. */
export const NEVER_TOUCH = ['plan/RULES.md', 'plan/35-design-constitution.md'];

export const TOMBSTONE_MARK = 'מואַרך';

/**
 * ⛔ **«חוזה חי» ⛔ אינו כל הריפו.** `50-tasks` ו-`60-findings` מצטטים כמעט כל
 * `D-xxx` שנכתב אי פעם, ולכן הכללתם הייתה שומרת על **הכול** והופכת את ה-GC
 * לפעולה ריקה. הרשימה כאן היא **מה שנקרא בכל טיק**: הבקרה, החוקים, החוקה,
 * ארבעת מפרטי המסך, רשם הדחיות, ופרומפטי הסוכנים.
 */
export const LIVE_CONTRACT = [
  'plan/00-control.md',
  'plan/RULES.md',
  'plan/35-design-constitution.md',
  'plan/36-video-spec.md',
  'plan/37-arena-spec.md',
  'plan/38-character-base.md',
  'plan/39-messages-spec.md',
  'plan/41-amirnet-spec.md',
  'plan/61-deferred.md',
  'docs/agents/PM.md',
  'docs/agents/DEV.md',
  'docs/agents/CRITIC.md',
  'docs/agents/CONTENT.md',
];

/** ⛔ קריאה בלבד — הקבצים הקפואים נקראים כאן ו⛔ אינם נפתחים לכתיבה לעולם. */
export function liveCitedIds(readText) {
  const out = new Set();
  for (const p of LIVE_CONTRACT) {
    const text = readText(p);
    if (text === null) continue;
    for (const m of text.matchAll(/\bD-\d{3}\b/g)) out.add(m[0]);
  }
  return out;
}
const DECISIONS = 'plan/40-decisions.md';
const DECISIONS_ARCHIVE = 'plan/archive/decisions-archive.md';

/* ────────────────────────── פונקציות טהורות (נבדקות) ────────────────────────── */

/**
 * כותרת החלטה: `### D-137 — …` · `#### D-029 — …` · `## D-020 — …`.
 * ⛔ שורת טבלה (`| D-001 | …`) ⛔ **אינה** כותרת ו⛔ אינה נוגעים בה — § 4.1 הוא
 * יומן ADR של שורה אחת לכל החלטה, כלומר הוא **כבר** מצבה.
 */
export const HEADING = /^(#{2,4})\s+(D-\d{3})\s*(?:[—–-]\s*)?(.*)$/u;

/** תאריך בכל אחת משתי הצורות שהלופ כותב בהן. מחזיר `YYYY-MM-DD` ממוין. */
export function datesIn(text) {
  const out = [];
  for (const m of text.matchAll(/\b(20\d\d)-(\d\d)-(\d\d)\b/g)) out.push(`${m[1]}-${m[2]}-${m[3]}`);
  for (const m of text.matchAll(/\b(\d\d)\/(\d\d)\/(20\d\d)\b/g)) out.push(`${m[3]}-${m[2]}-${m[1]}`);
  return out.sort();
}

/** הפרש ימים קלנדרי, ⛔ בלי אזורי זמן ו⛔ בלי שעון — שתי מחרוזות `YYYY-MM-DD`. */
export function daysBetween(from, to) {
  const d = (s) => Date.UTC(Number(s.slice(0, 4)), Number(s.slice(5, 7)) - 1, Number(s.slice(8, 10)));
  return Math.round((d(to) - d(from)) / 86_400_000);
}

/**
 * ⛔ **מועתק במכוון מ-`archive-registers.mjs`** — ⛔ אין תלות בין הסקריפטים,
 * וזו אותה החלטה שנעשתה שם מול `lib/core/planTable.ts`.
 * ⚠️ `:12` אחרי הסיומת הוא הצורה הרגילה בממצאים (`` `lib/core/x.ts:12` ``);
 * ביטוי שדורש גרש-סוגר מיד אחרי הסיומת מחזיר **אפס** ציטוטים.
 */
const CITE = /`((?:[a-z][\w.\-]*\/)+[\w.\-]*\.[a-z]+)(?::\d+(?:[-,]\d+)*)?`|\b(20\d\d-\d\d-\d\d-[\w-]+\.md)\b/g;
export function citationsIn(text) {
  const found = new Set();
  for (const m of text.matchAll(CITE)) found.add(m[1] ?? m[2]);
  return [...found];
}

/**
 * ⛔ **כותרת ⛔ אינה נגזרת «עד הנקודה».** היא מנוקה מהדגשה, מגרשיים ומהערת
 * המחזור בסוגריים — ונחתכת על גבול מילה, ⛔ ולעולם ⛔ לא בתוך code span.
 */
export function cleanTitle(raw) {
  const flat = raw
    .replace(/\*+/g, '')
    .replace(/`/g, '')
    .replace(/\s*\*?\(.*$/u, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (flat === '') return '—';
  if (flat.length <= 100) return flat;
  const cut = flat.slice(0, 100);
  const sp = cut.lastIndexOf(' ');
  return `${(sp > 50 ? cut.slice(0, sp) : cut).trim()}…`;
}

/**
 * חלוקת הקובץ לסעיפים. סעיף החלטה נמשך עד הכותרת הבאה **ברמה שווה או גבוהה**
 * ממנו — ⛔ ולא «עד הכותרת הבאה», שהיה בולע תת-סעיף לתוך הבא אחריו.
 */
export function sectionsOf(lines) {
  const heads = [];
  for (const [i, line] of lines.entries()) {
    const m = /^(#{1,6})\s/.exec(line);
    if (m !== null) heads.push({ i, depth: m[1].length });
  }
  const out = [];
  for (const [k, h] of heads.entries()) {
    const m = HEADING.exec(lines[h.i]);
    if (m === null) continue;
    let end = lines.length;
    for (let j = k + 1; j < heads.length; j += 1) {
      if (heads[j].depth <= h.depth) { end = heads[j].i; break; }
    }
    out.push({ start: h.i, end, depth: h.depth, id: m[2], title: cleanTitle(m[3] ?? '') });
  }
  return out;
}

/**
 * **ההכרעה, והיא כולה מספרים ו-grep.** סעיף נשמר בשלמותו כשמתקיים אחד מאלה:
 *   ⓐ הוא **מצוטט בחוזה חי** (`LIVE_CONTRACT` למטה) — ⛔ לעולם לא בגלל גיל.
 *   ⓑ הוא בין `keepN` ההחלטות בעלות המספר הגבוה ביותר.
 *   ⓒ נגעו בו בתוך `days` הימים האחרונים.
 * ⛔ סעיף שכבר נושא מצבה ⛔ אינו מטופל שוב.
 *
 * 🔴 **ⓐ הוא הסעיף שמונע את הנזק היחיד שאי אפשר לתקן בקומיט, והוא ⛔ אינו זהירות
 * תיאורטית:** `40-decisions` ⛔ אינו יומן היסטוריה בלבד — חלק מה-`D-xxx` שבו הם
 * **חוזה חי** שמסך נבנה לפיו היום (‏`D-033` · `D-034` · `D-171`…). הגדמה של אחד
 * מהם הייתה מותירה בלופ כותרת בלי כלל, והטיק הבא היה בונה מול ריק ו⛔ לא יודע.
 * ⇒ אותה מוסכמה בדיוק שבה `archive-stale.mjs` ⛔ אינו מקפיא ממצא שחוסם שורה. */
export function shouldTombstone({ id, body, rank, keepN, ageDays, days, citedLive = false }) {
  if (body.includes(TOMBSTONE_MARK)) return { tomb: false, why: 'כבר מוארך' };
  if (citedLive) return { tomb: false, why: 'מצוטט בחוזה חי — ⛔ לעולם לא בגלל גיל' };
  if (rank < keepN) return { tomb: false, why: `בין ${keepN} האחרונות` };
  if (ageDays !== null && ageDays <= days) return { tomb: false, why: `נגעו בו לפני ${ageDays} יום` };
  return { tomb: true, why: ageDays === null ? '⛔ אין תאריך · מחוץ לחלון' : `${ageDays} יום`, id };
}

/** המצבה עצמה — **שתי שורות לכל היותר**, וזה כל מה שנשאר בקובץ החי. */
export function tombstoneFor({ id, title, cites, today }) {
  const stamp = `${today.slice(8, 10)}/${today.slice(5, 7)}/${today.slice(0, 4)}`;
  const out = [`> [${id}] ${title} ⟨הדיון המלא הועבר לארכיון · ${TOMBSTONE_MARK} ${stamp}⟩`];
  if (cites.length > 0) out.push(`**ציטוטים שנשמרו:** ${cites.map((c) => `\`${c}\``).join(' · ')}`);
  out.push('');
  return out;
}

/* ────────────────────────────── ההרצה ────────────────────────────── */

const sha = (p) => (existsSync(at(p)) ? createHash('sha256').update(readFileSync(at(p))).digest('hex') : 'ABSENT');
const kb = (n) => `${(n / 1024).toFixed(1)}KB`;

export function runDecisions({ dry = DRY, keepN = KEEP_N, days = KEEP_DAYS, today = TODAY } = {}) {
  const path = at(DECISIONS);
  if (!existsSync(path)) throw new Error(`gc: ⛔ אין ${path}`);
  const before = readFileSync(path, 'utf8');
  const lines = before.split('\n');
  const sections = sectionsOf(lines);
  const live = liveCitedIds((p) => (existsSync(at(p)) ? readFileSync(at(p), 'utf8') : null));

  /* דירוג לפי מספר D יורד — ⛔ ולא לפי סדר הופעה בקובץ, שהוא כרונולוגי-למחצה. */
  const order = [...new Set(sections.map((s) => s.id))].sort(
    (a, b) => Number(b.slice(2)) - Number(a.slice(2)),
  );
  const rankOf = new Map(order.map((id, i) => [id, i]));

  const drop = new Set();
  const moved = [];
  const kept = [];

  for (const s of sections) {
    const body = lines.slice(s.start, s.end).join('\n');
    const dates = datesIn(body);
    const ageDays = dates.length === 0 ? null : daysBetween(dates[dates.length - 1], today);
    const verdict = shouldTombstone({
      id: s.id, body, rank: rankOf.get(s.id) ?? 0, keepN, ageDays, days,
      citedLive: live.has(s.id),
    });
    if (!verdict.tomb) { kept.push(`${s.id} — ${verdict.why}`); continue; }

    moved.push(body.replace(/\s+$/, ''));
    const stone = tombstoneFor({ id: s.id, title: s.title, cites: citationsIn(body), today });
    /* הכותרת נשארת בדיוק כפי שהיא; הגוף מוחלף במצבה. */
    for (let i = s.start + 1; i < s.end; i += 1) drop.add(i);
    lines[s.start] = [lines[s.start], '', ...stone].join('\n');
  }

  const after = lines.filter((_, i) => !drop.has(i)).join('\n').replace(/\n{4,}/g, '\n\n\n');

  if (moved.length > 0 && !dry) {
    const head = existsSync(at(DECISIONS_ARCHIVE))
      ? readFileSync(at(DECISIONS_ARCHIVE), 'utf8')
      : `<!-- ארכיון נגזר של \`${DECISIONS}\`. ⛔ נוצר בידי \`npm run gc:memory\`, ⛔ ואינו נערך ביד. -->\n\n# ארכיון — 40-decisions.md\n`;
    writeFileSync(
      at(DECISIONS_ARCHIVE),
      `${head}\n<!-- gc:memory ${today} · ${moved.length} סעיפים -->\n\n${moved.join('\n\n')}\n`,
      'utf8',
    );
    writeFileSync(path, after, 'utf8');
  }

  return {
    sections: sections.length,
    tombstoned: moved.length,
    kept: kept.length,
    liveKept: sections.filter((s) => live.has(s.id)).length,
    beforeBytes: Buffer.byteLength(before, 'utf8'),
    afterBytes: Buffer.byteLength(after, 'utf8'),
  };
}

function main() {
  const guard = Object.fromEntries(NEVER_TOUCH.map((p) => [p, sha(p)]));

  console.log(DRY ? 'gc:memory — הרצה יבשה, ⛔ שום דבר לא נכתב\n' : 'gc:memory\n');

  /* ── שלב א׳ — התורים. ⛔ לוגיקה קיימת, ⛔ לא לוגיקה חדשה. ── */
  console.log('שלב א׳ — תורים (`50-tasks` · `60-findings`) ⇐ scripts/archive-registers.mjs');
  try {
    const out = execFileSync(
      process.execPath,
      [join('scripts', 'archive-registers.mjs'), ...(DRY ? ['--dry'] : [])],
      { cwd: ROOT, encoding: 'utf8', env: { ...process.env, ARCHIVE_ROOT: ROOT } },
    );
    console.log(out.trim().split('\n').map((l) => `  ${l}`).join('\n'));
  } catch (err) {
    console.error('  🔴 ארכוב התורים נכשל — ⛔ ההחלטות ⛔ לא טופלו.');
    console.error(String(err.stdout ?? '') + String(err.stderr ?? err.message));
    process.exitCode = 1;
    return;
  }

  /* ── שלב ב׳ — מצבות להחלטות. ── */
  console.log('\nשלב ב׳ — מצבות (`40-decisions`)');
  const r = runDecisions();
  console.log(`  ${r.sections} סעיפי D · ${r.tombstoned} הוגדמו · ${r.kept} נשמרו בשלמותם`);
  console.log(`  מתוכם ${r.liveKept} נשמרו כי הם **מצוטטים בחוזה חי** — ⛔ לא בגלל גיל`);
  console.log(`  ${DECISIONS}: ${kb(r.beforeBytes)} ⇐ ${kb(r.afterBytes)}`);
  console.log(`  כלל השמירה: ${KEEP_N} ההחלטות האחרונות · או ${KEEP_DAYS} יום · היום ${TODAY}`);

  /* ── חוק הברזל — נמדד, ⛔ לא מובטח. ── */
  console.log('\nחוק הברזל');
  for (const p of NEVER_TOUCH) {
    if (sha(p) !== guard[p]) throw new Error(`gc: 🔴 ${p} השתנה — חוק הברזל נשבר`);
    console.log(`  ✅ ${p} — ⛔ לא נגענו (SHA-256 זהה)`);
  }

  console.log('\n⛔ ⛔ אף שורה לא נמחקה — הנוסח המלא ב-`plan/archive/`.');
  if (!DRY && r.tombstoned > 0) console.log('⚠️ הרץ `npm run check:rules` ו-`npm run loop:health` בקומיט הזה.');
}

if (process.argv[1] !== undefined && process.argv[1].endsWith('gc-memory.mjs')) main();
