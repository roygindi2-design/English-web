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
