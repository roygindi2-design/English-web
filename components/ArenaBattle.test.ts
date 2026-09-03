import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LAYER_ORDER } from '@/lib/core/characterBase';

/**
 * T-182 · `37-arena-spec § 11` — **שפת האנימציה, א1 + א2** (D-133 § א׳).
 * 🎯 הרנדר: `docs/design/kol-B-03-battle.png` · `docs/design/render_video_B.py`.
 *
 * שומר **מקור**, בדיוק כמו `components/ArenaStage.test.ts` ו-`app/arcade/page.test.ts`:
 * סביבת vitest היא `node` ו-jsdom נעדר בכוונה. ⛔ מה שנמדד כאן הוא **הקוד וה-CSS**,
 * ⛔ ולא הפיקסלים — הגיאומטריה היא עבודתו של `check:mobile` דרך `/dev/arcade`.
 *
 * ⚠️ **הלבנה, ⛔ ולא מקור גולמי** (F-039 · F-064 · F-065): הקבצים כאן **מתעדים בהערה**
 * מה אסור בהם — «⛔ אין `setTimeout`» כתוב באותיות מלאות בשני הקבצים — ומדידה גולמית
 * הייתה מפילה קובץ ⛔ שאין בו ולו הפרה אחת.
 */
const withoutComments = (src: string): string =>
  src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

