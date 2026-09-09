import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * F-025 — protocol hygiene on the task register.
 *
 * `plan/50-tasks.md` is the only place a task ID is minted, and three agents
 * address each other by that ID alone ("continued in T-034"). A duplicate ID is
 * not a typo: it silently reroutes an agent to a different task than the one the
 * finding meant, and F-025 shows it survived 33 cycles unnoticed because nothing
 * ever looked. A human reading a 44-row table will not catch the 45th collision
 * either — so the register is checked by a machine.
 */
const TASKS = readFileSync('plan/50-tasks.md', 'utf8');

/** Only the ID cell of a real table row — `| T-034 | M2 | …`. */
const ROW_ID = /^\|\s*(T-\d{3})\s*\|/gm;

function taskIds(): string[] {
  // `m[1]` is `string | undefined` under noUncheckedIndexedAccess even though the
  // group is not optional — filtered, not asserted, so an unmatched shape becomes
  // a missing row (which the length guard below catches) and never `undefined`.
  return [...TASKS.matchAll(ROW_ID)].map((m) => m[1]).filter((id): id is string => id !== undefined);
}

describe('plan/50-tasks.md — the task register', () => {
  it('has rows at all (guards the regex, not just the file)', () => {
    // Without this, a change to the table format turns every assertion below
    // into a vacuous pass over an empty list.
    expect(taskIds().length).toBeGreaterThan(20);
  });

  it('mints every task ID exactly once', () => {
    const ids = taskIds();
    const seen = new Map<string, number>();
    for (const id of ids) seen.set(id, (seen.get(id) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
    expect(duplicates, 'two tasks under one ID reroute agents to the wrong row').toEqual([]);
  });

  it('leaves no gap in the ID sequence — a gap means an ID was lost, not freed', () => {
    // A retired task keeps its row and its ID; IDs are never recycled, because a
    // finding written two months ago still points at the old one.
    const numbers = taskIds()
      .map((id) => Number(id.slice(2)))
      .sort((a, b) => a - b);
    const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });
});

/**
 * The same rule, one register over — `plan/30-architecture.md` § technical debt.
 *
 * The task register above is machine-checked since F-025; the debt register never
 * was, and it collided anyway: `TD-28` was minted twice — C-0102 for `elapsed_ms`
 * (`components/StudyDeckScreen`) and C-0145 for migration `0011` not yet applied.
 * Two unrelated debts under one ID is not cosmetic: a journal line reading
 * "TD-28 נסגר" closes an ambiguous item, and a `grep -n TD-28` hands the next
 * agent someone else's debt. Measured C-0150: 31 rows, exactly one collision.
 */
const ARCHITECTURE = readFileSync('plan/30-architecture.md', 'utf8');

/** Only the ID cell of a real table row — `| TD-28 | **…** | …`. */
const DEBT_ROW_ID = /^\|\s*(TD-\d{1,3})\s*\|/gm;

function debtIds(): string[] {
  // Filtered rather than asserted, for the same noUncheckedIndexedAccess reason
  // as `taskIds()`: an unmatched shape becomes a missing row, never `undefined`.
  return [...ARCHITECTURE.matchAll(DEBT_ROW_ID)]
    .map((m) => m[1])
    .filter((id): id is string => id !== undefined);
}

describe('plan/30-architecture.md — the technical-debt register', () => {
  it('has rows at all (guards the regex, not just the file)', () => {
    // Without this, a change to the table format turns every assertion below
    // into a vacuous pass over an empty list.
    expect(debtIds().length).toBeGreaterThan(20);
  });

  it('mints every debt ID exactly once', () => {
    const seen = new Map<string, number>();
    for (const id of debtIds()) seen.set(id, (seen.get(id) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
    expect(duplicates, 'two debts under one ID make "TD-nn נסגר" ambiguous').toEqual([]);
  });

  it('leaves no gap in the ID sequence — a gap means an ID was lost, not freed', () => {
    // A closed debt keeps its row and its ID (see the ✅ rows); IDs are never
    // recycled, because a plan written two weeks ago still points at the old one.
    const numbers = debtIds()
      .map((id) => Number(id.slice(3)))
      .sort((a, b) => a - b);
    const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });
});

/**
 * F-078 · T-128 — אותו חוק, רגיסטר אחד הלאה.
 *
 * `F-076` הוטבע פעמיים (שורות 97 ו-99) על שני ממצאים שונים. זה ⛔ אינו קוסמטי:
 * `measure-plan-tables.mjs:56-61` בונה `findingStates` כ-`Map`, כלומר השני דורס את
 * הראשון בשקט — ממצא שלם נעלם מהמכונה, ו-`staleBlocks` מכריעה עליו לפי הסטטוס של
 * ממצא אחר לגמרי. זו בדיוק מחלקת `TD-28`, שלישית באותה משפחה.
 */
const FINDINGS = readFileSync('plan/60-findings.md', 'utf8');

/** Only the ID cell of a real table row — `| F-076 | 🟡 MEDIUM | …`. */
const FINDING_ROW_ID = /^\|\s*(F-\d{3})\s*\|/gm;

function findingIds(): string[] {
  return [...FINDINGS.matchAll(FINDING_ROW_ID)]
    .map((m) => m[1])
    .filter((id): id is string => id !== undefined);
}

describe('plan/60-findings.md — the findings register', () => {
  it('has rows at all (guards the regex, not just the file)', () => {
    expect(findingIds().length).toBeGreaterThan(20);
  });

  it('mints every finding ID exactly once', () => {
    const seen = new Map<string, number>();
    for (const id of findingIds()) seen.set(id, (seen.get(id) ?? 0) + 1);
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1).map(([id, n]) => `${id}×${n}`);
    expect(duplicates, 'a duplicate finding ID silently drops one finding from findingStates').toEqual([]);
  });

  it('leaves no gap in the ID sequence — a gap means an ID was lost, not freed', () => {
    const numbers = findingIds()
      .map((id) => Number(id.slice(2)))
      .sort((a, b) => a - b);
    const expected = Array.from({ length: numbers.length }, (_, i) => i + 1);
    expect(numbers).toEqual(expected);
  });
});


/**
 * ⛔ **P4-1 — החזון הישן הוארך, וזו הבדיקה שמונעת ממנו לחזור.**
 * ‏`plan/01-vision.md` הכריז «ארבע לשוניות, ⛔ לא חמש» בזמן ש-`36 § 13` פריט 2 הוא
 * «לשונית חמישית». ⛔ סוכן שקרא את שניהם ⛔ אינו יכול לציית לשתיהן — זו ⛔ אינה
 * שאלת ניסוח. ⇒ הקובץ הוא **מצבה**, והבדיקה כאן שומרת שהוא יישאר כזה.
 */
describe('plan/01-vision.md — מצבה, ⛔ ולא חזון (P4-1)', () => {
  const tomb = readFileSync(join('plan', '01-vision.md'), 'utf8');

  it('הנוסח המלא נשמר בארכיון — ⛔ הוארך, ⛔ ולא נמחק', () => {
    const archived = readFileSync(
      join('plan', 'archive', '01-vision-retired-2026-08-24.md'),
      'utf8',
    );
    expect(archived.length).toBeGreaterThan(3000);
    expect(archived).toContain('שכבה 3');
  });

  it('המצבה מפנה למסמך העוגן ומצהירה שהיא ⛔ אינה מקור', () => {
    expect(tomb).toContain('plan/36-video-spec.md');
    expect(tomb).toContain('⛔ אינו מקור');
  });

  /** ⛔ הטענה שנושאת את כל המשקל: התוכן הסותר ⛔ אינו חוזר לקובץ החי. */
  it('⛔ ⛔ אין בה שכבות ו⛔ אין בה את הסתירה שבגללה הוארכה', () => {
    for (const banned of ['שכבה 1 —', 'שכבה 2 —', 'ארבע לשוניות']) {
      expect(tomb, banned).not.toContain(banned);
    }
    // ⛔ מצבה שגדלה היא חזון שחזר בדלת האחורית.
    expect(tomb.length).toBeLessThan(2500);
  });

  it('⛔ אף פרומפט סוכן ⛔ אינו מורה לקרוא אותה', () => {
    for (const agent of ['DEV', 'PM', 'QA', 'CONTENT']) {
      const body = readFileSync(join('docs', 'agents', `${agent}.md`), 'utf8');
      expect(body, agent).not.toMatch(/(read|קרא|Read)[^\n]{0,40}01-vision/i);
    }
  });
});
