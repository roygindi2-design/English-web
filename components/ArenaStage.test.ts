import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

const SRC = readFileSync('components/ArenaStage.tsx', 'utf8');
const CSS = readFileSync('app/globals.css', 'utf8');

/**
 * ⚠️ **הלבנה, ⛔ ולא `SRC` גולמי** — בדיוק הלקח של F-039 · F-065 ושל
 * `app/api/arcade/result/route.test.ts`: הרכיב **מתעד בהערה** שאין בו `setTimeout`,
 * ומדידה גולמית הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת. ⛔ מחיקת ההערה אינה הפתרון.
 */
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

/**
 * הבלוק של הבמה ב-CSS. ⛔ `indexOf` לבדו מחזיר `-1` על סמן חסר, ו-`slice(-1)`
 * מחזיר תו אחד — כלומר בדיקה שנראית ירוקה על קובץ שאין בו כלל. לכן המיקום נאסר במפורש.
 */
const STAGE_MARKER = '/* arena-stage';
const STAGE_AT = CSS.indexOf(STAGE_MARKER);
/**
 * ⚠️ **הבלוק מולבן גם הוא, ומאותה סיבה בדיוק:** ההערה שבראשו **מצהירה** «אין `infinite`»,
 * ומדידה גולמית הייתה מפילה בלוק ⛔ שאין בו ולו לולאה אחת. הכלל אחד: **מודדים קוד,
 * ⛔ לא תיעוד.** ⛔ המיקום נלקח מהמקור הגולמי (הסמן **הוא** הערה) והלבנתו באה אחריו.
 */
const STAGE_CSS = (STAGE_AT === -1 ? '' : CSS.slice(STAGE_AT)).replace(/\/\*[\s\S]*?\*\//g, '');

describe('<ArenaStage> — D-060 · חוקה § 5', () => {
  it('שתי דמויות, גיבור ויריב', () => {
    expect(CODE).toMatch(/role="hero"/);
    expect(CODE).toMatch(/role="enemy"/);
  });

  it('התנוחה מגיעה כ-prop מהחוק ⛔ ואינה מחושבת כאן', () => {
    expect(CODE).toMatch(/phase/);
    expect(CODE).not.toMatch(/\bcorrect\b/);
    expect(CODE).not.toMatch(/useState|useEffect/);
  });

  it('⛔ אפס שעון ואפס לולאת JS', () => {
    for (const banned of [/setTimeout/, /setInterval/, /requestAnimationFrame/]) {
      expect(CODE).not.toMatch(banned);
    }
  });

  it('⛔ אפס hex — הצבע מגיע מהאסימונים (חוקה § 2)', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('התנועה חיה ב-CSS, ולכל תנוחה יש כלל משלה', () => {
    expect(CODE).toMatch(/data-arena-phase=\{phase\}/);
    for (const phase of ['hit', 'dodge']) {
      expect(CSS).toContain(`[data-arena-phase='${phase}']`);
    }
  });

  it('⛔ בלוק הבמה קיים ב-CSS — סמן חסר הוא כשל בשם ⛔ ולא בדיקה ריקה', () => {
    expect(STAGE_AT, `הסמן «${STAGE_MARKER}» חייב להופיע ב-app/globals.css`).toBeGreaterThan(-1);
  });

  /**
   * ⚠️ **החריגה נמדדת בשמה, ⛔ ולא מבטלת את התקרה.** חוקה ב5 מתירה מוטיון מעל תקרת ב6
   * — ⇒ בלוק ה-`arena-idle` **בלבד** מוסר לפני המדידה, ותקרת 300ms ממשיכה לחול על
   * **כל שאר** כללי הבמה. ⛔ מחיקת התקרה הייתה קונה שורה אחת במחיר השומר כולו.
   */
  const NO_IDLE = STAGE_CSS.replace(/@keyframes arena-idle[\s\S]*?\}\s*\}/, '').replace(
    /\[data-arena-idle='on'\][^{]*\{[^}]*\}/g,
    '',
  );

  it('חוקה § 5 — ⛔ אין משך מעל 300ms בכללי הבמה (מלבד חריגת ב5, שנמדדת בנפרד)', () => {
    const ms = [...NO_IDLE.matchAll(/(\d+(?:\.\d+)?)ms/g)].map((m) => Number(m[1]));
    const s = [...NO_IDLE.matchAll(/(\d+(?:\.\d+)?)s\b/g)].map((m) => Number(m[1]) * 1000);
    expect([...ms, ...s].length, 'חייב להימדד משך אחד לפחות').toBeGreaterThan(0);
    for (const d of [...ms, ...s]) expect(d).toBeLessThanOrEqual(300);
  });

  it('פריט 39 · D-128 — לולאת ההמתנה קיימת, וחיה אך ורק בבמה', () => {
    expect(STAGE_CSS.length, 'הבלוק חייב להיות לא ריק').toBeGreaterThan(0);
    expect(STAGE_CSS).toMatch(/@keyframes arena-idle/);
    expect(STAGE_CSS).toMatch(/infinite/);
    // ⛔ הלולאה היחידה בבלוק, ⛔ ולא «לולאות»: ב5 מתיר חריגה מדודה, ⛔ לא רשות פתוחה.
    expect([...STAGE_CSS.matchAll(/infinite/g)]).toHaveLength(1);
  });

  it('גדר המשרעת ≤2px נמדדת מה-CSS, ⛔ ולא מהערה', () => {
    const px = [...STAGE_CSS.matchAll(/translateY\((-?\d+(?:\.\d+)?)px\)/g)]
      .map((m) => Math.abs(Number(m[1])));
    expect(px.length, 'חייבת להימדד תזוזה אחת לפחות').toBeGreaterThan(0);
    for (const v of px) expect(v).toBeLessThanOrEqual(2);
  });

  it('חוקה א7 — prefers-reduced-motion עוצר, ⛔ ולא מאיץ', () => {
    expect(STAGE_CSS).toMatch(/prefers-reduced-motion[\s\S]*arena-idle[\s\S]*animation:\s*none/);
  });
});