const SRC = readFileSync('components/ArenaBattle.tsx', 'utf8');
const CODE = withoutComments(SRC);
const CSS = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
const CSS_CODE = CSS.replace(/\/\*[\s\S]*?\*\//g, '');
const AVATAR = withoutComments(readFileSync('components/ArenaAvatar.tsx', 'utf8'));

/** פריים אחד. ⛔ ⛔ אינו נבחר: `docs/design/render_video_A.py:16` מצהיר `FPS = 30`. */
const FRAME_MS = 1000 / 30;

const declared = (name: string): number => {
  const hit = CSS_CODE.match(new RegExp(`${name}:\\s*(\\d+(?:\\.\\d+)?)ms`));
  expect(hit, `${name} חייב להיות מוצהר ב-app/arcade/arcade-tokens.css`).not.toBeNull();
  return Number((hit as RegExpMatchArray)[1]);
};

describe('א1 — hit-stop: 3-4 פריימים של קיפאון מוחלט בפגיעה', () => {
  it('המשך הוא **טוקן** ב-`arcade-tokens.css`, ⛔ ולא ליטרל ברכיב', () => {
    expect(CSS_CODE).toMatch(/--arena-hitstop-ms/);
    expect(CSS_CODE).toMatch(/animation:\s*arena-hitstop-[ab]\s+var\(--arena-hitstop-ms\)/);
    /* ⛔ **הבדיקה נגזרת מה-CSS ⛔ ואינה נוקבת במספר בעצמה:** הערך שהקובץ מצהיר עליו
       ⛔ אינו מופיע ברכיב כליטרל. ⛔ שני המספרים, ⛔ ולא אחד — ליטרל של `--arena-impact-ms`
       ברכיב הוא בדיוק אותה תקלה. */
    for (const name of ['--arena-hitstop-ms', '--arena-impact-ms']) {
      const value = String(declared(name));
      expect(CODE, `${name} = ${value} — המספר חי ב-CSS ⛔ ולא ברכיב`).not.toMatch(
        new RegExp(`\\b${value}\\b`),
      );
    }
  });

  it('המשך יושב בתוך 3-4 פריימים (100-130ms), ⛔ נמדד מה-CSS ⛔ ולא מהערה', () => {
    const ms = declared('--arena-hitstop-ms');
    expect(ms).toBeGreaterThanOrEqual(3 * FRAME_MS);
    expect(ms).toBeLessThanOrEqual(130);
  });

  it('⛔ הקיפאון הוא CSS (`animation-play-state`), ⛔ ולא שעון JS', () => {
    expect(CSS_CODE).toMatch(/animation-play-state:\s*paused/);
    // ⛔ אפס טיימרים ברכיב כולו — ⛔ ולא «אפס טיימר עם 130 בתוכו».
    for (const banned of [/setTimeout/, /setInterval/]) {
      expect(CODE, `${banned} — 36 § 14 ו-T-041 מחזיקים את תנועת הזירה ב-CSS`).not.toMatch(banned);
    }
    // מה שמשחרר את הקיפאון הוא סוף האנימציה, ⛔ ולא מונה.
    expect(CODE).toMatch(/onAnimationEnd/);
    expect(CODE).toMatch(/arena-hitstop/);
  });

  it('⛔ שני שמות אנימציה ⛔ ולא אחד — אחרת פגיעה שנייה בתוך החלון ⛔ אינה מאתחלת', () => {
    for (const name of ['arena-hitstop-a', 'arena-hitstop-b']) {
      expect(CSS_CODE, `@keyframes ${name}`).toContain(`@keyframes ${name}`);
    }
    expect(CODE).toMatch(/prev === 'a' \? 'b' : 'a'/);
  });

  it('הטריגר נגזר מהחוק — פגיעה בלבד, ⛔ ולא התחמקות', () => {
    /* ⛔ **התנוחה מגיעה מ-`lib/core/battle.ts` ⛔ ואינה נגזרת כאן** (D-060): «פגיעה» היא
       `stagePhase(...) === 'hit'` שבחוק, ⛔ ולא השוואה מקומית בין תשובה לאפשרות. */
    expect(CODE).toMatch(/stagePhase\(battle\) !== 'hit'/);
    expect(CODE).toContain('stagePhase');
    // ⛔ הרכיב ⛔ אינו משווה תשובה לאפשרות כדי להחליט אם לצייר אימפקט.
    expect(CODE).not.toMatch(/===\s*question\.answer/);
  });
});

describe('א2 — פריים אימפקט: 1-2 פריימים של צללית לבנה טהורה', () => {
  it('המשך הוא טוקן, והוא 1-2 פריימים', () => {
    const ms = declared('--arena-impact-ms');
    expect(ms).toBeGreaterThanOrEqual(FRAME_MS - 0.5);
    expect(ms).toBeLessThanOrEqual(2 * FRAME_MS + 0.5);
    // ⛔ האימפקט ⛔ אינו ארוך מהקיפאון שמכיל אותו.
    expect(ms).toBeLessThanOrEqual(declared('--arena-hitstop-ms'));
  });

  it('⛔ הצללית משתמשת ב**דיו הזירה** של T-214, ⛔ ולא ב-hex ו⛔ ולא ב-`white`', () => {
    expect(CSS_CODE).toMatch(/@keyframes arena-impact-a\s*\{\s*from\s*\{\s*color:\s*var\(--arena-ink\);/);
    expect(CSS_CODE).not.toMatch(/color:\s*(white|#fff)/i);
  });

  it('⛔ פריים, ⛔ ולא מעבר — `steps(1, end)` ו⛔ בלי `forwards`', () => {
    expect(CSS_CODE).toMatch(/animation:\s*arena-impact-a var\(--arena-impact-ms\) steps\(1, end\) 1;/);
    expect(CSS_CODE).not.toMatch(/arena-impact-[ab][^;]*forwards/);
  });

  /**
   * ⚠️ **הופנתה ב-T-215 באותו טיק, ⛔ ולא נמחקה** (⛔ בדיקה שנמחקה בלי מחליפה היא מה
   * שהפיל את T-164). הניסוח הקודם דרש **שכבת רקע שיורדת** ל-`opacity: 0` בפריים
   * האימפקט; ‏T-215 **מחקה** את הלוח האטום מ-`ArenaAvatar` (`38 § 4` ⛔ אינו מונה רקע ·
   * סוגר את F-158) ⇒ הצללית היא דמות **מעצם המבנה**. הדרישה ⛔ לא נחלשה — היא נמדדת
   * עכשיו על מה שמייצר אותה: ⛔ אין לוח, והכלל מגיע לכל `<g>` מקונן ⛔ ולא לבן ישיר.
   */
  it('⛔ אין לוח רקע אטום — הצללית היא דמות מעצם המבנה', () => {
    expect(AVATAR).not.toContain("data-arena-layer=\"background\"");
    expect(AVATAR).not.toMatch(/text-surface-raised/);
    expect([...LAYER_ORDER]).not.toContain('background');
    // ⛔ `g` ⛔ ולא `> g`: קבוצת הציוד היא `<g>` מקונן עם `color` משלה.
    expect(CSS_CODE).toMatch(/\[data-arena-figure\] g \{\s*animation: arena-impact-a/);
    expect(CSS_CODE).not.toMatch(/arena-impact-plate/);
  });
});

describe('חוקה שכבה א׳ א7 — `prefers-reduced-motion` מסיר את שניהם, והסבב עדיין נפתר', () => {
  it('שני מחסומים: הרכיב ⛔ אינו מציב את התכונה, וה-CSS מנטרל את ההשפעה', () => {
    expect(CODE).toContain("window.matchMedia('(prefers-reduced-motion: reduce)')");
    expect(CODE).toMatch(/castCount === 0 \|\| reducedMotion/);
    expect(CSS_CODE).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });

  it('⛔ הקיפאון מוסר (`running`) והצללית מוסרת (`animation: none`)', () => {
    const at = CSS_CODE.indexOf('@media (prefers-reduced-motion: reduce)');
    expect(at, 'הבלוק חייב להתקיים — סמן חסר הוא כשל בשם ⛔ ולא בדיקה ריקה').toBeGreaterThan(-1);
    const block = CSS_CODE.slice(at);
    expect(block).toMatch(/animation-play-state:\s*running/);
    expect(block).toMatch(/animation:\s*none/);
  });

  /**
   * ⛔ **השורה שהכי קל היה להחמיץ:** `animation: none` על האנימציה ה**נושאת** היה מונע
   * את `animationend` ⇒ התכונה ⛔ לעולם ⛔ לא הייתה משתחררת, והבמה הייתה קפואה לנצח.
   * הבלוק הגלובלי ב-`app/globals.css:103` מוריד אותה ל-`0.01ms`, וזה מספיק.
   */
  it('⛔ האנימציה הנושאת ⛔ אינה מכובה תחת reduced-motion — אחרת הבמה קופאת לנצח', () => {
    const block = CSS_CODE.slice(CSS_CODE.indexOf('@media (prefers-reduced-motion: reduce)'));
    /* ⛔ **⛔ לא «אין את המחרוזת `arena-hitstop`»** — מוטציה שהפילה את השורה הזאת ב-C-0335
       כיבתה את הנושאת דרך ה**סלקטור** (`[data-arena-impact='a'] { animation: none }`)
       ⛔ בלי לנקוב בשם האנימציה, והבדיקה נשארה ירוקה. ⇒ נמדד כאן **מה שמכובה**:
       כל כלל שהסלקטור שלו **מסתיים** באזור הבמה עצמו ⛔ אינו רשאי לגעת ב-`animation`. */
    for (const match of block.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const selector = match[1] ?? '';
      const body = match[2] ?? '';
      const endsOnCarrier = selector
        .split(',')
        .some((one) => /\[data-arena-impact='[ab]'\]\s*$/.test(one.trim()));
      if (!endsOnCarrier) continue;
      expect(body, `⛔ «${selector.trim()}» מכבה את השעון ⇒ animationend ⛔ לא ייורה`)
        .not.toMatch(/animation(-name|-duration)?\s*:/);
    }
    expect(readFileSync('app/globals.css', 'utf8')).toMatch(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]{0,220}animation-duration:\s*0\.01ms/,
    );
  });
});

/**
 * T-231 · `apple-design` § 1 · § 11 · `37-arena-spec § 6` — **פריים-הזמן ⛔ אינו נכנס
 * ל-state של React, ושלושת המדים עוברים ל-`transform: scaleX()`.**
 * 🎯 נמדד C-0371: לולאת ה-`requestAnimationFrame` קראה ל-`setElapsedMs` בכל פריים ⇒
 * ‏~5,400 סבבי רינדור בקרב אחד, ושלושה מדים צוירו ב-`style={{ width: ... }}` —
 * פריסה וציור בכל פריים על שלושה אלמנטים.
 */
describe('T-231 — פריים-הזמן חי ב-ref, ⛔ ולא ב-state; המדים עוברים ל-scaleX', () => {
  it('⛔ `elapsedMs` ⛔ אינו state — אין `useState` שמאתחל שעון, ויש `elapsedRef`', () => {
    expect(CODE).not.toMatch(/const \[elapsedMs, setElapsedMs\] = useState/);
    expect(CODE).not.toMatch(/\bsetElapsedMs\b/);
    expect(CODE).toMatch(/elapsedRef/);
  });

  it('⛔ אפס `style={{ width: ... }}` על מד — שלושתם `scaleX`, ⛔ ולא `width`', () => {
    expect(CODE).not.toMatch(/style=\{\{\s*width:/);
    const scaleXCount = (CODE.match(/scaleX\(/g) ?? []).length;
    expect(scaleXCount, 'שלושה מדים: טלגרף · חיי היריב · מאנה').toBeGreaterThanOrEqual(3);
  });

  it('מוצא הטרנספורם תואם RTL — הפס גדל מהצד שממנו הוא צויר ב-`width` (ימין)', () => {
    expect(CODE).toMatch(/transformOrigin:\s*['"]right/);
  });

  it('⛔ `setBattle` בלולאת ה-rAF נשען על הפניה זהה של `tick` — ⛔ אין תלות ב-`battle` המלא', () => {
    // הבדיקה בליבה (`battle.test.ts`, T-231 ⓒ) מוכיחה ש-`tick` מחזירה את אותה הפניה
    // כשלא זזה מכה; כאן נמדד שהרכיב עדיין קורא ל-`tick` דרך העדכון הפונקציונלי
    // (⛔ ולא קורא ל-`battle` ישירות מתוך הלולאה, מה שהיה שובר את הבלימה).
    expect(CODE).toMatch(/setBattle\(\(prev\) => \(prev === null \? prev : tick\(prev, next\)\)\)/);
  });

  it('⛔ `fire` ⛔ אינו נבנה מחדש בכל פריים — הזמן הנוכחי נקרא מ-ref בזמן הקריאה', () => {
    // לפני התיקון: `useCallback(..., [elapsedMs])` יצר פונקציה חדשה בכל פריים.
    expect(CODE).not.toMatch(/\}, \[elapsedMs\]\)/);
  });
});

describe('אינווריאנט 37 § 13.5 — התוספת ⛔ לא הדליפה ולו ערך אחד', () => {
  it('⛔ אפס hex חדש בקובץ הטוקנים, ⛔ ואפס שם זירה ב-globals/palette', () => {
    const globals = readFileSync('app/globals.css', 'utf8');
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    for (const token of ['--arena-hitstop-ms', '--arena-impact-ms', 'arena-impact-a']) {
      expect(globals, `${token} — אינווריאנט 37 § 13.5`).not.toContain(token);
      expect(palette, `${token} — אינווריאנט 37 § 13.5`).not.toContain(token);
    }
  });
});

/**
 * T-216 · `37-arena-spec § 11` א4 — **תנועת המשך: גלימה, שיער וחרב מפגרים 2 פריימים
 * אחרי הגוף.** ⛔ **המשך של T-182**, ⛔ ולא שורה עצמאית: א1 קופאת על אותה במה, ולכן
 * הפיגור נמדד כאן — ליד שני התזמונים שהוא נגזר מאותו `FPS = 30` שלהם.
 *
 * ⚠️ **מה שהופך את השורה הזאת לניתנת למדידה הוא ש-T-215 סימנה את שלוש השכבות בשמן**
 * (`data-arena-part="cape" | "hair" | "weapon"`) ⇒ הכלל ⛔ אינו מנחש שכבה, ו-`38 § 5`
 * ⛔ לא הופר.
 */
describe('א4 — תנועת המשך: שלוש שכבות מפגרות 2 פריימים אחרי הגוף', () => {
  /** ⛔ שלוש, ⛔ ואין רביעית — א4 נוקבת בהן בשמן. */
  const PARTS = ['cape', 'hair', 'weapon'] as const;

  /* ── הפרימיטיבים. ⛔ כולם **נקראים מהמקור**, ⛔ ואף אחד מהם ⛔ אינו נכתב כאן פעמיים. ── */
  const GLOBALS = readFileSync('app/globals.css', 'utf8');
  const STAGE_SRC = readFileSync('components/ArenaStage.tsx', 'utf8');

  const numberFrom = (src: string, re: RegExp, what: string): number => {
    const hit = src.match(re);
    expect(hit, `${what} — ⛔ לא נמצא במקור; בדיקה על מקור שהשתנה היא בדיקה ריקה`).not.toBeNull();
    return Number((hit as RegExpMatchArray)[1]);
  };

  /** תזוזת הגוף בתנוחה, ב-`rem` — `app/globals.css`, בלוק `arena-stage` (T-117). */
  const BODY_SHIFT_REM = numberFrom(
    GLOBALS,
    /\[data-arena-phase='hit'\] \[data-arena-figure='enemy'\] \{\s*transform: translateX\((-?[\d.]+)rem\)/,
    'תזוזת הגוף',
  );
  /** משך המעבר של הגוף, ב-ms — אותו בלוק. */
  const BODY_MS = numberFrom(
    GLOBALS,
    /\[data-arena-stage\] \[data-arena-figure\] \{\s*transition: transform (\d+)ms/,
    'משך המעבר של הגוף',
  );
  /** רוחב הדמות על הבמה — `FIGURE_CLASS` ב-`ArenaStage.tsx`. ‏`w-24` = 6rem. */
  const FIGURE_W_REM =
    numberFrom(STAGE_SRC, /FIGURE_CLASS = '[^']*\bw-(\d+)\b/, 'רוחב הדמות על הבמה') / 4;
  /** רוחב ה-`viewBox` ביחידות משתמש — `ArenaAvatar.tsx`. */
  const VIEW_W = numberFrom(AVATAR, /VIEW_BOX = '-?[\d.]+ -?[\d.]+ ([\d.]+) /, 'רוחב ה-viewBox');

  /**
   * ⛔ **המרה, ⛔ ולא מספר שנבחר.** התזוזה של הגוף היא `rem` על ה-`<svg>`; הפיגור חי
   * **בתוך** ה-`viewBox`, כלומר ביחידות משתמש. ⇒ אותה תזוזה ביחידות של הדמות:
   *   `0.75rem / 6rem × 200` = **25 יחידות**.
   */
  const BODY_SHIFT_UNITS = (BODY_SHIFT_REM / FIGURE_W_REM) * VIEW_W;

  it('הפיגור הוא **טוקן** ב-`arcade-tokens.css`, והוא **2 פריימים** בדיוק', () => {
    expect(CSS_CODE).toMatch(/--arena-follow-ms/);
    const ms = declared('--arena-follow-ms');
    expect(Math.abs(ms - 2 * FRAME_MS), `2 פריימים = ${(2 * FRAME_MS).toFixed(1)}ms`)
      .toBeLessThanOrEqual(1);
  });

  /**
   * ⛔ **המשרעת נגזרת מהתזוזה של הגוף, ⛔ ואינה נבחרת.** הגוף עובר `BODY_SHIFT_UNITS`
   * לאורך `BODY_MS`; ב-`FPS = 30` זה **שישה פריימים**, ולכן פיגור של **שניים** הוא
   * **שליש** מהמרחק. ⚠️ **קירוב ליניארי, מוצהר** — ⛔ ולא ערך ש«נראה נכון»: העקומה היא
   * `ease-out`, ולכן השליש הוא המרחק בקצב אחיד ⛔ ולא בקצב העקומה. הקירוב **נמדד כאן**,
   * ⇒ שינוי בכל אחד מארבעת הפרימיטיבים מפיל את השורה הזאת בשם.
   */
  it('המשרעת נגזרת מארבעה מספרים שנקראו מהמקור, ⛔ ולא נבחרה', () => {
    const frames = BODY_MS / FRAME_MS;
    const expected = BODY_SHIFT_UNITS * (2 / frames);
    const hit = CSS_CODE.match(/--arena-follow-x:\s*(-?[\d.]+)px/);
    expect(hit, '--arena-follow-x חייב להיות מוצהר ב-app/arcade/arcade-tokens.css').not.toBeNull();
    const declaredX = Number((hit as RegExpMatchArray)[1]);
    expect(
      Math.abs(declaredX - expected),
      `${declaredX} מול ${expected.toFixed(2)} = ${BODY_SHIFT_UNITS} × 2/${frames}`,
    ).toBeLessThanOrEqual(0.01);
  });

  /**
   * ⛔ **משך ההדבקה הוא משך המעבר של הגוף, ⛔ ולא מספר שני.** שני משכים על אותה תנועה
   * הם שתי עקומות שסוטות, ⇒ הבדיקה קוראת את **שני** הקבצים ומשווה.
   */
  it('משך ההדבקה = משך המעבר של הגוף, ⛔ ולא ליטרל שני', () => {
    expect(declared('--arena-follow-settle-ms')).toBe(BODY_MS);
    expect(CSS_CODE).toMatch(/animation: arena-follow-hit var\(--arena-follow-settle-ms\)/);
  });

  it('שלוש השכבות מסומנות בשמן ב-`ArenaAvatar`, ⇒ הכלל ⛔ אינו מנחש שכבה (`38 § 5`)', () => {
    for (const part of PARTS) expect(AVATAR).toContain(`data-arena-part="${part}"`);
  });

  /**
   * ⛔ **הפיגור הוא ל<b>אחור</b>, ⛔ ולא לאותו כיוון.** הגוף של היריב עובר `+`, ולכן
   * הגלימה נגררת `-`; הגיבור מתחמק `-`, והגלימה נגררת `+`. ⛔ סימן זהה היה **מכפיל**
   * את התזוזה במקום לפגר אחריה.
   */
  it('לכל תנוחה כלל משלה, והסימן הפוך לסימן של הגוף', () => {
    expect(CSS_CODE).toMatch(
      /\[data-arena-phase='hit'\][^{]*\[data-arena-part\][^{]*\{\s*animation: arena-follow-hit/,
    );
    expect(CSS_CODE).toMatch(
      /\[data-arena-phase='dodge'\][^{]*\[data-arena-part\][^{]*\{\s*animation: arena-follow-dodge/,
    );
    const hit = CSS_CODE.match(/@keyframes arena-follow-hit\s*\{[^}]*\}[^}]*\}/);
    const dodge = CSS_CODE.match(/@keyframes arena-follow-dodge\s*\{[^}]*\}[^}]*\}/);
    expect(hit, 'הקדר של `hit` חייב להתקיים').not.toBeNull();
    expect(dodge, 'הקדר של `dodge` חייב להתקיים').not.toBeNull();
    expect(String(hit)).toMatch(/translateX\(calc\(var\(--arena-follow-x\) \* -1\)\)/);
    expect(String(dodge)).toMatch(/translateX\(var\(--arena-follow-x\)\)/);
  });

  /**
   * ⛔ **⛔ בלי `forwards`** — פיגור שנשאר קפוא הוא גלימה שנשארת מאחור לנצח. השכבה
   * מתחילה `Δ` מאחור ו**מדביקה** את הגוף, ⇒ מצב היציבה הוא הגוף עצמו.
   */
  it('⛔ הפיגור מתיישב על הגוף — ⛔ אין `forwards`', () => {
    expect(CSS_CODE).not.toMatch(/arena-follow-[a-z]+[^;]*forwards/);
  });

  /**
   * ⛔ **א1 קופאת על שלושת הערוצים, ⛔ ולא על שניים.** עד השורה הזאת הקיפאון עצר את
   * לולאת ההמתנה ואת מעבר התנוחה; ערוץ שלישי שממשיך לזוז בתוך hit-stop הוא בדיוק
   * הפגם ש-א1 קיימת כדי למנוע.
   */
  it('א1 — הקיפאון עוצר גם את תנועת ההמשך', () => {
    expect(CSS_CODE).toMatch(
      /\[data-arena-impact='a'\][^{]*\[data-arena-part\][^{]*\{\s*animation-play-state: paused/,
    );
    expect(CSS_CODE).toMatch(
      /\[data-arena-impact='b'\][^{]*\[data-arena-part\][^{]*\{\s*animation-play-state: paused/,
    );
  });

  it('שכבה א׳ א7 — `prefers-reduced-motion` מסיר את הפיגור', () => {
    const at = CSS_CODE.lastIndexOf('@media (prefers-reduced-motion: reduce)');
    expect(at, 'הבלוק חייב להתקיים').toBeGreaterThan(-1);
    expect(CSS_CODE.slice(at)).toMatch(/\[data-arena-part\][^{]*\{\s*animation: none/);
  });

  it('⛔ אפס JS — הפיגור חי ב-CSS בלבד, ובשלושת הרכיבים אין לו ולו אזכור', () => {
    for (const src of [CODE, withoutComments(STAGE_SRC), AVATAR]) {
      expect(src).not.toMatch(/arena-follow/);
    }
  });
});
