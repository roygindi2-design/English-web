import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ancestorsOf, targetsIn, cmdlineOf } from './stop-preview.mjs';

/**
 * ⟦NEW 11/09⟧ 🔴 **הטענה היחידה שבאמת חשובה כאן היא ש-`preview:stop` ⛔ אינו הורג
 * את מי שקרא לו** — זה הפגם ② שהוא נבנה לתקן, והוא ⛔ אינו נראה בהרצה מוצלחת.
 *
 * ⇒ `/proc` מזויף: שרשרת אבות שכל אחד ממנה נושא `next start` בשורת הפקודה, בדיוק
 * כמו ה-shell של סוכן שמריץ `npx next start … ; pkill -f "next start"`.
 */
let root: string;

function proc(dir: string, pid: number, ppid: number, cmd: string) {
  mkdirSync(join(dir, String(pid)), { recursive: true });
  writeFileSync(join(dir, String(pid), 'cmdline'), cmd.split(' ').join('\0') + '\0');
  // ⛔ שם התהליך נכתב עם רווח וסוגריים בכוונה: הוא מה ששובר פיצול-ברווח נאיבי.
  writeFileSync(join(dir, String(pid), 'stat'), `${pid} (next-server (v16)) S ${ppid} 0 0`);
}

beforeAll(() => {
  root = mkdtempSync(join(tmpdir(), 'procfake-'));
  proc(root, 100, 1, 'bash -c npx next start -p 3000 ; npm run preview:stop'); // ⇐ אב
  proc(root, 101, 100, 'node scripts/stop-preview.mjs'); // ⇐ אני
  proc(root, 200, 1, 'next-server (v16.3.0)'); // ⇐ היעד האמיתי
  proc(root, 201, 1, 'next start -p 3000'); // ⇐ יעד נוסף
  proc(root, 300, 1, 'node scripts/unrelated.mjs'); // ⇐ ⛔ לא יעד
});
afterAll(() => rmSync(root, { recursive: true, force: true }));

describe('11/09 — preview:stop ⛔ אינו הורג את מי שקרא לו', () => {
  it('שרשרת האבות נאספת דרך שדה ה-PPID, גם כששם התהליך נושא רווחים וסוגריים', () => {
    const chain = ancestorsOf(101, root);
    expect(chain.has(101), 'עצמי').toBe(true);
    expect(chain.has(100), 'האב — ה-shell שהריץ אותי').toBe(true);
  });

  // 🔴 ⛔ הטענה המרכזית: ה-shell האב נושא את המחרוזת `next start` בשורת הפקודה שלו,
  // וזה **בדיוק** מה ש-`pkill -f "next start"` היה הורג.
  it('⛔ האב ⛔ אינו יעד, אף שהוא מתאים לתבנית מילה במילה', () => {
    expect(cmdlineOf(100, root)).toContain('next start');
    const pids = targetsIn(root, 101).map((t) => t.pid);
    expect(pids, '⛔ ה-shell שקרא לי ⛔ לא נהרג').not.toContain(100);
    expect(pids, '⛔ ואני ⛔ לא הורג את עצמי').not.toContain(101);
  });

  // ⛔ TD-26: זה התהליך ש-`pkill -f "next start"` ⛔ אינו יכול להתאים לעולם.
  it('⛔ תופס את `next-server`, ⛔ שהוא השם האמיתי אחרי העלייה', () => {
    const pids = targetsIn(root, 101).map((t) => t.pid);
    expect(pids, 'TD-26 — השם שאליו Next משנה את עצמו').toContain(200);
    expect(pids, 'וגם הצורה הכתובה').toContain(201);
  });

  it('⛔ אינו נוגע בתהליך שאינו Next', () => {
    expect(targetsIn(root, 101).map((t) => t.pid)).not.toContain(300);
  });
});
