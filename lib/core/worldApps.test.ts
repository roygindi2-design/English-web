import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  WORLD_APP_ORDER,
  WORLD_APP_LABEL_HE,
  WORLD_APP_HREF,
  LEARNING_PRIORITY,
  featuredAppId,
  levelTooSmallNoteHe,
  openAppCount,
  type WorldApp,
} from './worldApps';

const app = (over: Partial<WorldApp> & Pick<WorldApp, 'id'>): WorldApp => ({
  labelHe: WORLD_APP_LABEL_HE[over.id],
  href: WORLD_APP_HREF[over.id],
  state: { kind: 'open' },
  hasActiveTask: false,
  ...over,
});

describe('worldApps', () => {
  // ⚠️ **שניים ⇒ שלושה, C-0218 (T-110).** § 4.2יב מחייבת דרך הגעה למסך «המילים
  // שאספתי» («מגיעים מאריח»), ובלי האריח השלישי המסך קיים ו⛔ אין אליו קישור. האריח
  // עומד במסננת של § 4.2יא: תנאי הפתיחה שלו הוא **פתוח תמיד**, ⛔ ולא «בקרוב» בלי מספר.
  it('⛔ בדיוק שלושה אריחים, ⛔ ואין רביעי (§ 4.2יא · § 4.2יב)', () => {
    expect([...WORLD_APP_ORDER]).toEqual(['compose', 'arcade', 'collected']);
    expect(Object.keys(WORLD_APP_HREF).sort()).toEqual(['arcade', 'collected', 'compose']);
    expect(WORLD_APP_HREF.compose).toBe('/world/compose');
    expect(WORLD_APP_HREF.arcade).toBe('/arcade');
    expect(WORLD_APP_HREF.collected).toBe('/world/collected');
  });

  it('⛔ לכל אריח יש תווית **וגם** href — ⛔ אין ערך חסר בטבלה', () => {
    for (const id of WORLD_APP_ORDER) {
      expect(WORLD_APP_LABEL_HE[id] ?? '').not.toBe('');
      expect(WORLD_APP_HREF[id] ?? '').toMatch(/^\//);
    }
  });

  it('כל תווית היא עברית ⛔ ואינה ריקה (חוקה § 1 — צבע אינו ערוץ יחיד)', () => {
    for (const id of WORLD_APP_ORDER) {
      expect(WORLD_APP_LABEL_HE[id]).toMatch(/[֐-׿]/);
    }
  });

  it('⛔ אריח מושבת נושא מספר — «בקרוב» בלי ספרה אינו מצב חוקי (D-046)', () => {
    const note = levelTooSmallNoteHe(12, 8);
    expect(note).toMatch(/\d/);
    expect(note).toContain('12');
    expect(note).toContain('8');
    expect(note).not.toContain('בקרוב');
  });

  it('הגדול = הראשון עם חיוב פתוח; אין ⇒ הראשון בסדר `LEARNING_PRIORITY` (D-071ⓐ)', () => {
    // חיוב מנצח סדר עדיפויות
    expect(
      featuredAppId([app({ id: 'compose' }), app({ id: 'arcade', hasActiveTask: true })]),
    ).toBe('arcade');
    // שלושה פתוחים בלי חיוב ⇒ הראשון ב-LEARNING_PRIORITY = arcade
    expect(
      featuredAppId([app({ id: 'compose' }), app({ id: 'arcade' }), app({ id: 'collected' })]),
    ).toBe('arcade');
    // רק compose ו-collected פתוחים ⇒ compose
    expect(
      featuredAppId([
        app({ id: 'compose' }),
        app({ id: 'arcade', state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
        app({ id: 'collected' }),
      ]),
    ).toBe('compose');
    // רק collected פתוח ⇒ collected
    expect(
      featuredAppId([
        app({ id: 'compose', state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' } }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
        app({ id: 'collected' }),
      ]),
    ).toBe('collected');
    // חיוב על אריח **נעול** ⛔ אינו מגדיל אותו — נופל לסדר העדיפויות (D-046)
    expect(
      featuredAppId([
        app({ id: 'compose' }),
        app({
          id: 'arcade',
          hasActiveTask: true,
          state: { kind: 'locked', noteHe: 'נדרשות 12 מילים ברמה, יש 8' },
        }),
      ]),
    ).toBe('compose');
    // כלום פתוח ⇒ null
    expect(
      featuredAppId([
        app({ id: 'compose', state: { kind: 'unknown' } }),
        app({ id: 'arcade', state: { kind: 'unknown' } }),
      ]),
    ).toBeNull();
  });

  it('סדר `WORLD_APP_ORDER` ⛔ אינו משפיע על `featuredAppId` (F-084 · D-071ⓐ)', () => {
    // גם אם הרשת הפוכה בקלט — הבחירה מונחית `LEARNING_PRIORITY`
    const inputs = [app({ id: 'collected' }), app({ id: 'compose' }), app({ id: 'arcade' })];
    expect(featuredAppId(inputs)).toBe('arcade');
  });

  it('`LEARNING_PRIORITY` הוא בדיוק שלושת מזהי `WORLD_APP_ORDER` בסדר D-071ⓐ', () => {
    expect([...LEARNING_PRIORITY]).toEqual(['arcade', 'compose', 'collected']);
    expect(new Set(LEARNING_PRIORITY).size).toBe(LEARNING_PRIORITY.length);
    for (const id of LEARNING_PRIORITY) expect(WORLD_APP_ORDER).toContain(id);
  });

  it('«מספר האפליקציות הפתוחות» סופר `open` בלבד ⛔ ולא `unknown`', () => {
    expect(
      openAppCount([app({ id: 'compose' }), app({ id: 'arcade', state: { kind: 'unknown' } })]),
    ).toBe(1);
  });

  it('⛔ אפס ניקוד, מטבע ולוח תוצאות במודול (D-050)', () => {
    const src = readFileSync('lib/core/worldApps.ts', 'utf8');
    for (const banned of [
      /\bxp\b/i,
      /\bscore\b/i,
      /\bpoints\b/i,
      /\bcoin\b/i,
      /\bstreak\b/i,
      /לוח תוצאות/,
    ]) {
      expect(src).not.toMatch(banned);
    }
  });

  it('⛔ הנוסח ⛔ אינו סוטה מזה שכבר על המסך ב-<ArcadeEntry> (עוגן, ⛔ לא עריכה)', () => {
    // ⚠️ `<ArcadeEntry>` יושב בתור הסקירה (C-0188) ⇒ ⛔ אסור לערוך אותו. הבדיקה הזאת
    // הופכת את הכפילות ל**נמדדת**: היום שבו אחד הנוסחים ישתנה — היא נופלת בשמה.
    const entry = readFileSync('components/ArcadeEntry.tsx', 'utf8');
    expect(entry).toContain('נדרשות');
    expect(entry).toContain('מילים ברמה, יש');
    expect(levelTooSmallNoteHe(12, 8)).toBe('נדרשות 12 מילים ברמה, יש 8');
  });
});
