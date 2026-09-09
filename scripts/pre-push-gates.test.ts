import { execFileSync } from 'node:child_process';
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
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

/**
 * 🔒 **שער שלישי — הנעילה.**  ⟦NEW 09/09 · הוראת רוי⟧
 *
 * 🔬 **נמדד 09/09:** `LOCK_HELD_BY` ב-`plan/00-control.md` הוא המנעול היחיד של הלופ,
 * ו-`git grep LOCK_HELD_BY -- scripts/` החזיר **אפס** — ⛔ אף בדיקה ו⛔ אף הוק ⛔ לא
 * קראו אותו. ⇒ «כבד את הנעילה» היה עצה, ו-`F-191` הוא מה שעצה עולה: CONTENT דרס את
 * `plan/60-findings.md` כולו בזמן שסוכן אחר החזיק אותה.
 *
 * ⇒ שלוש הטענות למטה הן **כל** ההתנהגות: נעילה זרה חוסמת קוד · מרשה עקבה · ו-נעילה
 * שלי ⛔ אינה חוסמת דבר.
 */
describe('scripts/hooks/pre-push — שער הנעילה (RULES § 0.4)', () => {
  /** ריפו עם `plan/00-control.md` שנושא נעילה, ועם קומיט שני שמכתיב את הדיף. */
  const lockedRepo = (userName: string, holder: string, touched: string): string => {
    const root = repo(userName);
    const g = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    mkdirSync(join(root, 'plan'), { recursive: true });
    writeFileSync(join(root, 'plan', '00-control.md'), `LOCK_HELD_BY: ${holder}\n`, 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'lock');
    mkdirSync(join(root, dirnameOf(touched)) , { recursive: true });
    writeFileSync(join(root, touched), 'change\n', 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'work');
    return root;
  };
  const dirnameOf = (p: string): string => (p.includes('/') ? p.slice(0, p.lastIndexOf('/')) : '.');

  it('⛔ חוסם דחיפה שנוגעת בקוד כשהנעילה בידי סוכן אחר', () => {
    const r = runHook(lockedRepo('dev-agent', 'PM', 'lib/core/thing.ts'), 'refs/heads/work/current');
    expect(r.code, '⛔ הדחיפה חייבת להיכשל').not.toBe(0);
    expect(r.out).toMatch(/הנעילה מוחזקת בידי 'PM'/);
    expect(r.out, 'הכלל מצוטט').toMatch(/RULES § 0\.4/);
  });

  /**
   * ⚠️ **הפטור ⛔ אינו חור — הוא מה שמאפשר את `§ 0.29 ו׳` בכלל.** סוכן שנסוג **חייב**
   * לדחוף שורת יומן אחת בזמן שהנעילה מוחזקת נגדו; שער בלי הפטור היה מכריח אותו
   * לבחור בין שני כללים.
   */
  it('✅ מרשה עקבה — שורת יומן ברגיסטר — תחת אותה נעילה זרה', () => {
    const r = runHook(
      lockedRepo('dev-agent', 'PM', 'plan/archive/control-log.md'),
      'refs/heads/work/current',
    );
    expect(r.out, '⛔ ⛔ לא נחסם על הנעילה').not.toMatch(/הנעילה מוחזקת בידי/);
  });


  /**
   * 🔒 **גיל הנעילה — והטענות האלה נכתבו אחרי שהכשל קרה חי, ⛔ לא לפניו.**  ⟦NEW 09/09⟧
   *
   * 🔬 טיק QA אמיתי נורה 18:51:40Z, רץ 21.4 דק', ⛔ לא דחף דבר לשום מקום, ויצא `IDLE`
   * **מחזיק את הנעילה** ⇒ DEV · PM · CONTENT ⛔ לא יכלו לדחוף קוד, ו-QA ⛔ לא יכלה
   * למזג ל-`dev` בגלל הנעילה של עצמה.
   * 🔴 ו-`RULES § 0.4` **כן** נתנה חלון כיבוד (DEV 90 דק' · השאר 30) — השער הזה פשוט
   * ⛔ לא קרא את `LOCK_AT`, ולכן אכף נעילה **לנצח** וביטל את החלון שהחוקה נתנה.
   *
   * ⚠️ **וארבע הטענות ⛔ אינן ארבע גרסאות של אחת:** הראשונה היא שהפטור ⛔ **לא החליש**
   * את השער המקורי; השנייה היא הפטור עצמו; השלישית היא הגדר שמונעת את `F-121`
   * (סוכן איטי ⛔ אינו סוכן מת); הרביעית היא החור שהיה בגרסה הראשונה שכתבתי —
   * **קומיט הנעילה עצמו נושא את חותמת `LOCK_AT`**, ובלי סינונו שום נעילה ⛔ לא הזדקנה.
   */
  const agedRepo = (
    userName: string,
    holder: string,
    lockAt: string,
    touched: string,
    holderWork?: { subject: string; path: string },
  ): string => {
    const root = repo(userName);
    const g = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    mkdirSync(join(root, 'plan'), { recursive: true });
    writeFileSync(
      join(root, 'plan', '00-control.md'),
      `LOCK_HELD_BY: ${holder}\nLOCK_AT: "${lockAt}"\n`,
      'utf8',
    );
    g('add', '-A');
    // ⛔ קומיט הנעילה נושא את תחילית בעל הנעילה ⛔ ונוגע ⛔ אך ורק ב-`00-control.md`.
    g('commit', '-q', '-m', `loop(${holder}): C-1 lock`);
    if (holderWork) {
      mkdirSync(join(root, dirnameOf(holderWork.path)), { recursive: true });
      // ⛔ קומיט בקרה של בעל הנעילה **מוסיף** שורה ⛔ ואינו דורס את הקובץ — דריסה
      // הייתה מוחקת את `LOCK_HELD_BY` עצמו, והמבחן היה בודק ריפו ללא נעילה כלל.
      const abs = join(root, holderWork.path);
      const prev = holderWork.path === 'plan/00-control.md' ? readFileSync(abs, 'utf8') : '';
      writeFileSync(abs, `${prev}# ${holderWork.subject}\n`, 'utf8');
      g('add', '-A');
      g('commit', '-q', '-m', holderWork.subject);
    }
    mkdirSync(join(root, dirnameOf(touched)), { recursive: true });
    writeFileSync(join(root, touched), 'change\n', 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'work');
    return root;
  };
  const FRESH = new Date(Date.now() - 5 * 60_000).toISOString().replace(/\.\d+Z$/, 'Z');
  const STALE = '2020-01-01T00:00:00Z';

  it('⛔ נעילה זרה **טרייה** ⇒ הדחיפה עדיין נחסמת — הפטור ⛔ לא החליש את השער', () => {
    const r = runHook(
      agedRepo('dev-agent', 'PM', FRESH, 'lib/core/thing.ts'),
      'refs/heads/work/current',
    );
    expect(r.code, '⛔ חייבת להיחסם').not.toBe(0);
    expect(r.out).toMatch(/הנעילה מוחזקת בידי 'PM'/);
  });

  it('✅ נעילה זרה שחלון § 0.4 שלה פג ו⛔ אין קומיט עבודה של בעליה ⇒ ⛔ אינה חוסמת', () => {
    const r = runHook(
      agedRepo('dev-agent', 'PM', STALE, 'lib/core/thing.ts'),
      'refs/heads/work/current',
    );
    expect(r.out, 'השער מכריז יתומה').toMatch(/נעילה יתומה: 'PM'/);
    expect(r.out, '⛔ ⛔ לא נחסם על הנעילה').not.toMatch(/הדחיפה נחסמה: הנעילה מוחזקת/);
  });

  it('⛔ ישנה ⛔ אך בעליה דחף **עבודה** מאז ⇒ סוכן איטי, ⛔ לא מת ⇒ עדיין חוסמת (F-121)', () => {
    const r = runHook(
      agedRepo('dev-agent', 'PM', STALE, 'lib/core/thing.ts', {
        subject: 'loop(PM): C-1 T-9 real work',
        path: 'plan/50-tasks.md',
      }),
      'refs/heads/work/current',
    );
    expect(r.code, '⛔ חייבת להיחסם').not.toBe(0);
    expect(r.out).toMatch(/הנעילה מוחזקת בידי 'PM'/);
  });

  it('🔴 קומיט הנעילה עצמו ⛔ **אינו** סימן חיים — אחרת שום נעילה יתומה ⛔ לא הזדקנה', () => {
    // ⛔ בעל הנעילה דחף קומיט `loop(PM)` — אבל הוא נוגע ⛔ אך ורק ב-`00-control.md`.
    const r = runHook(
      agedRepo('dev-agent', 'PM', STALE, 'lib/core/thing.ts', {
        subject: 'loop(PM): C-1 lock again',
        path: 'plan/00-control.md',
      }),
      'refs/heads/work/current',
    );
    expect(r.out, 'עדיין יתומה').toMatch(/נעילה יתומה: 'PM'/);
  });

  it('✅ ⛔ אינו חוסם את מחזיק הנעילה עצמו', () => {
    const r = runHook(
      lockedRepo('dev-agent', 'DEV', 'lib/core/thing.ts'),
      'refs/heads/work/current',
    );
    expect(r.out, '⛔ הנעילה שלי ⛔ אינה חוסמת אותי').not.toMatch(/הנעילה מוחזקת בידי/);
  });

  /** ⛔ `CRITIC` ו-`QA` הם אותו סוכן בשתי איותים שהרגיסטר עדיין נושא. */
  it('✅ נעילת `CRITIC` ⛔ אינה חוסמת את `critic-agent`', () => {
    const r = runHook(
      lockedRepo('critic-agent', 'CRITIC', 'lib/core/thing.ts'),
      'refs/heads/work/current',
    );
    expect(r.out).not.toMatch(/הנעילה מוחזקת בידי/);
  });

  it('⛔ ⛔ ו-SKIP_VERIFY=1 ⛔ אינו פותח את הנעילה', () => {
    const r = runHook(
      lockedRepo('dev-agent', 'PM', 'lib/core/thing.ts'),
      'refs/heads/work/current',
      { SKIP_VERIFY: '1' },
    );
    expect(r.code, '⛔ מוצא החירום מדלג על verify, ⛔ לא על הנעילה').not.toBe(0);
    expect(r.out).toMatch(/הנעילה מוחזקת בידי 'PM'/);
  });

  it('✅ נעילה ריקה ⛔ אינה חוסמת דבר', () => {
    const r = runHook(lockedRepo('dev-agent', '""', 'lib/core/thing.ts'), 'refs/heads/work/current');
    expect(r.out).not.toMatch(/הנעילה מוחזקת בידי/);
  });
});

