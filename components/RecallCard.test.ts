import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * `<RecallCard>` — הכרטיס «מה שכתבת אתמול» בראש `/world` (T-105 · § 4.2יב · D-051 ·
 * D-050 · D-046 · תוכנית `2026-08-19-world-home.md` § 3).
 *
 * שומר מקור, באותה צורה ומאותו נימוק כמו `AppGrid.test.ts` ו-`ArcadeEntry.test.ts`:
 * סביבת vitest היא `node` במכוון (`vitest.config.ts`) ו-jsdom נעדר, ולכן בדיקת רינדור
 * ⛔ אינה שייכת לכאן. הגיאומטריה — יעד מגע ≥44px, אפס גלילה אופקית — נמדדת ב-
 * `check:mobile` על `/dev/world/recall`, שנוסף לרשימת המסלולים באותו טיק.
 *
 * מה שהקובץ הזה מוכיח, וללא זה היה מאמין ⛔ ולא מודד:
 *
 *   ✔ **מדד ⓐ של § 4.2יב: מחזור מלא של הכרטיס ⛔ אינו כותב שורה אחת.** ⛔ אפס
 *     `apiPost`, ⛔ אפס עמודת מנוע חזרות — לא בכתיבה ולא בשם (D-051)
 *   ✔ ⛔ אפס ניקוד, מטבע, רצף או לוח תוצאות (D-050 · E4)
 *   ✔ ⛔ אפס שעון: אין `setTimeout` ואין `setInterval` — כאן המילים ⛔ אינן בהכרח
 *     ידועות, ולכן S15/D-049 אוסרים דדליין
 *   ✔ מילת היעד היא **מסגרת** ⛔ ולא קו תחתון דק — `border-b` נופל **בשם**
 *   ✔ ⛔ אין ניסיון שני ואין «נסה שוב» על אפשרות: תשובה שגויה ⛔ אינה עונש
 *   ✔ המשפט עובר דרך `<EnText>`/`<EnWord>` ⛔ ולא דרך `lang="en"` שנכתב ביד (T-009)
 *   ✔ ⛔ אפס hex גולמי, ⛔ אפס אפקט שהחוקה § 6 אוסרת, ⛔ אפס מרכוז אנכי (F-011 · F-016)
 *   ✔ כל אנימציה ≤300ms (חוקה § 5)
 *
 * ⛔ מה שהוא **אינו** מוכיח, ונאמר כאן כדי שירוק לא ייקרא כיסוי: שהבקשה באמת חוזרת,
 * שהמילה באמת נוחתת במסגרת בדפדפן, ושהאפשרות באמת חדלה להיות לחיצה אחרי תשובה.
 */
const SRC = readFileSync('components/RecallCard.tsx', 'utf8');

/** C-0032/C-0071/C-0072 · F-065: שומר שהערה יכולה לספק אינו שומר על דבר. */
const CODE = withoutComments(SRC);

