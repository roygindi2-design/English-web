import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLD_APP_HREF, WORLD_APP_ORDER, LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * **רצ׳ט דו-כיווני, ⛔ ולא הערה.** כל `href` ברשת חייב מסך על הדיסק — ⛔ קישור
 * ל-404 הוא בדיוק מחלקת קוד המת של F-074. ובכיוון ההפוך: כל `href` שרשום כממתין
 * חייב ⛔ **לא** להיות קיים, כדי שהיום שבו הוא ייבנה **יפיל** את הבדיקה ויחייב
 * להוציא אותו מהרשימה. רשימה שאיש ⛔ אינו מנקה היא רשימה שאיש ⛔ אינו קורא.
 */

/** ⛔ **T-136 חסומה ב-F-096 🟡** (הכרעת PM: מה בדיוק נכתב בהקשה על מילה בסיפור).
 *  ⇒ `/world/story` ⛔ אינו קיים, והאריח שלו ⛔ אינו ניתן להגעה כ-`open` בייצור:
 *  `stories` ריקה עד ש-`0018_stories.sql` ייוולד ורוי יריץ אותו. */
const PENDING_ROUTES: readonly string[] = ['/world/story'];

/** Next מאפשר גם `app/<href>` וגם `app/(tabs)/<href>` — שניהם מסלולים חוקיים. */
function pageExists(href: string): boolean {
  return existsSync(`app${href}/page.tsx`) || existsSync(`app/(tabs)${href}/page.tsx`);
}

describe('WORLD_APP_HREF ⇄ מסכים על הדיסק', () => {
  it('⛔ כל אריח שאינו ממתין מוביל למסך קיים — ⛔ אפס קישור ל-404 (F-074)', () => {
    for (const id of WORLD_APP_ORDER) {
      const href = WORLD_APP_HREF[id] ?? '';
      if (PENDING_ROUTES.includes(href)) continue;
      expect(pageExists(href), `⛔ ${id} ⇒ ${href} — אין קובץ עמוד`).toBe(true);
    }
  });

  it('⛔ מסלול ממתין שנבנה ⇒ הבדיקה נופלת ומחייבת לנקות את הרשימה', () => {
    for (const href of PENDING_ROUTES) {
      expect(pageExists(href), `✅ ${href} נבנה — הוצא אותו מ-PENDING_ROUTES`).toBe(false);
    }
  });

  it('יעד הבריחה של לומד בלי רמה קיים — ⛔ ולא הבטחה (T-137ⓓ · T-082)', () => {
    expect(pageExists(LEVEL_SCAN_HREF)).toBe(true);
  });
});
