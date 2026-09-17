import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LAYER_ORDER } from '@/lib/core/characterBase';
import { withoutComments } from '@/lib/testSource';

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

/**
 * T-239 · `D-065` · `docs/api-contract.md:1150` (D-052) — **`no_level` הוא קוד מת שהוסר.**
 * ⛔ **נמדד בטיק הזה, ⛔ ולא שוער:** `GET /api/arcade/round` שולח `gameLevel` ו-`band`
 * בלבד — ⛔ **אף פעם לא `level`** — ⇒ `if (body.level === null)` היה תמיד `undefined === null`
 * (`false`), וענף `no_level` בלתי-מושג מהרגע שנכתב (`components/ArenaBattle.dom.test.tsx`
 * מודד את ארבעת ענפי הכשל שכן מושגים ומראה שלכל אחד יש יציאה).
 */
describe('T-239 — no_level הוסר: קוד מת ⛔ לא נכנס חזרה', () => {
  it('⛔ אפס אזכור של no_level / NO_LEVEL_HE / body.level ברכיב', () => {
    expect(CODE).not.toMatch(/no_level/);
    expect(CODE).not.toMatch(/NO_LEVEL_HE/);
    expect(CODE).not.toMatch(/body\.level/);
  });

  it('`RoundBody` נושא `band`, בדיוק כמו שהנתיב שולח — ⛔ ולא שדה שאינו קיים', () => {
    expect(CODE).toMatch(/readonly band: string/);
  });

  it('`ready.level` מוזן מ-`body.band` — השדה שהשרת אכן שולח', () => {
    expect(CODE).toMatch(/setScreen\(\{ kind: 'ready', level: body\.band \}\)/);
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
    /* ⚠️ **⟦הותאם 15/09 · `C-0624` · `T-366`⟧ הטענה נקבה ב-`animation: arena-follow-hit`
       **בתחילת ההצהרה**. ‏`T-366` הוסיף את `arena-sway` לאותה רשימה (וחייב אותו להיות
       **ראשון** — ראה הטענה הבאה), ⇒ הליטרל הצמוד נשבר על כלל ש⛔ אין בו שום פגם.
       ⇒ נמדד מה שהיא **התכוונה** למדוד: שהמשך מגיע מהטוקן, ⛔ ולא ממספר שני. */
    expect(CSS_CODE).toMatch(/arena-follow-hit var\(--arena-follow-settle-ms\)/);
    // ⛔ ו⛔ אין משך **ליטרלי** על אף אחת משתי ההדבקות — זה הפגם שהשורה נולדה נגדו.
    expect(CSS_CODE).not.toMatch(/arena-follow-(?:hit|dodge) \d/);
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
      /\[data-arena-phase='hit'\][^{]*\[data-arena-part\][^{]*\{[^}]*arena-follow-hit/,
    );
    expect(CSS_CODE).toMatch(
      /\[data-arena-phase='dodge'\][^{]*\[data-arena-part\][^{]*\{[^}]*arena-follow-dodge/,
    );
    const hit = CSS_CODE.match(/@keyframes arena-follow-hit\s*\{[^}]*\}[^}]*\}/);
    const dodge = CSS_CODE.match(/@keyframes arena-follow-dodge\s*\{[^}]*\}[^}]*\}/);
    expect(hit, 'הקדר של `hit` חייב להתקיים').not.toBeNull();
    expect(dodge, 'הקדר של `dodge` חייב להתקיים').not.toBeNull();
    expect(String(hit)).toMatch(/translateX\(calc\(var\(--arena-follow-x\) \* -1\)\)/);
    expect(String(dodge)).toMatch(/translateX\(var\(--arena-follow-x\)\)/);
  });

  /**
   * 🔴 **⟦NEW 15/09 · `C-0624` · `T-366`⟧ ‏`arena-sway` ⛔ ראשון, וזה ⛔ אינו סגנון.**
   *
   * 🔬 **המנגנון, ⛔ ולא טעם:** קיצור `animation` **מחליף** את הרשימה כולה, ו-CSS מתאים
   * אנימציה רצה לאנימציה חדשה **לפי מיקום ברשימה**. ⇒ הנדנוד של השכבות הרכות שורד את
   * ההינף **אך ורק** אם הוא באותו **מקום (0)** בכלל הבסיס ובשני כללי התנוחה. בכל סדר
   * אחר הוא מתאפס באמצע הפגיעה — בדיוק הקפיצה שהוא נועד למנוע.
   */
  it('הנדנוד שורד את ההינף — אותו שם, במקום 0, בשלושת הכללים', () => {
    const lists = [...CSS_CODE.matchAll(/animation:\s*([^;}]*arena-follow-(?:hit|dodge)[^;}]*)/g)]
      .map((m) => (m[1] ?? '').split(',').map((part) => part.trim().split(/\s+/)[0]));
    expect(lists.length, 'שני כללי תנוחה').toBe(2);
    for (const names of lists) {
      expect(names[0], 'הנדנוד ראשון ⇒ ההתאמה לפי מיקום מחזיקה').toBe('arena-sway');
      expect(names).toHaveLength(2);
    }
    // …וכלל הבסיס של השכבות הרכות מריץ את אותו שם, ⇒ יש מה להתאים אליו.
    expect(CSS_CODE).toMatch(
      /\[data-arena-part='hair'\][\s\S]{0,240}animation:\s*arena-sway var\(--arena-sway-ms\)/,
    );
    // ⛔ ושני הערוצים ⛔ אינם אותו מאפיין: הנדנוד `rotate`, ההינף `transform`.
    expect(CSS_CODE).toMatch(/@keyframes arena-sway\s*\{[^@]*rotate:/);
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

  /**
   * ⚠️ **⟦תוקן 15/09 · `C-0622`⟧ הטענה חיפשה את הבלוק ה**אחרון** של
   * `prefers-reduced-motion` והניחה שהוא של הפיגור.** ⇒ ברגע ש-`T-358` הוסיף בלוק
   * תנועה-מופחתת משלו בסוף הקובץ, הטענה נכשלה על כלל ש**ממשיך להתקיים** — היא מדדה
   * **מיקום בקובץ**, ⛔ ולא את מה שהיא מתכוונת לשמור עליו.
   * ⇒ עכשיו היא מחפשת את הבלוק ש**באמת** נוגע ב-`[data-arena-part]`. ⛔ הטענה ⛔ לא
   * רוככה: מחיקת הכלל עדיין מאדימה אותה, ו⛔ הוספת בלוק שישי כבר ⛔ אינה.
   */
  it('שכבה א׳ א7 — `prefers-reduced-motion` מסיר את הפיגור', () => {
    const blocks = CSS_CODE.split('@media (prefers-reduced-motion: reduce)').slice(1);
    expect(blocks.length, 'הבלוק חייב להתקיים').toBeGreaterThan(0);
    const guarded = blocks.filter((b) => /\[data-arena-part\][^{]*\{\s*animation: none/.test(b));
    expect(guarded.length, '⛔ ⛔ אף בלוק תנועה-מופחתת ⛔ אינו מכבה את הפיגור').toBeGreaterThan(0);
  });

  it('⛔ אפס JS — הפיגור חי ב-CSS בלבד, ובשלושת הרכיבים אין לו ולו אזכור', () => {
    for (const src of [CODE, withoutComments(STAGE_SRC), AVATAR]) {
      expect(src).not.toMatch(/arena-follow/);
    }
  });
});

/**
 * T-253ⓐ · D-186 — מסך «הקרב נגמר» עם שגיאת שמירה הוביל ל-`/cards`, ⛔ ולא
 * לטבעת שממנה הכניסה הגיעה (`lib/core/worldApps.ts`). ⛔ **גדר:** רק ה-`href`
 * והתווית של היציאה הזאת זזים — `data-arena-close` (ה-X ב-`topBar`) ו-`בחירת
 * רמה` (מסך `too_small`) הם פעולות אחרות ו⛔ אינם בתחום המשימה.
 */
describe('T-253ⓐ — «חזרה» ממסך הסיום חוזרת לטבעת', () => {
  it('הפעולה הראשית של מסך «הקרב נגמר» (שגיאת שמירה) מובילה ל-`/world`', () => {
    const finishedBlock = CODE.slice(CODE.indexOf('if (finished) {'));
    const primaryExit = finishedBlock.slice(finishedBlock.indexOf('FINISHED_HE'));
    expect(primaryExit).toContain('href="/world"');
    expect(primaryExit).toContain('BACK_TO_WORLD_HE');
    expect(SRC).toContain('חזרה לעולם');
  });

  it('⛔ שני הפעולות האחרות ל-`/cards` (ה-X ו-`בחירת רמה`) ⛔ לא זזות (D-186 הגדר)', () => {
    expect(CODE).toContain('data-arena-close href="/cards"');
    expect(CODE).toContain('CHOOSE_LEVEL_HE');
  });
});

describe('T-281 · 37 § 7 גדר 4 — המספרים חיים ב-lib/core, ⛔ לא ברכיב', () => {
  it('⛔ אין ברכיב קבוע חיים — LEARNER_HP ו-ENEMY_HP נמחקו', () => {
    expect(CODE).not.toMatch(/\bconst (LEARNER_HP|ENEMY_HP)\b/);
    expect(CODE).not.toMatch(/startBattle\([^)]*\b(12|20)\b/);
  });

  it('שלוש הקריאות ל-startBattle מוסרות את הדמות, ⛔ ולא מספרים', () => {
    const calls = CODE.match(/startBattle\(wordsOf\([^)]*\),\s*character\)/g) ?? [];
    expect(calls).toHaveLength(3);
    expect(CODE).not.toMatch(/startBattle\(wordsOf\([^)]*\)\)/);   // ⛔ never the default row by omission
  });

  it('גדר 1 — המילים ⛔ אינן תלויות בדמות: wordsOf ⛔ אינה מקבלת אותה', () => {
    expect(CODE).not.toMatch(/wordsOf\([^)]*character/);
  });
});