describe('<RecallCard>', () => {
  it('הוא רכיב לקוח וקורא לנקודת הקצה שבחוזה ⛔ ולא לשם שהומצא', () => {
    expect(SRC.startsWith("'use client'")).toBe(true);
    expect(CODE).toMatch(/apiGet<[^>]*>\('\/api\/world\/recall'\)/);
  });

  it('⛔ הכרטיס אינו כותב דבר — מדד ⓐ של § 4.2יב (D-051)', () => {
    expect(CODE).not.toMatch(/apiPost/);
    expect(CODE).not.toMatch(
      /easiness|interval_days|repetition|next_review_at|self_marked_known|word_progress/,
    );
  });

  it('⛔ אפס ניקוד, מטבע ורצף (D-050 · E4)', () => {
    expect(CODE).not.toMatch(/\bxp\b|\bscore\b|\bpoints\b|\bcoin\b|\bstreak\b/i);
    expect(CODE).not.toMatch(/ניקוד|מטבע|לוח תוצאות/);
  });

  it('⛔ אפס שעון — דדליין אסור כשהמילים אינן בהכרח ידועות (D-049 · S15)', () => {
    expect(CODE).not.toMatch(/setTimeout|setInterval/);
  });

  it('מילת היעד היא מסגרת בגובה השורה ⛔ ולא קו תחתון דק', () => {
    expect(CODE).toMatch(/border-border-strong/);
    expect(CODE, '⛔ «לא קו תחתון דק» — § 4.2יב').not.toMatch(/border-b\b/);
  });

  it('⛔ אין ניסיון שני ואין עונש — תשובה שגויה מנחיתה את המילה הנכונה בכל מקרה', () => {
    expect(CODE).not.toMatch(/נסה שוב.*אפשרות|ניסיון שני/);
    expect(CODE).toMatch(/המילה הייתה/);
  });

  it('האנגלית עוברת דרך העטיפה האחת ⛔ ולא דרך lang שנכתב ביד (T-009)', () => {
    expect(CODE).toContain('EnText');
    expect(CODE).toContain('EnWord');
  });

  it('ארבע אפשרויות שתיים-ושתיים, כל אחת ביעד מגע ⛔ ולא רשימה', () => {
    expect(CODE).toContain('grid-cols-2');
    expect(CODE).toContain('min-h-touch');
  });

  it('⛔ אפס מרכוז אנכי ואפס hex גולמי (חוקה § 4 · § 6 · F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/\bh-screen\b/);
    expect(CODE).not.toMatch(/justify-center/);
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/backdrop-blur|shadow-2xl|rotate-|perspective/);
  });

  it('כל אנימציה ≤300ms (חוקה § 5)', () => {
    const durations = [...CODE.matchAll(/duration-(\d+)/g)].map((m) => Number(m[1]));
    expect(durations.length).toBeGreaterThan(0);
    for (const ms of durations) expect(ms).toBeLessThanOrEqual(300);
  });

  it('נוסח הכשל מגיע מ-`lib/core/failure.ts` ⛔ ואינו מחרוזת חדשה (T-056)', () => {
    expect(CODE).toContain('FAILURE_HE');
    expect(CODE).toContain('RETRY_HE');
  });

  it('מייצא גם תצוגה טהורה לפיקסטורה ⛔ ואין עותק שני של ה-JSX', () => {
    expect(CODE).toMatch(/export function RecallCardView/);
    // ⛔ עותק שני היה נמדד כשני מופעים של רשת האפשרויות. אחד בלבד.
    expect([...CODE.matchAll(/grid-cols-2/g)]).toHaveLength(1);
  });

  it('⛔ שני מצבים ⛔ ולא אחד, ושניהם מובילים לאותה פעולה יחידה (D-075ⓑ · D-066)', () => {
    expect(CODE).toContain('עדיין לא הרכבת משפט');
    expect(CODE).toContain('המשפט שלך יחזור אליך');
    // ⚠️ נמדד באתר השימוש ⛔ ולא בשם הקבוע: שתי פעולות, ⛔ ולא אחת ו⛔ ולא שלוש.
    // ⛔ «מסך מת שממתין למחר» הוא בדיוק מה ש-D-066 אוסר.
    expect(CODE.match(/href=\{COMPOSE_HREF\}/g) ?? []).toHaveLength(2);
  });

  it('הסף מגיע מהשרת ⛔ ואינו כתוב בלקוח (D-046 · D-075ⓐ)', () => {
    expect(CODE).toContain('counts.required');
    // ⛔ השוואה ל-0 היא הסף שהלקוח המציא — בדיוק מה ש-D-046 בא למנוע.
    expect(CODE).not.toMatch(/eligible\s*[<>=!]==?\s*0/);
  });

  it('⛔ ארבע המילים האסורות — משוב על ההפקה ⛔ אינו נאמר לעולם (R-016 · D-075ⓑ)', () => {
    // ⚠️ נמדד על המקור **המולבן**: הערה ⛔ אינה מוצגת ללומד, ושער שהערה מפילה אותו
    // הוא רעש (F-065). מה שנמדד כאן הוא **הנוסח על המסך**.
    for (const banned of [/מילת\s+ה?יעד/, /לא הכיל/, /לא מתאים/, /נכון/]) {
      expect(CODE, `⛔ ${banned} — משוב על ההפקה (R-016)`).not.toMatch(banned);
    }
  });

  it('⛔ אפס `data-primary-action` — `/world` אינו FLOW_ROUTE (הגנת F-027)', () => {
    expect(CODE).not.toContain('data-primary-action');
  });
});
