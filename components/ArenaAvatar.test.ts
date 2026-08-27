import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('components/ArenaAvatar.tsx', 'utf8');
const CODE = SRC.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * התבנית של `ComposeDraft.test.ts:1-31` — הלבנת הערות לפני כל טענה, כדי שהערה שמזכירה
 * אסימון אסור ⛔ לא תיחשב לקוד (F-041 · F-065).
 */

describe('<ArenaAvatar>', () => {
  it("⛔ אפס תמונה, אפס CDN, אפס אמוג'י — שכבות SVG מקומיות בלבד (§ 4.2י · תקציב אפס)", () => {
    expect(CODE).toMatch(/<svg/);
    expect(CODE).not.toMatch(/<img|<Image|url\(|https?:|\.png|\.svg'|\.webp/);
    expect(CODE).not.toMatch(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
  });

  it('⛔ אפס hex גולמי — כל שכבה נושאת אסימון (חוקה § 6 · palette.ts)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).toMatch(/currentColor|text-(ink|brand|success|danger|ink-muted)/);
  });

  it('הפריטים מגיעים מ-`ARCADE_ITEMS` ⛔ ואינם רשימה שנייה', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/arcadeResult'/);
    expect(CODE).toMatch(/ARCADE_ITEMS/);
    // ⛔ שם שאינו ברשימה ⇒ מדולג בשקט, ⛔ ולא מרנדר שכבה ריקה:
    expect(CODE).toMatch(/ARCADE_ITEMS\.(includes|filter|indexOf)/);
  });

  it('⛔ אין שדה טקסט חופשי לשם הדמות (החזון: אפס טקסט חופשי)', () => {
    expect(CODE).not.toMatch(/<input|<textarea|contentEditable/);
  });

  it('⛔ אינו רכיב לקוח: שכבות בלי מצב ובלי handler', () => {
    expect(SRC.startsWith("'use client'")).toBe(false);
    expect(CODE).not.toMatch(/useState|useEffect|onClick/);
  });

  it('נושא שם נגיש עברי ⛔ ואינו דקורציה שקופה לקורא מסך', () => {
    expect(CODE).toMatch(/role="img"/);
    expect(CODE).toMatch(/aria-label=/);
  });

  it('⛔ אפס ניקוד ואפס נגיעה במנוע החזרות (D-050 · D-044)', () => {
    for (const banned of [/\bxp\b/i, /\bscore\b/i, /\bpoints\b/i, /\bcoin\b/i, /\bleaderboard\b/i]) {
      expect(CODE, `${banned} אסור — D-050`).not.toMatch(banned);
    }
    for (const banned of [/word_progress/, /easiness/, /next_review_at/]) {
      expect(CODE, `${banned} אסור — D-044`).not.toMatch(banned);
    }
  });

  it('חמש שכבות פריט בדיוק — המפה מוקלדת מול `ARCADE_ITEMS` (פריט שישי ⛔ אינו מהדר)', () => {
    expect(CODE).toMatch(/Record<\s*\(typeof ARCADE_ITEMS\)\[number\]/);
    for (const item of ['helmet', 'cape', 'lantern', 'boots', 'banner']) {
      expect(CODE, `${item} חייב שכבה`).toContain(item);
    }
  });

  /**
   * T-215 · `38 § 4`. ⛔ **הסדר ⛔ אינו נשמר בזכות סדר הכתיבה בקובץ** — הוא נגזר
   * מ-`LAYER_ORDER` שב-`lib/core/characterBase.ts`, שנבדק שם ביחידה. הבדיקה כאן
   * מוודאת שהרכיב באמת **נגזר ממנו**, ⛔ ולא מחזיק עותק שני שיסטה.
   */
  it('אחת־עשרה השכבות מגיעות מהמודול הטהור, ⛔ ולא מסדר הכתיבה כאן', () => {
    expect(CODE).toMatch(/from '@\/lib\/core\/characterBase'/);
    expect(CODE).toMatch(/LAYER_ORDER\.map/);
    expect(CODE).toMatch(/data-arena-layer=\{layer\}/);
    // ⛔ אפס גיאומטריה מוטבעת: כל עוגן מגיע מ-`anchorFor`, ⛔ ולא ממספר בקובץ הזה.
    expect(CODE).toMatch(/anchorFor\(/);
    for (const literal of ['-62', '52', '-70', '112', '76', '84']) {
      expect(CODE, `${literal} — הגיאומטריה חיה ב-characterBase.ts בלבד`)
        .not.toMatch(new RegExp(`[^\\w-]${literal}[^\\d]`));
    }
  });

  it('⛔ שכבה ריקה ⛔ אינה מצוירת — 22 צמתים שאיש אינו רואה', () => {
    expect(CODE).toMatch(/base === undefined && equipped\.length === 0/);
  });

  it('⛔ אין לוח רקע אטום (F-158 · `38 § 4` ⛔ אינו מונה רקע)', () => {
    expect(CODE).not.toMatch(/text-surface-raised/);
    expect(CODE).not.toMatch(/data-arena-layer="background"/);
  });

  it('א4 (`T-216`) מקבלת ווים בשם — גלימה · שיער · נשק', () => {
    for (const part of ['hair', 'cape', 'weapon']) {
      expect(CODE, `data-arena-part="${part}"`).toContain(`data-arena-part="${part}"`);
    }
  });

  /**
   * ⚠️ **`CODE` ו⛔ לא `SRC`, וזה בדיוק הלקח של F-039 · F-065:** הרכיב **מתעד בהערה**
   * ש-`38 § 5` אוסר את שלוש הפונקציות בשמן, ומדידה גולמית הייתה מפילה קובץ ⛔ שאין בו
   * ולו העתקה אחת. מודדים **קוד**, ⛔ לא תיעוד — ו⛔ מחיקת ההערה אינה הפתרון.
   */
  it('⛔ `38 § 5` — אף אחת משלוש פונקציות ה-sprite שנפסלו ⛔ אינה מועתקת', () => {
    for (const banned of ['wizard_sprite', 'knight_sprite', 'hero_sprite']) {
      expect(CODE, `${banned} — 38 § 5`).not.toContain(banned);
    }
  });

  it('שני התפקידים נבדלים גם בשם הנגיש ⛔ ולא בצבע בלבד (חוקה § 1)', () => {
    expect(CODE).toContain('הדמות שלך');
    expect(CODE).toContain('היריב');
    expect(CODE).toMatch(/text-brand/);
    expect(CODE).toMatch(/text-ink-muted/);
  });
});
