import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { WORLD_APP_HREF, WORLD_APP_ORDER, LEVEL_SCAN_HREF } from '@/lib/core/worldApps';

/**
 * **רצ׳ט דו-כיווני, ⛔ ולא הערה.** כל `href` ברשת חייב מסך על הדיסק — ⛔ קישור
 * ל-404 הוא בדיוק מחלקת קוד המת של F-074. ובכיוון ההפוך: כל `href` שרשום כממתין
 * חייב ⛔ **לא** להיות קיים, כדי שהיום שבו הוא ייבנה **יפיל** את הבדיקה ויחייב
 * להוציא אותו מהרשימה. רשימה שאיש ⛔ אינו מנקה היא רשימה שאיש ⛔ אינו קורא.
 */

/** ⛔ **ריקה מאז C-0299 (T-186), והרצ׳ט הוא שדרש את הניקוי:** `/world/story` נבנה,
 *  והבדיקה למטה **נפלה בשם** עד שהוצא מכאן — בדיוק מה שהיא נכתבה בשבילו.
 *  ⇒ D-091 סגור: האריח ⛔ אינו מצביע עוד ל-404.
 *  ⚠️ מסלול חדש שממתין נכנס לכאן עם **סיבה**, ⛔ ולא כשם בלבד. */
const PENDING_ROUTES: readonly string[] = [];

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