/**
 * 🔴 **⟦NEW 15/09 · `C-0622` · רוי דיווח, ואני מדדתי⟧ הזירה: ההקשה שלא הטילה,
 * המסך שלא נכנס, והתנועה שחסרה.**
 *
 * 🔬 **שלושת הממצאים נמדדו בדפדפן על `/dev/arcade`, ⛔ ולא נקראו מהקוד:**
 * ```
 * F-259  הקשה על קלף שכבר נבחר **ביטלה את הבחירה** ⇒ הקשה-הקשה ⛔ לא הטילה לעולם
 * F-260  320×568 ⇒ גלילה 408px, הקלפים **232px מתחת לקפל** · 375×667 ⇒ 133px מתחתיו
 * T-358  שני פסי המצב ב-`scaleX()` **בלי `transition`** ⇒ הפס **קופץ**, ⛔ ואינו נשפך
 * ```
 */
describe('C-0622 — הזירה: ההטלה, הפריסה והתנועה', () => {
  /**
   * 🔴 **`F-259` — הבאג שרוי דיווח עליו, במילותיו:** «לוחצים על תרגום של המילה
   * שמסומנת בגדול אך היא לא מתחלפת אחרי הלחיצה».
   * ⛔ הטענה נועלת את ה**התנהגות**, ⛔ ולא את הניסוח: `selected === option.he ⇒ fire`.
   */
  it('F-259 · הקשה שנייה על אותו קלף **מטילה**, ⛔ ואינה מבטלת בחירה', () => {
    // ⟦נוסח הורחב 16/09 · `C-0665` · `T-359`⟧ ⛔ **ההתנהגות, ⛔ ולא הניסוח** — וזה
    // בדיוק מה שהתיעוד מעל כבר הבטיח. הטענה הקודמת נעלה את ה**שורה** המדויקת
    // (`… ) fire(option.he)`), ⇒ עטיפת אותו ענף ב-`{}` כדי לשגר גם את הרפאים
    // ‏(`T-359`) הפילה אותה **בלי שההתנהגות זזה ולו בביט**. ⛔ הענף עדיין מוכרע
    // מ-`selected === option.he`, ועדיין קורא ל-`fire(option.he)` — ⛔ ורק זה נמדד.
    const twice = CODE.slice(CODE.indexOf('if (selected === option.he)'));
    expect(CODE, 'הענף קיים').toContain('if (selected === option.he)');
    expect(twice.slice(0, 260), 'וההקשה השנייה מטילה').toMatch(/fire\(option\.he\)/);
    // ⛔ **והגדר של `F-259` עצמו:** הענף הזה ⛔ אינו מבטל בחירה — ⛔ לא ב-`null`,
    // ⛔ ולא בשום ניסוח אחר. זו הרגרסיה שרוי דיווח עליה, ו⛔ היא ⛔ אינה חוזרת.
    expect(twice.slice(0, 260), '⛔ ⛔ ואינו מבטל בחירה').not.toMatch(/setSelected\(null\)/);
    // ⛔ והחלופה הישנה ⛔ חייבת להיעלם — שני הכללים באותו קובץ הם שני מוצרים.
    expect(CODE, '⛔ הביטול הישן ⛔ ירד').not.toMatch(/prev === option\.he \? null : option\.he/);
    // ⛔ ו⛔ אין תופעת לוואי בתוך מעדכן state — טעות שנכתבה כאן לרגע ותוקנה לפני הדחיפה.
    expect(CODE, '⛔ `fire` ⛔ אינו בתוך setSelected').not.toMatch(/setSelected\(\(prev\)[^}]*fire\(/);
  });

  /**
   * 🔴 **`F-260` — הקרב נכנס למסך.** ⛔ הגלילה ⛔ אינה «אי-נוחות» בזירה עם שעון של
   * 90 שניות; היא הפסד. ‏5.25rem = 84px = כותרת הפריסה (52) + `pb-32` של `<main>` (32),
   * שנמדדו בשרשרת ההורים — ⛔ ולא מספר יפה.
   */
  it('F-260 · מסך הקרב בגובה קבוע שמנכה את הכרום, ⛔ ואינו נגלל', () => {
    const battle = CODE.slice(CODE.indexOf('data-arena-scope'));
    expect(battle, 'גובה מדויק, ⛔ לא מינימום').toMatch(/h-\[calc\(100dvh-5\.25rem\)\]/);
    expect(battle, 'גלילה ⛔ אינה אפשרות').toMatch(/overflow-hidden/);
    // ⛔ והריפוד שלא ניקה כלום ⛔ ירד: ל-`/arcade` ⛔ אין סרגל לשוניות.
    expect(battle, '⛔ `pb-28` ⛔ ירד ממסך הקרב').not.toMatch(/h-\[calc\(100dvh-5\.25rem\)\][^"]*pb-28/);
    // ⛔ והבמה בולעת את הנותר — `min-h-0`, בלעדיו ילד flex מסרב להתכווץ מתחת לתוכנו.
    expect(battle, 'הבמה בולעת את הנותר').toMatch(/flex min-h-0 flex-1/);
  });

  /**
   * 🔴 **`F-278` — שלושת המסכים ש-`F-260` השאיר מאחור.** מסך הטעינה
   * (`screen.kind === 'loading'`), שלושת מסכי הכשל וסוף הסיבוב נשארו על
   * `min-h-[100dvh]` **ועוד** `pb-28` (‏112px) ⇒ **גבוהים מהמסך בהגדרה**, ⛔ לפני
   * שנספר ולו ילד אחד. ⛔ ו-`pb-28` ⛔ לא ניקה כלום: ל-`/arcade` ⛔ אין סרגל
   * לשוניות (הוא יושב מחוץ ל-`app/(tabs)/`, בכוונה) — זה ריפוד ששרד ממסך אחר.
   *
   * ⇒ **`T-416` ⓐ מחיל את התקדים של הקובץ על עצמו, ⛔ ולא פותר מחדש:** אותה תבנית
   * בדיוק כמו מסך הקרב, ו-5.25rem הם אותם 84px שנמדדו בשרשרת ההורים.
   * ⚠️ **והטענה רצה על ⛔ כל שורש-מסך, ⛔ ולא על שלושה שנוקבו בשם** — שורש חדש
   * שייוולד כאן נמדד איתם, ⛔ ולא מחליק מתחת לגדר.
   */
  it('F-278 · כל שורש-מסך בזירה על תבנית הקרב — גובה מדויק, ⛔ אפס `pb-28`', () => {
    const roots = [...CODE.matchAll(/<section\b[^>]*>/g)].map((tag) => {
      const cls = tag[0].match(/className="([^"]*)"/);
      return cls === null ? '' : cls[1];
    });
    // טעינה · כשל · סוף סיבוב · קרב. ⛔ טענה על קבוצה ריקה היא טענה ירוקה על כלום.
    expect(roots.length, 'ארבעת שורשי-המסך').toBeGreaterThanOrEqual(4);

    for (const cls of roots) {
      expect(cls, `גובה מדויק, ⛔ לא מינימום: "${cls}"`).toMatch(/\bh-\[calc\(100dvh-5\.25rem\)\]/);
      expect(cls, `גלילה ⛔ אינה אפשרות: "${cls}"`).toMatch(/\boverflow-hidden\b/);
      expect(cls, `⛔ ריפוד ששרד ממסך אחר: "${cls}"`).not.toMatch(/\bpb-28\b/);
      expect(cls, `⛔ מינימום ⛔ אינו גובה: "${cls}"`).not.toMatch(/\bmin-h-\[100dvh\]/);
    }
  });

  /**
   * `T-358` — שלוש שכבות התנועה. ⛔ כל אחת נבדקת **בקובץ הטוקנים**, כי `36 § 14`
   * ו-T-041 מחזיקים את תנועת הזירה ב-CSS ⛔ ולא ברכיב.
   */
  it('T-358 · פס חיי היריב נשפך — `transition`, ⛔ ולא `keyframes`', () => {
    expect(CODE, 'הצומת מסומן').toMatch(/data-arena-hp-fill/);
    expect(CSS, 'מעבר על transform').toMatch(/\[data-arena-hp-fill\][^}]*transition: transform/);
    // 🔴 ⛔ **`transition` ⛔ ולא `animation`** — `animate` § 6: פס שמשתנה פעמיים בשנייה
    // חייב לכוון מחדש מהערך הנוכחי; קיפריימים היו מתחילים מאפס ומקפיצים אותו לאחור.
    expect(CSS, '⛔ ⛔ לא קיפריימים על הפס').not.toMatch(/\[data-arena-hp-fill\][^}]*animation:/);
    // ⛔ ופס המאנה ⛔ אינו מקבל מעבר — הוא נכתב בכל פריים מלולאת ה-rAF.
    expect(CSS, '⛔ המאנה ⛔ אינה במעבר').not.toMatch(/data-arena-mana-fill/);
  });

  /**
   * ⟦NEW 16/09 · `C-0669` · `T-397`⟧ **מד המאנה הוא עשרה מקטעים ספירים.**
   * 🔬 הרנדר המחייב: `docs/design/render_video_B.py:288` (`mana_bar`) מצייר `cap`
   * מקטעים נפרדים, ‏`kol-B-03-battle.png` מראה 3 מתוך 10 מלאים, ו-`37 § 4` מתמחר
   * את היכולות ב**יחידות שלמות** ⇒ השאלה «האם 5 בידי» היא **ספירה**, ⛔ ולא קריאת
   * מספר בקרב בן 90 שניות שחלון התגובה בו 400ms.
   */
  it('T-397 · עשרה מקטעים נפרדים, ⛔ ולא מילוי רציף אחד', () => {
    // ⛔ המספר ⛔ אינו ליטרל ברכיב — הוא `MANA_CAP`, המקור היחיד שגם `manaAt` נגזר ממנו.
    expect(CODE, 'המקטעים נגזרים מ-MANA_CAP').toMatch(
      /Array\.from\(\{ length: MANA_CAP \}/,
    );
    expect(CODE, 'כל מקטע מסומן לבדיקה ולהליכה').toMatch(/data-arena-mana-seg/);
    expect(CODE, 'מצב המקטע נקרא מ-data, ⛔ ולא מהצבע בלבד').toMatch(/data-full=\{k < mana/);
    // 🔴 ⛔ **המילוי הרציף הישן ⛔ לא נשאר לצדם.** `scaleX(mana / MANA_CAP)` הוא בדיוק
    // הצורה ש-`T-397` מודדת כ-«0 יחידות ספירות», ושתי צורות במקביל הן מסך שסותר את עצמו.
    expect(CODE, '⛔ ⛔ לא scaleX על המאנה').not.toMatch(/scaleX\(\$\{mana \/ MANA_CAP\}\)/);
  });

  it('T-397 ⓑ · הערוץ הנגיש ⛔ לא זז — `aria-label` עדיין «N מתוך 10», והמספר עדיין על המסך', () => {
    // ⛔ זו הגדר של השורה: השינוי הוא **חזותי בלבד**. קורא מסך שקרא «3 מתוך 10»
    // לפני השינוי קורא בדיוק אותו דבר אחריו.
    expect(CODE).toMatch(/aria-label=\{`\$\{raging \? RAGE_HE : MANA_HE\} \$\{mana\} מתוך \$\{MANA_CAP\}`\}/);
    expect(CODE, 'המספר הנראה נשאר').toMatch(/manaTextRef[\s\S]{0,120}\$\{mana\} \/ \$\{MANA_CAP\}/);
    // ⛔ **ו⛔ אין כאן מצב שמקודד בצבע בלבד** (שכבה א׳ א2): שלושה ערוצים —
    // כמה מקטעים מלאים (מיקום), המספר `N / 10` (טקסט), ו-`aria-label`.
    expect(CODE, 'data-full הוא ערוץ שאינו צבע').toMatch(/dataset\.full = full/);
  });

  it('T-397 · הצבע הוא **טוקן**, ⛔ ולא ה-hex שהרנדר מצייר בו', () => {
    // 🔬 `render_video_B.py:300` צובע `(86,132,226)`; `arcade-tokens.css` מצהיר
    // `--arena-mana: #5684e2` — אותו צבע. ⇒ הרכיב נוקב ב**טוקן**, ⛔ ולא במספר.
    expect(CSS_CODE, 'הטוקן מוצהר').toMatch(/--arena-mana:\s*#5684e2/i);
    expect(CODE, 'הרכיב נוקב בטוקן').toMatch(/var\(--arena-mana\)/);
    expect(CODE, '⛔ ⛔ לא hex ברכיב').not.toMatch(/#5684e2/i);
    // ⛔ ובזמן זעם המקטעים מתחלפים לצבע ה-RAGE, בדיוק כמו ב-`mana_bar(rage=True)`.
    expect(CODE, 'זמן זעם מחליף את צבע המקטע').toMatch(
      /raging \? 'var\(--arena-cast-warn\)' : 'var\(--arena-mana\)'/,
    );
  });

  it('T-397 · הלולאה כותבת למקטעים ישירות — ⛔ אפס רינדורים חוזרים בקרב', () => {
    // 🔴 זו הסיבה ש-`T-231` בנה את המד על refs מלכתחילה: `setState` בלולאת rAF
    // מרנדר את כל הזירה 30 פעמים בשנייה. המעבר לעשרה מקטעים ⛔ אינו מבטל את זה.
    expect(CODE, 'ref למערך המקטעים').toMatch(/manaSegRefs = useRef<\(HTMLSpanElement \| null\)\[\]>/);
    expect(CODE, 'הלולאה קוראת לצובע').toMatch(/paintManaSegments\(manaSegRefs\.current, mana, nowRaging\)/);
    expect(CODE, '⛔ ⛔ לא setState על שינוי מאנה').not.toMatch(/setMana\(/);
  });

  it('T-358 · מספר הנזק הוא **מידע** — נגזר מהפרש החיים, ו⛔ אינו מחושב מחדש', () => {
    expect(CODE, 'נגזר מהפרש בפועל').toMatch(/prevEnemyHp\.current - battle\.enemyHp/);
    // ⛔ ⛔ לא חישוב שני של הנזק מהכללים — זה איך שמסך מתחיל לשקר על מה שקרה.
    expect(CODE, '⛔ ⛔ לא חישוב שני').not.toMatch(/data-arena-damage[\s\S]{0,400}criticalDamage/);
    expect(CSS, 'האנימציה קיימת').toMatch(/@keyframes arena-damage-float/);
    // ⛔ ⛔ לא `scale(0)` — «שום דבר במציאות אינו מופיע מאין» (`animate` § 4).
    expect(CSS, '⛔ ⛔ לא scale(0)').not.toMatch(/arena-damage-float[\s\S]{0,200}scale\(0\)/);
    // ⛔ ותחת תנועה מופחתת המספר **נשאר** ומפסיק לנוע — הוא מידע, ⛔ ולא אפקט.
    expect(CSS, 'תנועה מופחתת ⇒ נשאר').toMatch(
      /prefers-reduced-motion[\s\S]*data-arena-damage[\s\S]{0,140}opacity: 1/,
    );
  });

  /**
   * ⟦NEW 16/09 · `C-0665` · `T-359`⟧ **הקלף עף אל היריב.**
   * 🔬 הבדיקה מודדת את מה שאפשר למדוד בקוד — ⛔ שההיסט **מחושב משני מלבנים**
   * ו⛔ אינו מספר שנכתב; שהתנועה היא `transform`/`opacity` בלבד; ושתנועה מופחתת
   * חוסמת אותה **בשני** מחסומים. ⛔ «נראה טוב» ⛔ אינו נמדד כאן, ⛔ ואינו יכול.
   */
  it('T-359 · הקלף עף — ההיסט נמדד משני מלבנים, ⛔ ואינו מספר כתוב', () => {
    // ⛔ ① שני `getBoundingClientRect`, ⛔ ולא אחד: הקלף מודד את עצמו ב-`pointerup`
    //    (‏הרגע היחיד שבו הוא עוד במסמך), וההורה מודד את היריב.
    const CARD = withoutComments(readFileSync('components/SpellCard.tsx', 'utf8'));
    expect(CARD, 'הקלף מוסר את המלבן שממנו יצא').toMatch(
      /onCast\(e\.currentTarget\.getBoundingClientRect\(\)\)/,
    );
    expect(CODE, 'וההורה מודד את היריב').toMatch(
      /data-arena-enemy[\s\S]{0,200}getBoundingClientRect/,
    );
    expect(CODE, 'ההיסט הוא חיסור, ⛔ ולא קבוע').toMatch(/dx:[\s\S]{0,80}from\.left/);
    // ⛔ ② ההיסט נמסר כ**משתנה** — `style` מוטבע היה דורס את האנימציה כולה (`T-361`).
    expect(CODE, 'משתנה, ⛔ ולא transform מוטבע').toMatch(/--arena-throw-dx/);
    expect(CODE, '⛔ ⛔ אין transform מוטבע על הרפאים').not.toMatch(
      /data-arena-throw[\s\S]{0,600}transform:/,
    );
    // ⛔ ③ התנועה עצמה — `transform`/`opacity` בלבד, בעקומה ובחלון של השורה.
    expect(CSS, 'האנימציה קיימת').toMatch(/@keyframes arena-throw-fly/);
    expect(CSS, '⛔ ⛔ לא scale(0)').not.toMatch(/arena-throw-fly[\s\S]{0,240}scale\(0\)/);
    expect(CSS, '≤240ms, מהשורה').toMatch(/--arena-throw-ms:\s*240ms/);
    expect(CSS, 'ועקומת הזירה').toMatch(
      /\[data-arena-throw\][^}]*var\(--arena-ease-out\)/,
    );
    // ⛔ ולא `width`/`height`/`top`/`left` באנימציה — הן מפילות layout **ו**paint.
    expect(CSS, '⛔ ⛔ לא תכונות פריסה').not.toMatch(
      /@keyframes arena-throw-fly[\s\S]{0,400}(width|height|left|top):/,
    );
    // ⛔ ④ שני מחסומים לתנועה מופחתת — הרכיב ⛔ אינו יוצר, וה-CSS מוריד גם אם כן.
    expect(CODE, 'מחסום ברכיב').toMatch(/launchThrow[\s\S]{0,400}if \(reducedMotion\) return;/);
    expect(CSS, 'ומחסום ב-CSS').toMatch(
      /prefers-reduced-motion[\s\S]*data-arena-throw\][\s\S]{0,60}display: none/,
    );
  });

  /**
   * ⟦NEW 16/09 · `C-0665` · `T-364`⟧ **המספר עבר אל היריב.**
   * 🔬 שלוש הטענות של השורה נמדדות כאן אחת-אחת, ⛔ ולא כאחת: **מקום** (על היריב,
   * ⛔ לא על פס החיים) · **גודל וגוון** (גדול, אדום) · **התפרצות** (שלוש טבעות זהב).
   * ⛔ **הבדיקה ⛔ אינה מודדת «נראה טוב»** — היא מודדת שהמספר ⛔ אינו חוזר לתוך
   * `[role="img"]` של הפס, וזו בדיוק הרגרסיה שהשורה נפתחה עליה.
   */
  it('T-364 · הנזק יושב על היריב — גדול, אדום, ועם התפרצות', () => {
    // ⛔ ① מקום: הצומת יוצא מהכפתור של פס החיים ונכנס לאזור הבמה, שבו יושב היריב.
    expect(CODE, '⛔ ⛔ לא בתוך פס החיים').not.toMatch(
      /data-arena-hp-fill[\s\S]{0,600}data-arena-damage/,
    );
    expect(CODE, 'אחרי הבמה ⇒ על היריב').toMatch(
      /<ArenaStage[\s\S]{0,3000}data-arena-damage/,
    );
    // ⛔ `top-[16%]` הוא בדיוק המיקום של `[data-arena-slot="enemy"]` ב-`ArenaStage`,
    // ⛔ ולא מספר שנבחר — `STAGE_CLASS` הוא `h-full w-full` ⇒ אותה מערכת קואורדינטות.
    expect(CODE, 'על קואורדינטת היריב').toMatch(/top-\[16%\][^"]*/);
    const STAGE = readFileSync('components/ArenaStage.tsx', 'utf8');
    expect(STAGE, 'והיריב באמת שם').toMatch(/data-arena-slot="enemy"[^>]*top-\[16%\]/);
    // ⛔ ② גודל וגוון — שניהם ערכי רנדר, ⛔ ולא טעם.
    expect(CODE, 'אדום הרנדר').toMatch(/data-arena-damage[\s\S]{0,400}--arena-damage/);
    expect(CODE, '⛔ ⛔ לא זהב יותר').not.toMatch(
      /data-arena-damage[\s\S]{0,400}--arena-gold-light/,
    );
    expect(CSS, 'הגוון הוא של הרנדר').toMatch(/--arena-damage:\s*#ff8282/);
    // ⛔ ③ ההתפרצות — שלוש טבעות, ⛔ ואין בה נכס חדש.
    expect(CODE, 'שלוש טבעות').toMatch(/data-arena-burst/);
    expect(CSS, 'ההתפרצות מתרחבת').toMatch(/@keyframes arena-burst-ring/);
    expect(CSS, '⛔ ⛔ לא scale(0)').not.toMatch(/arena-burst-ring[\s\S]{0,160}scale\(0\)/);
    expect(CSS, 'זהב הרנדר').toMatch(/--arena-burst:\s*#ffecbe/);
    // ⛔ ④ וההתפרצות היא **קישוט** ⇒ היא זו שנעלמת תחת תנועה מופחתת, ⛔ ולא המספר.
    expect(CSS, 'תנועה מופחתת ⇒ ההתפרצות יורדת').toMatch(
      /prefers-reduced-motion[\s\S]*data-arena-burst\][\s\S]{0,60}display: none/,
    );
  });

  it('T-358 · הרעד שמור ל**קריטי בלבד**, ומשוחרר באותו מנגנון של הקיפאון', () => {
    expect(CODE, 'רק קריטי מדליק').toMatch(/if \(last\.critical\) setCrit/);
    expect(CODE, 'ומשוחרר ב-onAnimationEnd, ⛔ ולא ב-setTimeout').toMatch(
      /arena-crit-shake'\) setCrit\('off'\)/,
    );
    expect(CODE, '⛔ ⛔ אין setTimeout בנתיב').not.toMatch(/setTimeout\([^)]*setCrit/);
    expect(CSS, 'הרעד קיים').toMatch(/@keyframes arena-crit-shake/);
    expect(CSS, 'ומכובה בתנועה מופחתת').toMatch(
      /prefers-reduced-motion[\s\S]*data-arena-crit='a'\][\s\S]{0,120}animation: none/,
    );
    // 🔴 החלפת `a`⇄`b` היא מנגנון האתחול — בלעדיה שתי פגיעות ברצף מקבלות אנימציה אחת.
    expect(CODE, 'החלפת שם מאתחלת').toMatch(/setCrit\(\(prev\) => \(prev === 'a' \? 'b' : 'a'\)\)/);
  });
});

/**
 * 🔥 **T-401 · `37 § 8` ק1 · `render_video_B.py:364-378` — שבב הרצף בסרגל העליון.**
 *
 * ⛔ **הבדיקה על המקור, ⛔ ולא על DOM** — אותה צורה בדיוק כמו כל שאר הקובץ הזה:
 * הרכיב הוא לקוח (`'use client'`) עם `requestAnimationFrame` ו-`localStorage`, ואין
 * כאן מסלול רינדור. ⇒ מה שנמדד הוא **המבנה**: היכן השבב יושב, מה שולט בו, ומה
 * ⛔ אסור שיהיה בו.
 */
describe('T-401 — הרצף מגיע ללומד באמצע הקרב, ⛔ ולא רק בסיכום', () => {
  it('השבב קיים ויושב בתוך שורת `[data-arena-clock]`, ⛔ ולא שורה משלו', () => {
    expect(CODE).toMatch(/data-arena-streak/);
    const clock = CODE.indexOf('data-arena-clock');
    const streak = CODE.indexOf('data-arena-streak');
    const banner = CODE.indexOf('data-arena-banner');
    expect(clock).toBeGreaterThan(-1);
    expect(streak).toBeGreaterThan(clock);
    // ⛔ לפני הבאנר ⇒ עדיין בתוך ה-`<div>` של השעון, ⛔ ולא אחריו.
    expect(streak).toBeLessThan(banner);
  });

  it('⛔ אינו מוסיף ולו פיקסל לגובה השורה — `absolute`, כי הקטע `overflow-hidden`', () => {
    const chip = CODE.slice(CODE.indexOf('data-arena-streak'), CODE.indexOf('data-arena-banner'));
    expect(chip).toMatch(/absolute/);
    expect(chip).toMatch(/start-0/);
  });

  it('המספר מגיע מ-`streakAt` של השכבה הטהורה, ⛔ ואינו נספר ברכיב', () => {
    expect(CODE).toMatch(/streakAt\(battle\)/);
    // ⛔ אפס ספירה מקומית מעל `casts` ברכיב — מספר שנגזר בשני מקומות סוטה בשלישי.
    expect(CODE).not.toMatch(/casts\.filter/);
    expect(CODE).not.toMatch(/casts\.reduce/);
  });

  it('הסף 3 הוא `STREAK_HOT` מ-`lib/core/battle`, ⛔ ולא ליטרל ברכיב', () => {
    expect(CODE).toMatch(/STREAK_HOT/);
    const chip = CODE.slice(CODE.indexOf('data-arena-streak'), CODE.indexOf('data-arena-banner'));
    expect(chip).not.toMatch(/>=\s*3\b/);
  });

  it('⛔ אינו מצויר ב-`N = 0` (‏`:374` — `if streak > 0`)', () => {
    expect(CODE).toMatch(/\{streak > 0 &&/);
  });

  it('שכבה א׳ א2 — המצב ⛔ אינו בצבע בלבד: המילה והמספר הם הערוץ', () => {
    const chip = CODE.slice(CODE.indexOf('data-arena-streak'), CODE.indexOf('data-arena-banner'));
    expect(chip).toMatch(/STREAK_HE/);
    expect(chip).toMatch(/\{streak\}/);
    expect(chip).toMatch(/data-arena-streak-hot/);
  });

  it('⛔ אינווריאנט `37 § 13.5` — הטוקן החם ⛔ לא הדליף ל-`globals`/`palette`', () => {
    expect(CSS_CODE).toMatch(/--arena-streak-hot/);
    const globals = readFileSync('app/globals.css', 'utf8');
    const palette = readFileSync('lib/core/palette.ts', 'utf8');
    expect(globals).not.toContain('--arena-streak-hot');
    expect(palette).not.toContain('--arena-streak-hot');
    // ⛔ ה-hex עצמו חי בפלטה המתוחמת בלבד.
    expect(CODE).not.toMatch(/#784614/i);
  });
});

/**
 * 👻 **T-403 · `37 § 5` («**גילוי:** בקרב הראשון בלבד יד רפאים שמדגימה את הגרירה»).**
 *
 * 🔬 **הפער, נמדד בטיק הזה:** `grep -rn ghost components/` ⇒ **0** — הסעיף קיים
 * במפרט ו⛔ מעולם ⛔ לא נבנה; המחווה המרכזית של הקרב נלמדה מפסקה אחת.
 * ⛔ **שער «הקרב הראשון» ⛔ לא נבנה מחדש:** `ARENA_TAUGHT_KEY` כבר שומר על הפסקה,
 * ⇒ אותו ביט בדיוק (`showHint`) שומר גם על התנועה.
 */
describe('T-403 — יד הרפאים: המחווה נראית בקרב הראשון בלבד', () => {
  const chip = (): string =>
    CODE.slice(CODE.indexOf('data-arena-teach'), CODE.indexOf('data-arena-throw'));

  it('הצומת קיים, `fixed`, ⛔ אינו מידע ו⛔ אינו יעד מגע', () => {
    expect(CODE).toMatch(/data-arena-teach/);
    expect(chip()).toMatch(/aria-hidden/);
    expect(chip()).toMatch(/pointer-events-none/);
    expect(chip()).toMatch(/position: 'fixed'/);
  });

  it('⛔ מוצג אך ורק כש-`showHint` — אותו שער של `ARENA_TAUGHT_KEY`, ⛔ ולא שני', () => {
    expect(CODE).toMatch(/\{teach !== null &&/);
    expect(CODE).toMatch(/if \(!showHint \|\| reducedMotion \|\| battle === null\) return undefined;/);
    // ⛔ אפס מפתח אחסון שני — הרפאים ⛔ אינו זוכר דבר בעצמו.
    expect((CODE.match(/localStorage/g) ?? []).length).toBeLessThanOrEqual(2);
  });

  it('לכל היותר **שני** מחזורים, והמספר חי ב-CSS ⛔ ולא ברכיב', () => {
    expect(CSS_CODE).toMatch(/animation:\s*arena-teach-drag var\(--arena-teach-ms\) var\(--arena-ease-in-out\) 2 both/);
    expect(CODE).toMatch(/onAnimationEnd=\{\(\) => setTeach\(null\)\}/);
  });

  it('משך המחזור ≤1,200ms, ⛔ נמדד מה-CSS ⛔ ולא מהערה', () => {
    const ms = declared('--arena-teach-ms');
    expect(ms).toBeLessThanOrEqual(1_200);
    expect(ms).toBeGreaterThan(0);
    expect(CODE).not.toMatch(new RegExp(`\\b${ms}\\b`));
  });

  it('`transform` ו-`opacity` בלבד (`animate` § 4), ⛔ ואינו מתחיל מ-`scale(0)`', () => {
    const frames = CSS_CODE.slice(
      CSS_CODE.indexOf('@keyframes arena-teach-drag'),
      CSS_CODE.indexOf('[data-arena-teach]'),
    );
    expect(frames).toMatch(/transform/);
    expect(frames).toMatch(/opacity/);
    for (const banned of [/\bwidth:/, /\bheight:/, /\btop:/, /\bleft:/, /\bmargin/, /scale\(0\)/]) {
      expect(frames, `${banned} — animate § 4`).not.toMatch(banned);
    }
  });

  it('🔴 `prefers-reduced-motion` ⇒ ⛔ אין רפאים בכלל — ⛔ לא איטי ו⛔ לא מקוצר', () => {
    expect(CSS_CODE).toMatch(/\[data-arena-teach\]\s*\{\s*display:\s*none;\s*\}/);
    // ⛔ והמחסום השני, ברכיב: הוא ⛔ אפילו לא נמדד.
    expect(CODE).toMatch(/reducedMotion \|\| battle === null/);
  });

  it('המגע הראשון עוצר, ⛔ ואין מאזין ששורד — `pointerdown` עם `once`', () => {
    expect(CODE).toMatch(/window\.addEventListener\('pointerdown', stop, \{ once: true \}\)/);
    expect(CODE).toMatch(/removeEventListener\('pointerdown', stop\)/);
    // ⛔ והטלה עצמה מכבה אותו מייד, ⛔ ולא «אחרי שיסתיים».
    expect(CODE).toMatch(/setShowHint\(false\);\s*setTeach\(null\);/);
  });

  it('ⓒ — הפסקה `[data-arena-hint]` **נשארת**: התנועה ⛔ אינה מחליפה טקסט', () => {
    expect(CODE).toMatch(/data-arena-hint/);
    expect(CODE).toMatch(/DRAG_HINT_HE/);
  });

  it('⛔ אינו מזיז את פריסת היד — `fixed` בקצה העץ, ⛔ ולא ילד של `[data-arena-hand]`', () => {
    const hand = CODE.indexOf('data-arena-hand');
    expect(CODE.indexOf('data-arena-teach')).toBeGreaterThan(hand);
  });

  it('⛔ אינווריאנט `37 § 13.5` — אפס ערך חדש שדלף, והצבעים הם טוקנים קיימים', () => {
    expect(chip()).toMatch(/var\(--arena-gold-light\)/);
    expect(chip()).toMatch(/var\(--arena-gold\)/);
    expect(chip()).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});
