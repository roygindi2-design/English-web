import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FINDING_STATUS_INDEX, classifyStatus, splitRow } from '../lib/core/planTable';

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

  /**
   * 🔒 **⟦23/09 · `C-0762` · הוראת רוי⟧ סגירה ⛔ אינה סגירה עד שעמודת הסטטוס אומרת זאת.**
   *
   * 🔬 **הפגם נמדד, ⛔ ולא שוער:** שלוש סגירות נכתבו לעמודת **`סבב`** ⟨תא 7⟩ ו⛔ לא
   * לעמודת **הסטטוס** ⟨תא 6⟩ — `F-286` ⟨נסגר בקוד ב-`C-0714`, 18/09⟩, `F-251` ו-`F-252`
   * ⟨`C-0615`, 14/09⟩. ⇒ השורה המשיכה להיספר **פתוחה** בכל מכונה שקוראת סטטוס, ו-`F-286`
   * הוצג חמישה ימים כ«חוסם את הלופ» אחרי שכבר לא חסם דבר.
   *
   * ⛔ **ולמה כאן ⛔ ולא ב-`loop:health`:** ‏`loop:health` מייעץ בלבד. הקובץ הזה רץ ב-pre-push
   * **בכל דחיפה** — גם בנתיב המהיר ו**גם תחת `SKIP_VERIFY`** ⇒ ⛔ אין דרך לדחוף סגירה חצויה.
   *
   * ⛔ **והכלל צר בכוונה:** תא `סבב` ש**פותח** ב-✅ ⟨לפני כל ⟨הערה⟩⟩, או שנושא «✅ **נסגר»,
   * הוא הכרזת סגירה. ⇒ עמודת הסטטוס חייבת להיות ✅ או 🚫. ⛔ ✅ שיושב **בתוך** פרוזה
   * ⟨«ⓐ ✅ נבנה, ⓑ פתוח»⟩ ⛔ אינו הכרזה, ו⛔ אינו נתפס.
   */
  it('🔒 a closure declared in the round column is also in the status column', () => {
    const disagree: string[] = [];
    let rows = 0;
    for (const line of FINDINGS.split('\n')) {
      const id = /^\|\s*(F-\d{3})\s*\|/.exec(line)?.[1];
      if (id === undefined) continue;
      rows += 1;
      const cells = splitRow(line);
      const round = (cells[FINDING_STATUS_INDEX + 1] ?? '').trim();
      const declaresClosed = /^[^⟨]{0,40}✅/u.test(round) || /✅\s*\*\*נסגר/u.test(round);
      if (!declaresClosed) continue;
      const state = classifyStatus(cells[FINDING_STATUS_INDEX] ?? '');
      if (state !== 'done' && state !== 'cancelled') disagree.push(`${id} (סטטוס: ${state})`);
    }
    // ⛔ guards the parser: a register the loop cannot split is not a register that agrees.
    expect(rows).toBeGreaterThan(20);
    expect(
      disagree,
      'עמודת «סבב» מכריזה ✅ ועמודת הסטטוס ⛔ לא — עדכנו את תא הסטטוס לאותה סגירה',
    ).toEqual([]);
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

/**
 * 🚨 **`plan/20-alerts.md` — הקובץ היחיד מבין הרגיסטרים ש⛔ שום שער ⛔ לא קרא.**
 * ⟦NEW 10/09⟧
 *
 * 🔬 **נמדד 09/09:** ‏`R-027` נשאה **11** תאים ו-`R-028` נשאה **10**, מול **9** בכל
 * שאר 26 השורות — שתי שורות שגויות מזה שבועות, ו⛔ אף בדיקה ⛔ לא ראתה אותן.
 * ‏`measure:plan` קורא `50-tasks` ו-`60-findings` בלבד, עם תקרת שורות פגומות **0**;
 * הקובץ הזה ⛔ מעולם ⛔ לא נכלל. **הכלל היה שם, השער ⛔ לא.**
 *
 * ⚠️ **והספירה חייבת לכבד `\|`** — פיצול נאיבי סופר תו בורח כמפריד. זו בדיוק
 * המחלקה של `F-078`, והיא תפסה אותי בזמן שתיקנתי את השורות האלה.
 */
describe('🚨 שורות ההתראה שמורות לפי עמודה', () => {
  const fields = (line: string): string[] => {
    const out: string[] = [];
    let cur = '';
    for (let i = 0; i < line.length; i += 1) {
      if (line[i] === '\\' && line[i + 1] === '|') { cur += '\\|'; i += 1; continue; }
      if (line[i] === '|') { out.push(cur); cur = ''; continue; }
      cur += line[i];
    }
    out.push(cur);
    return out;
  };
  const rows = readFileSync('plan/20-alerts.md', 'utf8')
    .split('\n')
    .filter((l) => /^\| ?`?R-\d+/.test(l));

  it('⛔ יש שורות התראה בכלל', () => {
    expect(rows.length).toBeGreaterThan(20);
  });

  it('🔴 כל שורה נושאת בדיוק 9 שדות — ⛔ אחרת היא ⛔ אינה נקראת לפי עמודה', () => {
    const bad = rows
      .map((l) => ({ id: /R-\d+/.exec(l)?.[0] ?? '?', n: fields(l).length }))
      .filter((r) => r.n !== 9);
    expect(bad, `שורות פגומות: ${bad.map((b) => `${b.id}=${b.n}`).join(' ')}`).toEqual([]);
  });

  it('⛔ כל שורה **פתוחה** מצהירה על חסימה — ⛔ «חוסמת פיתוח» ⛔ אינה הצהרה', () => {
    // ⛔ **שורה סגורה ⛔ אינה חוסמת מעצם הגדרתה** ⇒ הטענה חלה על הפתוחות בלבד,
    // שהן היחידות שמישהו עשוי לקרוא כחסם. ⟦הכלל של רוי, 10/09: «כל שורה חדשה».⟧
    const silent = rows
      .filter((l) => /🔓/.test(fields(l)[7] ?? ''))
      .filter((l) => !/חוסמ|חוסם/.test(fields(l)[7] ?? ''))
      .map((l) => /R-\d+/.exec(l)?.[0] ?? '?');
    expect(
      silent,
      `⛔ שורות שתא הסטטוס שלהן ⛔ אינו אומר אם היא חוסמת: ${silent.join(' ')}`,
    ).toEqual([]);
  });
});