/**
 * 🏟️ **⟦NEW 15/09 · `C-0623` · `T-361` · רוי: «זה צריך להיות תלת-ממד»⟧ העומק.**
 *
 * 🔬 **מה שנמדד לפני, ⛔ ולא נקרא:** הבמה הייתה `flex-row items-end justify-between`
 * ושתי הדמויות `h-24 w-24` — **שורה שטוחה, אותו גודל בדיוק**, ⛔ בלי רצפה, ⛔ בלי
 * אופק ו⛔ בלי צל. ⇒ ⛔ אין חיווי מי רחוק ומי קרוב, ושתי דמויות זהות הן שני אייקונים.
 * ועל iPhone 13 הבמה כולה קיבלה **52px מתוך 580** — 9% מהמסך לקרב עצמו.
 */
describe('C-0623 — הבמה בתלת-ממד', () => {
  const STAGE = readFileSync('components/ArenaStage.tsx', 'utf8');
  const SCENE = readFileSync('components/ArenaScene.tsx', 'utf8');
  /* ⛔ **הערות ⛔ אינן קוד.** שתי טענות כאן נפלו על ה**פרוזה** שלי עצמה — הן חיפשו
     `aspect-[` ו-`useEffect` ומצאו אותם במשפט שמסביר למה הם ⛔ לא שם. ⇒ כל טענה
     **שלילית** רצה על המקור בלי הערות, וזה בדיוק מה ש-`withoutComments` קיים בשבילו. */
  const STAGE_CODE = withoutComments(STAGE);
  const SCENE_CODE = withoutComments(SCENE);
  const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8');

  it('הסט קיים ו**נסוג** — אופק, נקודת מגוז, ורצפה טרפזית', () => {
    expect(STAGE, 'הבמה מרכיבה את הסט').toMatch(/<ArenaScene\s*\/>/);
    expect(SCENE, 'אופק מוצהר').toMatch(/const HORIZON = \d+/);
    expect(SCENE, 'נקודת מגוז מוצהרת').toMatch(/const VANISHING_X = \d+/);
    // 🔴 **הרצפה היא `polygon`, ⛔ ולא `rect`.** מלבן הוא משטח; טרפז שמתכנס אל המגוז
    // הוא **מישור**, וזה כל ההבדל בין רקע כהה לבין מקום.
    expect(SCENE, 'רצפה טרפזית').toMatch(/<polygon[\s\S]{0,200}VANISHING_X \+ 26/);
    expect(SCENE, '⛔ ⛔ לא מלבן במקום הרצפה').not.toMatch(/<rect[^>]*id="arena-floor"/);
  });

  /** ⛔ **שלושת חיווי העומק, וכל אחד נבדק בנפרד** — שניים מהם לבד ⛔ אינם עומק. */
  it('שלושת חיווי העומק: סקאלה · גובה · צל', () => {
    // ① סקאלה — היריב מוקטן, ⛔ והגיבור לא.
    expect(STAGE, 'היריב מוקטן').toMatch(/data-arena-depth="far"[^>]*scale-\[0\.\d+\]/);
    // ② גובה — היריב מעוגן למעלה, הגיבור למטה. ⛔ שניהם על אותו קו = ⛔ אין עומק.
    expect(STAGE, 'היריב למעלה').toMatch(/data-arena-slot="enemy"[\s\S]{0,200}top-\[/);
    expect(STAGE, 'הגיבור למטה').toMatch(/data-arena-slot="hero"[\s\S]{0,300}bottom-\[/);
    // ③ צל — לשתיהן. ⛔ בלי צל דמות **מרחפת** על רקע, ⛔ ואינה עומדת על רצפה.
    expect((STAGE.match(/data-arena-shadow/g) ?? []).length, 'צל לשתי הדמויות').toBe(2);
    expect(TOKENS, 'והצל הוא אליפסה עם גרדיאנט').toMatch(
      /\[data-arena-shadow\]\s*\{[^}]*border-radius: 50%[^}]*radial-gradient/,
    );
  });

  /**
   * 🔴 **הרוחב הנומינלי ⛔ אינו זז, וזו ⛔ אינה קפדנות — זו פיזיקה.**
   * `ArenaBattle.test.ts` גוזר את `--arena-follow-x` מ-`FIGURE_CLASS`: התזוזה היא
   * `rem` על ה-`<svg>` והפיגור חי **בתוך** ה-`viewBox`. ⇒ הקטנת הקופסה הייתה משנה
   * את המכנה והופכת את הטוקן לשקר. **העומק מושג ב-`scale`**, שמקטין גם את תנועת
   * ההמשך — וזה בדיוק מה שמצלמה עושה.
   */
  it('העומק ב-`scale`, ⛔ ולא בקופסה קטנה יותר — הרוחב הנומינלי שלם', () => {
    expect(STAGE, 'קבוע יחיד לשתי הדמויות').toMatch(/const FIGURE_CLASS = 'h-24 w-24'/);
    const uses = STAGE.match(/className=\{FIGURE_CLASS\}/g) ?? [];
    expect(uses.length, 'שתי הדמויות קוראות אותו').toBe(2);
    // ⛔ ואין גובה קשיח שני שעוקף אותו — כך נולד הפער שהבדיקה תפסה.
    expect(STAGE_CODE, '⛔ ⛔ אין h-16/h-20 על דמות').not.toMatch(/ArenaAvatar[^/]*className="[^"]*h-(?:16|20)\b/);
  });

  it('הבמה **ממלאת** את מה שניתן לה, ⛔ ואינה כופה יחס', () => {
    // 🔬 נמדד: `aspect-[4/3]` בתוך הורה `flex-1` הוא הגדרה מעגלית ⇒ שניהם קרסו ל-20px.
    expect(STAGE, 'ממלאת').toMatch(/const STAGE_CLASS = 'relative h-full w-full/);
    expect(STAGE_CODE, '⛔ ⛔ לא יחס').not.toMatch(/aspect-\[/);
  });

  it('⛔ הסט **סטטי** — ⛔ אפס ריצוד, ⛔ אפס הבהוב (T-041)', () => {
    // 🔴 תקציב התנועה הולך למה שהלומד **עשה**, ⛔ ולא לרקע שמנצנץ בזמן שהוא חושב.
    expect(SCENE_CODE, '⛔ ⛔ אין אנימציה בסט').not.toMatch(/animation|@keyframes|transition/);
    expect(SCENE_CODE, '⛔ ו⛔ אין שעון').not.toMatch(/useState|useEffect|requestAnimationFrame|setTimeout/);
    // ⛔ ואין צבע גולמי — הכול טוקן של הזירה (`37 § 13.5`). ⛔ מזהי גרדיאנט
    // (`url(#arena-sky)`) ⛔ אינם צבע, ⇒ הדפוס דורש ספרות-הקס בלבד.
    expect(SCENE_CODE, '⛔ ⛔ אין hex').not.toMatch(/#[0-9a-fA-F]{3,8}\b(?![-\w])/);
  });
});