/**
 * 🧱 **שער רביעי — שלמות הרגיסטרים תחת `SKIP_VERIFY`.**  ⟦NEW 09/09 · `T-275` · `D-197` · `F-191`⟧
 *
 * 🔬 **⛔ לא היפותטי — זה `F-191`, 🔴 CRITICAL שכבר קרה.** ב-07/09 טיק CONTENT הוריד את
 * `plan/60-findings.md` מ-**237 שורות ל-26** (`git show 05563b5 --stat` ⇒
 * `18 insertions(+), 229 deletions(-)`), וכל הרישום ההיסטורי נמחק. ⇒ `SKIP_VERIFY=1`
 * מפסיק להיות עקיפה **מוחלטת**: מוצא החירום נשאר פתוח כדי ש-`verify` שבור ⛔ לא ינעל
 * את הריפו (הכרעה 100), ⛔ אבל «`verify` שבור» ⛔ אינו סיבה להשמיד רגיסטר בדרך החוצה.
 */
describe('scripts/hooks/pre-push — שלמות הרגיסטרים ⛔ אינה מדלגת (T-275)', () => {
  /** ריפו עם עותק אמיתי של הסקריפטים והרגיסטרים, כדי שהשער יוכל לרוץ בכלל. */
  const integrityRepo = (mutate?: (root: string) => void): string => {
    const root = repo('dev-agent');
    for (const d of ['scripts', 'plan', 'docs']) mkdirSync(join(root, d), { recursive: true });
    copyFileSync('scripts/check-rules-citations.mjs', join(root, 'scripts', 'check-rules-citations.mjs'));
    copyFileSync('plan/RULES.md', join(root, 'plan', 'RULES.md'));
    mutate?.(root);
    execFileSync('git', ['add', '-A'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    execFileSync('git', ['commit', '-q', '-m', 'integrity'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
    return root;
  };

  it('✅ מריץ את שער הציטוטים גם כש-SKIP_VERIFY=1', () => {
    const r = runHook(integrityRepo(), 'refs/heads/work/current', { SKIP_VERIFY: '1' });
    expect(r.out, 'הוא אומר במפורש שהוא ⛔ אינו מדלג').toMatch(/שלמות הרגיסטרים ⛔ אינה מדלגת/);
    expect(r.out, 'והשער עצמו רץ').toMatch(/RULES citations/);
  });

  it('⛔ חוסם את הדחיפה כשציטוט RULES שבור — גם עם SKIP_VERIFY=1', () => {
    // ⛔ הציטוט המזויף נבנה מחלקים, בדיוק כמו ב-`rules-citations.test.ts`: כתוב שלם,
    // `npm run check:rules` היה נופל **על קובץ הבדיקה הזה עצמו**.
    const fake = `RULES § 0.${'9'}9`;
    const root = integrityRepo((r) => {
      writeFileSync(join(r, 'plan', 'broken.md'), `ראה \`${fake}\`\n`, 'utf8');
    });
    const res = runHook(root, 'refs/heads/work/current', { SKIP_VERIFY: '1' });
    expect(res.code, '⛔ מוצא החירום ⛔ אינו פותח ציטוט שבור').not.toBe(0);
    expect(res.out).toMatch(/ציטוט RULES שבור/);
  });

  it('⚠️ ⛔ בלי node_modules — «⛔ לא נמדד», ⛔ ואינו נועל את מוצא החירום', () => {
    // 🔴 בריחת מוצא החירום היא הכשל היחיד שהוא קיים כדי למנוע ⇒ ⛔ אסור לו לחסום כאן.
    const r = runHook(integrityRepo(), 'refs/heads/work/current', { SKIP_VERIFY: '1' });
    expect(r.out, '⛔ «⛔ לא נמדד» ⛔ אינו «עבר», והוא נאמר בקול').toMatch(/⛔ לא נמדד/);
    expect(r.code, 'ו⛔ אינו חוסם').toBe(0);
  });
});

/**
 * 🧑‍⚖️ **`ops-agent` — מסלול חוקי לסשן תפעול, ⛔ ולא ריכוך של השער.**  ⟦NEW 09/09⟧
 * ⛔ נמדד: `main` פיגר **106 קומיטים**, ⇒ שיבוט PROMOTER קרא חוקה בת 75KB במקום 98KB,
 * ⛔ בלי `docs/agents/QA.md` ו⛔ בלי `.claude/settings.json` — הקובץ שנועד לשחרר את
 * הדחיפה שלו עצמו (`F-203`). ⇒ הקובץ מגיע ל-`main` ⛔ רק בדחיפה ל-`main`.
 * 🔴 **הטענות כאן הן על מה שנשאר אסור** — ⛔ ארבעת סוכני הלופ.
 */
describe('scripts/hooks/pre-push — מי רשאי לדחוף ל-main אחרי 09/09', () => {
  for (const who of ['dev-agent', 'pm-agent', 'content-agent', 'critic-agent']) {
    it(`⛔ ${who} ⛔ עדיין נדחה מ-main`, () => {
      const r = runHook(repo(who), 'refs/heads/main');
      expect(r.code, `⛔ ${who} חייב להידחות`).not.toBe(0);
      expect(r.out).toMatch(/הדחיפה ל-main נחסמה/);
    });
  }

  for (const who of ['promoter-agent', 'ops-agent']) {
    it(`✅ ${who} ⛔ אינו נחסם על בעלות הענף`, () => {
      const r = runHook(repo(who), 'refs/heads/main', { SKIP_VERIFY: '1' });
      expect(r.out, `${who}: ⛔ לא נחסם על main`).not.toMatch(/הדחיפה ל-main נחסמה/);
    });
  }

  it('⛔ ו-SKIP_VERIFY ⛔ עדיין אינו פותח את main לסוכן לופ', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/main', { SKIP_VERIFY: '1' });
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/הדחיפה ל-main נחסמה/);
  });
});
