/**
 * `gc:memory` — השער על פינוי הזיכרון. ⛔ הבדיקות כאן ⛔ אינן נוגעות ב-fs
 * ו⛔ אינן נוגעות ב-git: הן בודקות את **ההכרעה הטהורה**, שהיא המקום היחיד שבו
 * טעות מוחקת דיון חי או משאירה קובץ שגדל לנצח.
 */
import { describe, expect, it } from 'vitest';
import {
  HEADING,
  LIVE_CONTRACT,
  NEVER_TOUCH,
  TOMBSTONE_MARK,
  citationsIn,
  liveCitedIds,
  cleanTitle,
  datesIn,
  daysBetween,
  sectionsOf,
  shouldTombstone,
  tombstoneFor,
  controlHistorySection,
  controlHistoryRows,
  safeHistoryKeepN,
  CONTROL_CEILING,
  CONTROL_HISTORY_MAX_KEEP,
  assertOnlyHistoryRowsChanged,
  pruneControlHistory,
} from './gc-memory.mjs';

const base = {
  id: 'D-100',
  body: 'דיון ארוך',
  rank: 40,
  keepN: 20,
  ageDays: 60,
  days: 14,
};

describe('חוק הברזל', () => {
  it('שני הקבצים הקפואים ברשימה, ⛔ ואין דרך להוסיף להם', () => {
    expect(NEVER_TOUCH).toEqual(['plan/RULES.md', 'plan/35-design-constitution.md']);
  });
});

describe('shouldTombstone', () => {
  it('מגדים החלטה ישנה שאינה בין האחרונות', () => {
    expect(shouldTombstone(base).tomb).toBe(true);
  });

  it('⛔ אינו נוגע ב-N ההחלטות האחרונות, גם אם הן בנות שנה', () => {
    expect(shouldTombstone({ ...base, rank: 19, ageDays: 400 }).tomb).toBe(false);
    expect(shouldTombstone({ ...base, rank: 0 }).tomb).toBe(false);
  });

  it('⛔ אינו נוגע בהחלטה שנגעו בה בתוך החלון', () => {
    expect(shouldTombstone({ ...base, ageDays: 14 }).tomb).toBe(false);
    expect(shouldTombstone({ ...base, ageDays: 0 }).tomb).toBe(false);
    expect(shouldTombstone({ ...base, ageDays: 15 }).tomb).toBe(true);
  });

  it('אידמפוטנטי — סעיף שכבר נושא מצבה ⛔ אינו מטופל שוב', () => {
    expect(shouldTombstone({ ...base, body: `> [D-100] x ⟨… · ${TOMBSTONE_MARK} 31/08/2026⟩` }).tomb).toBe(false);
    /* גם המצבות הידניות מ-C-0374 — ⟨מואַרך 31/08/2026 · C-0374⟩ — נתפסות. */
    expect(shouldTombstone({ ...base, body: '⟨מואַרך 31/08/2026 · C-0374⟩' }).tomb).toBe(false);
  });

  it('סעיף בלי תאריך כלל — מוגדם, ⛔ ולא נשמר בשקט לנצח', () => {
    expect(shouldTombstone({ ...base, ageDays: null }).tomb).toBe(true);
  });
});

describe('החוזה החי — ⓐ', () => {
  it('החלטה שמצוטטת בחוזה חי ⛔ אינה מוגדמת, ⛔ גם אם היא בת שנה', () => {
    expect(shouldTombstone({ ...base, ageDays: 400, rank: 140, citedLive: true }).tomb).toBe(false);
  });

  it('⛔ `50-tasks`/`60-findings` ⛔ אינם בחוזה החי — הם מצטטים הכול והיו מרוקנים את ה-GC', () => {
    expect(LIVE_CONTRACT).not.toContain('plan/50-tasks.md');
    expect(LIVE_CONTRACT).not.toContain('plan/60-findings.md');
    expect(LIVE_CONTRACT).toContain('plan/00-control.md');
    expect(LIVE_CONTRACT).toContain('docs/agents/PM.md');
  });

  it('liveCitedIds אוסף רק `D-xxx`, וקובץ חסר ⛔ אינו זורק', () => {
    const ids = liveCitedIds((p: string) => (p === 'plan/00-control.md' ? 'ראה D-171 ו-D-033 · T-225' : null));
    expect([...ids].sort()).toEqual(['D-033', 'D-171']);
  });
});

