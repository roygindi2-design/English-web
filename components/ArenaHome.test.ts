import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaHome.tsx', import.meta.url), 'utf8');
/**
 * ⚠️ **הלבנה, ⛔ ולא מקור גולמי** — אותו דפוס בדיוק של `app/arcade/page.test.ts`
 * (‏F-039 · F-064 · F-065): הקובץ **מתעד בהערה** את מה שאסור בו, ומדידה גולמית הייתה
 * מפילה קובץ ⛔ שאין בו ולו הפרה אחת. ⛔ מחרוזות שהלומד רואה נמדדות על **המקור**.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('ArenaHome — `37 § 12` ומול `docs/design/kol-B-01-home.png`', () => {
  it('הכותרת ותת-הכותרת, מילה במילה מ-`37 § 12`', () => {
    expect(SRC).toContain('זירת קרב');
    expect(SRC).toContain('ארקייד · מבודד מהתקדמות הלמידה');
  });

  it('התווית שמפרידה בין רמת הזירה לרמת האנגלית — ⛔ המשפט שהמסך קיים בשבילו', () => {
    expect(SRC).toContain('נפרדת מרמת האנגלית שלך');
    expect(SRC).toContain('רמת זירה');
  });

  it('שלוש הפעולות של `37 § 12`', () => {
    expect(SRC).toContain('התחל קרב');
    expect(SRC).toContain('עיצוב דמות');
    expect(SRC).toContain('ארון ציוד');
  });

  /**
   * ⛔ **המילה `xp` ⛔ אינה נבדקת כתת-מחרוזת, וזו תיקון של התוכנית ⛔ ולא הרפיה שלה:**
   * ‏`export` מכילה `xp`, ⇒ `not.toContain('xp')` היה מפיל **כל** קובץ TypeScript
   * בעולם ו⛔ לא מודד דבר. הגבול הוא **מילה**, ולכן `\bxp\b`.
   */
  it('⛔ D-131 — ⛔ אין מד XP ו⛔ אין שבב שברים', () => {
    for (const banned of ['שברי ניצוץ', '2,000', '1,240']) {
      expect(CODE).not.toContain(banned);
    }
    expect(CODE).not.toMatch(/\bxp\b/i);
  });

  it('⛔ D-132 — ⛔ אף שם פריט של הרנדר', () => {
    for (const banned of ['חרב הניצוץ', 'מגן אבן', 'לחש אש', 'שריון קל']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('⛔ הרכיב מצייר ו⛔ אינו מחשב — חשבון מסלול הבוס חי בליבה', () => {
    expect(SRC).toContain('bossTrack');
    expect(SRC).toContain('winsToBoss');
    expect(SRC).toContain('homeSlots');
    expect(CODE).not.toMatch(/%\s*5|Math\.floor/);
    // ⛔ והמספר 5 עצמו ⛔ אינו חי כאן — `BOSS_EVERY` חי ב-`lib/core/arenaHome.ts`.
    expect(CODE).not.toContain('BOSS_EVERY');
  });

  it('שכבה א׳ — 44px על שתי הפעולות המשניות, אף שהרנדר מצייר 42', () => {
    expect(CODE).toContain('min-h-touch');
    expect(CODE).not.toContain('h-[42px]');
  });

  /**
   * ⚠️ **D-137 (PM, C-0338 · שכבה ב׳) דרס את התוכנית, וזה ⛔ אינו שינוי שקט:** התוכנית
   * הורתה לשלוח את תווית המשבצת ב-**9px** של הרנדר ולפתוח עליה את F-162. ‏D-137 סגר
   * את F-162 במדידה — 9px היה הופך לטקסט הקטן ביותר ששוגר במוצר, **25% מתחת** למדרגה
   * הקטנה בסולם — וקבע: **טקסט משני בזירה הוא `text-xs` (12px) ומעלה**.
   */
  it('D-137 — ⛔ אין בזירה מספר גופן מתחת ל-12: תווית המשבצת היא `text-xs`', () => {
    expect(CODE).toContain('text-xs');
    for (const banned of ['text-[9px]', 'text-[10px]', 'text-[11px]', 'text-[10.5px]', 'text-[11.5px]']) {
      expect(CODE).not.toContain(banned);
    }
  });

  it('שכבה א׳ — מצב צומת ⛔ אינו מקודד בצבע בלבד', () => {
    // צורה לכל מצב: וי · נקודה מלאה · גולגולת, ושם נגיש בעברית לכל צומת.
    expect(SRC).toContain('aria-label');
    expect(SRC).toContain('נוצח');
    expect(SRC).toContain('קרב הבוס');
  });

  it('הזירה מציירת משטח משלה — ⛔ אחרת הטקסט יושב על רקע העמוד (F-155)', () => {
    expect(CODE).toContain('data-arena-scope');
    expect(CODE).toContain('min-h-[100dvh]');
    expect(CODE).not.toContain('h-screen');
  });

  /**
   * ⚠️ **הסינון על סימני קוד ⛔ אינו הרפיה של הבדיקה — הוא מה שהופך אותה למדידה.**
   * הביטוי `>…<` תופס גם ג׳נריקה של TypeScript (`useState<…>(…)`) וגם טרנארי בתוך JSX,
   * ושניהם ⛔ אינם צומת טקסט. צומת טקסט אמיתי ⛔ אינו נושא `= ; ( ) ?` —
   * ⇒ דליפה אמיתית כמו `>Start battle<` עדיין נופלת, וקוד ⛔ אינו נספר כמחרוזת.
   */
  it('⛔ RTL, ו⛔ אין מחרוזת אנגלית שהלומד רואה', () => {
    const strings = CODE.match(/>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? [];
    const text = strings.filter((s) => /[=;()?]/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });

  it('`prefers-reduced-motion` — נשימת ה-idle נעצרת (שכבה א׳)', () => {
    expect(SRC).toContain('motion-reduce:animate-none');
  });

  it('⛔ פעולה מושבתת ⛔ בלי סיבה כתובה היא מבוי סתום — `עיצוב דמות` נושאת אחת', () => {
    expect(SRC).toContain('disabled');
    expect(SRC).toContain('aria-describedby');
    expect(SRC).toContain('בחירת דמות תיפתח בקרוב');
  });

  it('⛔ אפס hex ברכיב — הצבע מגיע מטוקני הזירה (חוקה § 2)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('⛔ אפס אמוג׳י — אייקוני SVG בלבד (שכבה א׳)', () => {
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it('⛔ נקודת קצה אחת, והיא זו של T-181', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/home']));
  });

  /**
   * T-253 · D-186 — הכניסה לזירה עוברת בטבעת (`lib/core/worldApps.ts`), והחץ
   * היחיד ביציאה הוביל ל-`/` ⇒ `signedInRedirect` ⇒ `/studies` — לשונית שהלומד
   * לא ביקש. ⓑ: `BACK_HE = 'חזרה'` היא גם שם חפיסת החזרות (`DeckSelector.tsx`,
   * `36 § 5`, נעול) — מילה אחת, שתי משמעויות. שתיהן נסגרות באותה תווית: החץ
   * חוזר ישירות לטבעת, ונקרא בשם היעד שלו — אותה תווית ששני צמתי הטבעת
   * האחרים כבר נושאים (`ComposeDraft.tsx` · `StoryScreen.tsx`).
   */
  it('T-253 — חץ החזרה מוביל ישירות לטבעת, ⛔ לא ל-`/`', () => {
    expect(CODE).toContain('href="/world"');
    expect(CODE).not.toMatch(/href="\/"/);
  });

  it('T-253ⓑ — תווית החץ היא `חזרה לעולם`, ⛔ לא `חזרה` החשופה שמתנגשת בשם החפיסה', () => {
    expect(SRC).toContain('חזרה לעולם');
    expect(SRC).not.toMatch(/aria-label=\{?['"]חזרה['"]\}?/);
  });
});
