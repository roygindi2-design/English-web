import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⛔ **שני שערים ב-`scripts/hooks/pre-push`, ולשניהם ⛔ לא הייתה בדיקה.**  ⟦NEW 08/09⟧
 *
 * ⓐ **בעלות ענף.** `RULES § 0.1 ב׳` — «⛔ אף סוכן ⛔ אינו דוחף ל-main מלבד PROMOTER» — הוא
 *    הכלל העמוס ביותר בחוקה, ו🔬 **נמדד 08/09 ש⛔ שום דבר ⛔ לא אכף אותו:**
 *    `git grep origin/main -- scripts/` החזיר **אפס**. הוא היה משפט בקובץ, בדיוק כפי
 *    ש-`npm run verify` היה משפט לפני הכרעה 100.
 *
 * ⓑ **המסלול המהיר.** 🔬 נמדד: **161 מתוך 516** קומיטי הלופ בשבועיים נגעו ⛔ אך ורק
 *    ב-`plan/00-control.md` — קומיט «התחלתי» — וכל אחד הריץ `verify` מלא (~4 דקות).
 *    ⇒ ~11 שעות חישוב לשבועיים. **הפטור ⛔ אינו «לדלג», אלא «להריץ את מה שהדיף יכול
 *    לשבור»** — ונמדד בשיבוט הזה: 25 שניות מול 3–5 דקות.
 *
 * 🔴 **הקובץ הזה קיים כדי ששני השערים ⛔ לא יהיו חלולים.** בדיקה על טקסט ⛔ אינה
 * מספיקה כאן, ולכן כל טענה למטה **מריצה את ההוק בפועל** על ריפו git אמיתי.
 */
const HOOK = readFileSync('scripts/hooks/pre-push', 'utf8');

/** ריפו git אמיתי עם ההוק מותקן — ⛔ אין דרך לזייף התנהגות של `git push`. */
const repo = (userName: string): string => {
  const root = mkdtempSync(join(tmpdir(), 'prepush-'));
  const g = (...args: string[]) =>
    execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  g('init', '-q', '-b', 'work/current');
  g('config', 'user.email', 't@t');
  g('config', 'user.name', userName);
  mkdirSync(join(root, '.git', 'hooks'), { recursive: true });
  writeFileSync(join(root, '.git', 'hooks', 'pre-push'), HOOK, { mode: 0o755 });
  writeFileSync(join(root, 'seed.txt'), 'x', 'utf8');
  g('add', '-A');
  g('commit', '-q', '-m', 'seed');
  return root;
};

/** מריץ את ההוק ישירות עם ה-stdin ש-git מעביר לו, ⛔ ולא דרך רשת. */
const runHook = (
  root: string,
  remoteRef: string,
  env: Record<string, string> = {},
): { code: number; out: string } => {
  const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  try {
    const out = execFileSync('bash', ['.git/hooks/pre-push', 'origin', 'git@example:x.git'], {
      cwd: root,
      encoding: 'utf8',
      input: `refs/heads/local ${sha} ${remoteRef} ${'0'.repeat(40)}\n`,
      env: { ...process.env, ...env },
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, out };
  } catch (e) {
    const err = e as { status?: number; stdout?: string; stderr?: string };
    return { code: err.status ?? -1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
};

describe('scripts/hooks/pre-push — שער בעלות הענף (RULES § 0.1 ב׳)', () => {
  it('⛔ חוסם דחיפה ל-main מזהות שאינה promoter-agent', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/main');
    expect(r.code, '⛔ הדחיפה חייבת להיכשל').not.toBe(0);
    expect(r.out).toMatch(/הדחיפה ל-main נחסמה/);
    expect(r.out, 'הכלל מצוטט, ⛔ לא רק נאכף').toMatch(/RULES § 0\.1 ב׳/);
  });

  /**
   * 🔴 **זו הטענה שקובעת את מיקום השער בקובץ.** `verify` שבור הוא סיבה לדלג על
   * `verify`; הוא ⛔ **לעולם** ⛔ אינו סיבה לדחוף ל-`main`. ⇒ השער חייב לרוץ **לפני**
   * מוצא החירום, ⛔ ואחריו הוא היה חסר משמעות.
   */
  it('⛔ ⛔ ו-SKIP_VERIFY=1 ⛔ אינו פותח את הדרך ל-main', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/main', { SKIP_VERIFY: '1' });
    expect(r.code, '⛔ SKIP_VERIFY ⛔ אינו עוקף בעלות ענף').not.toBe(0);
    expect(r.out).toMatch(/הדחיפה ל-main נחסמה/);
  });

  it('⛔ חוסם דחיפה ל-dev מסוכן שאינו QA', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/dev');
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/הדחיפה ל-dev נחסמה/);
  });

  it('✅ ⛔ אינו נוגע בדחיפה ל-work/current — ⛔ שער שחוסם עבודה רגילה הוא שער מזיק', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/work/current', { SKIP_VERIFY: '1' });
    expect(r.code, 'work/current הוא ענף העבודה של כולם').toBe(0);
    expect(r.out).not.toMatch(/נחסמה/);
  });

  it('✅ promoter-agent עובר ל-main, ו-QA עובר ל-dev', () => {
    expect(runHook(repo('promoter-agent'), 'refs/heads/main', { SKIP_VERIFY: '1' }).code).toBe(0);
    expect(runHook(repo('critic-agent'), 'refs/heads/dev', { SKIP_VERIFY: '1' }).code).toBe(0);
  });
});