describe('HEADING', () => {
  it('תופס כותרת החלטה בשלוש הרמות', () => {
    expect(HEADING.exec('## D-020 — כותרת')?.[2]).toBe('D-020');
    expect(HEADING.exec('### D-137 — כותרת')?.[2]).toBe('D-137');
    expect(HEADING.exec('#### D-029 — כותרת')?.[2]).toBe('D-029');
  });

  it('⛔ ⛔ אינו תופס שורת טבלה — § 4.1 הוא כבר מצבה בת שורה', () => {
    expect(HEADING.exec('| D-001 | Next.js + Supabase | … |')).toBeNull();
  });

  it('⛔ ⛔ אינו תופס כותרת שאינה החלטה', () => {
    expect(HEADING.exec('### 4.1 יומן החלטות')).toBeNull();
  });
});

describe('sectionsOf', () => {
  const lines = [
    '### D-137 — הראשונה',
    'גוף א',
    '#### D-138 — מקוננת',
    'גוף ב',
    '### D-139 — השנייה',
    'גוף ג',
  ];

  it('סעיף נמשך עד כותרת ברמה שווה או גבוהה, ⛔ ולא עד «הכותרת הבאה»', () => {
    const s = sectionsOf(lines);
    expect(s.map((x: { id: string }) => x.id)).toEqual(['D-137', 'D-138', 'D-139']);
    expect(s[0]).toMatchObject({ start: 0, end: 4 });
    expect(s[1]).toMatchObject({ start: 2, end: 4 });
    expect(s[2]).toMatchObject({ start: 4, end: 6 });
  });
});

describe('datesIn · daysBetween', () => {
  it('קורא את שתי הצורות שהלופ כותב בהן', () => {
    expect(datesIn('נכתב 2026-08-14 ותוקן 31/08/2026')).toEqual(['2026-08-14', '2026-08-31']);
  });

  it('⛔ ⛔ אינו קורא מספר שאינו תאריך', () => {
    expect(datesIn('375×780 · 1,209 פריטים')).toEqual([]);
  });

  it('הפרש ימים קלנדרי, ⛔ בלי שעון', () => {
    expect(daysBetween('2026-08-18', '2026-09-01')).toBe(14);
    expect(daysBetween('2026-09-01', '2026-09-01')).toBe(0);
  });
});

describe('citationsIn', () => {
  it('שומר נתיב קובץ, גם עם `:12`', () => {
    expect(citationsIn('ראה `lib/core/deck.ts:47` ו-`app/globals.css`'))
      .toEqual(['lib/core/deck.ts', 'app/globals.css']);
  });

  it('שומר שם תוכנית — זה מה שמחזיק את `loop:health` בדיקה 6 ירוקה', () => {
    expect(citationsIn('נגזר מ-2026-08-20-arena-completion.md'))
      .toEqual(['2026-08-20-arena-completion.md']);
  });
});

describe('cleanTitle', () => {
  it('מסלק הדגשה, גרשיים והערת מחזור', () => {
    expect(cleanTitle('**השורה היא משמעות** *(PM, C-0046)*')).toBe('השורה היא משמעות');
  });

  it('⛔ ⛔ אינו חותך באמצע מילה', () => {
    const long = cleanTitle(`${'מילה '.repeat(40)}`);
    expect(long.endsWith('…')).toBe(true);
    expect(long.length).toBeLessThanOrEqual(101);
  });
});

describe('tombstoneFor', () => {
  const stone = tombstoneFor({
    id: 'D-137', title: 'כותרת', cites: ['lib/core/x.ts'], today: '2026-09-01',
  });

  it('שורת מצבה בפורמט המוסכם, עם חותמת תאריך', () => {
    expect(stone[0]).toContain('> [D-137] כותרת');
    expect(stone[0]).toContain(TOMBSTONE_MARK);
    expect(stone[0]).toContain('01/09/2026');
  });

  it('שורת הציטוטים נכתבת רק כשיש ציטוט', () => {
    expect(stone).toHaveLength(3);
    expect(stone[1]).toContain('lib/core/x.ts');
    expect(tombstoneFor({ id: 'D-1', title: 'x', cites: [], today: '2026-09-01' })).toHaveLength(2);
  });
});

