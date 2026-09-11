#!/usr/bin/env node
/**
 * ⟦NEW 11/09 · הוראת רוי⟧ **להרוג את שרת התצוגה המקדימה — פעם אחת, בקוד משותף.**
 *
 * 🔴 **שני פגמים באותה שורה, ושניהם נמדדו — ⛔ לא שוערו:**
 *
 * ① **`pkill -f "next start"` ⛔ אינו הורג את השרת.** זה `TD-26` ב-`plan/30-architecture.md`,
 *    כתוב במאגר מזה חודש: Next משנה את שם התהליך ל-`next-server (vX.Y.Z)` מיד אחרי
 *    העלייה ⇒ התהליך **שורד** את ה-pkill וממשיך להחזיק את הפורט, ו-`check:mobile`
 *    נופל אחר כך על פורט תפוס. ⇒ הפקודה השגויה הזאת כתובה ב**חמישה** קבצי סוכן.
 *
 * ② **והיא הורגת את מי שקרא לה.** `-f` משווה מול **שורת הפקודה המלאה**, ולסוכן
 *    שמריץ `npx next start -p 3000 & … ; pkill -f "next start"` יש את המחרוזת
 *    `next start` בשורת הפקודה של ה-shell **של עצמו** ⇒ ה-shell מתאבד באמצע,
 *    והכלי מדווח «הפקודה נהרגה» על טיק שהיה תקין.
 *
 * ⇒ **התיקון הוא קוד, ⛔ ולא נוסח טוב יותר בחמישה קבצים.** כאן, פעם אחת:
 *   • התאמה על **שם התהליך האמיתי** — `next-server` וגם `next start`/`next dev`
 *   • ⛔ **ולעולם לא על עצמי ו⛔ לא על אב קדמון שלי** — שרשרת ה-PPID נאספת ומוחרגת,
 *     וזו הגדר שמונעת בדיוק את ②
 *   • `SIGTERM`, המתנה, ואז `SIGKILL` לשורדים
 *   • ⛔ אידמפוטנטי: ⛔ אין תהליך ⇒ exit 0 בשקט. «⛔ אין מה להרוג» ⛔ אינו כישלון.
 *
 *   npm run preview:stop
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';

const PATTERNS = [/next-server/, /next\s+start/, /next\s+dev/];

/** שורת הפקודה המלאה של תהליך, או `''` אם הוא כבר מת. */
export function cmdlineOf(pid, root = '/proc') {
  try {
    return readFileSync(`${root}/${pid}/cmdline`, 'utf8').replace(/\0/g, ' ').trim();
  } catch {
    return '';
  }
}

/** ⛔ הגדר המרכזית: כל שרשרת האבות שלי, ⛔ כדי שלעולם לא אהרוג את מי שקרא לי. */
export function ancestorsOf(pid, root = '/proc') {
  const chain = new Set();
  let cur = pid;
  for (let guard = 0; guard < 64 && cur > 1; guard += 1) {
    chain.add(cur);
    let ppid = 0;
    try {
      // ⛔ השדה הרביעי ב-`stat` הוא ה-PPID — ⛔ אבל שם התהליך (שדה 2) עלול להכיל
      // רווחים וסוגריים, ולכן חותכים **אחרי הסוגר האחרון**, ⛔ ולא מפצלים ברווח.
      const stat = readFileSync(`${root}/${cur}/stat`, 'utf8');
      const tail = stat.slice(stat.lastIndexOf(')') + 1).trim().split(/\s+/);
      ppid = Number(tail[1]);
    } catch {
      break;
    }
    if (!Number.isFinite(ppid) || ppid <= 0) break;
    cur = ppid;
  }
  chain.add(cur);
  return chain;
}

export function targetsIn(root = '/proc', self = process.pid) {
  if (!existsSync(root)) return [];
  const skip = ancestorsOf(self, root);
  const out = [];
  for (const entry of readdirSync(root)) {
    const pid = Number(entry);
    if (!Number.isInteger(pid) || pid <= 0 || skip.has(pid)) continue;
    const cmd = cmdlineOf(pid, root);
    if (cmd && PATTERNS.some((re) => re.test(cmd))) out.push({ pid, cmd });
  }
  return out;
}

async function main() {
  const targets = targetsIn();
  if (targets.length === 0) {
    console.log('preview:stop — ⛔ אין שרת תצוגה מקדימה חי. ⛔ לא כישלון.');
    return 0;
  }
  for (const t of targets) {
    console.log(`preview:stop — SIGTERM ${t.pid}  ${t.cmd.slice(0, 72)}`);
    try {
      process.kill(t.pid, 'SIGTERM');
    } catch {
      /* מת בינתיים — ⛔ לא כישלון */
    }
  }
  await new Promise((r) => setTimeout(r, 1200));
  for (const t of targets) {
    if (cmdlineOf(t.pid) === '') continue;
    console.log(`preview:stop — SIGKILL ${t.pid} (שרד SIGTERM)`);
    try {
      process.kill(t.pid, 'SIGKILL');
    } catch {
      /* מת בינתיים */
    }
  }
  return 0;
}

if (process.argv[1] && process.argv[1].endsWith('stop-preview.mjs')) process.exit(await main());
