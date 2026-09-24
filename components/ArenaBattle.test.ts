import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { LAYER_ORDER } from '@/lib/core/characterBase';
import { withoutComments, withoutCssComments } from '@/lib/testSource';

const SRC = readFileSync('components/ArenaBattle.tsx', 'utf8');
const CODE = withoutComments(SRC);
const CSS = readFileSync('app/arcade/arcade-tokens.css', 'utf8');
const CSS_CODE = withoutCssComments(CSS);
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

  /**
   * 🔴 **⟦20/09 · `C-0746` · `F-306`ⓑ⟧ השעון והרעד ⛔ אינם רשאים לחלוק אלמנט.**
   *
   * 🔬 **נמדד בדפדפן חי (393×852, `/dev/arcade`), ⛔ ולא הוסק מקריאת הקובץ:**
   * הצבת שתי התכונות על אזור הבמה וקריאת `getComputedStyle(area).animationName`
   * החזירה `arena-hitstop-a` כשרק `data-arena-impact` היה דלוק, ו-`arena-crit-shake`
   * **בלבד** כששניהם היו דלוקים. ⇒ אותה תכונה, אותו אלמנט, אותה ספציפיות `(0,2,0)`,
   * והרעד מאוחר יותר ⇒ **החליף** את השעון.
   *
   * 🔴 **וההשלכה ⛔ אינה קוסמטית:** השחרור מאזין ל-`animationName.startsWith('arena-hitstop')`
   * ⇒ בפגיעה קריטית `setImpact('off')` ⛔ לעולם ⛔ לא נקרא, ושתי הדמויות נשארות
   * **צלליות לבנות עד סוף הקרב**.
   *
   * ⛔ **ו⛔ אין לתקן זאת בהעברת הרעד לערוץ `transform` אחר** (‏`translate`/`rotate`):
   * ההתנגשות היא על תכונת ה-`animation` **עצמה**, ⛔ ולא על הערוץ שהקיפריימים מניעים.
   */
  it('⛔ השעון ⛔ אינו יושב על אזור הבמה — שם הרעד הקריטי מחליף אותו', () => {
    const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)];
    const carriers = rules
      .filter(([, , body]) => /animation:\s*arena-hitstop-[ab]\b/.test(body ?? ''))
      .map(([, selector]) => (selector ?? '').trim());
    expect(carriers.length, '⛔ אף כלל ⛔ אינו מפעיל את השעון ⇒ הבדיקה ריקה').toBeGreaterThan(0);
    for (const selector of carriers) {
      expect(selector, `⛔ «${selector}» מחזיק את השעון על אזור הבמה, ששם הרעד דורס אותו`)
        .not.toMatch(/data-arena-stage-area/);
    }
    // ⛔ **והצד השני של אותה טענה:** הרעד **כן** יושב שם, ⇒ אם מישהו יזיז אותו
    //    אל צומת השעון ההתנגשות תחזור, והשורה הזאת תיפול.
    const shake = rules
      .filter(([, , body]) => /animation:\s*arena-crit-shake\b/.test(body ?? ''))
      .map(([, selector]) => (selector ?? '').trim());
    expect(shake.length).toBeGreaterThan(0);
    for (const selector of shake) {
      expect(selector, `⛔ «${selector}» — הרעד חוזר לחלוק צומת עם השעון`)
        .not.toMatch(/data-arena-hitstop/);
    }
    // ⇒ והצומת קיים ברכיב, אחרת הכלל ⛔ אינו חל על דבר.
    expect(CODE).toMatch(/data-arena-hitstop=\{impact\}/);
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
    /* 🔴 **⟦עודכן 19/09 · `C-0738` · `T-439`⟧ נמדדת ה**הגעה**, ⛔ ולא מחרוזת.**
       הגרסה הקודמת קיבעה `castCount === 0 || reducedMotion` **מילה במילה**, ⇒
       היא האדימה כשהגדר פוצל לשתי שורות — **בלי ש⛔ אף התנהגות השתנתה**.
       🔬 והטענה כאן **חזקה יותר**: `reducedMotion` חוסם ב-`return` **לפני**
       ש-`setImpact` נקרא בכלל ⇒ התכונה ⛔ אינה מוצבת. זה מה שא7 דורשת,
       ⛔ ולא איך שהתנאי מנוסח. */
    const effect = CODE.slice(CODE.indexOf('const castCount ='));
    const guard = effect.indexOf('if (reducedMotion) return;');
    const setter = effect.indexOf('setImpact(');
    expect(guard, '⛔ חייב להתקיים גדר של תנועה מופחתת').toBeGreaterThan(-1);
    expect(setter, '⛔ וחייב להתקיים מי שמוצב').toBeGreaterThan(-1);
    expect(guard, 'הגדר **לפני** ההצבה').toBeLessThan(setter);
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
       כל כלל שהסלקטור שלו **מסתיים** בנושאת עצמה ⛔ אינו רשאי לגעת ב-`animation`.

       ↩️ **⟦20/09 · `C-0746` · `F-306`ⓑ⟧ והנושאת עברה צומת** — מ-`[data-arena-impact]`
       על אזור הבמה אל `[data-arena-hitstop]`, צומת אפס-גודל משלה, כי הרעד הקריטי
       **החליף** את השעון על התכונה המשותפת. ⛔ **והשורה הזאת חייבת לזוז איתה:**
       דפוס שמחפש נושאת שכבר ⛔ אינה קיימת עובר על **אפס** כללים ונשאר ירוק לנצח —
       בדיוק המחלקה של המוטציה שההערה מעל מתעדת, מצד השני. */
    for (const match of block.matchAll(/([^{}]+)\{([^}]*)\}/g)) {
      const selector = match[1] ?? '';
      const body = match[2] ?? '';
      const endsOnCarrier = selector
        .split(',')
        .some((one) => /\[data-arena-hitstop='[ab]'\]\s*$/.test(one.trim()));
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
  it('F-260 · מסך הקרב בגובה קבוע, ⛔ ואינו נגלל', () => {
    const battle = CODE.slice(CODE.indexOf('data-arena-scope'));
    // 🎬 **⟦17/09 · `T-423`ⓑ⟧ הגובה הוא `100dvh` **מלא**, ⛔ ולא `100dvh` פחות הכרום.**
    // ⛔ זו ⛔ אינה החלשה של `F-260` — היא אותה טענה אחרי ש**הכרום עצמו ירד**
    // (`arcade-tokens.css`, `body:has([data-arena-scope])`). ניכוי של 84px שכבר
    // ⛔ אינם על המסך היה משאיר 84px של כלום בתחתית, כלומר `F-284` מהצד השני.
    expect(battle, 'גובה מדויק, ⛔ לא מינימום').toMatch(/h-\[100dvh\]/);
    expect(battle, '⛔ הניכוי ⛔ אינו חוזר — הכרום ⛔ אינו קיים במסלול הזה').not.toMatch(
      /h-\[calc\(100dvh-5\.25rem\)\]/,
    );
    expect(battle, 'גלילה ⛔ אינה אפשרות').toMatch(/overflow-hidden/);
    // ⛔ והריפוד שלא ניקה כלום ⛔ ירד: ל-`/arcade` ⛔ אין סרגל לשוניות.
    expect(battle, '⛔ `pb-28` ⛔ ירד ממסך הקרב').not.toMatch(/h-\[100dvh\][^"]*pb-28/);
    // ⛔ והבמה בולעת את הנותר — `min-h-0`, בלעדיו ילד flex מסרב להתכווץ מתחת לתוכנו.
    expect(battle, 'הבמה בולעת את הנותר').toMatch(/flex min-h-0 flex-1/);
  });

  /**
   * 🎬 **T-423ⓐ — ה-X נשאר במקומו כשהמקטע יצא למלוא הרוחב.**
   *
   * 🔬 **הסיבה מדידה, ⛔ ולא סגנון:** `absolute` נמדד מול **תיבת הריפוד** של המכיל.
   * ‏`arcade-tokens.css` נתן ל-`[data-arena-scope]` ‏`padding-inline: 1.5rem` ⇒ `end-0`
   * היה מצמיד את כפתור היציאה לקצה **הפיזי** של המסך, 24px מהמקום שבו הוא נמדד עד היום,
   * ומכניס יעד 44px לפינה שבה האגודל פוגש את מסגרת המכשיר.
   * ⛔ **וזו ⛔ אינה החלפה של `F-260`** — הגובה כאן ⛔ לא נגע, ורק הציר האופקי זז.
   */
  it('T-423ⓐ · כפתור היציאה נמדד מול הריפוד החדש — `end-6`, ⛔ ולא `end-0`', () => {
    const battle = CODE.slice(CODE.indexOf('data-arena-scope'));
    expect(battle, 'ה-X יושב 24px מהקצה, כמו לפני המלוא-רוחב').toMatch(
      /absolute end-6 top-0 z-10/,
    );
    expect(battle, '⛔ `end-0` ⛔ אינו חוזר — הוא הצמיד את היעד למסגרת המכשיר').not.toMatch(
      /absolute end-0 top-0 z-10/,
    );
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
    const roots = [...CODE.matchAll(/<section\b[^>]*>/g)].map((tag) => ({
      scoped: /data-arena-scope/.test(tag[0]),
      cls: tag[0].match(/className="([^"]*)"/)?.[1] ?? '',
    }));
    // טעינה · כשל · סוף סיבוב · קרב. ⛔ טענה על קבוצה ריקה היא טענה ירוקה על כלום.
    expect(roots.length, 'ארבעת שורשי-המסך').toBeGreaterThanOrEqual(4);
    // ⛔ ושתי הקבוצות ⛔ אינן ריקות — אחרת הלולאה למטה ירוקה על כלום.
    expect(roots.filter((r) => r.scoped).length, 'שורש נושא-סקופ אחד לפחות').toBeGreaterThanOrEqual(1);
    expect(roots.filter((r) => !r.scoped).length, 'שורש שאינו נושא סקופ אחד לפחות').toBeGreaterThanOrEqual(1);

    for (const { scoped, cls } of roots) {
      /**
       * 🎬 **⟦17/09 · `T-423`ⓑ⟧ הגובה נגזר מ**מי מוריד את הכרום**, ⛔ ולא מהקובץ.**
       *
       * 🔬 **וזו מדידה, ⛔ ולא שני סגנונות:** `arcade-tokens.css` מוריד את ה-84
       * (‏`<header>` 52 + `pb-8` 32) **אך ורק** במסמך שיש בו `data-arena-scope`.
       * ⇒ שורש שנושא אותו רואה `100dvh` **מלא**, ושורש שאינו נושא אותו — מסכי
       * הטעינה, הכשל וסוף הסיבוב — עדיין יושב מתחת לכותרת ⇒ **חייב** להמשיך לנכות
       * אותה. ⛔ אותו מספר לשניהם היה שובר בדיוק אחד מהם, בכל כיוון שייבחר.
       * ⚠️ **ומה שמאחד אותם ⛔ לא נגע:** גובה **מדויק**, ⛔ לא מינימום · גלילה
       * ⛔ אינה אפשרות · ⛔ אפס `pb-28`. זה `F-278`, והוא ⛔ לא הוחלש.
       */
      if (scoped) {
        expect(cls, `גובה מלא כשהכרום ירד: "${cls}"`).toMatch(/\bh-\[100dvh\]/);
        expect(cls, `⛔ ניכוי כרום שאינו קיים: "${cls}"`).not.toMatch(
          /\bh-\[calc\(100dvh-5\.25rem\)\]/,
        );
      } else {
        // 👻 `T-421` (`C-0779`) — שורש שנושא רצועה קבועה מנכה **גם** את שמירת ה-`body` לה
        // (`5rem` + אזור בטוח), כי אחרת היא משולמת פעמיים: 80px נמדדו חי ב-`/dev/arcade/too-small`.
        expect(cls, `גובה מדויק שמנכה את הכרום: "${cls}"`).toMatch(
          /\bh-\[calc\(100dvh-5\.25rem(?:-5rem-env\(safe-area-inset-bottom\))?\)\]/,
        );
      }
      expect(cls, `גלילה ⛔ אינה אפשרות: "${cls}"`).toMatch(/\boverflow-hidden\b/);
      expect(cls, `⛔ ריפוד ששרד ממסך אחר: "${cls}"`).not.toMatch(/\bpb-28\b/);
      expect(cls, `⛔ מינימום ⛔ אינו גובה: "${cls}"`).not.toMatch(/\bmin-h-\[100dvh\]/);
    }
  });

  /**
   * 🎬 **`T-423`ⓑ — שמונה רצועות, סכום אחד: `56+110+330+44+28+196+68+20 = 852`.**
   *
   * 🔬 **שמונת המספרים נקראו מ-Figma בטיק הזה** (`get_metadata` על
   * `v216k02v3L0azhfOw3y2ur / 3316:2`, ‏393×852) ⛔ ולא נבחרו — וקריאה של
   * ה**קואורדינטות** היא מה שמכריע את `gap`:
   * ```
   * top-bar      y=0    h=56        enemy-block  y=56   h=110
   * stage        y=166  h=330       mana         y=496  h=44
   * hint         y=540  h=28        deck         y=568  h=196
   * abilities    y=764  h=68        (bottom)     y=832  h=20
   * ```
   * ⇒ כל רצועה מתחילה **בדיוק** היכן שקודמתה נגמרה ⇒ **`gap` הוא אפס**, והמרווח חי
   * בתוך הרצועה. ⛔ `gap-2` היה מוסיף 48px שאין להם מקום, והם היו נגרעים מהבמה —
   * שכבר נמדדה פעם אחת ב-52px (`T-361`).
   *
   * ⚠️ **סריקת-מקור, ⛔ ולא פריסה.** הטענה החיה — שהמקטע שווה ל-`clientHeight`,
   * שאין גלילה, ושכל רצועה מחזירה את גובהה ב-±1px — היא ⓒ, והיא רצה ב-`check:mobile`
   * ב-393×852 וב-430×932. ‏`jsdom` ⛔ אינו מודד פריסה, ⇒ טענת גובה כאן הייתה
   * **טענה ירוקה על כלום**.
   */
  it('T-423ⓑ · שבע רצועות בגובה מוצהר, והבמה בולעת את השארית — סכום 852', () => {
    const battle = CODE.slice(CODE.indexOf('data-arena-scope'));

    // ⛔ הרצועה, הגובה שלה, וה-Figma node שממנו הוא נקרא. ⛔ אף אחד מהם ⛔ לא נבחר.
    const BANDS = [
      { mark: 'data-arena-clock', px: 56, node: '3316:3' },
      { mark: 'data-arena-enemy-block', px: 110, node: '3316:8' },
      { mark: 'data-arena-mana', px: 44, node: '3319:2' },
      { mark: 'data-arena-hintrow', px: 28, node: '3319:15' },
      { mark: 'data-arena-hand', px: 120, node: 'T-459 · 100px cards, not Figma 132' },
      { mark: 'data-arena-abilities', px: 68, node: '3319:33' },
      { mark: 'data-arena-isolation', px: 20, node: '832→852' },
    ] as const;

    for (const { mark, px, node } of BANDS) {
      const at = battle.indexOf(mark);
      expect(at, `הרצועה ${mark} קיימת`).toBeGreaterThan(-1);
      // ⛔ החלון הוא התגית עצמה — `className` יושב לידה, ⛔ ולא שלוש רצועות הלאה.
      const tag = battle.slice(Math.max(0, at - 400), at + 400);
      expect(tag, `${mark} מצהיר ${px}px (Figma ${node})`).toContain(`h-[${px}px]`);
      // ⛔ **`shrink-0` ⛔ אינו קישוט:** בלעדיו ילד flex מתכווץ מתחת לגובה המוצהר
      // ברגע שהסכום לוחץ, ⇒ «גובה מוצהר» היה הופך ל«גובה מבוקש».
      expect(tag, `${mark} ⛔ אינו מתכווץ`).toContain('shrink-0');
    }

    // 🔢 **הסכום עצמו, ⛔ ולא שבע טענות נפרדות:** שבע הרצועות ועוד הבמה = 852.
    const declared = BANDS.reduce((sum, b) => sum + b.px, 0);
    // 📏 ⟦`T-459`⟧ ‏deck 196 ⇒ 120: 76px עוברים לבמה (330 ⇒ 406), הסכום ⛔ לא זז.
    expect(declared, 'שבע הרצועות שאינן הבמה').toBe(446);
    expect(declared + 406, '‏`36 § 8.0` ② — הסכום ב-393×852').toBe(852);

    // ⛔ **ואפס `gap` על השורש** — זה מה שמאפשר לסכום להסתכם.
    const root = battle.slice(0, battle.indexOf('>'));
    expect(root, 'אפס `gap` — הרצועות צמודות, כמו ב-Figma').toMatch(/\bgap-0\b/);

    // ⛔ **והבמה היא היחידה שגובהה ⛔ אינו מוצהר** — היא בולעת את השארית.
    expect(battle, 'הבמה גמישה').toMatch(/flex min-h-0 flex-1/);
    const stage = battle.slice(battle.indexOf('data-arena-stage-area'));
    expect(stage.slice(0, 900), '⛔ ולבמה ⛔ אין גובה מוצהר').not.toMatch(/h-\[\d+px\]/);
  });

  /**
   * 🎬 **`T-423`ⓑ — הכרום יורד **פעם אחת**, ב-CSS, ו⛔ אך ורק במסמך של הזירה.**
   *
   * 🔴 **האילוץ שקובע את הצורה:** ה-`<header>` (52) ו-`pb-8` (32) יושבים ב-
   * `app/layout.tsx` — **שורש המוצר כולו**. ⇒ כלל שמוריד אותם ⛔ חייב להיות בלתי-אפשרי
   * להחיל על מסך שאינו זירה, ו-`:has()` הוא מה שהופך את זה למדיד: הוא דורש **צאצא**
   * שנושא `data-arena-scope`. ⛔ מסך שאינו זירה ⛔ אינו יכול להיתפס בו.
   * ⚠️ **והראיה ההופכית חיה ב-`check:mobile`**, ⛔ ולא כאן: `/dev/tabs/me` מחזיר
   * ‏`<header>` בגובה **52px**, ⛔ ולא 0.
   */
  it('T-423ⓑ · הורדת הכרום היא כלל CSS אחד, מותנה ב-`data-arena-scope`', () => {
    expect(CSS_CODE, 'הכותרת יורדת במסמך של הזירה').toMatch(
      /body:has\(\[data-arena-scope\]\)[^{]*header\s*\{[^}]*display:\s*none/,
    );
    expect(CSS_CODE, 'ו-`pb-8` של ה-`<main>` איתה').toMatch(
      /body:has\(\[data-arena-scope\]\)[^{]*main\s*\{[^}]*padding-bottom:\s*0/,
    );
    // ⛔ **⛔ ולא כלל אחד בלי התנאי** — `header { display: none }` גלובלי היה מוחק את
    // הכותרת מכל מסך במוצר, וזו בדיוק התקלה שהשורה הזאת אוסרת במפורש.
    expect(CSS_CODE, '⛔ אין כלל גלובלי על `header`').not.toMatch(
      /(^|\})\s*header\s*\{[^}]*display:\s*none/,
    );
  });

  /**
   * 🥊 **`T-422`ⓓ — שני המסכים השכנים, על אותה תבנית ובאותה טענה.**
   *
   * 🔬 **למה הטענה יושבת **כאן** ו⛔ לא בקובץ של כל רכיב:** התבנית שהיא מודדת היא של
   * `ArenaBattle.tsx` — הוא הגדיר אותה ב-`T-416`, והשכנים **מיישמים** אותה. טענה
   * שמפוצלת לשני קבצים היא שתי תבניות שמתחילות להיפרד ביום שאחד מהם משתנה.
   * ⚠️ **סריקת-מקור, ⛔ ולא פריסה** — קובצי ה-`.dom.test.tsx` הם `jsdom`, ⇒ ⛔ אפס
   * פריסה בהם; המדידה החיה נעשית ב-`check:mobile` ובהליכה, ⛔ לא כאן.
   * ⚠️ ⛔ **ו-`pb-28` ⛔ אינו נאסר על `ArenaResult`** — ל-`ArenaBattle` ⛔ אין
   * `<ActionBar>` קבוע ולו יש, ⇒ הריפוד שם משלם על הרצועה במקום לשרוד ממסך אחר.
   */
  it('T-422 · `ArenaSummary` ו-`ArenaResult` על תבנית הקרב — גובה מדויק ואזור גמיש', () => {
    const NEIGHBOURS = ['components/ArenaSummary.tsx', 'components/ArenaResult.tsx'] as const;

    for (const file of NEIGHBOURS) {
      const code = withoutComments(readFileSync(file, 'utf8'));
      const roots = [...code.matchAll(/<section\b[^>]*>/g)].map((tag) => ({
        scoped: /data-arena-scope/.test(tag[0]),
        cls: tag[0].match(/className="([^"]*)"/)?.[1] ?? '',
      }));
      expect(roots.length, `${file} — שורש אחד לפחות`).toBeGreaterThanOrEqual(1);

      for (const { scoped, cls } of roots) {
        // ⟦T-428⟧ אותו כלל של `F-278`: שורש בסקופ ⇒ הכרום ירד ⇒ `100dvh` מלא; אחרת ניכוי 84.
        expect(cls, `${file} — גובה מדויק, ⛔ לא מינימום: "${cls}"`).toMatch(
          scoped ? /\bh-\[100dvh\]/ : /\bh-\[calc\(100dvh-5\.25rem\)\]/,
        );
        expect(cls, `${file} — גלילת עמוד ⛔ אינה אפשרות: "${cls}"`).toMatch(/\boverflow-hidden\b/);
        expect(cls, `${file} — ⛔ מינימום ⛔ אינו גובה: "${cls}"`).not.toMatch(/\bmin-h-\[100dvh\]/);
      }

      // ⛔ **וגובה מדויק בלי אזור גמיש הוא `overflow-hidden` שחותך תוכן בשקט** — זו
      // בדיוק התקלה שהגובה המדויק לבדו היה מייצר, ⇒ היא נמדדת יחד איתו.
      expect(code, `${file} — האזור שאורכו תלוי בקרב בולע את השארית`).toMatch(
        /min-h-0 flex-1/,
      );
      expect(code, `${file} — והוא נגלל בתוך עצמו`).toMatch(/overflow-y-auto/);
    }
  });

  /**
   * ⛔ **שתי בקרות שליליות — טענה שאינה יכולה להיכשל ⛔ אינה טענה** (`T-422`ⓓ).
   * שתיהן מריצות את **אותה** לוגיקה על מחרוזת שאמורה להפיל אותה.
   */
  it('T-422 · הטענה נופלת על `min-h-[100dvh]` ועל גובה מדויק בלי אזור גמיש', () => {
    const exact = /\bh-\[calc\(100dvh-5\.25rem\)\]/;
    const minimum = /\bmin-h-\[100dvh\]/;

    // ⓐ מינימום במקום גובה מדויק ⇒ נופל על שתי הטענות גם יחד.
    const REGRESSED = 'flex min-h-[100dvh] flex-col gap-6 pb-8 pt-10';
    expect(REGRESSED).not.toMatch(exact);
    expect(REGRESSED).toMatch(minimum);

    // ⓑ גובה מדויק ⛔ בלי אזור גמיש ⇒ עובר את טענת הגובה ו**נופל** על הגמישות.
    const CLIPPED = '<section className="flex h-[calc(100dvh-5.25rem)] flex-col overflow-hidden">';
    expect(CLIPPED).toMatch(exact);
    expect(CLIPPED).not.toMatch(/min-h-0 flex-1/);
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
    // T-452 — the label now names the doubled rate too (`manaLabelHe`); «N מתוך 10» ⛔ unchanged.
    expect(CODE).toMatch(/aria-label=\{`\$\{manaLabelHe\(raging, lastBreath\)\} \$\{mana\} מתוך \$\{MANA_CAP\}`\}/);
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
      /raging \? 'var\(--danger\)' : 'var\(--arena-mana\)'/,
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
    // 🎯 **⟦18/09 · `C-0717`⟧ הטענה ⛔ לא רוככה — היא עברה לעוגן, והעוגן נבדק כאן.**
    // 🔬 **ולמה היא **חייבת** הייתה לעבור:** הביטוי הישן קיבל את `[data-arena-enemy]`,
    // ונמדד ב-393×852 ש**זהו לוח החיים** (`cy 206 · cx 272`) ⛔ ולא היריב
    // (`cy 283 · cx 197`). ⇒ השער אישר במשך שבועות שהקלף «נמדד אל היריב» בזמן
    // שהוא עף אל **מד החיים**. ⛔ טענה ירוקה על הצומת הלא-נכון.
    const ANCHORS = withoutComments(readFileSync('components/arenaAnchors.ts', 'utf8'));
    expect(CODE, 'וההורה מודד את היריב — דרך העוגן, ⛔ ולא בשאילתה משלו').toMatch(
      /const to = foeRect\(area\)/,
    );
    expect(ANCHORS, '⛔ והעוגן הוא **הדמות**, ⛔ ולא הלוח שמעליה').toMatch(
      /FOE_SELECTOR = '\[data-arena-figure="enemy"\]'/,
    );
    expect(ANCHORS, 'והוא מודד מלבן חי').toMatch(/getBoundingClientRect/);
    expect(CODE, '⛔ ⛔ ואין שאילתה שנייה לאותו צומת ב-ArenaBattle').not.toMatch(
      /querySelector\('\[data-arena-enemy\]'\)/,
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
   * 🟡👻 **⟦23/09 · `C-0775` · `T-449` · `37 § 11` א3 · א5⟧** — הקלף **נזרק**, ⛔ ולא מתכווץ.
   * ⓐ מתיחה `1.25×0.8` בשיגור, מחיצה `0.75×1.2` מתוך בסיס העומק `0.55` בפגיעה.
   * ⓑ חמישה עותקים דוהים על **אותם** קיפריימים, `transform`+`opacity` בלבד.
   * ⓒ השחרור על הרפאים **האחרון** — אחרת ארבעה עותקים נחתכים באמצע הדרך.
   */
  it('🟡👻 א3 מתיחה ומחיצה · א5 חמישה רפאים על אותו מסלול, ⛔ אפס filter', () => {
    const fly = CSS.slice(CSS.indexOf('@keyframes arena-throw-fly'), CSS.indexOf('[data-arena-throw] {'));
    expect(fly, 'מתיחה בשיגור').toMatch(/scale\(1\.25, 0\.8\)/);
    expect(fly, 'מחיצה בפגיעה = 0.55 × (0.75, 1.2)').toMatch(/scale\(0\.4125, 0\.66\)/);
    expect(fly, '⛔ אפס filter').not.toMatch(/filter/);
    const ghost = CSS.slice(CSS.indexOf('[data-arena-throw-ghost] {'));
    expect(ghost.slice(0, 400), 'אותם קיפריימים').toMatch(/animation: arena-throw-fly var\(--arena-throw-ms\)/);
    expect(ghost.slice(0, 400), 'השהיה עולה').toMatch(/animation-delay: calc\(var\(--arena-throw-ghost-i, 1\) \* 18ms\)/);
    expect(ghost.slice(0, 400), '⛔ ⛔ לא blur').not.toMatch(/filter/);
    expect(CSS, 'תנועה מופחתת מסירה גם את הרפאים').toMatch(
      /prefers-reduced-motion[\s\S]*\[data-arena-throw-ghost\] \{ display: none; \}/,
    );
    expect(CODE, 'חמישה, בדיוק').toMatch(/\[1, 2, 3, 4, 5\]\.map\(\(i\) =>/);
    expect(CODE, 'השחרור על האחרון').toMatch(/onAnimationEnd=\{i === 5 \? \(\) => setThrowFx\(null\) : undefined\}/);
    const ghostJsx = CODE.slice(CODE.indexOf('data-arena-throw-ghost'), CODE.indexOf('data-arena-throw\n'));
    expect(ghostJsx, '⛔ הרפאים ⛔ אינם נושאים את המילה').not.toMatch(/throwFx\.label/);
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
    // ⛔ `bottom-[46%]` הוא בדיוק המיקום של `[data-arena-slot="enemy"]` ב-`ArenaStage`
    // (⟦`T-456`⟧ — הרגליים), ⛔ ולא מספר שנבחר — `STAGE_CLASS` הוא `h-full w-full` ⇒ אותה מערכת.
    expect(CODE, 'על קואורדינטת היריב').toMatch(/bottom-\[46%\][^"]*/);
    const STAGE = readFileSync('components/ArenaStage.tsx', 'utf8');
    expect(STAGE, 'והיריב באמת שם').toMatch(/data-arena-slot="enemy"[^>]*bottom-\[46%\]/);
    // ⛔ ② גודל וגוון — שניהם ערכי רנדר, ⛔ ולא טעם.
    expect(CODE, 'אדום הרנדר').toMatch(/data-arena-damage[\s\S]{0,400}--arena-damage/);
    expect(CODE, '⛔ ⛔ לא מבטא הלומד').not.toMatch(
      /data-arena-damage[\s\S]{0,400}--brand-surface/,
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

  // 🔵 T-425 — ⛔ `·` הוא ההודאה ששתי הוראות נדחסו לשורה אחת.
  it('T-425 — שורת הרמז: הוראה אחת בכל רגע, ⛔ בלי `·`, ⛔ ושני המסלולים נשארים', () => {
    const drag = CODE.match(/const DRAG_HINT_HE = '([^']*)'/)?.[1] ?? '';
    const tap = CODE.match(/const TAP_ENEMY_HINT_HE = '([^']*)'/)?.[1] ?? '';
    expect(drag).toContain('כלפי מעלה'); // המחווה האמיתית — ⛔ «אל היריב»
    expect(tap).toContain('היריב');
    for (const s of [drag, tap]) {
      expect(s).not.toContain('·');
      expect(s.length).toBeLessThanOrEqual(30);
    }
    expect(CODE).toMatch(/\{selected === null \? DRAG_HINT_HE : TAP_ENEMY_HINT_HE\}/);
  });

  it('⛔ אינו מזיז את פריסת היד — `fixed` בקצה העץ, ⛔ ולא ילד של `[data-arena-hand]`', () => {
    const hand = CODE.indexOf('data-arena-hand');
    expect(CODE.indexOf('data-arena-teach')).toBeGreaterThan(hand);
  });

  it('⛔ אינווריאנט `37 § 13.5` — אפס ערך חדש שדלף, והצבעים הם טוקנים קיימים', () => {
    // ⟦T-427 · `D-282`⟧ מבטא הלומד מ-`palette.ts` — ⛔ ולא זהב הזירה.
    expect(chip()).toMatch(/var\(--brand-surface\)/);
    expect(chip()).toMatch(/var\(--brand\)/);
    expect(chip()).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });
});

/**
 * 🔥 **⟦20/09 · `C-0750` · `37 § 8` ק1 · `D-271`⟧ הרצף משלם ב**הכרה**.**
 *
 * ‏`D-271` מחק את «מכפיל 1.5» מק1 אחרי שנמדד ש**נזק ומילים הם אותו ציר, הפוך**:
 * `ceil(ENEMY_HP / hitDamage)` — החישוב של `wordsFromBoss` עצמו — הוא מספר המילים
 * שהלומד **פוגש**, ⇒ תגמול רצף ב**נזק** חותך את הלמידה לחצי **דווקא ללומד המדויק
 * ביותר**. ⇒ שני הפריטים שנשארו הם **הילה** ו**להב לוהט**.
 */
describe('C-0750 · `§ 8` ק1 — ההכרה על הרצף, ⛔ ולא נזק', () => {
  it('⛔ אפס נגיעה במכניקה — `cast` ⛔ אינו יודע מהו רצף', () => {
    const battle = readFileSync('lib/core/battle.ts', 'utf8');
    // ⛔ **גדר 1 של `§ 7`, ובשמה:** ארבעה מפתחות ל-`CharacterBattleStats`, ⇒ שדה
    //    רצף בטבלת ההטיה היה מוסיף חמישי ומפיל את הסריקה במקור.
    expect(withoutComments(battle)).not.toMatch(/stats\.streak/);
    // ⛔ ו«מכפיל 1.5» ⛔ אינו קיים עוד במפרט — `D-271` מחק אותו, ⛔ ולא דחה.
    const spec = readFileSync('plan/37-arena-spec.md', 'utf8');
    const row = (spec.match(/^\| ק1 \|.*$/m) ?? [''])[0];
    expect(row, 'שורת ק1 חייבת להיות בטבלה').toContain('ק1');
    expect(row, '«מכפיל 1.5» נמחק מהשורה עצמה').not.toContain('מכפיל 1.5');
  });

  it('⛔ ההילה היא `opacity`, ⛔ ולא `filter` — `COMPOSITOR_ONLY` ⛔ אינו מכיל אותו', () => {
    const halo = CSS.slice(CSS.indexOf('@keyframes arena-halo'));
    expect(CSS, 'הקיפריימים קיימים').toContain('@keyframes arena-halo');
    const frames = halo.slice(0, halo.indexOf('}\n['));
    expect(frames, '⛔ אך ורק `opacity` בקיפריימים').not.toMatch(/\b(filter|box-shadow|background|color)\s*:/);
    expect(frames).toMatch(/opacity:/);
    // ⛔ ו⛔ אין `filter` בקובץ הטוקנים כולו — השער היה נופל, וזו הסיבה שזה כתוב כאן.
    expect(CSS_CODE, '⛔ אין `filter` בזירה').not.toMatch(/(^|[;{\s])filter\s*:/);
  });

  /**
   * 🔴 **`globals.css` מאפס כל משך ל-`0.01ms`** ⇒ הכלל: FX שמשוחרר ב-`onAnimationEnd`
   * ⇒ `display: none` · לולאה **מקשטת** ⇒ `animation: none` · צומת שנושא **מידע**
   * ⇒ **קצה קפוא**. ההילה אומרת «אתה ברצף» ⇒ היא מידע, ⇒ היא חייבת להישאר **נראית**.
   * ⛔ `animation: none` לבדה הייתה משאירה אותה על `opacity: 0` של ברירת המחדל —
   * כלומר **מוחקת** דווקא ללומד שביקש פחות תנועה את המשוב שק1 קיימת בשבילו.
   */
  it('בתנועה מופחתת ההילה **נראית** — קצה קפוא, ⛔ ולא נמחקת', () => {
    const blocks = [...CSS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '');
    const halo = blocks.find((b) => b.includes('data-arena-halo'));
    expect(halo, 'להילה חייב להיות כלל בתנועה מופחתת').toBeTruthy();
    expect(halo as string, '⛔ ⛔ ולא נעלמת').not.toMatch(/display:\s*none/);
    expect(halo as string, 'האנימציה נכבית').toMatch(/animation:\s*none/);
    const frozen = (halo as string).match(/opacity:\s*(0?\.\d+|[1-9]\d*)/);
    expect(frozen, '⛔ `animation: none` לבדה משאירה אותה על `opacity: 0`').not.toBeNull();
    expect(Number((frozen as RegExpMatchArray)[1])).toBeGreaterThan(0);
  });

  it('הלהב הלוהט הוא הצבה על משתנה קיים, ⛔ ולא כלל צבע על `[data-arena-part]`', () => {
    // 🔬 `ArenaAvatar` מצייר את הנשק ב-`var(--arena-fig-blade, currentColor)` ⇒ הווריאבל
    //    הוא הווו שכבר קיים. ⛔ סלקטור חדש על `[data-arena-part]` היה נכנס לערוץ תפוס.
    expect(AVATAR).toContain('--arena-fig-blade');
    expect(CSS_CODE).toMatch(
      /\[data-arena-slot='hero'\]\[data-arena-hot='on'\]\s*\{[^}]*--arena-fig-blade:/,
    );
  });
});

/**
 * 🏟️ **⟦20/09 · `C-0751` · `T-441` · `37 § 11` א6 + א8⟧ המצלמה והזירה מגיבות.**
 *
 * 🔬 **מה כבר היה בנוי, נמדד ⛔ ולא שוער.** א6 נוקב ב**ארבעה**: «zoom · רעידה ·
 * האטה · הטיה». ‏`arena-crit-shake` הוא הרעידה וה-hit-stop הוא ההאטה ⇒ **שניים
 * כבר קיימים**, ומה שנבנה כאן הוא ה-zoom וההטיה.
 */
describe('C-0751 · `§ 11` א6 — המצלמה, ומספריה מהמפרט', () => {
  const SPEC = readFileSync('plan/37-arena-spec.md', 'utf8');
  /**
   * ⛔ **המספרים נקראים מה**מפרט**, ⛔ ואינם מוקלדים כאן** — אותו דפוס בדיוק
   * ש-`battle.test.ts` מפעיל על טבלת `§ 7`: מספר שזז במסמך **חייב** להפיל את
   * הבדיקה, אחרת המסמך והקוד יכולים לסטות בשקט וכבר ⛔ אין מקור אמת.
   */
  const A6 = (SPEC.match(/^\| א6 \|[^|]*\|([^|]*)\|/m) ?? ['', ''])[1] ?? '';

  it('שורת א6 קיימת במפרט — אחרת כל מה שמתחת מודד מחרוזת ריקה', () => {
    expect(A6.trim().length, '⛔ שורת א6 ⛔ לא נמצאה ב-`37 § 11`').toBeGreaterThan(10);
    expect(A6).toContain('zoom');
  });

  it('ה-zoom וההטיה הם **המספרים של א6**, ⛔ ולא ערכים שנבחרו', () => {
    const zoom = (A6.match(/zoom\s+(\d+(?:\.\d+)?)/) ?? [])[1];
    const tilt = (A6.match(/הטיה\s+(\d+(?:\.\d+)?)/) ?? [])[1];
    expect(zoom, 'א6 נוקב ב-zoom').toBeTruthy();
    expect(tilt, 'א6 נוקב בהטיה').toBeTruthy();
    expect(CSS_CODE).toContain(`--arena-camera-zoom: ${String(zoom)}`);
    expect(CSS_CODE).toContain(`--arena-camera-tilt: ${String(tilt)}deg`);
  });

  /**
   * 🔴 **הערוץ ⛔ אינו בחירה — הוא מה ש**פנוי**.** ‏`animation` על אזור הבמה תפוס
   * בידי `arena-crit-shake`, ו-`transform` תפוס בידי הקיפריים שלו. ⇒ `scale`
   * ו-`rotate`, והשלושה **מתחברים** (`translate` → `rotate` → `scale` → `transform`).
   */
  it('המצלמה על `scale` ו-`rotate`, ⛔ ולא על `transform` — הערוץ תפוס', () => {
    const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)];
    const camera = rules.filter(([, sel, body]) =>
      /\[data-arena-stage-area\]\[data-arena-impact='[ab]'\]/.test(sel ?? '')
      && /(^|[;\s])(scale|rotate):/.test(body ?? ''));
    expect(camera.length, 'למצלמה חייבים להיות כללים').toBeGreaterThan(0);
    for (const [, sel, body] of camera) {
      expect(body ?? '', `⛔ «${String(sel).trim()}» נוגע ב-transform, שתפוס בידי הרעד`)
        .not.toMatch(/(^|[;\s])transform:/);
    }
  });

  /**
   * 🔴 **`[data-arena-stage]` נושא `perspective: 720px`** ⇒ כל `transform` עליו יוצר
   * containing block חדש ו**שובר את מצלמת הקלפים**. ⇒ ⛔ אף כלל ⛔ אינו נוגע בו.
   */
  it('⛔ ⛔ אף `transform` על `[data-arena-stage]` — שם חיה הפרספקטיבה', () => {
    const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)];
    const onStage = rules.filter(([, sel]) => /\[data-arena-stage\](?!-)/.test(sel ?? ''));
    expect(onStage.length, 'חייב להיות כלל אחד לפחות על הבמה').toBeGreaterThan(0);
    const carries = onStage.some(([, , body]) => /(^|[;\s])(transform|scale|rotate|translate):/.test(body ?? ''));
    expect(carries, '⛔ ערוץ תנועה על הצומת שנושא `perspective`').toBe(false);
  });

  it('כניסה **מהירה** ויציאה **איטית** — משך סימטרי קורא כנשימה, ⛔ ולא כמכה', () => {
    const ms = (name: string): number => {
      const hit = CSS_CODE.match(new RegExp(`${name}:\\s*(\\d+)ms`));
      expect(hit, `${name} חייב להיות מוצהר`).not.toBeNull();
      return Number((hit as RegExpMatchArray)[1]);
    };
    expect(ms('--arena-camera-in-ms')).toBeLessThan(ms('--arena-camera-out-ms'));
    // ⛔ והכניסה קצרה מהקיפאון ⇒ הזום מגיע **לפני** שהקיפאון נגמר.
    expect(ms('--arena-camera-in-ms')).toBeLessThan(declared('--arena-hitstop-ms'));
  });

  it('ההטיה מתחלפת בסימן בין `a` ל-`b` — אחרת המסך נוטה תמיד לאותו צד', () => {
    expect(CSS_CODE).toMatch(/\[data-arena-impact='a'\]\s*\{[^}]*rotate:\s*var\(--arena-camera-tilt\)/);
    expect(CSS_CODE).toMatch(/\[data-arena-impact='b'\]\s*\{[^}]*rotate:\s*calc\(var\(--arena-camera-tilt\)\s*\*\s*-1\)/);
  });
});

/**
 * 🔥 **⟦20/09 · `C-0751` · `T-441` · `§ 11` א8⟧ «לפידים מתלקחים · הקהל קם».**
 *
 * 🔴 **ולמה זה ⛔ אינו סותר את «הסט **סטטי**»:** ההצהרה ב-`ArenaScene.tsx` אוסרת
 * **ריצוד** — «תקציב התנועה הולך למה שהלומד **עשה**, ⛔ ולא לרקע שמנצנץ בזמן שהוא
 * חושב». א8 היא **בדיוק** «מה שהלומד עשה»: הסט ⛔ אינו זז אף פעם מלבד ברגע הפגיעה.
 */
describe('C-0751 · `§ 11` א8 — הזירה מגיבה, ⛔ ואינה מרצדת', () => {
  const SCENE = readFileSync('components/ArenaScene.tsx', 'utf8');
  const SCENE_CODE = withoutComments(SCENE);

  it('הווים בסט, וה**כללים** ⛔ אינם — הרכיב מצייר ו⛔ אינו מנפיש', () => {
    expect(SCENE_CODE).toContain('data-arena-torch');
    expect(SCENE_CODE).toContain('data-arena-crowd');
    // ⛔ אותו גדר שראש `ArenaScene.tsx` מצהיר עליו, ושתפס אותי בטיק הזה.
    expect(SCENE_CODE, '⛔ ⛔ אין אנימציה ברכיב הסט').not.toMatch(/animation|@keyframes|transition/);
  });

  it('⛔ שתיהן דולקות **אך ורק** תחת פגיעה — ⛔ ולא `infinite`', () => {
    const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)];
    /* ⛔ **שני שמות לכל אפקט, ⛔ ולא אחד** — `a`⇄`b` הוא מנגנון האתחול: שתי פגיעות
       בתוך `--arena-hitstop-ms` מעבירות את התכונה `a` → `b` **בלי לעבור ב-`off`**,
       ושם זהה ⛔ אינו מפעיל אנימציה מחדש ⇒ הלפידים היו קופאים על הפגיעה הראשונה. */
    for (const name of [
      'arena-torch-flare-a', 'arena-torch-flare-b',
      'arena-crowd-rise-a', 'arena-crowd-rise-b',
    ]) {
      expect(CSS_CODE, `@keyframes ${name}`).toContain(`@keyframes ${name}`);
      const carriers = rules
        .filter(([, , body]) => new RegExp(`animation:\\s*${name}\\b`).test(body ?? ''))
        .map(([, sel, body]) => ({ sel: (sel ?? '').trim(), body: body ?? '' }));
      expect(carriers.length, `⛔ אף כלל ⛔ אינו מפעיל את ${name}`).toBeGreaterThan(0);
      for (const { sel, body } of carriers) {
        expect(sel, `⛔ «${sel}» מפעיל את ${name} בלי פגיעה ⇒ ריצוד רקע`)
          .toMatch(/\[data-arena-impact='[ab]'\]/);
        expect(body, `⛔ ${name} חוזר לנצח — זה בדיוק מה ש-T-041 אוסר`)
          .not.toMatch(/\binfinite\b/);
      }
    }
  });

  /**
   * 💨 **«אבק מנקודת הפגיעה» — ושתי הנקודות ⛔ אינן אותה נקודה.**
   * `data-arena-impact` הוא «הלומד **פגע**» ⇒ אבק מרגלי ה**יריב**;
   * `data-arena-hurt` הוא «הלומד **נפגע**» ⇒ מרגלי ה**גיבור**.
   * ⛔ אבק במקום הלא-נכון אומר בדיוק את ההפך ממה שקרה — וזו הטענה שנמדדת כאן.
   */
  it('האבק עולה מהחריץ **הנכון** לכל אחד משני המקורות', () => {
    const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)]
      .filter(([, , body]) => /animation:\s*arena-dust-[ab]\b/.test(body ?? ''))
      .map(([, sel]) => (sel ?? '').trim());
    expect(rules.length, '⛔ אף כלל ⛔ אינו מפעיל אבק').toBeGreaterThan(0);
    for (const sel of rules) {
      const onHit = sel.includes("[data-arena-impact=");
      const onHurt = sel.includes("[data-arena-hurt=");
      expect(onHit !== onHurt, `⛔ «${sel}» ⛔ אינו תלוי בדיוק באחד משני המקורות`).toBe(true);
      expect(sel, onHit ? 'פגיעה ⇒ אבק אצל היריב' : 'רתיעה ⇒ אבק אצל הגיבור')
        .toContain(onHit ? "[data-arena-slot='enemy']" : "[data-arena-slot='hero']");
    }
    // ⛔ ושני הצמתים קיימים בבמה, אחרת הכללים ⛔ אינם חלים על דבר.
    const stage = readFileSync('components/ArenaStage.tsx', 'utf8');
    expect((withoutComments(stage).match(/data-arena-dust/g) ?? []).length).toBe(2);
  });

  it('⛔ `scale` על צומת SVG דורש `transform-box: fill-box`, אחרת ההילה **נעה**', () => {
    expect(CSS_CODE).toMatch(/\[data-arena-torch\]\s*\{[^}]*transform-box:\s*fill-box/);
  });

  /**
   * ⛔ **ו⛔ זה ⛔ אינו אותו כלל כמו ההילה של ק1:** ההילה נושאת **מידע** ⇒ קצה קפוא.
   * אלה ⛔ אינם נושאים דבר — הפגיעה נאמרת בפס החיים, במספר ובצללית — ⇒ **קישוט**,
   * וקישוט נכבה. ⛔ ו-`globals.css` שמאפס משכים היה הופך זום של 4.5% ל**קפיצה**.
   */
  it('⛔ שם אחד לשני הערכים ⛔ אינו מאתחל — הווים נבדלים ב-`a`/`b`', () => {
    for (const [attr, name] of [['a', 'arena-torch-flare-a'], ['b', 'arena-torch-flare-b'],
      ['a', 'arena-crowd-rise-a'], ['b', 'arena-crowd-rise-b']] as const) {
      const rules = [...CSS_CODE.matchAll(/([^{}]+)\{([^}]*)\}/g)]
        .filter(([, , body]) => new RegExp(`animation:\\s*${name}\\b`).test(body ?? ''));
      expect(rules.length, `⛔ אף כלל ⛔ אינו מפעיל את ${name}`).toBe(1);
      expect((rules[0]?.[1] ?? '').trim(), `${name} חייב לשבת על '${attr}' בלבד`)
        .toContain(`[data-arena-impact='${attr}']`);
    }
  });

  it('בתנועה מופחתת — המצלמה והזירה **כבויות**, ⛔ ולא מהירות', () => {
    const blocks = [...CSS.matchAll(/@media \(prefers-reduced-motion: reduce\)\s*\{([\s\S]*?)\n\}/g)]
      .map((m) => m[1] ?? '');
    const camera = blocks.find((b) => b.includes('data-arena-camera') || /scale:\s*1;/.test(b));
    expect(camera, 'למצלמה חייב להיות כלל בתנועה מופחתת').toBeTruthy();
    expect(camera as string).toMatch(/scale:\s*1\s*;/);
    expect(camera as string).toMatch(/rotate:\s*0deg/);
    const set = blocks.find((b) => b.includes('data-arena-torch'));
    expect(set, 'לסט חייב להיות כלל בתנועה מופחתת').toBeTruthy();
    expect(set as string).toMatch(/animation:\s*none/);
    expect(set as string).toContain('data-arena-crowd');
  });
});