/* T-249 — שלב ג׳: יומן העברות המקל ב-`00-control.md § 0.1`. */
describe('controlHistorySection', () => {
  it('⛔ אין כותרת 0.1 בקובץ ⇐ null, ⛔ ולא שגיאה', () => {
    expect(controlHistorySection(['אין כאן שום דבר', 'שורה שנייה'])).toBeNull();
  });

  it('בלי כותרת הבאה — הסעיף נמשך עד סוף הקובץ', () => {
    const lines = ['לפני', '### 0.1 יומן העברות מקל', 'שורה בתוך הסעיף'];
    const section = controlHistorySection(lines);
    expect(section).toEqual({ start: 1, end: 3 });
  });

  it('עם כותרת הבאה ברמה 1-3 — הסעיף נעצר שם, ⛔ ולא בולע אותה', () => {
    const lines = ['### 0.1 יומן העברות מקל', 'שורה', '### 0.2 סעיף אחר', 'לא שייך'];
    const section = controlHistorySection(lines);
    expect(section).toEqual({ start: 0, end: 2 });
  });
});

describe('controlHistoryRows', () => {
  it('אוסף רק שורות `| C-XXXX |`, בסדר הופעתן, בתוך גבולות הסעיף', () => {
    const lines = [
      '### 0.1 יומן העברות מקל',
      '| Cycle | מסוכן | לסוכן |',
      '|---|---|---|',
      '| C-0003 | DEV | CRITIC |',
      '| C-0002 | DEV | CRITIC |',
      '| C-0001 | DEV | CRITIC |',
    ];
    const section = controlHistorySection(lines)!;
    const rows = controlHistoryRows(lines, section);
    expect(rows.map((r) => r.cycle)).toEqual(['C-0003', 'C-0002', 'C-0001']);
    expect(rows[0]).toMatchObject({ line: 3, raw: '| C-0003 | DEV | CRITIC |' });
  });
});

describe('safeHistoryKeepN', () => {
  it('שומר את כל השורות כשהתקציב מספיק', () => {
    const n = safeHistoryKeepN({ otherBytes: 1000, rowSizes: [100, 100, 100], ceiling: 2000, maxKeep: 10 });
    expect(n).toBe(3);
  });

  it('⛔ אף פעם פחות מ-1, גם כשהתקציב שלילי כבר מהשורה הראשונה', () => {
    const n = safeHistoryKeepN({ otherBytes: 5000, rowSizes: [800, 800, 800], ceiling: 4000, maxKeep: 10 });
    expect(n).toBe(1);
  });

  it('⛔ אף פעם יותר מ-maxKeep, גם כשיש מרווח שנשאר', () => {
    const n = safeHistoryKeepN({ otherBytes: 0, rowSizes: Array(20).fill(10), ceiling: 100_000, maxKeep: 4 });
    expect(n).toBe(4);
  });

  it('אין שורות מועמדות כלל ⇐ עדיין מחזירה min, ⛔ ולא 0', () => {
    const n = safeHistoryKeepN({ otherBytes: 0, rowSizes: [], ceiling: 100_000, maxKeep: 10 });
    expect(n).toBe(1);
  });

  it('נמדד — `CONTROL_CEILING` זהה לתקרה ב-`loop-health.mjs` בדיקה 9 (12 * 1024)', () => {
    expect(CONTROL_CEILING).toBe(12 * 1024);
  });

  it('ⓑ — `CONTROL_HISTORY_MAX_KEEP` הוא תקרה בטווח 5–10 שביקש T-249, ⛔ ולא יעד קבוע', () => {
    expect(CONTROL_HISTORY_MAX_KEEP).toBeGreaterThanOrEqual(5);
    expect(CONTROL_HISTORY_MAX_KEEP).toBeLessThanOrEqual(10);
  });
});

