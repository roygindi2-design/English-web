import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const run = (root: string, dry = false): string =>
  execFileSync('node', ['scripts/archive-registers.mjs', ...(dry ? ['--dry'] : [])], {
    encoding: 'utf8',
    env: { ...process.env, ARCHIVE_ROOT: root },
  });

/** ⛔ `console.warn` יוצא ל-stderr ⇒ `execFileSync` ⛔ אינו רואה אותו. ⟦F-243⟧ */
const runStderr = (root: string, dry = false): string =>
  spawnSync('node', ['scripts/archive-registers.mjs', ...(dry ? ['--dry'] : [])], {
    encoding: 'utf8',
    env: { ...process.env, ARCHIVE_ROOT: root },
  }).stderr;

const TASK_HEAD =
  '| id | אבן דרך | המשימה | מקור | סטטוס | סבבי ביקורת | קבצים | סקיל |\n|---|---|---|---|---|---|---|---|\n';
const FIND_HEAD =
  '| # | חומרה | קובץ | הממצא | תרחיש | תיקון | סטטוס | סבב |\n|---|---|---|---|---|---|---|---|\n';

/** ⛔ שורות אמיתיות בצורתן: פרוזה ארוכה, גליפים בתוך המשפטים, וציטוטי קבצים. */
const CLOSED_TASK =
  '| T-100 | M2 · story · מבנה | בניית מסך הסיפור, ⛔ ולא הכרטיסייה | D-073 | ✅ **C-0155 — נסגרה.** ⛔ אינו נוגע ב-⬜ ואינו ⛔ חוסם, וזה בדיוק העניין | 0 | `components/StoryScreen.tsx` · תוכנית: `docs/superpowers/plans/2026-08-14-world-compose.md` | `ui-styling` |';
const OPEN_TASK =
  '| T-101 | M2 · nav · נוחות | לשונית חמישית | § 13 | ⬜ | 0 | `components/Tabs.tsx` | — |';
const BLOCKED_TASK =
  '| T-102 | M2 · arena · מבנה | ממתינה למקור | R-010 | ⛔ חסומה — ✅ אין מקור מאושר | 0 | — | — |';
const CLOSED_FINDING =
  '| F-200 | 🟠 HIGH | `lib/core/x.ts:12` | הממצא | התרחיש | התיקון | ✅ **נסגר C-0201.** ⛔ אינו חוזר | 0 |';
const OPEN_FINDING =
  '| F-201 | 🔴 CRITICAL | `lib/core/y.ts:3` | הממצא | התרחיש | התיקון | 🔓 פתוח → PM | 0 |';
/**
 * ⛔ צינור גולמי ⇒ 9 תאים. ⛔ אסור לגעת בה (F-078).
 * ⚠️ **והצינור יושב אחרי תא הסטטוס בכוונה.** בגרסה קודמת של הפיקסטורה הוא ישב
 * לפניו, ולכן תא ה«סטטוס» שנקרא היה תא אחר — והשורה נדחתה **במקרה** ⛔ ולא בגלל
 * השומר. מוטציה שהסירה את השומר עברה ירוקה. עכשיו הסטטוס ✅ יושב במקומו,
 * והדרך היחידה לדחות את השורה היא **ספירת התאים**.
 */
const MALFORMED =
  '| T-103 | M0 · loop · תשתית | משימה סגורה | — | ✅ **C-0099 נסגרה** | 0 | ריצה: grep "a|b" | — |';

/**
 * 🔴 ⟦F-243 · 14/09⟧ **צינור בתוך code-span ⛔ אינו שורה פגומה — והפיקסטורה למעלה**
 * **קראה לו כך עד היום.**
 *
 * 🔬 **נמדד חי C-0593 (QA), ⛔ ולא שוער:** שורת `T-326` ב-`plan/50-tasks.md` נושאת
 * `` `/world/amirnet/practice|simulation` `` — צינור **בתוך גרש בודד**, ותקין לפי
 * `lib/core/planTable.ts`: ‏`codeSpans()` מזהה את התחום ו-`splitRow` ⛔ אינו מפצל
 * שם ⇒ `measure-plan-tables` מדווח **0 שורות פגומות** על 336 שורות המשימות.
 * ⛔ **אבל `archive-registers.mjs` מחזיק עותק ⛔ נפרד של `splitRow`, ⛔ בלי**
 * **`codeSpans()`** ⇒ אותה שורה נמדדה שם **9** תאים במקום 8, נדחתה בשורה 135,
 * ו-`npm run archive` הדפיס «8 שורות הוגדמו» ⛔ בלי `T-326` ביניהן — ⛔ בלי אזהרה,
 * ⛔ בלי ספירה, ⛔ בלי שום איתות. **תת-ספירה שקטה.**
 *
 * ⇒ הפיקסטורה `MALFORMED` איבדה כאן את הגרשיים: שורה פגומה היא צינור **גולמי**,
 * ⛔ ולא צינור מצוטט. השורה המצוטטת עברה לפיקסטורה משלה מתחת.
 */
