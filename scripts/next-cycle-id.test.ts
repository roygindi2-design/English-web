import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CYCLE_ID_BRANCHES, formatCycleId, maxCycleNumber, nextCycleId } from './next-cycle-id.mjs';

describe('scripts/next-cycle-id.mjs', () => {
  it('finds the highest C-xxxx id across one text blob', () => {
    const log = 'loop(DEV): C-0201 fix x\nloop(PM): C-0199 plan y\n';
    expect(maxCycleNumber([log])).toBe(201);
  });

  it('returns 0 when no C-xxxx id is present, so the next id starts at C-0001', () => {
    expect(maxCycleNumber([''])).toBe(0);
    expect(maxCycleNumber(['no ids here'])).toBe(0);
  });

  /**
   * 🔴 Reproduces the measured collision, verbatim from
   * `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 1.2 כ-1: commit
   * `bf4c785` locked in as `C-0426` on one branch view; the very next commit in
   * sequence, `e94a4ae`, had to fix itself with "previous commit wrongly called
   * itself C-0426". Two agents ran max+1 against only ONE branch each and got
   * the same number. The fix is structural: always take the max across BOTH
   * remotes together, never one alone.
   */
  it('🔴 takes the max ACROSS both branches, not the max of either alone — closes the C-0426 collision', () => {
    const devLog = 'loop(DEV): C-0425 a\nloop(QA): C-0424 merge\n';
    // work/current is AHEAD of dev by one commit that dev has not seen yet.
    const workCurrentLog = 'loop(DEV): C-0426 b\nloop(DEV): C-0425 a\n';
    // An agent that only reads `dev` would compute max(425) + 1 = C-0426 — a
    // collision with the id `work/current` already used.
    expect(maxCycleNumber([devLog])).toBe(425);
    // Reading both together is what closes it: C-0427, never C-0426 again.
    expect(maxCycleNumber([devLog, workCurrentLog])).toBe(426);
    expect(formatCycleId(maxCycleNumber([devLog, workCurrentLog]) + 1)).toBe('C-0427');
  });

  it('formats with zero-padding to 4 digits, no cap below 9999', () => {
    expect(formatCycleId(1)).toBe('C-0001');
    expect(formatCycleId(453)).toBe('C-0453');
    expect(formatCycleId(10000)).toBe('C-10000');
  });

  it('ignores ids embedded in unrelated tokens (word boundary, not substring)', () => {
    // "XC-0426Y" must not match — only a real `C-####` token counts.
    expect(maxCycleNumber(['XC-0426Y really-not-an-id'])).toBe(0);
  });
});

/**
 * ⛔ The declaration file is hand-written (`next-cycle-id.d.mts`), so it can drift
 * from the module. The block above catches a changed BEHAVIOUR; this one catches
 * a changed SHAPE — the same pairing `motion-gate.test.ts`/`story-tap-audit.test.ts` use.
 */
describe('the hand-written declaration file', () => {
  it('declares exactly the names the module exports', async () => {
    const mod = await import('./next-cycle-id.mjs');
    const declared = [
      ...readFileSync('scripts/next-cycle-id.d.mts', 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});

/**
 * 🔢 **`T-317` — ‏`origin/main` נכנס למונה.**  ⟦NEW 13/09 · `D-227` · סוגרת את `F-231` · המשך של `T-254`⟧
 *
 * 🔬 **נמדד, ⛔ ולא שוער:** `C-0284` (24/08) · `C-0426` (04/09) · `C-0546` (12/09) —
 * שלושה זוגות טיקים שנשאו את אותו `C-XXXX`. ‏`T-254` כבר מושכת **שני** ענפים,
 * ⛔ אבל PROMOTER ⛔ אינו דוחף לאף אחד מהם: הוא מקדם ל-`main`. ⇒ המזהה שלו
 * ⛔ אינו גלוי למונה, ו-`git log --grep C-0546` מחזיר שני טיקים של שני סוכנים.
 * וזה בדיוק הערוץ ש-`loop:health` בדיקה 17 קוראת בו את הלופ.
 *
 * 🔴 **הגדר:** ⛔ **צורת המזהה ⛔ אינה משתנה** — `C-\d+` נשאר, ו-`C-0546-DEV` נדחתה
 * ב-`D-227` בשמה.
 */
describe('🔢 T-317 — שלושה ענפים, ⛔ ולא שניים', () => {
  it('שלושת הענפים מוצהרים במקום אחד, ו-`origin/main` ביניהם', () => {
    expect([...CYCLE_ID_BRANCHES].sort()).toEqual(['origin/dev', 'origin/main', 'origin/work/current']);
  });

  /** ⛔ בדל git: מחזיר יומן לכל ענף, ⛔ ורושם מה נמשך — כדי שגם ה-`fetch` ייבדק. */
  const gitStub = (logs: Record<string, string>) => {
    const fetched: string[][] = [];
    const git = (...args: string[]): string => {
      if (args[0] === 'fetch') {
        fetched.push(args);
        return '';
      }
      if (args[0] === 'log') {
        const ref = args[1] ?? '';
        const log = logs[ref];
        if (log === undefined) throw new Error(`⛔ ${ref} לא נגיש`);
        return log;
      }
      throw new Error(`⛔ פקודה לא צפויה: ${args.join(' ')}`);
    };
    return { git, fetched };
  };

  it('🔴 `C-0600` יושב על `main` בלבד ⇒ המזהה הבא הוא `C-0601`, ⛔ ולא `C-0427`', () => {
    const { git } = gitStub({
      'origin/dev': 'loop(QA): C-0425 merge\n',
      'origin/work/current': 'loop(DEV): C-0426 b\n',
      'origin/main': 'loop(PROMOTER): C-0600 promote\n',
    });
    // ⛔ המונה הישן קרא שני ענפים בלבד ⇒ max(426)+1 = C-0427, התנגשות עם קידום קיים.
    expect(maxCycleNumber(['loop(QA): C-0425 merge\n', 'loop(DEV): C-0426 b\n'])).toBe(426);
    expect(nextCycleId(git)).toBe('C-0601');
  });

  it('⛔ ענף אחד לא נגיש ⇒ המונה ממשיך על מה שכן, ⛔ ואינו מת', () => {
    const { git } = gitStub({
      'origin/work/current': 'loop(DEV): C-0426 b\n',
      'origin/main': 'loop(PROMOTER): C-0430 promote\n',
    });
    expect(nextCycleId(git)).toBe('C-0431');
  });

  it('⛔ אף ענף לא נגיש ⇒ זורק, ⛔ ו⛔ לא מחזיר `C-0001` בשקט', () => {
    const { git } = gitStub({});
    expect(() => nextCycleId(git)).toThrow();
  });

  it('ה-`fetch` מושך את שלושת הענפים', () => {
    const { git, fetched } = gitStub({
      'origin/dev': 'C-0001',
      'origin/work/current': 'C-0002',
      'origin/main': 'C-0003',
    });
    nextCycleId(git);
    expect(fetched).toHaveLength(1);
    expect(fetched[0]).toEqual(['fetch', 'origin', 'dev', 'work/current', 'main']);
  });
});
