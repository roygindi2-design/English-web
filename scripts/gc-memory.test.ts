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