/** 🫁 `T-452` · `37 § 8` ק5 — הרצועה נושאת את המצב, במילים ובתכונה, ⛔ ולא בצבע בלבד. */
describe('T-452 · נשימה אחרונה על רצועת המאנה', () => {
  const SRC_452 = readFileSync('components/ArenaBattle.tsx', 'utf8');
  it('המפלס נגזר מ-`manaOf` (רגע החצייה שבמצב), ⛔ ולא מ-`manaAt` בלי החיים', () => {
    expect(SRC_452).toContain('manaOf(currentBattle, next)');
    expect(SRC_452).toContain('manaOf(battle, elapsedRef.current)');
    expect(SRC_452).not.toMatch(/manaAt\(/);
  });
  it('תכונה נראית + תווית עברית, ⛔ ו⛔ לא `--arena-damage` (שמור ליריב)', () => {
    expect(SRC_452).toContain('data-arena-last-breath');
    expect(SRC_452).toContain("'נשימה אחרונה · מאנה כפולה'");
    const label = SRC_452.slice(SRC_452.indexOf('data-arena-last-breath'), SRC_452.indexOf('data-arena-last-breath') + 900);
    expect(label).not.toContain('--arena-damage');
  });
});

describe('⟦T-427 · `D-282`⟧ every arena root wears the dark surface', () => {
  // 🔬 Without `data-surface='dark'` the root inherits `:root`'s LIGHT tokens on a stage
  // that is dark in both schemes: --danger 2.31:1 · --brand-surface 2.23:1 (F-319).
  const ROOTS = ['ArenaBattle', 'ArenaHome', 'ArenaSummary', 'ArenaResult', 'ArenaCharacterChoice'];
  it.each(ROOTS)('%s — one `data-surface="dark"` per `data-arena-scope` root', (name) => {
    const src = readFileSync(`components/${name}.tsx`, 'utf8');
    const roots = src.match(/^\s*(<section )?data-arena-scope\b(?!`)/gm) ?? [];
    expect(roots.length).toBeGreaterThan(0);
    expect(src.match(/data-surface="dark"/g)?.length).toBe(roots.length);
  });
  it('⛔ the six retired accent tokens are gone from components/', () => {
    for (const name of ROOTS.concat(['SpellCard', 'ArenaScene', 'ArenaStage', 'ArenaAvatar'])) {
      const src = readFileSync(`components/${name}.tsx`, 'utf8');
      expect(src, name).not.toMatch(/--arena-(gold|gold-light|cast|cast-edge|cast-warn|dodge)\b(?!-)/);
    }
  });
});
