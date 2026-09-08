import { execFileSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Every check runs against a FIXTURE root, not the live repo. That is the whole
 * point: a checker that can only be observed passing has not been tested. Each
 * test below builds a tiny repo that contains exactly one defect and asserts the
 * matching check goes red on it — and that the others stay green, so a check
 * cannot pass by failing everything.
 */
const run = (root: string): { out: string; code: number } => {
  try {
    return {
      out: execFileSync('node', ['scripts/loop-health.mjs'], {
        encoding: 'utf8',
        env: { ...process.env, LOOP_HEALTH_ROOT: root },
      }),
      code: 0,
    };
  } catch (e) {
    const err = e as { stdout?: string; status?: number };
    return { out: err.stdout ?? '', code: err.status ?? -1 };
  }
};

const failed = (out: string, n: string): boolean =>
  new RegExp(`^ FAIL ${n}\\.`, 'm').test(out);
/**
 * ⛔ **A SOFT CHECK REPORTS ` warn `, ⛔ NOT ` FAIL `** — and the distinction is the
 * whole point of the soft window: the verdict is printed in full and ⛔ does not
 * touch the exit code until its date. ⇒ a test for a new check asserts `warned`,
 * ⛔ and asserting `failed` on it would pass only by accident after the date.
 */
const warned = (out: string, n: string): boolean =>
  new RegExp(`^ warn ${n}\\.`, 'm').test(out);
/**
 * 🔴 ⛔ **«⛔ לא נמדד» הוא מצב שלישי, ⛔ ולא גוון של כישלון.**  ⟦NEW 08/09 · `F-206`⟧
 * בדיקה שלא הצליחה לרוץ ⛔ לא מצאה דבר, ו«לא מצאה דבר» ⛔ אינו «מצאה נקי». ⇒ היא
 * ⛔ אינה נספרת בקוד היציאה **בשום תאריך**, ⛔ ולכן טענה עליה ⛔ אינה יכולה להתהפך.
 */
const notMeasured = (out: string, n: string): boolean =>
  new RegExp(`^ n/m  ${n}\\.`, 'm').test(out);

/** Mirrors `IMPROVE_ROW_TAG` in scripts/loop-health.mjs — kept as a literal here so
 *  the test does not import implementation internals, only observable output. */
const IMPROVE_ROW_TAG_LITERAL = 'שיפור';

/** A repo where all eight checks pass. Each test then breaks exactly one thing. */
const healthy = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'lh-'));
  mkdirSync(join(root, 'plan'), { recursive: true });
  mkdirSync(join(root, 'docs', 'superpowers', 'plans'), { recursive: true });
  mkdirSync(join(root, 'lib', 'core'), { recursive: true });

  const write = (p: string, body: string) => writeFileSync(join(root, p), body, 'utf8');

  write('lib/core/realGate.ts', 'export const gate = true;\n');
  write('docs/real-brief.md', '# brief\n');
  write(
    'plan/25-content-commissions.md',
    '| id | מה | תדריך | שער | הערה | סטטוס | משימה |\n' +
      '|---|---|---|---|---|---|---|\n' +
      '| K-001 | x | `docs/real-brief.md` | `lib/core/realGate.ts` | — | ⬜ | T-001 |\n',
  );
  write(
    'plan/60-findings.md',
    '| # | חומרה | קובץ | הממצא | תרחיש | תיקון | סטטוס | סבב |\n' +
      '|---|---|---|---|---|---|---|---|\n' +
      '| F-001 | 🔴 | `lib/core/realGate.ts` | x | y | z | ⬜ פתוח | 0 |\n',
  );
  const today = new Date().toISOString().slice(0, 10);
  write(
    'plan/03-for-roy.md',
    '| # | מי | מתי | מה | למה | חוסם |\n|---|---|---|---|---|---|\n' +
      `| 1 | PM (C-0001) | 2026-08-01 | לעשות משהו · נבדק: ${today} | כי | לא |\n`,
  );
  write(
    'plan/00-control.md',
    'RELEASE_READY: ""\nACTIVE_WORKSTREAM: story\nIMPROVE_TARGET: ""\nACTIVE_TASK_ID: []\n',
  );
  // ⛔ `story` is item 1 of the build order, so ⛔ nothing precedes it and check 13 has
  // ⛔ nothing to demand — the file still has to EXIST, because «missing register»
  // reports «⛔ לא נמדד» and goes red, ⛔ never green.
  write('plan/61-deferred.md', '| זרימה | תאריך | ⬜ | ממצאים | צעדים | C |\n|---|---|---|---|---|---|\n');
  write('plan/26-plan-feedback.md', '| C-0001 | `p.md` | `files` | why | ⬜ |\n');
  write('plan/50-tasks.md', '| T-001 | M0 | uses 2026-01-01-real-plan.md | — | ⬜ | 0 | — | — |\n');
  write('docs/superpowers/plans/2026-01-01-real-plan.md', '# plan\n');
  // ⛔ Check 8 runs the real generator, which needs the real registers; a fixture
  // cannot satisfy it, so the fixture root carries the committed snapshots and
  // the generator's own inputs verbatim.
  for (const p of ['docs/plan-tables.md', 'docs/plan-open.md']) {
    cpSync(p, join(root, p));
  }
  return root;
};

const patch = (root: string, file: string, fn: (s: string) => string): void => {
  const p = join(root, file);
  writeFileSync(p, fn(readFileSync(p, 'utf8')), 'utf8');
};