describe('assertOnlyHistoryRowsChanged — ⓒ: ⛔ שום דבר מחוץ ל-§0.1 לא זז', () => {
  it('לא זורקת כשרק שורות בתוך הסעיף הוסרו', () => {
    const before = ['מחוץ א', '### 0.1', 'r1', 'r2', 'מחוץ ב'];
    const section = { start: 1, end: 4 };
    const after = ['מחוץ א', '### 0.1', 'r1', 'מחוץ ב'];
    expect(() => assertOnlyHistoryRowsChanged(before, after, section)).not.toThrow();
  });

  it('🔴 זורקת כשמשהו מחוץ לסעיף השתנה — הגנה על בלוק המשתנים', () => {
    const before = ['ACTIVE_TASK_ID: T-249', '### 0.1', 'r1', 'r2', 'סוף'];
    const section = { start: 1, end: 4 };
    const corrupted = ['ACTIVE_TASK_ID: T-999', '### 0.1', 'r1', 'r2', 'סוף'];
    expect(() => assertOnlyHistoryRowsChanged(before, corrupted, section)).toThrow(/מחוץ ל-§0\.1/);
  });

  it('🔴 זורקת גם כשהסיומת (אחרי הטבלה) השתנתה', () => {
    const before = ['ראש', '### 0.1', 'r1', 'r2', 'סוף מקורי'];
    const section = { start: 1, end: 4 };
    const corrupted = ['ראש', '### 0.1', 'r1', 'r2', 'סוף שונה'];
    expect(() => assertOnlyHistoryRowsChanged(before, corrupted, section)).toThrow();
  });
});

/**
 * `pruneControlHistory` — האינטגרציה הטהורה. ⛔ **הבדיקות כאן הן ⓒ בשורת
 * T-249**: שום הרצה ⛔ לא מסירה ו⛔ לא משנה אף אחד ממשתני המצב הקריטיים
 * (`ACTIVE_TASK_ID` · `NEXT_AGENT` · `ACTIVE_WORKSTREAM` · `STATE` ·
 * `WORKING_BRANCH` · `MERGE_TARGET`), כולל fixture גבולי שבו שורה נשמרת
 * נושאת בפרוזה שלה טקסט חופשי שנראה כמו שם משתנה מצב.
 */
const CRITICAL_BLOCK = [
  '<!--',
  'NEXT_AGENT: CRITIC                 # לא נוגעים כאן',
  'STATE: EXECUTING',
  'ACTIVE_MILESTONE: M0',
  'ACTIVE_TASK_ID: T-249             # note',
  'WORKING_BRANCH: work/current',
  'MERGE_TARGET: dev',
  'ACTIVE_WORKSTREAM: studies',
  '-->',
].join('\n');

const FOOTER = ['---', '', '**החוקים המלאים:** `plan/RULES.md`'].join('\n');

function row(cycle: string, body = 'טיק'): string {
  return `| ${cycle} | DEV | CRITIC | 2026-09-01T00:00:00Z | ${body} | תוצר |`;
}

function controlText(rows: string[]): string {
  return [
    CRITICAL_BLOCK,
    '',
    '### 0.1 יומן העברות מקל',
    '',
    '| Cycle | מסוכן | לסוכן | בשעה | סיבה | תוצר |',
    '|---|---|---|---|---|---|',
    ...rows,
    FOOTER,
  ].join('\n');
}

