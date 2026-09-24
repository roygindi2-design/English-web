import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * 🔴 **T-337 — ציר ה-RTL של פס הסינון.** המשך של `F-236`, קובץ אחר.
 *
 * ⚠️ **המדידה האמיתית של השורה הזאת היא בפיקסלים ו⛔ לא כאן:**
 * `scripts/verify-mobile.mjs` מודד ב-Chromium ב-320/375/414 שקצה ה-`right` של מקטע
 * `--success` נוגע בקצה ה-`right` של `[data-filter-track]` (±1px). הבדיקה הזאת היא
 * **הרצפה המהירה** — היא רצה ב-`npm test` בלי דפדפן, ותופסת חזרה של המחלקה בשנייה
 * אחת במקום בשלוש דקות של בילד.
 */
const SRC = readFileSync('components/FilterBar.tsx', 'utf8');

/** ההערות מופשטות: הכלל הוא על מה שמצויר, ⛔ ולא על הפרוזה שמסבירה אותו. */
const CODE = withoutComments(SRC);

describe('FilterBar — ציר ה-RTL של המסילה (T-337)', () => {
  it('⛔ ⛔ אין `flex-row-reverse` במסילה — במיכל RTL הוא הופך את הציר פעם שנייה', () => {
    expect(CODE).not.toContain('flex-row-reverse');
  });

  it('המסילה עדיין `flex` ונושאת את הידית שהמדידה בדפדפן נתלית בה', () => {
    const track = /className="([^"]*)"\s*\n\s*data-filter-track/.exec(CODE);
    expect(track).not.toBeNull();
    expect(track?.[1]).toContain('flex');
    expect(track?.[1]).toContain('overflow-hidden');
  });

  it('⛔ ⛔ ואין `dir` מקומי — המסמך כולו RTL, וכיוון מקומי הוא הגדרה שנייה', () => {
    expect(CODE).not.toMatch(/\bdir=/);
  });

  it('סדר המקטעים הוא `--success` ואז `--danger` — הילד הראשון הוא הימני ב-RTL', () => {
    const known = CODE.indexOf('bg-success');
    const unknown = CODE.indexOf('bg-danger');
    expect(known).toBeGreaterThan(-1);
    expect(unknown).toBeGreaterThan(-1);
    expect(known).toBeLessThan(unknown);
  });

  it('ההערה מעל המסילה אומרת את מה שהקוד **עושה** — זה חצי הממצא של T-337', () => {
    // ⛔ ההערה הישנה הצהירה על `flex-row-reverse` שתי שורות מעל קוד שהשתמש בו
    // בדיוק הפוך למה שהרנדר קובע. הערה שסותרת את הקוד היא מלכודת לסוכן הבא.
    expect(SRC).toContain('`flex` רגיל, ⛔ ולא `flex-row-reverse`');
    expect(SRC).toContain('render_video_A.py:287');
  });
});