const CLOSED_TASK_WITH_PIPE_IN_CODE =
  '| T-104 | M0 · loop · תשתית | משימה סגורה שנושאת צינור מצוטט | — | ✅ **C-0098 נסגרה** | 0 | `/world/amirnet/practice|simulation` | — |';

const fixture = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'arch-'));
  mkdirSync(join(root, 'plan', 'archive'), { recursive: true });
  writeFileSync(
    join(root, 'plan', '50-tasks.md'),
    TASK_HEAD +
      [CLOSED_TASK, OPEN_TASK, BLOCKED_TASK, MALFORMED, CLOSED_TASK_WITH_PIPE_IN_CODE].join('\n') +
      '\n',
    'utf8',
  );
  writeFileSync(
    join(root, 'plan', '60-findings.md'),
    FIND_HEAD + [CLOSED_FINDING, OPEN_FINDING].join('\n') + '\n',
    'utf8',
  );
  return root;
};

const tasks = (root: string): string => readFileSync(join(root, 'plan', '50-tasks.md'), 'utf8');
const findings = (root: string): string =>
  readFileSync(join(root, 'plan', '60-findings.md'), 'utf8');
const archived = (root: string, f: string): string =>
  readFileSync(join(root, 'plan', 'archive', f), 'utf8');

describe('scripts/archive-registers.mjs — ⛔ מגדים, ⛔ ואינו מוחק', () => {
  it('⛔ הרצה יבשה ⛔ אינה כותבת דבר', () => {
    const root = fixture();
    const before = tasks(root);
    run(root, true);
    expect(tasks(root)).toBe(before);
    expect(existsSync(join(root, 'plan', 'archive', 'tasks-archive.md'))).toBe(false);
  });

  /** ⛔ הטענה שנושאת את כל המשקל: הנוסח המלא שרד **מילה במילה**. */
  it('כל שורה שהוגדמה קיימת בארכיון **בדיוק כפי שהייתה**', () => {
    const root = fixture();
    run(root);
    expect(archived(root, 'tasks-archive.md')).toContain(CLOSED_TASK);
    expect(archived(root, 'findings-archive.md')).toContain(CLOSED_FINDING);
  });

  it('⛔ ⛔ אין נגיעה בשורה פתוחה או חסומה', () => {
    const root = fixture();
    run(root);
    expect(tasks(root)).toContain(OPEN_TASK);
    expect(tasks(root)).toContain(BLOCKED_TASK);
    expect(findings(root)).toContain(OPEN_FINDING);
    expect(archived(root, 'tasks-archive.md')).not.toContain('T-101');
  });

  /**
   * ⛔ **הבדיקה שמונעת את הכשל שהיה שובר את `loop:health` בדיקה 6.** שורה סגורה
   * נושאת ציטוט תוכנית; הסרתה הייתה הופכת תוכניות ליתומות בן־לילה.
   */
  it('הגדם שומר את המזהה, את תא אבן הדרך, את הסטטוס ואת **כל ציטוט**', () => {
    const root = fixture();
    run(root);
    const stub = tasks(root)
      .split('\n')
      .find((l) => l.startsWith('| T-100 '));
    expect(stub).toBeDefined();
    expect(stub).toContain('M2 · story · מבנה');
    expect(stub).toContain('✅ C-0155');
    expect(stub).toContain('components/StoryScreen.tsx');
    expect(stub).toContain('2026-08-14-world-compose.md');
    expect(stub).toContain('⟨מואַרך⟩');
    expect(stub!.length).toBeLessThan(CLOSED_TASK.length);
  });

  it('הגדם נשאר שורת טבלה תקינה — 8 עמודות', () => {
    const root = fixture();
    run(root);
    const stubs = tasks(root)
      .split('\n')
      .filter((l) => l.includes('⟨מואַרך⟩'));
    // ⛔ בדיקה שלא ראתה ולו גדם אחד ⛔ אינה בדיקה.
    expect(stubs.length).toBeGreaterThan(0);
    for (const line of stubs) expect(line.split('|').length, line.slice(0, 30)).toBe(10);
  });

  it('⛔ ⛔ אינו נוגע בשורה פגומה — F-078 ⛔ אינו מוחמר כאן', () => {
    const root = fixture();
    run(root);
    expect(tasks(root)).toContain(MALFORMED);
    expect(archived(root, 'tasks-archive.md')).not.toContain('T-103');
  });

  // 🔴 ⟦F-243⟧ שני הצדדים של אותו כלל, ⛔ ולא אחד: השורה המצוטטת **כן** מוגדמת…
  it('🔴 צינור בתוך code-span ⛔ אינו פוסל — שורה סגורה כזאת מוגדמת', () => {
    const root = fixture();
    const out = run(root);
    expect(
      archived(root, 'tasks-archive.md'),
      '⛔ `T-104` ⛔ לא הגיעה לארכיון ⇒ שני הפרסרים עדיין חלוקים על אינדקס התא',
    ).toContain('T-104');
    expect(tasks(root), 'והשורה החיה הוחלפה בגדם').not.toContain(
      CLOSED_TASK_WITH_PIPE_IN_CODE,
    );
    expect(out, 'והספירה שהודפסה סופרת אותה').toMatch(/\d+ שורות/);
  });

  // …⛔ ודילוג ⛔ אינו שקט. זו הגדר השנייה של `F-243`: «⛔ אין שום איתות שמשהו דולג».
  it('🔴 שורה סגורה שנפסלה על ספירת תאים ⇒ אזהרה, ⛔ ולא שקט', () => {
    const root = fixture();
    const err = runStderr(root, true);
    expect(err, '⛔ הדילוג על `T-103` ⛔ אינו מדווח').toContain('T-103');
    expect(err).toMatch(/⛔ archive: דילוג/);
    expect(err, 'והמספרים שנמדדו בפועל').toMatch(/9 תאים במקום 8/);
  });

  /**
   * ⛔ **הרגרסיה שקרתה בפועל בהרצה החיה הראשונה, 25/08.** חיתוך ב-`slice(0,90)`
   * הותיר גרש בודד מתוך code span ⇒ `loop:health` בדיקה 2 קראה **טענת נתיב
   * מזויפת** («ממצא מצביע על קובץ מת»), ו-26 שורות נעשו פגומות בבדיקה 5.
   * ⇒ הגדם ⛔ אינו נושא גרש, צינור או לוכסן הפוך. ⛔ לעולם.
   */
  it('⛔ ⛔ אין בגדם גרש · צינור · לוכסן — הקיצור ⛔ אינו יוצר טענה מזויפת', () => {
    const root = fixture();
    run(root);
    const stubs = [...tasks(root).split('\n'), ...findings(root).split('\n')].filter((l) =>
      l.includes('⟨מואַרך⟩'),
    );
    expect(stubs.length).toBeGreaterThan(0);
    // תא התיאור: במשימות index 3, בממצאים index 4 (naive split).
    for (const line of stubs) {
      const cells = line.split('|');
      const desc = (line.startsWith('| T-') ? cells[3] : cells[4]) ?? '';
      expect(desc, line.slice(0, 30)).not.toMatch(/[`\\]/);
    }
  });

  /**
   * ⛔ **הרגרסיה השנייה בהרצה החיה: הציטוטים דרסו את תא הסטטוס בממצאים** —
   * `citeIndex` נגזר כ-`cells - 2`, ובממצאים זה תא הסטטוס עצמו. ⇒ F-040 נקרא
   * כפתוח, ובדיקה 2 האדימה על נתיב מת בשורה שסגורה מזמן.
   */
  it('בממצא — הסטטוס שורד את הגדם, והציטוטים ⛔ אינם דורסים אותו', () => {
    const root = fixture();
    run(root);
    const stub = findings(root)
      .split('\n')
      .find((l) => l.startsWith('| F-200 '));
    expect(stub).toBeDefined();
    const cells = stub!.split('|');
    expect(cells[7], 'תא הסטטוס בממצא').toContain('✅ C-0201');
    expect(cells[7]).toContain('⟨מואַרך⟩');
    expect(cells[3], 'תא הקובץ בממצא').toContain('lib/core/x.ts');
    expect(cells[4], 'תא הממצא נשאר תיאור').not.toMatch(/[`\\]/);
  });

  it('⛔ מספר השורות ברגיסטר ⛔ אינו משתנה', () => {
    const root = fixture();
    const before = tasks(root).split('\n').filter((l) => /^\| T-\d+ /.test(l)).length;
    run(root);
    const after = tasks(root).split('\n').filter((l) => /^\| T-\d+ /.test(l)).length;
    expect(after).toBe(before);
  });

  it('אידמפוטנטי — הרצה שנייה ⛔ אינה מזיזה דבר', () => {
    const root = fixture();
    run(root);
    const once = tasks(root);
    const out = run(root);
    expect(tasks(root)).toBe(once);
    expect(out).toContain('⛔ אין שורות סגורות לארכוב');
  });

  it('⛔ עוצר בשם כשאין רגיסטר, ⛔ ואינו מדווח הצלחה', () => {
    const root = mkdtempSync(join(tmpdir(), 'arch-empty-'));
    mkdirSync(join(root, 'plan', 'archive'), { recursive: true });
    expect(() => run(root)).toThrow(/⛔ אין/);
  });
});
