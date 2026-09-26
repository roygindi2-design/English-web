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
    const fast = /REGISTER_ONLY" = "1"[\s\S]*?VERIFY_LABEL="verify\(docs\)"/.exec(HOOK)?.[0] ?? '';
    expect(fast, 'הבלוק המהיר נמצא').not.toBe('');
    for (const cmd of ['check:motion', 'check:text-floor', 'check:rules', 'vitest run scripts/']) {
      expect(fast, `המסלול המהיר מריץ ${cmd}`).toContain(cmd);
    }
    expect(fast, '⛔ build ⛔ אינו במסלול המהיר').not.toMatch(/npm run build/);
    expect(fast, '⛔ check:mobile ⛔ אינו במסלול המהיר').not.toMatch(/check:mobile/);
  });

  // 📄 ⟦23/09 · אישור רוי⟧ נתיב המסמכים: ⛔ build ו⛔ check:mobile — אבל vitest **מלא**,
  // כי בדיקות ב-app/ · lib/ · components/ קוראות docs/*.md.
  it('נתיב המסמכים מריץ vitest מלא — ⛔ ואינו מריץ build או check:mobile', () => {
    // ⛔ רק שורות שרצות — ⛔ לא הערות ו⛔ לא `echo`, שמותר להן לנקוב בשם של מה ש⛔ אינו רץ.
    const docs = (/DOCS_ONLY" = "1"[\s\S]*?VERIFY_LABEL="verify\(3w\)"/.exec(HOOK)?.[0] ?? '')
      .split('\n')
      .filter((l) => !/^\s*(#|echo )/.test(l))
      .join('\n');
    expect(docs, 'הבלוק נמצא').not.toBe('');
    expect(docs).toMatch(/npx vitest run;/);
    expect(docs).toContain('check:rules');
    expect(docs).not.toMatch(/npm run build/);
    expect(docs).not.toMatch(/check:mobile|npm run verify/);
    // ⛔ ו-DOCS_ONLY ⛔ אינו מרחיב את פטור הנעילה: docs/*.md מאפס את REGISTER_ONLY.
    expect(HOOK).toMatch(/docs\/\*\.md\) REGISTER_ONLY=0 ;;/);
  });

  // ⏱️ ⟦24/09⟧ נמדד על `C-0788`: QA רשמה את ריצת ההוק (3 רוחבים) כ«verify מלא». ⇒ דחיפה
  // ל-dev/main מריצה את המלא **בהוק**, ⛔ ולא תלויה בכך שהסוכן יזכור.
  it('דחיפה ל-dev או main מדליקה את שער שש הרשומות — ⛔ לפני כל נתיב מהיר', () => {
    expect(HOOK).toMatch(/case "\$ref" in refs\/heads\/dev\|refs\/heads\/main\) PUSHING_GATE=1 ;; esac/);
    const gate = HOOK.indexOf('if [ "$PUSHING_GATE" = "1" ]; then');
    const fast = HOOK.indexOf('elif [ "$REGISTER_ONLY" = "1" ]; then');
    expect(gate, 'ענף השער קיים').toBeGreaterThan(-1);
    expect(fast, 'הנתיב המהיר הוא elif אחריו').toBeGreaterThan(gate);
  });

  it('המסלול המלא מריץ check:mobile בשלושה רוחבים — ⛔ ו-verify-mobile יודע מה זה', () => {
    expect(HOOK).toContain('MOBILE_WIDTHS=pre-push npm run verify');
    const vm = readFileSync('scripts/verify-mobile.mjs', 'utf8');
    expect(vm).toMatch(/process\.env\.MOBILE_WIDTHS === 'pre-push'/);
    expect(vm).toContain("const PRE_PUSH_WIDTHS = ['320×780', '390×844', '430×932'];");
    // ⛔ כל שלוש הרשומות קיימות ב-ALL_WIDTHS — אחרת הפילטר היה מחזיר פחות משלוש בשקט.
    for (const [w, h] of [[320, 780], [390, 844], [430, 932]]) {
      expect(vm).toMatch(new RegExp(`\\{ width: ${w}, height: ${h},`));
    }
  });

  it('verify:attested דוחה verify(3w) ו-verify(docs) ⇒ QA מריצה את המלא', () => {
    const va = readFileSync('scripts/verify-attested.mjs', 'utf8');
    expect(va).toMatch(/\^verify\\\(\(3w\|docs\)\\\)/);
  });

  /**
   * 🔴 **«⛔ לא ידענו מה השתנה» חייב להיפתר לאיטי.** שער שנופל למסלול המהיר כשהוא
   * ⛔ אינו יודע מה בדיף הוא בדיוק החור שהוא נבנה נגדו.
   */
  it('⛔ דיף שלא ניתן לקרוא ⇒ מסלול מלא — ספק נפתר לאיטי, ⛔ לא למהיר', () => {
    expect(HOOK).toMatch(/if \[ -z "\$CHANGED" \]; then\s*\n\s*REGISTER_ONLY=0/);
    expect(HOOK).toMatch(/REGISTER_ONLY=0[^\n]*\n\s*DOCS_ONLY=0/);
  });

  /**
   * ⚠️ **החותמת חייבת לומר מה באמת רץ.** בדיקה 16 קוראת את ההערה הזאת; הערה שאומרת
   * `verify` על ריצה מהירה הופכת את הראיה לטענה — הדבר היחיד שהיא קיימת נגדו.
   */
  it('החותמת מבדילה verify(3w) · verify(docs) · verify(fast)', () => {
    expect(HOOK).toContain('VERIFY_LABEL="verify(fast)"');
    expect(HOOK).toContain('VERIFY_LABEL="verify(docs)"');
    expect(HOOK).toContain('VERIFY_LABEL="verify(3w)"');
    // ⏱️ ⟦23/09 · `T-429`⟧ `verify` נקי ⛔ רק בענף של דחיפה ל-dev/main — שם רצות שש רשומות.
    const clean = HOOK.split('VERIFY_LABEL="verify"').length - 1;
    expect(clean, 'חותמת `verify` נקייה אחת בלבד').toBe(1);
    const gateBranch = /PUSHING_GATE" = "1" \]; then\s*\n\s*VERIFY_LABEL="verify"\s*\n[\s\S]*?if ! npm run verify; then/.exec(HOOK)?.[0] ?? '';
    expect(gateBranch, 'הענף של dev/main').not.toBe('');
    expect(gateBranch, '⛔ בלי MOBILE_WIDTHS — כל שש הרשומות').not.toContain('MOBILE_WIDTHS');
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
/**
 * ⟦NEW 11/09 · `F-216` · `F-214`⟧ **נעילה שלא נלקחה, ושם שנקטע במקף.**
 *
 * 🔬 שתי תקלות שנמדדו **חי** באותו יום, ושתיהן על אותה שורה שקוראת את השדה:
 *   `F-216` — ‏`C-0525` (CONTENT) דחף טיק תוכן שלם עם `LOCK_HELD_BY: ""`, ואז כתב
 *             הערת **שחרור**. ‏`loop:health` החזיר 23/23 — ⛔ אף בדיקה ⛔ אינה מאמתת
 *             שסוכן שדחף עבודה החזיק את הנעילה.
 *   `F-214` — ‏`"dev-agent"` נקטע ל-`dev`, ש⛔ אינו תואם ⛔ אף `MINE` ⇒ הסוכן נחסם
 *             מהנעילה של עצמו, ו-`HOLDER_RE` ⛔ לא התאים ⛔ לאף קומיט.
 */
describe('11/09 — נעילה חסרה ⛔ ושם בעל נעילה עם מקף', () => {
  const REF = 'refs/heads/work/current';
  const lockRepo = (userName: string, holder: string, touched: string): string => {
    const root = repo(userName);
    const g = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    mkdirSync(join(root, 'plan'), { recursive: true });
    writeFileSync(join(root, 'plan', '00-control.md'), `LOCK_HELD_BY: ${holder}\n`, 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'lock');
    mkdirSync(join(root, touched.includes('/') ? touched.slice(0, touched.lastIndexOf('/')) : '.'), {
      recursive: true,
    });
    writeFileSync(join(root, touched), 'change\n', 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'work');
    return root;
  };

  // 🔴 `F-216` — הכיוון שנמדד: קוד + נעילה ריקה + זהות סוכן ⇒ ⛔ נדחה.
  it('⛔ דוחה דחיפת קוד כשהנעילה ריקה', () => {
    const out = runHook(lockRepo('content-agent', '""', 'lib/core/x.ts'), REF);
    expect(out.code, '⛔ הדחיפה עברה בלי נעילה').not.toBe(0);
    expect(out.out).toMatch(/LOCK_HELD_BY ריק/);
  });

  /**
   * ⚠️ **שלוש הטענות הבאות בודקות ש**השער הזה** ⛔ לא ירה — ⛔ ולא שהדחיפה עברה.**
   * ‏הריפו הזמני ⛔ אין בו `node_modules`, ולכן שער ה-`verify` עוצר אותה ממילא;
   * טענה על `code === 0` הייתה מודדת את השער ההוא ⛔ ולא את זה שנוספה כאן.
   */
  const missingLockFired = (out: string) => /LOCK_HELD_BY ריק/.test(out);

  // ⛔ הגדר שבלעדיה השער חוסם את עצמו: קומיט הנעילה **הוא** רגיסטר-בלבד.
  it('⛔ ומרשה את קומיט הנעילה עצמו — אחרת שום טיק ⛔ לא היה מתחיל', () => {
    const out = runHook(lockRepo('content-agent', '""', 'plan/00-control.md'), REF);
    expect(missingLockFired(out.out), 'קומיט נעילה נחסם ⇒ הלופ מת').toBe(false);
  });

  // ⛔ בן-אדם · כלי · CI — ⛔ אינם סוכני לופ ו⛔ אינם בתחולת השער.
  // ⚠️ ⟦תוקן 12/09⟧ הדוגמה כאן הייתה `ops-agent`, וזה חדל להיות נכון באותו יום:
  // מרגע שהתפעול מחזיק נעילה כמו סוכן, הוא גם **בתחולת** השער הזה — וזה עקבי,
  // ⛔ לא החמרה. ⇒ הדוגמה הוחלפה בזהות שבאמת ⛔ אינה של הלופ.
  it('⛔ אינו חל על זהות שאינה סוכן לופ', () => {
    const out = runHook(lockRepo('roy', '""', 'lib/core/x.ts'), REF);
    expect(missingLockFired(out.out)).toBe(false);
  });

  it('✅ ⛔ וכן חל על התפעול — הוא נוטל נעילה כמו כולם', () => {
    const out = runHook(lockRepo('ops-agent', '""', 'lib/core/x.ts'), REF);
    expect(missingLockFired(out.out)).toBe(true);
  });

  /**
   * 🔴 ⟦NEW 12/09 · `F-219`⟧ **התקלה שהשער הזה עצמו גרם, בהרצה החיה הראשונה שלו.**
   *
   * 🔬 נמדד 12/09 01:17Z: QA-שער עומד על `dev` כדי למזג ⇒ `git diff origin/dev...HEAD`
   * מחזיר את **כל קבצי הקוד** שהמיזוג מביא ⇒ `REGISTER_ONLY=0`; הנעילה ריקה כדין;
   * הזהות `critic-agent` ⇒ **השער חסם את המיזוג.** הסוכן נטל נעילה בעודו על `dev`,
   * הקומיט נחת שם, `dev` הסתעף ו-`merge --ff-only` סירב.
   * ⇒ הנעילה מסדרת **כותבים ל-`work/current`**, ⛔ ולא קידום היסטוריה שכבר עברה שער.
   */
  it('⛔ אינו חוסם דחיפת מיזוג ל-dev, גם כשהדיף נושא קוד והנעילה ריקה', () => {
    const out = runHook(lockRepo('critic-agent', '""', 'lib/core/x.ts'), 'refs/heads/dev');
    expect(missingLockFired(out.out), '🔴 השער חסם את המיזוג ⇒ הלופ נעצר').toBe(false);
  });

  it('⛔ ו⛔ לא ל-main', () => {
    const out = runHook(lockRepo('promoter-agent', '""', 'lib/core/x.ts'), 'refs/heads/main');
    expect(missingLockFired(out.out)).toBe(false);
  });

  // ⛔ ועדיין חוסם את מה שהוא נבנה בשבילו: כתיבה ל-`work/current` בלי נעילה.
  it('✅ ועדיין חוסם דחיפת קוד ל-work/current בלי נעילה', () => {
    const out = runHook(lockRepo('content-agent', '""', 'lib/core/x.ts'), REF);
    expect(missingLockFired(out.out)).toBe(true);
  });

  // 🔴 `F-214` — הנעילה שלי בצורת הזהות, ⛔ ולא בשם התפקיד.
  it('⛔ הנעילה של הסוכן עצמו ⛔ אינה חוסמת אותו, גם כשנכתבה `dev-agent`', () => {
    const out = runHook(lockRepo('dev-agent', '"dev-agent"', 'lib/core/x.ts'), REF);
    expect(out.out, '⛔ הסוכן נחסם מהנעילה של עצמו').not.toMatch(/הנעילה מוחזקת בידי/);
    expect(missingLockFired(out.out)).toBe(false);
  });

  // ⟦NEW 12/09⟧ ⛔ סשן התפעול ⛔ לא יכול היה להחזיק נעילה: `MINE` ריק ⇒ נעילה **משלו**
  // נקראה כזרה וחסמה את הדחיפה שלו עצמו. ⇒ הוא כותב ל-`work/current` כמו סוכן.
  it('⛔ הנעילה של סשן התפעול ⛔ אינה חוסמת אותו', () => {
    const out = runHook(lockRepo('ops-agent', '"OPS"', 'lib/core/x.ts'), REF);
    expect(out.out, '⛔ ops נחסם מהנעילה של עצמו').not.toMatch(/הנעילה מוחזקת בידי/);
  });

  it('⛔ ונעילה של סוכן אחר עדיין חוסמת את התפעול', () => {
    const out = runHook(lockRepo('ops-agent', '"DEV"', 'lib/core/x.ts'), REF);
    expect(out.out).toMatch(/הנעילה מוחזקת בידי 'DEV'/);
  });

  it('⛔ ונעילה זרה בצורת הזהות עדיין חוסמת', () => {
    const out = runHook(lockRepo('dev-agent', '"pm-agent"', 'lib/core/x.ts'), REF);
    expect(out.code).not.toBe(0);
    expect(out.out).toMatch(/PM/);
  });
});

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
   * 🔴 ⟦NEW 12/09 · `F-229`⟧ **הנעילה מסדרת כותבים ל-`work/current`, ⛔ ואינה חוסמת**
   * **קידום.** ⛔ וזו ⛔ אינה הכללה — זו בדיוק ההנמקה ש-`F-219` כתב לשער שמעליו,
   * שלא הוחלה על השער הזה.
   *
   * 🔬 **נמדד חי 12/09 13:16Z:** קידום `dev`⇢`main` עם `verify: exit 0` מוערת על ראש
   * `dev`, בעלות-ענף `ops-agent` תקפה ו-`merge --ff-only` מוצלח — **נדחה על נעילה של**
   * **`QA` ב-`work/current`**, ענף שהקידום ⛔ אינו נוגע בו. `main` נשאר 111 מאחור.
   * ⇒ ובשעה שזה נמדד, הנעילה הייתה **בת 10 דקות** — כלומר ⛔ **לא** חלון `§ 0.4`,
   * ⛔ ולא נעילה יתומה: השער הזה היה חוסם **כל** קידום שמתרחש בתוך טיק של מישהו אחר.
   */
  it('⛔ נעילה זרה ⛔ אינה חוסמת קידום ל-main, גם כשהדיף נושא קוד', () => {
    const r = runHook(lockedRepo('promoter-agent', 'QA', 'lib/core/thing.ts'), 'refs/heads/main');
    expect(r.out, '🔴 השער חסם את הקידום ⇒ main מפגר').not.toMatch(/הנעילה מוחזקת בידי/);
  });

  it('⛔ ו⛔ לא מיזוג ל-dev', () => {
    const r = runHook(lockedRepo('critic-agent', 'PM', 'lib/core/thing.ts'), 'refs/heads/dev');
    expect(r.out, '🔴 השער חסם את המיזוג ⇒ הלופ נעצר').not.toMatch(/הנעילה מוחזקת בידי/);
  });

  /** ⛔ ועדיין חוסם את מה שהוא נבנה בשבילו — אחרת זה חור, ⛔ לא תחום. */
  it('✅ ונעילה זרה עדיין חוסמת דחיפת קוד ל-work/current', () => {
    const r = runHook(lockedRepo('dev-agent', 'QA', 'lib/core/thing.ts'), 'refs/heads/work/current');
    expect(r.code, '⛔ הדחיפה חייבת להיכשל').not.toBe(0);
    expect(r.out).toMatch(/הנעילה מוחזקת בידי 'QA'/);
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

  /**
   * 🔴 **ו-`dev` היה עד 09/09 **מחמיר יותר** מ-`main`, וזו הייתה תקלה ⛔ ולא מדיניות.**
   * `main` התיר `ops-agent` מאז הסבב הקודם; `dev` ⛔ לא עודכן באותו קומיט ⇒ סשן תפעול
   * יכול היה לקדם את הענף הרגיש ו⛔ לא את זה שלפניו בשרשרת, כלומר ⛔ לא לקדם **לפי
   * הסדר** כלל. ⇒ שתי הטענות: מי נכנס, ⛔ ומי עדיין ⛔ לא.
   */
  for (const who of ['critic-agent', 'qa-agent', 'promoter-agent', 'ops-agent']) {
    it(`✅ ${who} ⛔ אינו נחסם על בעלות הענף ב-dev`, () => {
      const r = runHook(repo(who), 'refs/heads/dev', { SKIP_VERIFY: '1' });
      expect(r.out, `${who}: ⛔ לא נחסם על dev`).not.toMatch(/הדחיפה ל-dev נחסמה/);
    });
  }

  for (const who of ['dev-agent', 'pm-agent', 'content-agent']) {
    it(`⛔ ${who} ⛔ עדיין נדחה מ-dev`, () => {
      const r = runHook(repo(who), 'refs/heads/dev');
      expect(r.code, `⛔ ${who} חייב להידחות`).not.toBe(0);
      expect(r.out).toMatch(/הדחיפה ל-dev נחסמה/);
    });
  }

  it('⛔ ו-SKIP_VERIFY ⛔ עדיין אינו פותח את main לסוכן לופ', () => {
    const r = runHook(repo('dev-agent'), 'refs/heads/main', { SKIP_VERIFY: '1' });
    expect(r.code).not.toBe(0);
    expect(r.out).toMatch(/הדחיפה ל-main נחסמה/);
  });
});

describe('scripts/hooks/pre-push — תקרת 00-control.md נאכפת בדחיפה (T-523 · יעד loop ②)', () => {
  /**
   * 🔬 ההישנות השישית (`F-182`·`F-211`·`F-245`·`T-340`·`F-263`): בדיקה 9 של `loop:health`
   * **מודדת** את התקרה, ⛔ אבל ⛔ אינה חוסמת — ⇒ היצרן כותב מעליה, והמנקה רודף אחריו.
   * ⇒ השער: דחיפה ל-`work/current` שבה הקובץ **מעל** 12,288 **ו**גדל מול הבסיס — נדחית.
   * ⛔ דחיפה שמקטינה (או משאירה) קובץ שכבר מעל — עוברת: ⛔ אסור שהשער יחסום את הגיזום.
   */
  const CEILING = 12 * 1024;

  const controlRepo = (baseBytes: number, tipBytes: number): { root: string; base: string } => {
    const root = repo('dev-agent');
    const g = (...args: string[]) =>
      execFileSync('git', args, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    mkdirSync(join(root, 'plan'), { recursive: true });
    const body = (n: number) => `LOCK_HELD_BY: ""\n${'x'.repeat(Math.max(0, n - 17))}`;
    writeFileSync(join(root, 'plan', '00-control.md'), body(baseBytes), 'utf8');
    g('add', '-A');
    g('commit', '-q', '-m', 'base');
    const base = g('rev-parse', 'HEAD').trim();
    writeFileSync(join(root, 'plan', '00-control.md'), body(tipBytes), 'utf8');
    g('commit', '-q', '-am', 'tip');
    return { root, base };
  };

  const push = (root: string, remoteSha: string, ref = 'refs/heads/work/current') => {
    const sha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    try {
      const out = execFileSync('bash', ['.git/hooks/pre-push', 'origin', 'git@example:x.git'], {
        cwd: root,
        encoding: 'utf8',
        input: `refs/heads/local ${sha} ${ref} ${remoteSha}\n`,
        env: { ...process.env, SKIP_VERIFY: '1' },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      return { code: 0, out };
    } catch (e) {
      const err = e as { status?: number; stdout?: string; stderr?: string };
      return { code: err.status ?? -1, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
    }
  };

  it('⛔ דחיפה שחוצה את התקרה נדחית — ⛔ גם תחת SKIP_VERIFY', () => {
    const { root, base } = controlRepo(CEILING - 100, CEILING + 50);
    const r = push(root, base);
    expect(r.code, '⛔ הדחיפה חייבת להיכשל').not.toBe(0);
    expect(r.out).toMatch(/תקרת plan\/00-control\.md/);
    expect(r.out, 'המספרים נקובים').toContain(String(CEILING + 50));
  });

  it('⛔ דחיפה שמגדילה קובץ שכבר מעל התקרה נדחית', () => {
    const { root, base } = controlRepo(CEILING + 10, CEILING + 40);
    expect(push(root, base).code).not.toBe(0);
  });

  it('✅ דחיפה שמקטינה קובץ שמעל התקרה עוברת — ⛔ השער ⛔ אינו חוסם את הגיזום', () => {
    const { root, base } = controlRepo(CEILING + 400, CEILING + 100);
    const r = push(root, base);
    expect(r.code, r.out).toBe(0);
  });

  it('✅ דחיפה מתחת לתקרה עוברת', () => {
    const { root, base } = controlRepo(CEILING - 400, CEILING - 100);
    expect(push(root, base).code).toBe(0);
  });

  it('✅ ⛔ חל רק על work/current — מיזוג ל-dev ⛔ אינו נחסם כאן (בדיקה 9: «⛔ must not block a merge»)', () => {
    const root = controlRepo(CEILING - 100, CEILING + 50).root;
    const r = push(root, '0'.repeat(40), 'refs/heads/dev');
    expect(r.out).not.toMatch(/תקרת plan\/00-control\.md/);
  });

  it('התקרה בהוק זהה לתקרה של בדיקה 9 — ⛔ שני מספרים שונים הם שני כללים', () => {
    expect(HOOK).toMatch(/CONTROL_CEILING=12288\b/);
    expect(readFileSync('scripts/loop-health.mjs', 'utf8')).toMatch(/const CONTROL_CEILING = 12 \* 1024;/);
  });
});
