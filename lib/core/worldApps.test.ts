import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  WORLD_APP_ORDER,
  WORLD_APP_LABEL_HE,
  WORLD_APP_HREF,
  LEARNING_PRIORITY,
  LEVEL_SCAN_HREF,
  featuredAppId,
  levelTooSmallNoteHe,
  libraryTile,
  openAppCount,
  storiesTooFewNoteHe,
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
  // ⚠️ **שלושה ⇒ ארבעה, D-074ⓑ.** «אריח נכנס לרשת אם ורק אם יש לו משימה, שורה
  // בטבלת הצימוד של D-054, ותנאי פתיחה מדיד ונקוב במספר» — והספרייה עומדת
  // בשלושתם מ-C-0239 (‏T-134…T-137 · שורת D-054 · «נדרשים 3 סיפורים ברמה שלך, יש N»).
  // ⛔ הנוסח «⛔ אין רביעי» ב-§ 4.2יא **בטל** — § 4.2יג גוברת עליו.
  it('⛔ בדיוק ארבעה אריחים, וסדר הרשת = סדר הפתיחה (D-074ⓑ · § 4.2יג)', () => {
    expect([...WORLD_APP_ORDER]).toEqual(['compose', 'arcade', 'collected', 'library']);
    expect(Object.keys(WORLD_APP_HREF).sort()).toEqual([
      'arcade',
      'collected',
      'compose',
      'library',
    ]);
    expect(WORLD_APP_HREF.compose).toBe('/world/compose');
    expect(WORLD_APP_HREF.arcade).toBe('/arcade');
    expect(WORLD_APP_HREF.collected).toBe('/world/collected');
    expect(WORLD_APP_HREF.library).toBe('/world/story');
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

  it('`LEARNING_PRIORITY` — קריאה בהקשר היא **תרגול** ⛔ ולא צפייה (T-137ⓑ · D-071ⓐ)', () => {
    expect([...LEARNING_PRIORITY]).toEqual(['arcade', 'library', 'compose', 'collected']);
    expect(new Set(LEARNING_PRIORITY).size).toBe(LEARNING_PRIORITY.length);
    expect(LEARNING_PRIORITY.length).toBe(WORLD_APP_ORDER.length);
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

/**
 * אריח «הספרייה» — § 4.2יג · D-074ⓑ · D-046. שלושה ענפים בדיוק, ⛔ ואין רביעי.
 */
describe('libraryTile (T-137ⓒ · ⓓ)', () => {
  it('⛔ פחות מהנדרש ⇒ מושבת **עם שני המספרים**, ⛔ ולא «בקרוב» (D-046)', () => {
    const tile = libraryTile({ required: 3, atLevel: 1 });
    expect(tile.state.kind).toBe('locked');
    const note = tile.state.kind === 'locked' ? tile.state.noteHe : '';
    expect(note).toContain('3');
    expect(note).toContain('1');
    expect(note).toMatch(/\d/);
    expect(tile.href).toBe(WORLD_APP_HREF.library);
  });

  it('הנוסח נבנה משני מספרים ⛔ ואינו כותב אף אחד מהם בקוד', () => {
    // ⚠️ נמדד בשני ערכים שונים ⛔ ולא באחד: פונקציה שמחזירה מחרוזת קבועה עוברת
    // בדיקה של ערך יחיד (F-105 — קלט שנבנה מהקבוע הנמדד ⛔ אינו מדידה).
    expect(storiesTooFewNoteHe(3, 1)).not.toBe(storiesTooFewNoteHe(5, 2));
    expect(storiesTooFewNoteHe(5, 2)).toContain('5');
    expect(storiesTooFewNoteHe(5, 2)).toContain('2');
  });

  it('הגיע לסף ⇒ פתוח אל המסך (§ 4.2יג — «מגיעים מאריח»)', () => {
    const tile = libraryTile({ required: 3, atLevel: 3 });
    expect(tile.state.kind).toBe('open');
    expect(tile.href).toBe(WORLD_APP_HREF.library);
  });

  it('⛔ לומד בלי רמה ⛔ אינו נחסם — הוא נשלח לסריקת הרמה (T-137ⓓ · T-082)', () => {
    const tile = libraryTile({ required: 3, atLevel: null });
    expect(tile.state.kind).toBe('open');
    expect(tile.href).toBe(LEVEL_SCAN_HREF);
    expect(tile.href).not.toBe(WORLD_APP_HREF.library);
  });

  it('קריאה שנכשלה ⇒ «—» ⛔ ולא «0» — מספר שאין לנו אינו אפס', () => {
    expect(libraryTile(null).state.kind).toBe('unknown');
  });

  it('⛔ הספרייה ⛔ אינה נוגעת בזירה — D-054: 🔗 מצומדת לצד הלימודי', () => {
    // סריקת מקור: הגבול נאכף **בהיעדר**, בדיוק כמו ב-`0018_stories.sql`.
    const src = readFileSync('lib/core/worldApps.ts', 'utf8');
    expect(src).not.toContain('arcade_collected_words');
  });
});
