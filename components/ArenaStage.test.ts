import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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
