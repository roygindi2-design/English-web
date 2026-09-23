import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';
import { LANE_SHIFT_PCT, laneEdgeAtHorizon } from '@/components/ArenaScene';
import { TELEGRAPH_MS, WINDOW_END_MS } from '@/lib/core/battle';

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
    /* ⚠️ **⟨עודכן `C-0733`⟩ `FLOOR_HALF_FAR` ו⬛ לא `26` מוטבע — והטענה לא נחלשה.**
       המספר היה כתוב פעמיים — במצולע ובמקדם ההתכנסות — ושני העותקים
       **סטו זה מזה**. ⇒ מקור אחד, והטרפז עדיין נמדד כאן בשמו. */
    expect(SCENE, 'רצפה טרפזית').toMatch(/<polygon[\s\S]{0,200}VANISHING_X \+ FLOOR_HALF_FAR/);
    expect(SCENE, '⛔ ⛔ לא מלבן במקום הרצפה').not.toMatch(/<rect[^>]*id="arena-floor"/);
  });

  /** ⛔ **שלושת חיווי העומק, וכל אחד נבדק בנפרד** — שניים מהם לבד ⛔ אינם עומק. */
  it('שלושת חיווי העומק: סקאלה · גובה · צל', () => {
    /* ↩️ **⟦20/09 · `C-0750`⟧ `STAGE_CODE` — מולבן, ⛔ ולא `STAGE` גולמי.**
       ⚠️ **וזה הלקח שראש הקובץ הזה כבר כתוב עליו** (`F-039` · `F-065`), שהשורה
       הזאת פשוט ⛔ לא קיימה: ספירת `data-arena-shadow` **גולמית** החזירה **3**
       ברגע שהילת הרצף נוספה עם הערה שאומרת «בדפוס `[data-arena-shadow]` שורה
       מעליו» ⇒ הקובץ האדים על **פרוזה**, בעוד מספר הצמתים ⛔ לא זז.
       ⛔ **והטענה ⛔ לא נחלשה:** `<span data-arena-shadow>` שלישי אמיתי עדיין מאדים,
       ושלושת חיווי העומק נמדדים על **הקוד**, שהוא מה שהדפדפן רואה. */
    // ① סקאלה — היריב מוקטן, ⛔ והגיבור לא.
    expect(STAGE_CODE, 'היריב מוקטן').toMatch(/data-arena-depth="far"[^>]*scale-\[0\.\d+\]/);
    // ② גובה — היריב מעוגן למעלה, הגיבור למטה. ⛔ שניהם על אותו קו = ⛔ אין עומק.
    expect(STAGE_CODE, 'היריב למעלה').toMatch(/data-arena-slot="enemy"[\s\S]{0,200}top-\[/);
    expect(STAGE_CODE, 'הגיבור למטה').toMatch(/data-arena-slot="hero"[\s\S]{0,300}bottom-\[/);
    // ③ צל — לשתיהן. ⛔ בלי צל דמות **מרחפת** על רקע, ⛔ ואינה עומדת על רצפה.
    expect((STAGE_CODE.match(/data-arena-shadow/g) ?? []).length, 'צל לשתי הדמויות').toBe(2);
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

/**
 * 🎭 **⟦NEW 15/09 · `C-0624` · `T-366` · רוי: «תשפר את האנימציה של הדמויות עצמן»⟧**
 *
 * 🔬 **מה שנמדד בקוד לפני, ⛔ ולא שוער:** `data-arena-idle` הופיע **פעם אחת** בבמה ⇒
 * הגיבור נשם והיריב היה **פסל**; `[data-arena-part]` זז **אך ורק** ברגע פגיעה; והתנוחות
 * היו `translateX` בלבד — **החלקה, ⛔ ולא מכה**.
 */
describe('C-0624 — הדמויות חיות', () => {
  const STAGE = readFileSync('components/ArenaStage.tsx', 'utf8');
  const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
  const TOKENS_CODE = TOKENS.replace(/\/\*[\s\S]*?\*\//g, '');

  it('⛔ **שתי** הדמויות נושמות, ⛔ ולא אחת', () => {
    // ⓐ הגיבור — המנגנון הקיים, ⛔ שלא נגעתי בו.
    expect(STAGE).toMatch(/data-arena-idle=\{idle \? 'on' : 'off'\}/);
    // ⓑ היריב — תכונה **משלו**. ⛔ שימוש חוזר ב-`data-arena-idle` היה מוחק את
    //    `scale-[0.66]` שלו: הכלל שלה ב-`globals.css` הוא `transform`, וכך גם הסקאלה.
    expect(STAGE).toMatch(/data-arena-breath="enemy"/);
    expect(TOKENS_CODE).toMatch(
      /\[data-arena-breath='enemy'\]\s*\{[^}]*animation:\s*arena-breath var\(--arena-breath-ms\)/,
    );
  });

  it('⛔ נשימת היריב על `translate`, ⛔ ולא על `transform` — אחרת העומק נמחק', () => {
    const frames = TOKENS_CODE.match(/@keyframes arena-breath\s*\{[\s\S]*?\}\s*\}/);
    expect(frames, 'הקדר חייב להתקיים').not.toBeNull();
    expect(String(frames)).toMatch(/translate:/);
    // 🔴 זו הטענה כולה: `transform` כאן היה דורס את `scale-[0.66]` של העוטף.
    expect(String(frames), '⛔ ⛔ לא transform').not.toMatch(/transform:/);
    // …והעוטף אכן נושא את שניהם על אותו אלמנט, ⇒ ההתנגשות ⛔ אינה תיאורטית.
    expect(STAGE).toMatch(/data-arena-breath="enemy"[\s\S]{0,120}scale-\[0\.66\]/);
  });

  it('שני מחזורים שונים ⇒ שתי נשימות, ⛔ ולא מטרונום', () => {
    const breath = Number(/--arena-breath-ms:\s*(\d+)ms/.exec(TOKENS)?.[1]);
    const sway = Number(/--arena-sway-ms:\s*(\d+)ms/.exec(TOKENS)?.[1]);
    const hero = Number(/animation: arena-idle (\d+)ms/.exec(readFileSync('app/globals.css', 'utf8'))?.[1]);
    for (const [name, v] of [['breath', breath], ['sway', sway], ['hero', hero]] as const) {
      expect(Number.isFinite(v), `${name} חייב להימדד`).toBe(true);
    }
    // ⛔ שלושה מחזורים **שונים**, ו⛔ אף אחד ⛔ אינו כפולה שלמה של אחר ⇒ הם נסחפים
    // זה מזה ו⛔ לעולם אינם פועמים יחד.
    expect(new Set([breath, sway, hero]).size).toBe(3);
    const pairs: readonly (readonly [number, number])[] = [
      [breath, hero],
      [sway, hero],
      [breath, sway],
    ];
    for (const [a, b] of pairs) {
      expect(Math.max(a, b) % Math.min(a, b), `${a}/${b} ⛔ אינם כפולה`).not.toBe(0);
    }
  });

  it('ההישענות היא ערוץ **שני**, ⛔ ולא החלפה של ההדיפה', () => {
    // ⛔ `rotate` לצד `transform`, ⇒ שניהם רצים. בכתיב הישן זה היה מאפיין אחד.
    expect(TOKENS_CODE).toMatch(/transition:\s*transform 200ms ease-out,\s*rotate 200ms ease-out/);
    expect(TOKENS_CODE).toMatch(/\[data-arena-phase='hit'\] \[data-arena-figure='enemy'\]\s*\{\s*rotate:/);
    expect(TOKENS_CODE).toMatch(/\[data-arena-phase='dodge'\] \[data-arena-figure='hero'\]\s*\{\s*rotate:/);
    // ⛔ **הציר בכפות הרגליים** — גוף מסתובב סביב מה שנוגע ברצפה שהסט צייר.
    expect(TOKENS_CODE).toMatch(/\[data-arena-figure\]\s*\{[^}]*transform-origin:\s*50% 100%/);
  });

  it('⛔ הנדנוד על השכבות ה**רכות** בלבד — ⛔ ולא על הנשק', () => {
    expect(TOKENS_CODE).toMatch(/\[data-arena-part='hair'\]/);
    expect(TOKENS_CODE).toMatch(/\[data-arena-part='cape'\]/);
    // 🔴 מוט שמוחזק ביד ⛔ אינו מפגר אחרי הגוף. בד ושיער כן.
    const sway = TOKENS_CODE.slice(TOKENS_CODE.indexOf("[data-arena-part='hair']"));
    expect(sway.slice(0, 260), '⛔ ⛔ לא הנשק').not.toMatch(/data-arena-part='weapon'/);
    // …והציר הוא נקודת החיבור, ⛔ ולא מרכז הצורה.
    expect(TOKENS_CODE).toMatch(/transform-box:\s*fill-box;\s*transform-origin:\s*50% 0%/);
  });

  it('חוקה א7 — שלושת הערוצים החדשים נעצרים ב-`prefers-reduced-motion`', () => {
    const blocks = [...TOKENS_CODE.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '');
    const joined = blocks.join('\n');
    expect(blocks.length, 'חייב להימדד בלוק אחד לפחות').toBeGreaterThan(0);
    for (const sel of ["[data-arena-breath='enemy']", "[data-arena-part='hair']", "[data-arena-part='cape']"]) {
      expect(joined, `${sel} חייב להיעצר`).toContain(sel);
    }
    // ⛔ `animation: none` ו⛔ לא משך זעיר — משך 0.01ms על `infinite` הוא לולאה מהירה.
    expect(joined).toMatch(/animation:\s*none/);
    // ⛔ **וההישענות חוזרת לזקוף**, ⛔ ולא נשארת נטויה לנצח כשהתנועה כבויה.
    expect(joined).toMatch(/rotate:\s*0deg/);
  });
});

/**
 * 🏃 **⟦19/09 · `C-0730` · `T-433`ⓑ · `37 § 5` · `D-269` הכרעה ①⟧ הנתיב על המסך.**
 *
 * 🔬 **מה שנמדד לפני, ⛔ ולא הונח:** הליבה ידעה על שלושה נתיבים (`C-0729`), המחווה
 * זוהתה, `dx` חושב — ו⛔ **שום פיקסל על המסך לא זז**. ⇒ הבדיקות כאן מודדות את
 * שלוש החוליות שסוגרות את הפער: ה**תכונה** על החריץ, ה**כלל** ב-CSS, וה**רצפה**
 * שמראה שלוש רצועות ⛔ ולא ארבע.
 *
 * 🔴 **והטענה הכבדה ביותר היא זו של תנועה מופחתת** — כי היא הכלל שכל העיצוב נגזר
 * ממנו: הנתיב הוא **מצב**, ⇒ כשהתנועה כבויה המעבר מוסר וה**מיקום נשאר**.
 */
describe('C-0730 · T-433ⓑ — הנתיב על המסך', () => {
  const TOKENS_SRC = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
  const TOKENS = TOKENS_SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  const SCENE = withoutComments(readFileSync('components/ArenaScene.tsx', 'utf8'));

  it('הנתיב מגיע כ-prop ⛔ ואינו state — ונכתב כ**תכונה** על החריץ', () => {
    expect(CODE).toMatch(/readonly lane\?/);
    expect(CODE).toMatch(/data-arena-lane=\{LANE_NAMES\[lane \?\? CENTRE\]\}/);
    // ⛔ הכלל של הבמה ⛔ אינו נחלש: ⛔ אפס state, ⛔ אפס שעון.
    expect(CODE).not.toMatch(/useState|useEffect|requestAnimationFrame/);
  });

  it('⛔ התכונה יושבת על ה**חריץ**, ⛔ ולא על הדמות — הצל זז איתה', () => {
    // 🔬 הפגם שזה מונע: צל שנשאר במרכז בזמן שהגוף עבר נתיב ⇒ הגוף מרחף.
    const slot = CODE.slice(CODE.indexOf('data-arena-slot="hero"'));
    expect(slot.slice(0, 200)).toContain('data-arena-lane=');
    expect(slot).toMatch(/data-arena-lane=[\s\S]{0,300}data-arena-shadow/);
  });

  it('שלושת הנתיבים הם שלושה כללי CSS, ו**כולם** על `translate`', () => {
    for (const name of ['left', 'centre', 'right']) {
      expect(TOKENS, `נתיב ${name}`).toContain(`[data-arena-slot='hero'][data-arena-lane='${name}']`);
    }
    // ⛔ **⛔ לא `transform`** — הוא תפוס בידי התנוחה ובידי לולאת ה-idle (`T-366`ⓐ).
    const lanes = TOKENS.slice(TOKENS.indexOf("[data-arena-slot='hero'][data-arena-lane='left']"));
    expect(lanes.slice(0, 400)).not.toMatch(/transform:/);
    expect(lanes.slice(0, 400)).toMatch(/translate:/);
    /* 🔬 **⟨`C-0733`⟩ המספר **מחושב מחדש** מארבעת מקורותיו, ⬛ ואינו מועתק.**
       ⇒ שינוי ב-`HORIZON`, ברוחב הרצפה בחזית או באופק, או בגובה חריץ הגיבור
       **מפיל את השורה הזאת בשם** — בדיוק כמו `--arena-follow-x`. */
    expect(TOKENS).toContain(`--arena-lane-shift: ${LANE_SHIFT_PCT.toFixed(4)}%`);
    // ⬛ **ו⬛ לא «שליש מרוחב הבמה»** — זה היה הפגם: הלומד עמד מחוץ לרצפה.
    expect(LANE_SHIFT_PCT).toBeLessThan(100 / 3);
  });

  it('🔴 תנועה מופחתת — ה**מעבר** מוסר, וה**מיקום** נשאר', () => {
    const blocks = [...TOKENS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '');
    const lane = blocks.filter((b) => b.includes("[data-arena-slot='hero']"));
    expect(lane.length, 'חייב להיות בלוק שעוצר את מעבר הנתיב').toBeGreaterThan(0);
    expect(lane.join('\n')).toMatch(/transition:\s*none/);
    // 🔴 **הטענה שמגנה על המשחק:** ⛔ אסור שהבלוק יאפס את המיקום עצמו — לומד עם
    //    תנועה מופחתת עדיין **עומד בנתיב שבחר**, אחרת ההתחמקות ⛔ אינה קיימת עבורו.
    expect(lane.join('\n')).not.toMatch(/translate:\s*0/);
  });

  it('הרצפה מראה **שלוש** רצועות — ⇒ ארבעה גבולות, ⛔ ולא חמישה קווים', () => {
    // 🔬 הפגם: חמישה קווים ⇒ העין קוראת ארבעה נתיבים במשחק שיש בו שלושה.
    expect(SCENE).toMatch(/const LANES = 3;/);
    expect(SCENE).toMatch(/length: LANES \+ 1/);
    expect(SCENE).not.toMatch(/\[-24, -12, 0, 12, 24\]/);
    /* 🔴 **⟨`C-0733`⟩ וקווי הנתיבים **שוכבים על הרצפה**, ⬛ ולא על מישור משלהם.**
       🔬 המקדם הישן הוליד קו שפה שנחת על `43.8` באופק בעוד פינת המצולע שם על `24`
       ⇒ שתי שכבות של אותה פרספקטיבה סיפרו שני סיפורים. */
    expect(laneEdgeAtHorizon(0)).toBeCloseTo(24, 6);
    expect(laneEdgeAtHorizon(100)).toBeCloseTo(76, 6);
    expect(laneEdgeAtHorizon(50)).toBeCloseTo(50, 6);
  });
});

/**
 * 🔥 **⟦19/09 · `C-0732` · `T-434` · `37 § 8` ק3 · `37 § 6`⟧ המתקפה הראשונה.**
 *
 * 🔬 **הפער שנמדד:** היריב טוען 5.3 שניות, מכריז «מטיל!», המד מהבהב — ו⛔ **שום
 * עצם ⛔ אינו עף**. המכה פשוט **קורית**.
 *
 * 🔴 **והטענה שמכריעה את כל העיצוב היא ההפרדה, ⛔ ולא הכדור:** סימן הרצפה הוא
 * ה**מידע** והכדור הוא ה**קישוט**. ⇒ תחת `prefers-reduced-motion` הכדור נעלם
 * ו**הסימן נשאר** — ואילו היה הפוך, לומד עם תנועה מופחתת ⛔ לא היה יכול לשחק.
 * ⇒ הבדיקה הזאת מודדת את ה**א-סימטריה** בין שני הצמתים, ⛔ ולא את קיומם.
 */
describe('C-0732 · T-434 — המתקפה הראשונה', () => {
  const TOKENS_SRC = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
  const TOKENS = TOKENS_SRC.replace(/\/\*[\s\S]*?\*\//g, '');
  const BATTLE = withoutComments(readFileSync('components/ArenaBattle.tsx', 'utf8'));

  const reduced = () =>
    [...TOKENS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '')
      .join('\n');

  it('🔴 תנועה מופחתת — **הכדור נעלם, והסימן נשאר**', () => {
    expect(reduced(), 'הכדור חייב להיעלם').toContain('[data-arena-bolt]');
    // ⛔ **וזו הטענה שמגנה על המשחק:** סימן הרצפה ⛔ אינו מוסר לעולם.
    expect(reduced(), '⛔ סימן הרצפה ⛔ אינו מוסר').not.toContain('[data-arena-aim]');
  });

  it('⛔ `display: none` לכדור ⛔ ולא `animation: none` — אחרת הצומת חי לנצח', () => {
    // 🔬 בלי אנימציה ⛔ אין `animationend`, ⇒ `onAnimationEnd` ⛔ לעולם ⛔ אינו נורה
    //    והצומת נשאר במסמך לנצח. ⛔ **גוף הכלל עצמו, ⛔ ולא חלון תווים** — 🔬 נמדד:
    //    חלון של 120 תווים גלש אל הכלל הבא ומצא שם `display: none` ⇒ המוטציה
    //    `animation: none` נשארה **ירוקה**, כלומר הבדיקה ⛔ לא מדדה דבר.
    const body = /\[data-arena-bolt\]\s*\{([^}]*)\}/.exec(reduced())?.[1] ?? '';
    expect(body, 'הכלל חייב להתקיים בתוך בלוק התנועה המופחתת').not.toBe('');
    expect(body).toMatch(/display:\s*none/);
    expect(body, '⛔ `animation: none` משאיר את הצומת על המסך לנצח').not.toMatch(/animation:/);
  });

  it('⛔ הסימן הוא **מצב** — ⛔ אפס אנימציה ו⛔ אפס `transition` עליו', () => {
    const at = TOKENS.indexOf('[data-arena-aim]');
    expect(at, 'הכלל חייב להתקיים').toBeGreaterThan(-1);
    const rule = TOKENS.slice(at, TOKENS.indexOf('}', at));
    expect(rule).not.toMatch(/animation|transition/);
    for (const name of ['left', 'centre', 'right']) {
      expect(TOKENS, `נתיב ${name}`).toContain(`[data-arena-aim='${name}']`);
    }
  });

  it('🔬 משך הכדור **נגזר** מהטלגרף — 300ms, ⛔ ולא מספר שנבחר', () => {
    // `§ 6`: החלון נסגר ב-`WINDOW_END_MS` והמכה נוחתת בתום `TELEGRAPH_MS`
    // ⇒ ההפרש **הוא** המשך, ⛔ ואינו מספר שאפשר לכוונן בנפרד.
    expect(TELEGRAPH_MS - WINDOW_END_MS).toBe(300);
    expect(TOKENS).toMatch(/--arena-bolt-ms:\s*300ms/);
  });

  it('הכדור יוצא ב-`committed` בלבד — ⛔ ולא בחלון שעוד אפשר להתחמק בו', () => {
    expect(BATTLE).toMatch(/phase === 'committed'\)\s*launchBoltRef\.current\(\)/);
    // ⛔ **שני צמתים חיים, ⛔ ולא מספרים:** כדור שמכוון לחריץ טס למרכז בכל נתיב.
    expect(BATTLE).toMatch(/heroRect\(area\)/);
    expect(BATTLE).toMatch(/foeRect\(area\)/);
  });

  it('⛔ אפס שעון — השחרור הוא `onAnimationEnd`, כמו הקלף', () => {
    expect(BATTLE).not.toMatch(/setTimeout|setInterval/);
    const at = BATTLE.indexOf('data-arena-bolt');
    expect(at).toBeGreaterThan(-1);
    expect(BATTLE.slice(at, at + 400)).toMatch(/onAnimationEnd/);
  });

  it('🔴 **המחסום הראשון מתוך שניים** — הצומת ⛔ אפילו ⛔ אינו נולד', () => {
    // ⛔ ה-CSS לבדו ⛔ אינו מספיק: `display:none` מסתיר צומת ש**נוצר**.
    const at = BATTLE.indexOf('const launchBolt =');
    expect(at).toBeGreaterThan(-1);
    expect(BATTLE.slice(at, at + 200)).toMatch(/if \(reducedMotion\) return;/);
  });

  it('הסימן נדלק בהכרזה ⛔ ולא בפגיעה, והוא **נגזר מהנתיב** ⛔ ולא מאקראי', () => {
    expect(BATTLE).toMatch(/telegraphPhase === 'window' \|\| telegraphPhase === 'committed'/);
    expect(BATTLE).toMatch(/aim=\{aimed \? aimLaneAt\(battle, aimSwing\) : null\}/);
    expect(BATTLE).not.toMatch(/Math\.random/);
  });
});

/**
 * ⚔️ **⟦19/09 · `C-0739` · `T-440` · `37 § 6`⟧ הדמויות זזות במתקפה.**
 *
 * 🔬 **שני פערים, ושניהם נמדדו ⛔ ולא שוערו:**
 * ⓐ `§ 6` כותב «הכרזה 5.3 ש׳: **ידיים מורמות**» — ו⛔ **רק מד זז** היום.
 * ⓑ `grep -c prevLearnerHp` ⇒ **0**: לזירה שלושה אותות ויזואליים, **שלושתם
 *    על ההטלה של הלומד**. ⇒ המכה של ה**יריב** נוחתת, וה**גוף ⛔ אינו מגיב**.
 */
describe('C-0739 · T-440 — הדמויות זזות במתקפה', () => {
  const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const BATTLE = withoutComments(readFileSync('components/ArenaBattle.tsx', 'utf8'));

  it('🙌 הידיים עולות ב**הכרזה** — ⛔ ולא בטעינה', () => {
    // `§ 6`: הטבלה ממקמת «ידיים מורמות» ב-5.3ש׳, שהוא בדיוק `charging ⇢ window`.
    expect(TOKENS).toMatch(/\[data-arena-telegraph='window'\][^{]*\[data-arena-layer='mainHand'\]/);
    expect(TOKENS).not.toMatch(/\[data-arena-telegraph='charging'\][^{]*rotate/);
    expect(CODE, 'והשלב מגיע כ-prop').toMatch(/data-arena-telegraph=\{telegraph\}/);
  });

  it('⛔ הסיבוב על **קבוצת השכבה** — אחרת המטה מתנתק מהיד', () => {
    // 🔬 `mainHand` נושא את הזרוע **ואת המטה והגולה**.
    expect(TOKENS).toMatch(/\[data-arena-layer='mainHand'\],[\s\S]{0,120}\[data-arena-layer='offHand'\]\s*\{[\s\S]{0,140}transform-box:\s*fill-box/);
    // ⛔ **`rotate` ⛔ ולא `transform`** — `transform` תפוס בציור מגב (`T-432`).
    const at = TOKENS.indexOf("[data-arena-figure='enemy'] [data-arena-layer='mainHand']");
    expect(TOKENS.slice(at, at + 400)).not.toMatch(/transform:\s/);
  });

  it('⛔ וסימנים **הפוכים** לשתי הידיים — אחרת אחת יורדת', () => {
    expect(TOKENS).toMatch(/\[data-arena-layer='mainHand'\]\s*\{\s*rotate:\s*calc\(var\(--arena-arms-deg\) \* -1\)/);
    expect(TOKENS).toMatch(/\[data-arena-layer='offHand'\]\s*\{\s*rotate:\s*var\(--arena-arms-deg\)/);
  });

  it('🩸 הרתיעה — האות שלא היה קיים כלל', () => {
    expect(BATTLE, '⛔ היה 0 לפני השורה הזאת').toMatch(/prevLearnerHp/);
    expect(BATTLE).toMatch(/data-arena-hurt=/);
    // ⛔ `'a'⇄'b'` — שם זהה ⛔ אינו מפעיל מחדש ⇒ שתי מכות רצופות כמכה אחת.
    expect(TOKENS).toMatch(/@keyframes arena-hurt-a/);
    expect(TOKENS).toMatch(/@keyframes arena-hurt-b/);
    expect(BATTLE).toMatch(/animationName\.startsWith\('arena-hurt'\)/);
  });

  it('⛔ הרתיעה על `translate` — `transform` תפוס בידי התנוחה', () => {
    // 🔬 אנימציה על `transform` הייתה **דורסת מכה באמצע**.
    const at = TOKENS.indexOf('@keyframes arena-hurt-a');
    const block = TOKENS.slice(at, TOKENS.indexOf('}\n}', at));
    expect(block).toMatch(/translate:/);
    expect(block).not.toMatch(/transform:/);
  });

  it('🔴 תנועה מופחתת — הידיים **נשארות מורמות**, והרתיעה מוסרת', () => {
    const blocks = [...TOKENS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '').join('\n');
    // ⛔ «ידיים מורמות» היא **מידע** ⟨«עכשיו הוא מטיל»⟩ ⇒ רק המעבר מוסר.
    expect(blocks).toMatch(/\[data-arena-layer='offHand'\][\s\S]{0,80}transition:\s*none/);
    expect(blocks, '⛔ והתנוחה ⛔ אינה מאופסת').not.toMatch(/\[data-arena-layer='offHand'\][\s\S]{0,80}rotate:\s*0/);
    // 🩸 הרתיעה היא **תנועה טהורה** ⇒ `animation: none`.
    expect(blocks).toMatch(/\[data-arena-hurt='a'\][\s\S]{0,140}animation:\s*none/);
  });
});

/**
 * 🤸⚔️ **⟦19/09 · `C-0741` · `T-440`ⓑⓒ⟧ הגלגול והלהב.**
 *
 * 🔬 **הפער:** `dodge()` מעניק חסינות והמסך אומר «התחמקות!» ב**טקסט** — ⇒
 * הלומד החליק, ניצל, ו⛔ **שום דבר בגוף שלו ⛔ לא הגיב**.
 * ⛔ **ותנוחת ה-`dodge` ⛔ אינה זה:** `battle.ts:479` פוסק ש-`'dodge'` פירושה
 * «ההטלה האחרונה הייתה **שגויה**» — שני דברים שונים בשם אחד.
 */
describe('C-0741 · T-440ⓑⓒ — הגלגול והלהב', () => {
  const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const BATTLE = withoutComments(readFileSync('components/ArenaBattle.tsx', 'utf8'));

  it('🔴 **הקפיצה האנכית** — זו הטענה שמבדילה התחמקות מהחלקה', () => {
    const at = TOKENS.indexOf('@keyframes arena-roll-a');
    const block = TOKENS.slice(at, TOKENS.indexOf('}\n}', at));
    // ⛔ גוף שנע רק על `X` **מחליק**; גוף שעולה ויורד תוך כדי **מתחמק**.
    expect(block).toMatch(/translate:\s*-?[\d.]+%\s+-[\d.]+%/);
    expect(block, '⛔ ועל `translate`, ⛔ לא `transform`').not.toMatch(/transform:/);
  });

  it('הגלגול נתלה ב-`dodgedSwing` — ⛔ ולא בתנוחת ה-`dodge`', () => {
    // 🔬 שני דברים שונים בשם אחד: `'dodge'` = «ענית לא נכון».
    expect(BATTLE).toMatch(/const dodgedSwing = battle\?\.dodgedSwing/);
    expect(BATTLE).toMatch(/data-arena-roll=/);
    expect(BATTLE).toMatch(/animationName\.startsWith\('arena-roll'\)/);
  });

  it('⛔ הגלגול על עוטף ה-idle — `translate` של הדמות תפוס בידי הרתיעה', () => {
    // 🔬 שתי אנימציות על קיצור `animation` אחד היו **דורסות זו את זו**.
    expect(TOKENS).toMatch(/\[data-arena-roll='a'\] \[data-arena-slot='hero'\] \[data-arena-idle\]/);
    const at = TOKENS.indexOf("[data-arena-roll='a'] [data-arena-slot='hero']");
    expect(TOKENS.slice(at, at + 260)).not.toMatch(/data-arena-figure/);
  });

  it('⚔️ הלהב מסתובב סביב ה**ידית** — ⛔ ולא סביב מרכזו', () => {
    // 🔬 סיבוב סביב המרכז מזיז את הידית ⇒ נקרא כמו חרב שמרחפת.
    expect(TOKENS).toMatch(/\[data-arena-part='weapon'\]\s*\{[\s\S]{0,180}transform-origin:\s*0% 100%/);
    expect(TOKENS).toMatch(/\[data-arena-phase='hit'\][^{]*\[data-arena-part='weapon'\]\s*\{\s*rotate:/);
  });

  it('🔬 והמשכים **נגזרים מהרנדר** — ⛔ ולא נבחרו', () => {
    // `render_video_B.py`: הגלגול `sin(… / .55 · π)` ⇒ 550ms · ההינף 300ms.
    expect(TOKENS).toMatch(/--arena-roll-ms:\s*550ms/);
    expect(TOKENS).toMatch(/--arena-swing-ms:\s*300ms/);
  });

  it('🔴 תנועה מופחתת — שניהם מוסרים, והמידע נשאר בטקסט ובפס', () => {
    const blocks = [...TOKENS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '').join('\n');
    expect(blocks).toMatch(/\[data-arena-roll='a'\][\s\S]{0,200}animation-name:\s*none/);
    expect(blocks).toMatch(/\[data-arena-part='weapon'\][\s\S]{0,80}transition:\s*none/);
  });
});

/**
 * 🦴 **⟦21/09 · `C-0757` · `T-444`ⓓ⟧ השלד זז — **והבידוד הוא בורר**.**
 *
 * 🔴 **הטענה הכבדה כאן ⛔ אינה «יש קיפריים» — היא ש**שש הדמויות הקיימות
 * ⛔ אינן רואות אותו**.** צילום חי מוכיח זאת **היום**; הבדיקה הזאת מוכיחה
 * שזה יישאר נכון אחרי שמישהו יערוך את הגיליון בעוד חודשיים.
 */
describe('C-0757 · T-444ⓓ — המפרקים זזים, ו⛔ רק על הנווד', () => {
  const TOKENS = readFileSync('app/arcade/arcade-tokens.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

  it('🔴 **כל** בורר שמפעיל `arena-rig-*` מגודר ל-`data-arena-rig` — ⛔ ואין חריג', () => {
    // 🔬 הבוררים נחתכים על `{`, ⇒ כל קבוצת בוררים נמדדת **בשלמותה**.
    const rules = TOKENS.split('}').filter((b) => /animation(-name)?:\s*arena-rig-/.test(b));
    expect(rules.length, 'לפחות שלושה כללים — ברך · גו · זרוע').toBeGreaterThanOrEqual(3);
    for (const rule of rules) {
      const selectors = (rule.split('{')[0] ?? '').split(',').map((x) => x.trim()).filter(Boolean);
      expect(selectors.length).toBeGreaterThan(0);
      for (const sel of selectors) {
        expect(sel, `בורר בלי שלד: ${sel}`).toContain("[data-arena-rig='jointed']");
        // ⛔ **ורק הגיבור** — היריב ⛔ אינו בועט.
        expect(sel, `בורר בלי גיבור: ${sel}`).toContain("[data-arena-slot='hero']");
      }
    }
  });

  it('🔴 המפרקים מסתובבים ב-`rotate` בלבד — ⛔ ו⛔ אף `transform`', () => {
    for (const name of ['knee', 'torso', 'arm']) {
      for (const v of ['a', 'b']) {
        const at = TOKENS.indexOf(`@keyframes arena-rig-${name}-${v} {`);
        expect(at, `arena-rig-${name}-${v}`).toBeGreaterThan(-1);
        const body = TOKENS.slice(at, TOKENS.indexOf('\n}', at));
        expect(body, `arena-rig-${name}-${v}`).toMatch(/rotate:/);
        // ⛔ `transform` על מפרק ⛔ אינו מורכב עם `transform` של ההורה.
        expect(body, `arena-rig-${name}-${v}`).not.toMatch(/transform:/);
      }
    }
  });

  /**
   * 🔴 **⟦23/09 · `T-446` · `F-313`⟧ המחלקה, ⛔ ולא שתי השורות:** כל כלל שנבחר על
   * `[data-arena-strike='b']` נוקב בשם קיפריימים **שונה** מזה של `'a'` לאותו צומת.
   * 🔬 הצל והאבק נשאו שם אחד לשניהם ⇒ ⛔ לא התאפסו, והצל אמר «באוויר» על גוף שעומד.
   */
  it("🔴 כל כלל על `[data-arena-strike='b']` נוקב בקיפריימים שונים מ-`'a'` — ⛔ אפס שם משותף", () => {
    const names = (v: 'a' | 'b'): string[] => TOKENS.split('}')
      .filter((b) => (b.split('{')[0] ?? '').includes(`[data-arena-strike='${v}']`))
      .flatMap((b) => [...b.matchAll(/animation(?:-name)?:\s*([-\w]+)/g)].map((m) => m[1] ?? ''));
    const a = new Set(names('a'));
    const b = names('b');
    expect(b.length).toBeGreaterThanOrEqual(6);
    for (const n of b.filter((n) => n.startsWith('arena-strike') || n.startsWith('arena-rig-'))) {
      if (n.endsWith('-b')) expect(a.has(n), n).toBe(false);
    }
    for (const node of ['castrig', 'shadow', 'landdust']) {
      const rule = (v: string): string | undefined => TOKENS.split('}').find((blk) =>
        (blk.split('{')[0] ?? '').trim().endsWith(`[data-arena-strike='${v}'] [data-arena-slot='hero'] [data-arena-${node}]`));
      const nameOf = (v: string): string | undefined => rule(v)?.match(/animation:\s*([-\w]+)/)?.[1];
      expect(nameOf('a'), node).toBeDefined();
      expect(nameOf('b'), node).toBeDefined();
      expect(nameOf('b'), `${node}: 'b' ⛔ חולק שם עם 'a'`).not.toBe(nameOf('a'));
    }
  });

  it('🛬 `T-446` — כניסה מהנחיתה מזיזה את **כל** שכבות הבעיטה לאותה נקודה, ⛔ ולא רק את הגוף', () => {
    const rule = TOKENS.split('}').find((b) => /animation-delay:\s*calc\(var\(--arena-strike-ms\)\s*\*\s*-0\.5\)/.test(b));
    expect(rule, 'חוק הנחיתה קיים').toBeDefined();
    const sel = (rule as string).split('{')[0] ?? '';
    for (const n of ['[data-arena-castrig]', '[data-arena-shadow]', '[data-arena-landdust]',
      "[data-arena-joint='knee']", "[data-arena-joint='arm']", "[data-arena-layer='body']", "[data-arena-layer='offHand']"]) {
      expect(sel, n).toContain(n);
    }
    expect(sel, 'האגן ⛔ אינו מונפש ⇒ ⛔ אינו מוזז').not.toContain("[data-arena-layer='legs']");
    expect(sel.match(/\[data-arena-strike-from='land'\]/g)?.length).toBe(13);
  });

  it("⛔ `'a'⇄'b'` — שם זהה ⛔ אינו מפעיל מחדש, ⇒ שתי תשובות רצופות ⛔ אינן נבלעות", () => {
    for (const name of ['knee', 'torso', 'arm']) {
      expect(TOKENS).toMatch(new RegExp(`animation-name:\\s*arena-rig-${name}-b`));
    }
  });

  it('🌀 פיתול הגו ⛔ אינו נוגע ב-`legs` — אחרת זו **הטיה**, ⛔ ולא פיתול', () => {
    const rules = TOKENS.split('}').filter((b) => /animation(-name)?:\s*arena-rig-torso-/.test(b));
    expect(rules.length).toBe(2);
    for (const rule of rules) {
      expect(rule.split('{')[0], 'האגן נשאר').not.toMatch(/\[data-arena-layer='legs'\]/);
      expect(rule.split('{')[0]).toMatch(/\[data-arena-layer='body'\]/);
    }
    // 🔬 המרכז מגיע מהמודול הטהור דרך משתנה, ⛔ ואינו מוקלד בגיליון.
    expect(TOKENS).toMatch(/transform-origin:\s*var\(--arena-rig-torso\)/);
  });

  it('🔴 והמפרקים רוכבים על **שעון הבעיטה שכבר קיים** — ⛔ ולא על שעון שני', () => {
    const rules = TOKENS.split('}').filter((b) => /animation:\s*arena-rig-/.test(b));
    for (const rule of rules) {
      expect(rule, 'כל מפרק על --arena-strike-ms').toMatch(/var\(--arena-strike-ms\)/);
      expect(rule.split('{')[0]).toMatch(/\[data-arena-strike='[ab]'\]/);
    }
  });
});