describe('scripts/hooks/pre-push — המסלול המהיר', () => {
  /**
   * ⛔ **הקבוצה מוצהרת בקוד, ⛔ ולא נלמדת מהתנהגות.** הטענה קוראת אותה מהקובץ עצמו כדי
   * שהרחבה שקטה של הקבוצה — הדרך היחידה שהשער הזה יכול להיהפך לחור — תיתפס כאן.
   */
  it('קבוצת הנתיבים המהירה היא בדיוק plan/ · docs/plan-* · docs/agents/', () => {
    expect(HOOK).toMatch(/plan\/\*\|docs\/plan-\*\.md\|docs\/agents\/\*\)/);
    // ⛔ ⛔ אף נתיב קוד ⛔ אינו בקבוצה.
    for (const forbidden of ['lib/', 'app/', 'components/', 'scripts/', 'supabase/']) {
      expect(
        new RegExp(`\\|${forbidden.replace('/', '\\/')}\\*\\)`).test(HOOK),
        `⛔ ${forbidden} ⛔ אסור שיהיה במסלול המהיר`,
      ).toBe(false);
    }
  });

  it('המסלול המהיר מריץ את שלוש הבדיקות שקוראות plan/ — ⛔ ואינו מריץ build או check:mobile', () => {
    const fast = /REGISTER_ONLY" = "1"[\s\S]*?VERIFY_LABEL="verify"/.exec(HOOK)?.[0] ?? '';
    expect(fast, 'הבלוק המהיר נמצא').not.toBe('');
    for (const cmd of ['check:motion', 'check:text-floor', 'check:rules', 'vitest run scripts/']) {
      expect(fast, `המסלול המהיר מריץ ${cmd}`).toContain(cmd);
    }
    expect(fast, '⛔ build ⛔ אינו במסלול המהיר').not.toMatch(/npm run build/);
    expect(fast, '⛔ check:mobile ⛔ אינו במסלול המהיר').not.toMatch(/check:mobile/);
  });

  /**
   * 🔴 **«⛔ לא ידענו מה השתנה» חייב להיפתר לאיטי.** שער שנופל למסלול המהיר כשהוא
   * ⛔ אינו יודע מה בדיף הוא בדיוק החור שהוא נבנה נגדו.
   */
  it('⛔ דיף שלא ניתן לקרוא ⇒ מסלול מלא — ספק נפתר לאיטי, ⛔ לא למהיר', () => {
    expect(HOOK).toMatch(/if \[ -z "\$CHANGED" \]; then\s*\n\s*REGISTER_ONLY=0/);
  });

  /**
   * ⚠️ **החותמת חייבת לומר מה באמת רץ.** בדיקה 16 קוראת את ההערה הזאת; הערה שאומרת
   * `verify` על ריצה מהירה הופכת את הראיה לטענה — הדבר היחיד שהיא קיימת נגדו.
   */
  it('החותמת מבדילה verify מ-verify(fast)', () => {
    expect(HOOK).toContain('VERIFY_LABEL="verify(fast)"');
    expect(HOOK).toContain('VERIFY_LABEL="verify"');
    expect(HOOK, 'ההערה נכתבת מהתווית, ⛔ לא ממחרוזת קבועה').toMatch(
      /git notes --ref=verify add -f -m "\$VERIFY_LABEL: exit 0/,
    );
  });
});