describe('pruneControlHistory', () => {
  it('⛔ אינה נוגעת כשיש פחות שורות מהתקרה הבטוחה', () => {
    const text = controlText([row('C-0002'), row('C-0001')]);
    const result = pruneControlHistory(text);
    expect(result.changed).toBe(false);
    expect(result.archived).toEqual([]);
  });

  it('מגזמת לפי מספר Cycle יורד, ⛔ ולא לפי מיקום בקובץ', () => {
    /* C-0001 מופיעה מעל C-0002 בכוונה — הדירוג חייב לתקן את הסדר. */
    const rows = [row('C-0001', 'ישנה'), row('C-0002', 'חדשה'), row('C-0000', 'הכי ישנה')];
    const text = controlText(rows);
    const result = pruneControlHistory(text, { maxKeep: 1, ceiling: 100_000 });
    expect(result.changed).toBe(true);
    expect(result.keepN).toBe(1);
    expect(result.lines.join('\n')).toContain('C-0002');
    expect(result.lines.join('\n')).not.toContain('| C-0001 |');
    expect(result.archived).toHaveLength(2);
    expect(result.archived.some((r) => r.includes('C-0001'))).toBe(true);
    expect(result.archived.some((r) => r.includes('C-0000'))).toBe(true);
  });

  it('⛔ אפס מחיקה — כל שורה שהוסרה מהקובץ החי חוזרת מילה במילה ב-archived', () => {
    const rows = [row('C-0003', 'גוף מדויק ⛔ ⚠️ 🔴'), row('C-0002'), row('C-0001')];
    const text = controlText(rows);
    const result = pruneControlHistory(text, { maxKeep: 1, ceiling: 100_000 });
    expect(result.archived).toContain(rows[1]);
    expect(result.archived).toContain(rows[2]);
  });

  it('🔴 אידמפוטנטי — הרצה שנייה על התוצאה של הראשונה היא no-op', () => {
    const rows = Array.from({ length: 6 }, (_, i) => row(`C-${String(6 - i).padStart(4, '0')}`));
    const text = controlText(rows);
    const first = pruneControlHistory(text, { maxKeep: 3, ceiling: 100_000 });
    expect(first.changed).toBe(true);
    const second = pruneControlHistory(first.lines.join('\n'), { maxKeep: 3, ceiling: 100_000 });
    expect(second.changed).toBe(false);
  });

  it('⛔ בלוק המשתנים הקריטיים (`<!-- ... -->`) נשאר זהה בתים-לבתים אחרי הגיזום', () => {
    const rows = Array.from({ length: 8 }, (_, i) => row(`C-${String(8 - i).padStart(4, '0')}`));
    const text = controlText(rows);
    const result = pruneControlHistory(text, { maxKeep: 2, ceiling: 100_000 });
    expect(result.changed).toBe(true);
    const afterCriticalBlock = result.lines.slice(0, CRITICAL_BLOCK.split('\n').length).join('\n');
    expect(afterCriticalBlock).toBe(CRITICAL_BLOCK);
  });

  it('🎯 גבולי — שורה נשמרת שנושאת בפרוזה שלה שם משתנה מצב אמיתי ⛔ אינה מבלבלת את ההכרעה', () => {
    /* השורה שנשמרת מזכירה בפרוזה שלה ACTIVE_TASK_ID ו-NEXT_AGENT — בדיוק כמו
     * שדיווח DEV אמיתי מתאר מה הוא כתב ל-00-control.md. */
    const suspiciousRow = row('C-0003', 'עדכן ACTIVE_TASK_ID ל-T-250 ו-NEXT_AGENT=CRITIC בקומיט');
    const rows = [suspiciousRow, row('C-0002'), row('C-0001')];
    const text = controlText(rows);
    const result = pruneControlHistory(text, { maxKeep: 2, ceiling: 100_000 });

    expect(result.changed).toBe(true);
    /* השורה החשודה נשמרה מילה במילה — הפרוזה שלה ⛔ לא נגזרה ו⛔ לא נערכה. */
    expect(result.lines).toContain(suspiciousRow);
    /* ובלוק המשתנים האמיתי, מעל הסעיף, ⛔ לא זז ולא השתנה בגלל הטקסט הדומה. */
    const afterCriticalBlock = result.lines.slice(0, CRITICAL_BLOCK.split('\n').length).join('\n');
    expect(afterCriticalBlock).toBe(CRITICAL_BLOCK);
    expect(afterCriticalBlock).toContain('ACTIVE_TASK_ID: T-249');
    expect(afterCriticalBlock).toContain('NEXT_AGENT: CRITIC');
  });

  it('⛔ ה-footer שאחרי הטבלה נשאר זהה בתים-לבתים', () => {
    const rows = Array.from({ length: 6 }, (_, i) => row(`C-${String(6 - i).padStart(4, '0')}`));
    const text = controlText(rows);
    const result = pruneControlHistory(text, { maxKeep: 2, ceiling: 100_000 });
    expect(result.lines.join('\n')).toContain(FOOTER);
  });

  it('⛔ הקובץ החי לעולם לא נכתב מעל התקרה, גם עם הרבה שורות מועמדות גדולות', () => {
    const rows = Array.from({ length: 15 }, (_, i) => row(`C-${String(15 - i).padStart(4, '0')}`, 'גוף'.repeat(50)));
    const text = controlText(rows);
    const result = pruneControlHistory(text, { ceiling: CONTROL_CEILING });
    expect(result.changed).toBe(true);
    expect(result.keepN).toBeLessThanOrEqual(CONTROL_HISTORY_MAX_KEEP);
    expect(Buffer.byteLength(result.lines.join('\n'), 'utf8')).toBeLessThanOrEqual(CONTROL_CEILING);
  });
});