describe('scripts/loop-health.mjs', () => {
  it('is green on a healthy fixture — every check except the one a fixture cannot satisfy', () => {
    // ⚠️ This assertion was HOLLOW on its first draft: it read
    // `expect(failed(out)).toBe(failed(out) && false)`, where `failed` was called
    // with one argument, matched `^ FAIL undefined\.`, and was therefore always
    // false on both sides. It passed while measuring nothing. Now it names the
    // checks and asserts each one individually.
    const r = run(healthy());
    /**
     * 🔴 **תוקן C-0372, וזו ⛔ אינה התאמה של מספר לתוצאה — זו הסרה של מספר שאינו ניתן
     * לפינון.** הליטרל היה `11/14`, והבדיקה הייתה **אדומה על `dev` עצמו** — כלומר
     * `npm run verify` ⛔ לא היה יכול לעבור לאף סוכן (‏`F-174`).
     * **⛔ ולא בגלל רגרסיה אחת, אלא בגלל שתי בדיקות שהתוצאה שלהן ⛔ אינה של הפיקסצ׳ר:**
     * ⓐ בדיקה 11 קוראת את `docs/plan-open.md` ה**אמיתי** שהפיקסצ׳ר מעתיק פנימה ⇒
     *    הוורדיקט שלה זז עם הרגיסטרים החיים, בכל טיק, לנצח.
     * ⓑ בדיקה 12 קוראת את `plan/60-findings.md` של הפיקסצ׳ר (‏`F-001`, ⛔ לא בבעלות PM)
     *    ⇒ היא ירוקה כאן **בצדק**, וההנחה שנכתבה ב-C-0359/C-0366 שהיא תיפול הייתה שגויה.
     * ⇒ **סכום שנעוץ כליטרל מודד את מצב הרגיסטרים של אותו יום, ⛔ לא את הבודק.**
     * ⛔ **והתחליף ⛔ אינו «לוותר על המספר»:** הסכום נגזר מהפלט עצמו ונבדק מולו, ושתי
     * הבדיקות שהפיקסצ׳ר ⛔ אינו יכול לספק (8 · 10) עדיין נאמרות **בשמן** ונדרשות ליפול.
     */
    const total = /loop health: (\d+)\/(\d+) checks pass/.exec(r.out);
    expect(total, 'the checker must print its own total').not.toBeNull();
    expect(total?.[2]).toBe('17');
    const failing = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17']
      .filter((n) => failed(r.out, n));
    // ⚠️ בדיקה רכה ⛔ אינה נספרת במונה ו⛔ אינה נספרת ב-` FAIL ` — ⇒ המשלים הוא
    // עוברות + כישלונות קשים + אזהרות. (16 ו-17 נחתו 06/09 בחלון רך.)
    const warning = ['12', '13', '14', '16', '17'].filter((n) => warned(r.out, n));
    /**
     * 🔴 ⛔ **⟦08/09 · `F-206`⟧ ומצב שלישי נכנס למשוואה: «⛔ לא נמדד».** בדיקה שלא
     * הצליחה לרוץ (‏17 כאן — ⛔ אין `roster.json` בפיקסצ׳ר) ⛔ אינה עוברת, ⛔ אינה נכשלת
     * ו⛔ אינה אזהרה. ⇒ הסכום המודפס חייב להשלים את **שלושתם**, אחרת בדיקה שנעלמה
     * מהמשוואה נספרת בשקט כעוברת — וזו בדיוק המחלקה שהבלוק הזה קיים נגדה.
     */
    const unmeasured = ['1','2','3','4','5','6','7','8','9','10','11','12','13','14','15','16','17']
      .filter((n) => notMeasured(r.out, n));
    // הסכום המודפס חייב להיות משלים למספר הכישלונות — ⛔ אחרת הבודק סופר לא נכון.
    expect(Number(total?.[1]) + failing.length + warning.length + unmeasured.length).toBe(17);
    expect(unmeasured, '⛔ 17 ⛔ אינה מודדת בלי roster ⇒ n/m, ⛔ ולא «עברה»').toContain('17');
    for (const n of ['1', '2', '3', '4', '5', '6', '7', '9', '15']) {
      expect(failed(r.out, n), `check ${n} must be green on a healthy fixture`).toBe(false);
    }
    // ⛔ Check 10 shells out to git inside the fixture root, which is ⛔ not a repo.
    // It reports «⛔ לא נמדד» and goes RED — ⛔ never green. A check that passes
    // because it could not run is the exact lie this file exists against.
    expect(failed(r.out, '10')).toBe(true);
    expect(r.out).toContain('⛔ לא נמדד');
    // ⛔ Check 8 runs the real generator against fixture registers, so it cannot
    // pass here. Stated out loud rather than excluded quietly — a checker whose
    // own test hides a failure is the thing this whole file exists against.
    expect(failed(r.out, '8')).toBe(true);
    // ⛔ בדיקות 11 ו-12 ⛔ אינן נעוצות כאן, וזה נאמר במפורש ⛔ ולא מושמט: הוורדיקט שלהן
    // נקבע ברגיסטרים החיים ⛔ ולא בפיקסצ׳ר. פינון שלהן הוא בדיוק מה שהפיל את הקובץ הזה.
    expect(r.code).toBe(1);
  });

  /**
   * T-257 — a soft, PRINT-ONLY report line, explicitly not a numbered check
   * (mirrors `workTypeMix`; see the task row and `2026-09-06-loop-infra-hardening.md`).
   * The only path a fixture (a plain temp dir, never a real git repo) can exercise
   * is the "git not reachable" fallback — exactly the same limitation `check 10`
   * already has in this file (see the comment on its own healthy-fixture assertion
   * above). The counting logic itself is verified live against the real repo as
   * part of this task's commit step, not re-created here with a fake git repo.
   */
  describe('T-257 — טיקי PM מאז פרוסת פיצ׳ר אחרונה (דיווח רך)', () => {
    it('מדפיסה "⛔ לא נמדד" כש-git אינו נגיש (הפיקסצ׳ר אינו ריפו git)', () => {
      const r = run(healthy());
      expect(r.out).toMatch(/טיקי PM מאז פרוסת פיצ'ר אחרונה.*⛔ לא נמדד/);
    });

    it('⛔ אינה מופיעה בין הבדיקות הממוספרות — אינה FAIL ואינה warn', () => {
      const r = run(healthy());
      expect(r.out).not.toMatch(/^ FAIL 15\./m);
      expect(r.out).not.toMatch(/^ warn 15\./m);
      // ⛔ T-257 עצמה ⛔ אינה מזיזה את הסכום — היא אינה בדיקה ממוספרת. הסכום כאן
      // הוא 15 כי T-260 (שנחתה באותו טיק) הוסיפה check('15', …) אמיתי — לא כי
      // השורה הזו נספרת. ⚠️ תוקן מ-'14' ל-'15' עם נחיתת T-260, ומ-'15' ל-'17' עם
      // נחיתת בדיקות 16 (שער verify · הכרעה 100) ו-17 (סוכן שותק · הכרעה 101).
      const total = /loop health: \d+\/(\d+) checks pass/.exec(r.out);
      expect(total?.[1]).toBe('17');
    });
  });

  /**
   * T-260 — `ACTIVE_TASK_ID` moves from a single string to a short bracketed
   * list of at most 3 valid `T-xxx` ids (`D-190 § 1.2`, option ⓑ). This check
   * protects the shape of that field the same way check 9 protects the file's
   * byte budget: a malformed field is a defect nobody notices until an agent's
   * hand-parse of it silently does the wrong thing.
   */
  describe('T-260 — check 15 · ACTIVE_TASK_ID תקין', () => {
    const withControl = (activeTaskIdLine: string): string => {
      const root = healthy();
      const controlPath = join(root, 'plan', '00-control.md');
      const original = readFileSync(controlPath, 'utf8');
      const patched = original.replace(/^ACTIVE_TASK_ID:.*$/m, activeTaskIdLine);
      writeFileSync(controlPath, patched, 'utf8');
      return root;
    };

    it('ריק ("[]") — תקין', () => {
      const r = run(withControl('ACTIVE_TASK_ID: []'));
      expect(failed(r.out, '15')).toBe(false);
    });

    it('רשימה תקינה של עד 3 מזהים — תקין', () => {
      const r = run(withControl('ACTIVE_TASK_ID: [T-235, T-238]'));
      expect(failed(r.out, '15')).toBe(false);
    });

    it('⛔ 4 מזהים — נופלת, התקרה 3', () => {
      const r = run(withControl('ACTIVE_TASK_ID: [T-1, T-2, T-3, T-4]'));
      expect(failed(r.out, '15')).toBe(true);
      expect(r.out).toContain('התקרה 3');
    });

    it('⛔ מזהה בפורמט לא תקף — נופלת', () => {
      const r = run(withControl('ACTIVE_TASK_ID: [T-235, banana]'));
      expect(failed(r.out, '15')).toBe(true);
      expect(r.out).toContain('banana');
    });

    it('⛔ כפילות — נופלת', () => {
      const r = run(withControl('ACTIVE_TASK_ID: [T-235, T-235]'));
      expect(failed(r.out, '15')).toBe(true);
      expect(r.out).toContain('כפילות');
    });

    it('⛔ שורה חסרה — לא נמדד, ⛔ ולא ok בשתיקה', () => {
      const root = healthy();
      const controlPath = join(root, 'plan', '00-control.md');
      const original = readFileSync(controlPath, 'utf8');
      writeFileSync(controlPath, original.replace(/^ACTIVE_TASK_ID:.*$/m, ''), 'utf8');
      const r = run(root);
      expect(failed(r.out, '15')).toBe(true);
      expect(r.out).toContain('⛔ לא נמדד');
    });
  });

  it('exits 0 only when every check passes — measured against the live repo', () => {
    // The live repo is the one place check 8 can be satisfied. Today checks 1, 3
    // and 6 fail there, so the exit code is 1 and that is the honest state.
    const r = run('.');
    const m = /loop health: (\d+)\/(\d+)/.exec(r.out);
    const passes = m?.[1];
    const total = m?.[2];
    expect(passes).toBeDefined();
    // ⛔ ids 1–10, contiguous since 25/08: check 9 (the control-register ceiling)
    // was lit early — the file was measured 661 bytes OVER its own rule.
    // ⚠️ 14 → 15 with T-260's check('15', …) landing (2026-09-06).
    // ⚠️ 15 → 17 with checks 16 (verify gate) and 17 (silent agent) landing (2026-09-06, הכרעות 100 · 101).
    expect(total).toBe('17');
    /**
     * ⛔ **THE EXIT CODE COUNTS HARD FAILURES ONLY — a soft check ⛔ never sets it.**
     * ⟦30/08, wave 2⟧ Checks 12·13·14 landed against a backlog that predates them, and
     * Roy's phase-7 lesson is that a check which goes red on day one teaches every agent
     * that red is the normal colour. ⇒ inside the soft window they print ` warn `, are
     * excluded from the pass count's numerator ⛔ and from the exit code, and on their
     * date they start counting with ⛔ no further edit.
     * ⛔ The soft ones are named here rather than absorbed silently: a total that
     * quietly swallows a failure is the same lie as a check that passes because it
     * could not run.
     */
    // ⚠️ 16 ו-17 נוספו 06/09 עם חלון רך עד 2026-09-13 (הכרעות 100 · 101).
    const soft = ['12', '13', '14', '16', '17'].filter((n) => warned(r.out, n));
    const hard = Number(total) - Number(passes) - soft.length;
    expect(r.code).toBe(hard === 0 ? 0 : 1);
  });

  it('1 · goes red on a commission whose brief was never written — the live failure of 24/08', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s.replace('`docs/real-brief.md`', '`docs/never-written-brief.md`'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('docs/never-written-brief.md');
    expect(r.code).toBe(1);
  });

  /**
   * ⛔ THE BLOCKED-ROW PAIR. A ⛔ row is where a checker is easiest to game: mark
   * the row blocked and the missing brief stops being reported. These two tests
   * are what makes that impossible — blocked buys an exemption from the FILES and
   * pays for it with a NAMED finding or task.
   */
  it('1 · stays green on a ⛔ blocked row that names its finding — blocking is a successful outcome', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('`docs/real-brief.md`', '⛔ אין — נחסמה')
        .replace('`lib/core/realGate.ts` | — | ⬜ |', '⛔ אין | F-117 | ⛔ |'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(false);
  });

  it('1 · goes red on a ⛔ blocked row that names nothing — ⛔ אינו מקום לחנות בו עבודה', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('`docs/real-brief.md`', '⛔ אין — נחסמה')
        .replace('`lib/core/realGate.ts` | — | ⬜ | T-001 |', '⛔ אין | — | ⛔ | — |'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('⛔ בלי ממצא או משימה');
  });

  /**
   * ⛔ ⛔ IS A PROSE GLYPH IN THIS REPO, AND THAT IS THE TRAP. Every register here
   * writes ⛔ inside its descriptions, so «the row contains ⛔» would mark almost
   * every commission blocked and exempt it from the file check — the checker would
   * go quiet on exactly the rows it exists for. Only the STATE cell counts.
   * ⛔ Without this test the scoping is unpinned: it survives being widened to the
   * whole line, measured.
   */
  it('1 · ⛔ בתיאור ⛔ אינו חסימה — רק תא המצב נחשב', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s
        .replace('| K-001 | x |', '| K-001 | ⛔ אין להמציא כאן דקדוק |')
        .replace('`docs/real-brief.md`', '`docs/never-written-brief.md`'),
    );
    const r = run(root);
    expect(failed(r.out, '1')).toBe(true);
    expect(r.out).toContain('docs/never-written-brief.md');
  });

  it('1 · stays green when the same row is closed — a closed row may name a deleted file', () => {
    const root = healthy();
    patch(root, 'plan/25-content-commissions.md', (s) =>
      s.replace('`docs/real-brief.md`', '`docs/gone.md`').replace('| ⬜ |', '| ✅ |'),
    );
    expect(failed(run(root).out, '1')).toBe(false);
  });

  it('2 · goes red on a finding pointing at a deleted file', () => {
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('`lib/core/realGate.ts`', '`lib/core/deleted.ts`'),
    );
    expect(failed(run(root).out, '2')).toBe(true);
  });

  it('3 · goes red on a Roy item with no stamp, and on one stamped over a week ago', () => {
    const noStamp = healthy();
    patch(noStamp, 'plan/03-for-roy.md', (s) => s.replace(/ · נבדק: \d{4}-\d{2}-\d{2}/, ''));
    expect(failed(run(noStamp).out, '3')).toBe(true);

    const old = healthy();
    patch(old, 'plan/03-for-roy.md', (s) => s.replace(/נבדק: \d{4}-\d{2}-\d{2}/, 'נבדק: 2026-01-01'));
    const r = run(old);
    expect(failed(r.out, '3')).toBe(true);
    expect(r.out).toContain('2026-01-01');
  });

  it('4 · goes red when a slice is marked ready and the three taps were not written', () => {
    // ⛔ The only path by which an answer from Roy re-enters the loop. It has been
    // instructed in the QA prompt since the loop began and written zero times.
    const root = healthy();
    patch(root, 'plan/00-control.md', () => 'RELEASE_READY: "abc123 · 24/08 · 12 commits"\n');
    expect(failed(run(root).out, '4')).toBe(true);

    patch(root, 'plan/03-for-roy.md', (s) => `${s}\n**שלוש הקשות:** 1 · 2 · 3\n`);
    expect(failed(run(root).out, '4')).toBe(false);
  });

  it('6 · goes red on a plan file no task row cites', () => {
    const root = healthy();
    writeFileSync(join(root, 'docs/superpowers/plans/2026-02-02-orphan.md'), '# x\n', 'utf8');
    const r = run(root);
    expect(failed(r.out, '6')).toBe(true);
    expect(r.out).toContain('2026-02-02-orphan.md');
  });

  /**
   * ⛔ The widening measured on 24/08: 4 of the 8 «orphans» were cited in
   * `60-findings.md`. A plan a finding cites is **findable**, which is the entire
   * harm the check names. ⛔ Without this test the widening is unpinned and a later
   * hand could quietly narrow it back to `50-tasks.md` alone.
   */
  it('6 · stays green on a plan only a FINDING cites — findable is findable', () => {
    const root = healthy();
    writeFileSync(join(root, 'docs/superpowers/plans/2026-02-02-from-finding.md'), '# x\n', 'utf8');
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('| x | y | z |', '| x | y | 2026-02-02-from-finding.md |'),
    );
    const r = run(root);
    expect(failed(r.out, '6')).toBe(false);
  });

  /**
   * ⛔ **9 — the rule existed and nothing enforced it.** Measured 25/08:
   * `plan/00-control.md` was **12,949 bytes against a 12,288 ceiling**, and four
   * agents read it every tick. ⛔ A ceiling nobody measures is a comment.
   */
  it('9 · goes red when the control register passes its ceiling', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s + 'x'.repeat(13_000));
    const r = run(root);
    expect(failed(r.out, '9')).toBe(true);
    expect(r.out).toMatch(/\d+ בתים מתוך 12288/);
  });

  it('9 · ⛔ ⛔ אינו ירוק על קובץ חסר — «0 בתים» ⛔ אינו «מתחת לתקרה»', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', () => '');
    const r = run(root);
    expect(failed(r.out, '9')).toBe(true);
    expect(r.out).toContain('⛔ לא נמדד');
  });

  /**
   * ⛔ **11 — הבדיקה היחידה שמודדת בזבוז, ⛔ ולא נכונות.** ‏DEV לוקח עבודה **רק**
   * מהזרימה הפעילה; כשהיא ריקה, כל טיק שלו הוא שכפול + קריאת פרומפט + ⛔ אפס תוצר.
   * נמדד 26/08: `story` התרוקנה ב-05:29 והשדה עדיין אמר `story` שעתיים אחר כך.
   */
  it('11 · goes red when the active workstream has no open row', () => {
    const root = healthy();
    patch(root, 'docs/plan-open.md', (s) => s.replace(/^\| 1\. `story` \|([^|]*)\|([^|]*)\|/m, '| 1. `story` |$1| 0 |'));
    const r = run(root);
    expect(failed(r.out, '11')).toBe(true);
    expect(r.out).toContain('טיק ריק');
  });

  it('11 · ⛔ ⛔ אינו ירוק כשאין ACTIVE_WORKSTREAM — «חסר» ⛔ אינו «תקין»', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s.replace(/^ACTIVE_WORKSTREAM:.*$/m, ''));
    const r = run(root);
    expect(failed(r.out, '11')).toBe(true);
    expect(r.out).toContain('⛔ לא נמדד');
  });

  /**
   * 🧭 **‏D-174 · הפרוסה הכללית — ארבע טענות, וכל אחת מהן מחלקת כשל שכבר קרתה.**
   *
   * 🔴 **המדידה שפתחה את זה, 31/08 על שיבוט חי:** `loop` נשא **10 שורות ⬜** ו-`base`
   * נשא **15** — **25 שורות פתוחות ש⛔ אף טיק DEV ⛔ לא יכול היה לקחת**, מפני ש-DEV
   * מסנן ל-`ACTIVE_WORKSTREAM` ו-`ACTIVE_WORKSTREAM` מעולם ⛔ לא החזיק אלא זרימת פיצ׳ר.
   * זו **הפעם השלישית** לאותה מחלקת כשל: `D-122 § ב` (חמש שורות `cards` מתויגות `base`)
   * ו-`D-171` (`ACTIVE_TASK_ID` שהפילטר הפיל בשקט).
   */
  it('11 · מוקד חוצה-מערכת נספר על כל הקבוצה — `general` ∪ `loop` ∪ `base`', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) =>
      s.replace('ACTIVE_WORKSTREAM: story', 'ACTIVE_WORKSTREAM: general\nPREV_WORKSTREAM: "story"'),
    );
    const r = run(root);
    // ⛔ ‏`general` עצמו מחזיק 0 שורות — ואם הבדיקה הייתה סופרת אותו לבדו היא הייתה
    // מדווחת «מוצתה» בעוד 25 שורות פתוחות יושבות שתי שורות מתחתיה בטבלה.
    expect(failed(r.out, '11'), '⛔ ⛔ לא «מוצתה» — הקבוצה מחזיקה עבודה').toBe(false);
    expect(r.out).toContain('חוצה-מערכת');
  });

  it('11 · ⛔ ו⛔ אינו ירוק מזכות עצמו — קבוצה חוצה-מערכת ריקה עדיין אדומה', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) =>
      s.replace('ACTIVE_WORKSTREAM: story', 'ACTIVE_WORKSTREAM: general\nPREV_WORKSTREAM: "story"'),
    );
    patch(root, 'docs/plan-open.md', (s) =>
      s.replace(/^\| · `(loop|base|general)` \(מחוץ לרצף\) \|([^|]*)\|([^|]*)\|/gm, '| · `$1` (מחוץ לרצף) |$2| 0 |'),
    );
    const r = run(root);
    expect(failed(r.out, '11')).toBe(true);
    expect(r.out).toContain('טיק ריק');
  });

  /**
   * 🟠 **F-169 · נפתח על ידי QA (C-0367) — הבדיקה סופרת גלגלת, ⛔ ולא תא.** ‏`T-220` היה
   * המקרה החי: השורה פותחת `⬜` (הגלגלת הראשונה מנצחת, `classifyStatus`/`taskState`) ואז
   * מצהירה בפרוזה, באותו תא: «ⓐ ו-ⓓ ⛔ נשארות ⬜, חסומות ב-F-164». ⛔ אין `חסם:` מוצהר —
   * כך שגם `citedTasks`/`staleTaskBlocks` ⛔ אינם רואים אותה — ו-`balance()` קורא רק את
   * המספר הגמור מ-`docs/plan-open.md`, ⛔ לא את הפרוזה שמאחוריו. ⇒ בדיקה 11 דיווחה «יש
   * עבודה פנויה» על שורה ש⛔ שום DEV לא יכול היה לבנות בפועל.
   */
  it('11 · F-169 — שורה שפותחת ⬜ ומחזיקה `חסומ` באותו תא ⛔ אינה עבודה פנויה', () => {
    const root = healthy();
    patch(root, 'docs/plan-open.md', (s) =>
      s.replace(/^\| 1\. `story` \|([^|]*)\|([^|]*)\|/m, '| 1. `story` |$1| 1 |'),
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) => `${s}| T-900 | M2 · story · נוחות | x | — | ⬜ ⓐ נבנתה ⇒ 🟣 · ⓑ ⛔ נשארת ⬜, חסומה ב-F-999 | 0 | — | — |\n`,
    );
    const r = run(root);
    expect(failed(r.out, '11'), '⛔ השורה היחידה ⬜ חסומה בתא — ⛔ אין עבודה פנויה באמת').toBe(true);
    expect(r.out).toContain('טיק ריק');
  });

  it('11 · F-169 — שורה חסומה-בתא ⛔ אינה מוחקת שורה אחרת שבאמת פנויה', () => {
    const root = healthy();
    patch(root, 'docs/plan-open.md', (s) =>
      s.replace(/^\| 1\. `story` \|([^|]*)\|([^|]*)\|/m, '| 1. `story` |$1| 2 |'),
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) =>
        `${s}| T-900 | M2 · story · נוחות | x | — | ⬜ ⓐ נבנתה ⇒ 🟣 · ⓑ ⛔ נשארת ⬜, חסומה ב-F-999 | 0 | — | — |\n` +
        `| T-901 | M2 · story · נוחות | y | — | ⬜ | 0 | — | — |\n`,
    );
    const r = run(root);
    expect(failed(r.out, '11'), '⛔ T-901 באמת פנויה — הקבוצה ⛔ אינה «מוצתה»').toBe(false);
    expect(r.out).toContain('1 משימות ⬜');
  });

  /**
   * 🔴 **הבאג שנתפס בכתיבת הבדיקה הזאת, ⛔ ולא שוער.** ‏`order` של הקבוצה החוצה-מערכתית
   * הוא `null` — ו-**`null < 5` הוא `true` ב-JavaScript**. ⇒ ברגע שהשורות האלה נכנסו
   * ל-`balance()`, בדיקה 13 החלה לדרוש «שורת חוב» מ-`loop` · `base` · `general` כאילו
   * הרצף עבר אותן, והלופ ירד מ-13/14 ל-12/14 **בלי ששום דבר בתוכן השתנה**.
   */
  it('13 · ⛔ הקבוצה החוצה-מערכתית ⛔ אינה נספרת כזרימה «שהרצף עבר»', () => {
    const root = healthy();
    const r = run(root);
    for (const w of ['loop', 'base', 'general']) {
      expect(r.out, `⛔ ${w} ⛔ אינו ברצף ⇒ ⛔ אין ממנו מה לדרוש`).not.toContain(
        `${w} — נחתמה/הוזזה`,
      );
    }
  });

  it('13 · מוקד חוצה-מערכת בלי `PREV_WORKSTREAM` ⛔ אינו עובר בשקט', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) =>
      s.replace('ACTIVE_WORKSTREAM: story', 'ACTIVE_WORKSTREAM: general'),
    );
    const r = run(root);
    expect(warned(r.out, '13') || failed(r.out, '13')).toBe(true);
    expect(r.out).toContain('PREV_WORKSTREAM ריק');
  });

  it('7 · goes red when the same missing element is reported twice — the PM did not learn', () => {
    const root = healthy();
    patch(root, 'plan/26-plan-feedback.md', (s) => `${s}| C-0002 | \`q.md\` | \`files\` | why | ⬜ |\n`);
    const r = run(root);
    expect(failed(r.out, '7')).toBe(true);
    expect(r.out).toContain('files');
  });

  it('7 · stays green when the repeated row is already closed', () => {
    const root = healthy();
    patch(root, 'plan/26-plan-feedback.md', (s) => `${s}| C-0002 | \`q.md\` | \`files\` | why | ✅ |\n`);
    expect(failed(run(root).out, '7')).toBe(false);
  });

  it('7 · a CLOSED row whose status text quotes a 🔴/🟣/🔧 finding does not count as a second open "files" row — the surrogate-pair trap (T-213)', () => {
    // ⛔ Same class of bug as the check-2 test below, a different regex: `/[⬜🔵]/`
    // at `scripts/loop-health.mjs` (check 7's "is this row still open" test) does
    // not carry the `u` flag either. `C-0002` here is CLOSED (✅) — its status cell
    // just happens to name the finding it closed, "F-100 🔴" — and the unflagged
    // class reads that 🔴's leading surrogate as if it were a ⬜/🔵 open-glyph, so
    // the checker double-counts "files" (once for the healthy fixture's genuinely
    // open `C-0001`, once for this closed row) and fails a PM that repeated
    // nothing.
    const root = healthy();
    patch(
      root,
      'plan/26-plan-feedback.md',
      (s) => `${s}| C-0002 | \`q.md\` | \`files\` | already closed | ✅ **סגור — ראה F-100 🔴** |\n`,
    );
    expect(failed(run(root).out, '7')).toBe(false);
  });

  it('does not mistake a 🔴 finding for a closed one — the surrogate-pair trap', () => {
    // ⛔ THE BUG THIS PINS, found before shipping: `/[✅🚫]/` WITHOUT the `u` flag
    // splits 🚫 into its surrogate halves, so the class matches anything opening
    // with \uD83D — 🔴, 🟣 and 🔵 included. The checker therefore skipped every
    // 🔴 CRITICAL row as "closed", which is the precise inverse of its job.
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) =>
      s.replace('`lib/core/realGate.ts`', '`lib/core/deleted.ts`').replace('⬜ פתוח', '🔴 פתוח'),
    );
    const r = run(root);
    expect(failed(r.out, '2'), 'a 🔴 row must still be measured').toBe(true);
    expect(r.out).toContain('lib/core/deleted.ts');
  });

  /**
   * ⛔ **THE THREE CHECKS ADDED 30/08 GET THE SAME TREATMENT AS THE OTHERS:** each one
   * is proved to go red on a fixture carrying exactly the defect it exists to catch.
   * ⛔ A check observed only passing has ⛔ not been tested — and these three were
   * written against a live repo where two of them are green, which is precisely the
   * situation in which a broken checker looks perfect.
   * ✅ **PERMANENT AS OF `D-177` (`F-180`):** their soft window closed 2026-09-02 —
   * each now FAILs like any other check, ⛔ never warns.
   */
  it('12 · fails on a PM-owned finding that blocks a written row', () => {
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) => s.replace('⬜ פתוח', '⬜ פתוח → **PM**'));
    patch(root, 'plan/50-tasks.md', (s) =>
      s.replace('| ⬜ |', '| ⛔ חסום על F-001 |').replace('uses', 'F-001 blocks: uses'),
    );
    const r = run(root);
    expect(failed(r.out, '12'), 'soft window closed 2026-09-02 ⇒ FAIL, ⛔ not warn').toBe(true);
    expect(warned(r.out, '12')).toBe(false);
    expect(r.out).toContain('F-001');
    expect(r.out).toContain('T-001');
  });

  it('12 · stays green when the PM-owned finding blocks ⛔ nothing — a finding is ⛔ not a debt by itself', () => {
    const root = healthy();
    patch(root, 'plan/60-findings.md', (s) => s.replace('⬜ פתוח', '⬜ פתוח → **PM**'));
    const r = run(root);
    expect(failed(r.out, '12')).toBe(false);
    expect(warned(r.out, '12')).toBe(false);
  });

  it('13 · fails when the sequence moved past a workstream that has ⛔ no deferred row', () => {
    const root = healthy();
    // `cards` is item 3 of the build order ⇒ `story` and `nav` are behind it, and the
    // fixture register is empty ⇒ both are owed a row and ⛔ neither has one.
    patch(root, 'plan/00-control.md', (s) =>
      s.replace('ACTIVE_WORKSTREAM: story', 'ACTIVE_WORKSTREAM: cards'),
    );
    const r = run(root);
    expect(failed(r.out, '13')).toBe(true);
    expect(warned(r.out, '13')).toBe(false);
    expect(r.out).toContain('story');
    expect(r.out).toContain('nav');
  });

  it('13 · goes red — ⛔ not green — when the register file is missing entirely', () => {
    // ⛔ A check that passes because its input is absent is the lie this file exists
    // against. Missing register ⇒ «⛔ לא נמדד», ⛔ never «ok».
    const root = healthy();
    writeFileSync(join(root, 'plan/61-deferred.md'), '', 'utf8');
    const r = run(root);
    expect(failed(r.out, '13')).toBe(true);
    expect(r.out).toContain('⛔ לא נמדד');
  });

  it('14 · fails when IMPROVE_TARGET points at a workstream the sequence has ⛔ not passed', () => {
    // 🔴 This is the failure mode the whole fence exists for: `arena` sits AFTER the
    // active `story`, so pointing IMPROVE_TARGET at it is a **second active
    // workstream through the back door** — the one rule that keeps the product from
    // becoming five half-built screens.
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) =>
      s.replace('IMPROVE_TARGET: ""', 'IMPROVE_TARGET: arena'),
    );
    const r = run(root);
    expect(failed(r.out, '14')).toBe(true);
    expect(warned(r.out, '14')).toBe(false);
    expect(r.out).toContain('בדלת האחורית');
  });

  it('14 · שורות פתוחות בלי תג שיפור ⛔ אינן נספרות לתקרה — גם אם הן מעל 2', () => {
    // `loop` is a cross-cutting workstream (order: null in balance()), so condition 1
    // (`there.order >= here.order`) never fires against it regardless of the active
    // workstream — this isolates the test to the ceiling condition alone.
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s.replace('IMPROVE_TARGET: ""', 'IMPROVE_TARGET: loop'));
    patch(
      root,
      'plan/61-deferred.md',
      (s) => s + '| `loop` | 2026-09-01 | 3 | F-000 | x | C-0001 |\n',
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) =>
        s +
        '| T-900 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n' +
        '| T-901 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n' +
        '| T-902 | M0 · loop · נוחות | קיימת מלפני IMPROVE, ⛔ ללא תג | — | ⬜ | 0 | — | — |\n',
    );
    const r = run(root);
    expect(
      failed(r.out, '14'),
      'שלוש שורות פתוחות ⛔ ללא התג לא היו אמורות להפיל את הבדיקה',
    ).toBe(false);
  });

  it('14 · שורות פתוחות עם תג שיפור נספרות, ומעל התקרה מפילות', () => {
    const root = healthy();
    patch(root, 'plan/00-control.md', (s) => s.replace('IMPROVE_TARGET: ""', 'IMPROVE_TARGET: loop'));
    patch(
      root,
      'plan/61-deferred.md',
      (s) => s + '| `loop` | 2026-09-01 | 3 | F-000 | x | C-0001 |\n',
    );
    patch(
      root,
      'plan/50-tasks.md',
      (s) =>
        s +
        '| T-900 | M0 · loop · נוחות · שיפור | שורת שיפור 1 | — | ⬜ | 0 | — | — |\n' +
        '| T-901 | M0 · loop · נוחות · שיפור | שורת שיפור 2 | — | ⬜ | 0 | — | — |\n' +
        '| T-902 | M0 · loop · נוחות · שיפור | שורת שיפור 3 | — | ⬜ | 0 | — | — |\n',
    );
    const r = run(root);
    expect(failed(r.out, '14'), 'שלוש שורות מתויגות מעל תקרה 2 חייבות להפיל').toBe(true);
    expect(r.out, 'הפירוט מזכיר את התג').toContain(IMPROVE_ROW_TAG_LITERAL);
  });

  it('14 · an empty field is the mode being OFF, and that is a PASS', () => {
    const r = run(healthy());
    expect(failed(r.out, '14')).toBe(false);
    expect(warned(r.out, '14')).toBe(false);
    expect(r.out).toContain('ריק — המצב כבוי');
  });

  it('prints the work-type mix as a NUMBER — ⛔ never as a check that can fail', () => {
    // ⛔ D-147 says the mix is soft. A number in the pass/fail column is a number
    // somebody starts optimising, so it is deliberately ⛔ not a `check()`.
    const r = run('.');
    expect(r.out).toContain('תמהיל (דיווח רך');
    // ⚠️ 14 → 15 with T-260's check('15', …), 15 → 17 with checks 16·17 (2026-09-06) — unrelated to this mix line.
    expect(r.out).toMatch(/loop health: \d+\/17 checks pass/);
    expect(r.out, 'the mix ⛔ must not appear as a numbered check').not.toMatch(
      /^(  ok  | FAIL | warn )\d+\. תמהיל/m,
    );
  });

  /**
   * 🔴 **‏D-148 · 30/08 — the mix reads TOKENS, ⛔ not a suffix, and this fixture is the
   * one that would have caught the bug.** The old line asked `endsWith('נוחות')`, so the
   * first row to carry a token AFTER its work-type tag re-counted as untagged — ⛔ silently,
   * ⛔ with every check still green. ⇒ the fixture below puts the layer tag last on purpose.
   */
  it('the work-type mix counts a row whose kind tag is ⛔ not the last token (D-148)', () => {
    const root = healthy();
    patch(root, 'plan/50-tasks.md', (s) =>
      s.replace('| T-001 | M0 |', '| T-001 | M0 · arena · נוחות · שכבה ב׳ |'),
    );
    const r = run(root);
    expect(r.out, 'the row counts under its kind, ⛔ not as untagged').toMatch(
      /נוחות 1 · תוכן 0 · ⛔ ללא תג 0/,
    );
  });

  /**
   * ⛔ **בדיקה 16 · שער ה-verify** ⟦הכרעה 100⟧ — הפיקסצ׳ר ⛔ אינו ריפו ו⛔ אין בו
   * `scripts/hooks`, ולכן הבדיקה ⛔ אינה יכולה לעבור כאן. זה בדיוק מה שנדרש: בודק
   * שעובר כי ⛔ לא הצליח לרוץ הוא בדיוק השקר שהקובץ הזה קיים נגדו.
   * 🔴 ⛔ **⟦REWRITTEN 08/09 · אותה מחלקה של `F-206`, שנמצאה בהרצת ההוכחה שלו⟧ הטענה כאן
   * הייתה `warned === true` ו-`failed === false`, והחלון הרך של בדיקה 16 נסגר ב-`2026-09-13`
   * — **אותו תאריך בדיוק** של בדיקה 17. ⇒ באותו יום, בלי ⛔ שום עריכה, הסימון היה עובר
   * ל-` FAIL `, שתי השורות היו נופלות, ו-`npm run verify` היה מאדים לחמשת הסוכנים.
   * ⛔ **נמדד ⛔ ולא שוער:** הרצת הבדיקות מול `softUntil` מוקדם הפילה בדיוק את השורה הזאת.
   * ⇒ הטענה היא על ה**וורדיקט** — «הבדיקה אמרה שה-hook חסר, והיא ⛔ לא שתקה» — ⛔ ולא על
   * הצבע שהתאריך קובע.
   */
  describe('הכרעה 100 — check 16 · שער ה-verify', () => {
    it('אומרת «⛔ hook חסר» על שורש שאין בו scripts/hooks, ומדווחת ⛔ בכל תאריך', () => {
      const r = run(healthy());
      expect(
        warned(r.out, '16') || failed(r.out, '16'),
        '⛔ הבדיקה מדווחת — רכה עד 13/09, קשה אחריו, ⛔ ולא שקטה',
      ).toBe(true);
      expect(notMeasured(r.out, '16'), '⛔ היא כן מדדה — ה-hook פשוט ⛔ אינו שם').toBe(false);
      expect(r.out).toMatch(/16\..*hook/);
      expect(r.out).toContain('npm run hooks:install');
    });

    it('מודדת את ההתקנה בריפו החי — ה-hook מותקן ⛔ ואינו ישן', () => {
      // ⛔ נמדד על השיבוט הזה, ⛔ לא על פיקסצ׳ר: זה כל מה שהבדיקה מבטיחה.
      const r = run('.');
      expect(r.out, 'שורת הבדיקה נדפסת').toMatch(/16\. ה-hook של verify/);
      expect(r.out, '⛔ hook חסר/ישן ⇒ הריפו החי אינו מותקן').not.toContain('⛔ hook חסר/ישן');
    });
  });

  /**
   * ⛔ **בדיקה 17 · סוכן שותק** ⟦הכרעה 101 ⓒ⟧ — הכשל הנמדד: שבעה חלונות QA רצופים
   * בין 04/09 19:12Z ל-06/09 11:00Z הפיקו ⛔ אפס קומיטים, ו⛔ שום דבר לא אמר למה.
   */
  describe('הכרעה 101 — check 17 · סוכן דלוק ששותק מעל 24 שעות', () => {
    /**
     * 🔴 ⛔ **⟦REWRITTEN 08/09 · `F-206` · `T-280`⟧ הטענה הזאת הייתה תלוית-תאריך, וב-13/09
     * היא הייתה מתהפכת ומאדימה את `npm run verify` לחמשת הסוכנים.**
     *
     * ⛔ נמדד ⛔ ולא שוער: היא טענה `warned === true` ו-`failed === false` על בדיקה שהחלון
     * הרך שלה נסגר ב-`2026-09-13` (`loop-health.mjs`). ⇒ ביום הזה, בלי ⛔ שום עריכה, הסימון
     * היה הופך ל-`FAIL`, שתי השורות היו נופלות, ו**הבדיקה הייתה שוברת את השער עצמו** —
     * ⛔ לא רק את דוח הבריאות.
     * ⇒ הטענה החדשה היא על ה**סיווג**, ⛔ ולא על המצב הרך/קשה: «roster חסר» הוא
     * **⛔ לא נמדד**, ⛔ ולעולם ⛔ לא כישלון — בשום תאריך.
     */
    it('roster.json חסר ⇒ «⛔ לא נמדד», ⛔ ולא כישלון — ⛔ בשום תאריך (F-206)', () => {
      const r = run(healthy());
      expect(notMeasured(r.out, '17'), '⛔ הסימון הוא n/m').toBe(true);
      expect(failed(r.out, '17'), '⛔ ⛔ אינה נספרת ככישלון').toBe(false);
      expect(warned(r.out, '17'), '⛔ ⛔ ואינה אזהרה — היא פשוט ⛔ לא נמדדה').toBe(false);
      expect(r.out).toMatch(/17\..*roster\.json/);
      expect(r.out, '⛔ «לא נמדד» ⛔ אינו «עבר», והדוח אומר זאת').toMatch(/⛔ לא נמדד/);
    });

    /**
     * 🟡 🔴 ⛔ **שלושה מצבים, ⛔ ולא שניים — זה כל `F-206`.**
     *
     * עד 08/09 «‏ref חסר בקלון», «סוכן חסום כדין» ו«סוכן מת» הדפיסו **את אותה שורה בדיוק**,
     * והשלישי הוא הסיבה שהבדיקה קיימת. ⛔ נמדד: CONTENT שתק **שלושה חלונות רצופים** עם
     * ריצות `SUCCEEDED` — ⛔ כי `F-194` חסם כל אצווה, ⛔ ולא כי הוא מת.
     * ⇒ הבדיקה בונה כאן ריפו git אמיתי בן שני קומיטים, כי ⛔ אין דרך לזייף `git log`.
     */
    describe('שלושת המצבים — חסום כדין ⛔ אינו נראה כמו מת (F-206 · T-280)', () => {
      const gitRepo = (subjects: string[]): string => {
        const root = healthy();
        const g = (...args: string[]) =>
          execFileSync('git', args, { cwd: root, stdio: ['ignore', 'pipe', 'ignore'] });
        // ⛔ `loop-health.mjs` קורא ל-`./scripts/g` יחסית ל-ROOT ⇒ עותק אמיתי, ⛔ לא בדל.
        mkdirSync(join(root, 'scripts'), { recursive: true });
        mkdirSync(join(root, 'docs', 'agents'), { recursive: true });
        copyFileSync('scripts/g', join(root, 'scripts', 'g'));
        chmodSync(join(root, 'scripts', 'g'), 0o755);
        writeFileSync(join(root, 'docs', 'agents', 'roster.json'), ROSTER_ONE, 'utf8');
        g('init', '-q', '-b', 'main');
        g('config', 'user.email', 't@t');
        g('config', 'user.name', 't');
        for (const subject of subjects) {
          writeFileSync(join(root, 'seq.txt'), subject, 'utf8');
          g('add', '-A');
          g('commit', '-q', '-m', subject);
        }
        // ⛔ הבדיקה קוראת `origin/work/current` בשמו המלא — ⛔ לא ענף מקומי.
        g('update-ref', 'refs/remotes/origin/work/current', 'HEAD');
        return root;
      };

      const ROSTER_ONE = JSON.stringify({
        agents: [{ name: 'DEV', commitPrefix: 'loop(DEV', enabled: true, maxSilentHours: 24 }],
      });

      const line17 = (out: string): string =>
        /^(?:  ok  | FAIL | warn | n\/m  )17\. .*$/m.exec(out)?.[0] ?? '';

      it('🟢 קומיט עבודה טרי ⇒ ok', () => {
        const r = run(gitRepo(['loop(DEV): C-0001 built the thing']));
        expect(line17(r.out), 'שורת הבדיקה נדפסת').not.toBe('');
        expect(failed(r.out, '17')).toBe(false);
        expect(warned(r.out, '17')).toBe(false);
        expect(notMeasured(r.out, '17')).toBe(false);
      });

      /**
       * ⛔ **הקומיט טרי, ⛔ אבל הוא שורת יומן — ⛔ לא עבודה.** ⇒ הסוכן חי, הסיבה כתובה,
       * ו⛔ אין כאן כישלון. ⛔ הדיווח ⛔ אינו נעלם: הוא מצטט את הסיבה מהיומן.
       */
      it('🟡 רק שורת יומן טרייה ⇒ «חי ללא עבודה», מדווח ו⛔ לא נכשל', () => {
        const r = run(gitRepo(['loop(DEV): C-0002 idle — F-194 blocks every batch']));
        expect(failed(r.out, '17'), '⛔ ⛔ לא כישלון — הוא אמר למה').toBe(false);
        expect(r.out, 'הסיבה מצוטטת מהיומן').toMatch(/חי ללא עבודה/);
        expect(r.out, 'ומצוטטת מילה במילה').toMatch(/F-194 blocks every batch/);
      });

      /**
       * 🔴 ⛔ **⛔ אף קומיט בתחילית הסוכן — ⛔ ולא שורת יומן.** זה, ⛔ ורק זה, מפיל את
       * הבדיקה. ⛔ סוכן שנמדד כמת ⛔ אינו נבדל בשום ערוץ אחר — `git log` הוא היחיד שרואים.
       */
      it('🔴 ⛔ אף קומיט ⇒ שקט מוחלט, וזה המצב היחיד שמפיל', () => {
        const r = run(gitRepo(['ops(runtime): somebody else entirely']));
        // ⛔ **⛔ לא `warned` ו⛔ לא `failed` — הבדיקה נעשית על ה**וורדיקט**, ⛔ לא על
        // החלון הרך. ‏17 עוברת מ-` warn ` ל-` FAIL ` ב-13/09 **בלי שום עריכה**, וטענה
        // על אחד מהשניים הייתה מתהפכת באותו יום. זו בדיוק התקלה ש-`F-206` פתח עליה.
        expect(warned(r.out, '17') || failed(r.out, '17'), '⛔ נספר — רך עד 13/09, קשה אחריו').toBe(
          true,
        );
        expect(notMeasured(r.out, '17'), '⛔ נמדד — יש roster ויש git').toBe(false);
        expect(r.out, 'שקט מוחלט, ⛔ ולא «חי ללא עבודה»').toMatch(/שקט מוחלט/);
        expect(r.out).not.toMatch(/חי ללא עבודה/);
      });
    });

    it('מודדת את ארבעת הסוכנים בריפו החי, ומדפיסה שעות לכל אחד', () => {
      const r = run('.');
      const line = /^(?:  ok  | FAIL | warn )17\. .*$/m.exec(r.out)?.[0] ?? '';
      expect(line, 'שורת הבדיקה נדפסת').not.toBe('');
      for (const name of ['DEV', 'PM', 'QA', 'CONTENT']) {
        expect(line, `${name} נמדד בשם`).toContain(name);
      }
      expect(line, 'המספר בשעות, ⛔ לא «כנראה»').toMatch(/\d+\.\d+ש׳|⛔/u);
    });

    /**
     * 🆕 ⟦06/09 · `RULES § 0.29`⟧ **חמישה, ⛔ ולא ארבעה — `PROMOTER` נכנס לרשימה.**
     * ⛔ והוא נכנס דווקא מפני שהוא ⛔ אינו סוכן בנייה: הוא מקדם `dev`⇢`main` ו⛔ אינו
     * דוחף קוד ל-`work/current`, ולכן **בלי שורת יומן יומית הוא ⛔ אינו נבדל מסוכן מת**
     * בעיני בדיקה 17 — בדיוק `F-188`. ⇒ הוא מחויב לשורה ב-`plan/archive/control-log.md`
     * בכל ריצה, בתחילית `loop(PROMOTER`.
     * ⚠️ **`maxSilentHours` שלו הוא 30, ⛔ ולא 24, וזה ⛔ אינו שרירותי:** הוא יורה פעם
     * ביום ב-23:00Z ⇒ הפער בין הקומיט שלו לריצה הבאה מגיע ל-~23.5 שעות **בלופ בריא
     * לגמרי**. תקרה של 24 הייתה מאדימה את הבדיקה על שגרה תקינה.
     */
    it('הרשימה בריפו מצהירה על חמשת הסוכנים ועל תחילית הקומיט של כל אחד', () => {
      const roster = JSON.parse(readFileSync('docs/agents/roster.json', 'utf8')) as {
        agents: {
          name: string;
          commitPrefix: string | string[];
          enabled: boolean;
          maxSilentHours?: number;
        }[];
      };
      expect(roster.agents.map((a) => a.name).sort()).toEqual([
        'CONTENT',
        'DEV',
        'PM',
        'PROMOTER',
        'QA',
      ]);
      for (const a of roster.agents) {
        // ⛔ תחילית אחת או כמה — ⛔ אבל כל אחת מהן חייבת להיות תחילית קומיט אמיתית.
        const prefixes = Array.isArray(a.commitPrefix) ? a.commitPrefix : [a.commitPrefix];
        expect(prefixes.length, `${a.name}: ⛔ לפחות תחילית אחת`).toBeGreaterThan(0);
        for (const p of prefixes) expect(p, `${a.name}: תחילית`).toMatch(/^loop\(/);
      }
      const promoter = roster.agents.find((a) => a.name === 'PROMOTER');
      expect(promoter, '⛔ PROMOTER חייב להיות ברשימה — אחרת ⛔ אף בדיקה ⛔ אינה מודדת אותו').toBeDefined();
      expect(promoter?.commitPrefix, 'התחילית שבדיקה 17 מחפשת').toBe('loop(PROMOTER');
      // ⛔ תקרה של 24 על סוכן שיורה פעם ביום היא אזהרה על לופ בריא.
      expect(promoter?.maxSilentHours ?? 24, '⛔ תקרת השקט חייבת לכסות מחזור יומי מלא').toBeGreaterThan(24);
    });

    /**
     * 🔴 ⛔ **⟦NEW 07/09⟧ הכשל שהבדיקה הזאת נכתבה עליו — ⛔ נמדד, ⛔ לא שוער.**
     *
     * QA שינה את תחילית הקומיט שלו מ-`loop(CRITIC` ל-`loop(QA`, וה-roster ⛔ לא עודכן.
     * נמדד על `origin/work/current` ב-07/09: **16** קומיטים בתחילית החדשה מול **13**
     * בישנה מאז 05/09 ⇒ בדיקה 17 קפאה על 06-09 21:07Z ודיווחה «QA שותק 24.8 שעות»
     * בזמן ש-QA דחף כל כמה דקות. ⛔ **סוכן חי שנקרא כמת — `F-188` בדיוק, הפוך.**
     *
     * ⚠️ **ולמה זה גרוע יותר ממספר שגוי:** אזהרה שלא יכולה להיסגר לעולם מאמנת כל סוכן
     * שקורא `loop:health` להתעלם ממנה. ⇒ הבדיקה הזאת ⛔ אינה בודקת את הצורה בלבד, אלא
     * ש**המספר המודפס נגזר מהקומיט האחרון שנכתב בפועל**, בכל אחת מהתחיליות.
     */
    it('⛔ בדיקה 17 מודדת את QA לפי התחילית שהוא כותב בפועל, ⛔ לא לפי השם הישן בלבד', () => {
      const roster = JSON.parse(readFileSync('docs/agents/roster.json', 'utf8')) as {
        agents: { name: string; commitPrefix: string | string[] }[];
      };
      const qa = roster.agents.find((a) => a.name === 'QA');
      const prefixes = Array.isArray(qa?.commitPrefix) ? qa.commitPrefix : [qa?.commitPrefix ?? ''];
      expect(prefixes, '⛔ התחילית שהוא כותב בפועל').toContain('loop(QA');
      expect(prefixes, '⛔ וההיסטוריה מחזיקה גם את הישנה').toContain('loop(CRITIC');

      // ⛔ המספר, ⛔ לא הצורה: הקומיט האחרון תחת **אחת** מהתחיליות, ישירות מ-git.
      let newestTs: number | null = null;
      try {
        const log = execFileSync(
          'git',
          ['log', 'origin/work/current', '--format=%ct%x1f%s', '-400'],
          { encoding: 'utf8' },
        );
        for (const line of log.trim().split('\n').filter(Boolean)) {
          const [ts, subject = ''] = line.split('\x1f');
          if (prefixes.some((p) => subject.startsWith(p))) {
            newestTs = Number(ts);
            break;
          }
        }
      } catch {
        newestTs = null; // ⛔ אין git/ref ⇒ נבדקת הצורה בלבד, ⛔ ולא נכשלים על הסביבה.
      }

      const line = /^(?:  ok  | FAIL | warn )17\. .*$/m.exec(run('.').out)?.[0] ?? '';
      const printed = /QA (\d+\.\d+)ש׳/u.exec(line)?.[1];
      if (newestTs !== null && printed !== undefined) {
        const expected = (Date.now() / 1000 - newestTs) / 3600;
        // ⛔ עם הבאג המספר היה של `loop(CRITIC` בלבד — שעות שלמות משעות הרחק מזה.
        expect(Number(printed), '⛔ המספר נגזר מהקומיט האחרון בפועל').toBeCloseTo(expected, 0);
      }
    });
  });

  /**
   * 🔓 **`T-278` — כל סוכן שנועל חייב להופיע ב-`§ 0.4`, גם כשורה וגם כמי שנסוגים מפניו.**
   * ⟦NEW 08/09⟧
   *
   * 🔬 **הכשל שנמדד:** `loop(PROMOTER): C-0495 lock` נדחף 07/09 23:23Z ⇒ PROMOTER **כן**
   * תופס `LOCK_HELD_BY`. ‏`§ 0.4` מנתה שלוש שורות ו⛔ **לא הזכירה אותו באף אחת** ⇒ ריצה
   * שלו שנמתחה אל תוך חלון DEV העמידה את DEV מול נעילה שהחוקה ⛔ לא ציוותה עליו לכבד.
   * ⛔ **תזמון מקטין הסתברות, ⛔ ואינו מגדיר התנהגות** — ולכן זו בדיקה, ⛔ ולא הערה.
   *
   * ⚠️ **המקור לרשימת הנועלים הוא `roster.json`, ⛔ ולא רשימה שנייה כאן** — רשימה שנייה
   * היא בדיוק הדבר שהבדיקה הזאת קיימת כדי למנוע.
   */
  it('כל סוכן דלוק ב-roster מופיע ב-§ 0.4 — כשורה, וגם בתא «נסוג מפני» של אחר (T-278)', () => {
    const roster = JSON.parse(readFileSync('docs/agents/roster.json', 'utf8')) as {
      agents: { name: string; enabled: boolean }[];
    };
    const rules = readFileSync('plan/RULES.md', 'utf8');
    const section = /### 0\.4 [\s\S]*?\n### /.exec(rules)?.[0] ?? '';
    expect(section, '§ 0.4 נמצא').not.toBe('');

    const rows = section.split('\n').filter((l) => /^\| \*\*[A-Z]+\*\* \|/.test(l));
    const rowNames = rows.map((l) => /^\| \*\*([A-Z]+)\*\*/.exec(l)?.[1] ?? '');
    const yieldedTo = rows.map((l) => l.split('|')[2] ?? '').join(' ');

    for (const a of roster.agents.filter((x) => x.enabled)) {
      expect(rowNames, `${a.name}: שורה משלו — למי הוא נסוג`).toContain(a.name);
      expect(
        yieldedTo,
        `${a.name}: הוא נועל ⇒ מישהו חייב להיות מצווה לכבד את הנעילה שלו`,
      ).toContain(a.name);
    }
  });

  it('writes nothing into the repo it measures', () => {
    // ⛔ A checker with side effects is a checker nobody can run safely.
    const root = healthy();
    const before = readFileSync(join(root, 'plan/50-tasks.md'), 'utf8');
    run(root);
    expect(readFileSync(join(root, 'plan/50-tasks.md'), 'utf8')).toBe(before);
  });
});
