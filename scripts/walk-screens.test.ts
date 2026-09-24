import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import {
  isAbortedRequestLine,
  requestFailureLine,
  splitAborted,
} from './lib/walk-errors.mjs';
import { DEFAULT_ROUTES, walkRoutes } from './lib/walk-routes.mjs';
import { EXPECTED_CONSOLE, splitExpected } from './lib/walk-expected.mjs';

/**
 * 🧹 **`T-305` — ביטול פריפֶּץ' של Next ⛔ אינו «פגם נראה».**  ⟦NEW 13/09 · `D-219` · סוגרת את `F-230`⟧
 *
 * 🔬 **נמדד חי, ⛔ ולא שוער:** הליכה על שלושת מסכי אמירנט החזירה «⛔ 5 פגמים נראים»,
 * וכל חמש השורות ב-`allErrors` היו `REQFAIL net::ERR_ABORTED ⇐ …&_rsc=…` — אותם
 * נתיבים בדיוק ענו **200** ב-`curl` באותה הרצה. ⇒ ⛔ אפס שגיאות אמיתיות.
 *
 * 🔴 **והסינון הוא על `errorText` ⛔ בלבד, ⛔ ולא על הכתובת** — `verify-mobile.mjs:936`
 * כבר מנמק שם למה: סינון לפי כתובת משתיק גם כשל **אמיתי** באותו נתיב. הבדיקה
 * האחרונה כאן היא בדיוק התרחיש הזה.
 */
describe('🧹 T-305 — REQFAIL net::ERR_ABORTED הוא מידע, ⛔ ולא פגם', () => {
  const RSC = 'http://127.0.0.1:3000/world/amirnet/practice?level=b1&_rsc=1a2b3';

  it('⛔ ביטול פריפץ׳ ⛔ אינו נספר כשגיאה', () => {
    expect(isAbortedRequestLine(requestFailureLine('net::ERR_ABORTED', RSC))).toBe(true);
  });

  it('🔴 כשל רשת אמיתי **כן** נספר', () => {
    expect(isAbortedRequestLine(requestFailureLine('net::ERR_CONNECTION_REFUSED', RSC))).toBe(false);
  });

  it('⛔ שתי שורות סינתטיות ⇒ רק השנייה נספרת, והראשונה ⛔ אינה נעלמת', () => {
    const lines = [
      requestFailureLine('net::ERR_ABORTED', RSC),
      requestFailureLine('net::ERR_NAME_NOT_RESOLVED', 'http://127.0.0.1:3000/api/world/story'),
    ];
    const { errors, aborted } = splitAborted(lines);
    expect(errors).toHaveLength(1);
    expect(errors[0]).toContain('net::ERR_NAME_NOT_RESOLVED');
    expect(aborted).toHaveLength(1);
  });

  it('🔴 שגיאת קונסול ופאג׳ארור ⛔ אינן נוגעות לסינון הזה כלל', () => {
    const { errors, aborted } = splitAborted([
      'PAGEERROR: TypeError: x is not a function',
      'HTTP 503 ⇐ http://127.0.0.1:3000/api/world/story',
    ]);
    expect(errors).toHaveLength(2);
    expect(aborted).toHaveLength(0);
  });

  /**
   * 🔴 **הגדר שהופך את זה לתיקון ⛔ ולא להשתקה** — אותו נתיב `_rsc` בדיוק, עם
   * `errorText` אמיתי. סינון לפי כתובת היה בולע אותו; סינון לפי `errorText` ⛔ לא.
   */
  it('🔴 אותו נתיב `_rsc` עם כשל אמיתי ⇒ **נספר** — הסינון הוא על errorText, ⛔ לא על הכתובת', () => {
    const { errors, aborted } = splitAborted([requestFailureLine('net::ERR_FAILED', RSC)]);
    expect(errors).toHaveLength(1);
    expect(aborted).toHaveLength(0);
  });
});

/**
 * ⛔ ההצהרה `walk-errors.d.mts` נכתבת ביד ⇒ היא יכולה לסטות מהמודול. הבלוק למעלה
 * תופס **התנהגות** שהשתנתה; זה תופס **צורה** שהשתנתה — אותו זיווג ש-`next-cycle-id.test.ts`
 * משתמש בו.
 */
describe('the hand-written declaration file', () => {
  // ⟦הורחב C-0630 · `T-371`⟧ שתי הצהרות ידניות עכשיו, ⛔ ולא אחת ⇒ הבדיקה עוברת על
  // שתיהן. הצהרה שנייה שהבדיקה ⛔ אינה מכסה היא בדיוק הסטייה שהבלוק הזה קיים נגדה.
  it.each([
    ['./lib/walk-errors.mjs', 'scripts/lib/walk-errors.d.mts'],
    ['./lib/walk-routes.mjs', 'scripts/lib/walk-routes.d.mts'],
  ])('%s declares exactly the names the module exports', async (spec, decl) => {
    const mod = await import(spec);
    const declared = [
      ...readFileSync(decl, 'utf8').matchAll(
        /export declare (?:const|function)\s+([A-Za-z_$][\w$]*)/g,
      ),
    ].map((m) => m[1]);
    expect([...declared].sort()).toEqual(Object.keys(mod).sort());
  });
});

/**
 * 🔭 **`T-371` — השער שמעולם ⛔ לא ראה את `amirnet`.**  ⟦NEW 15/09 · `C-0630`⟧
 *
 * 🔬 **נמדד לפני השינוי, ⛔ ולא שוער:** `grep -c amirnet` על רשימת המסלולים המוצהרת
 * של ההליכה ⇒ **0**, בעוד ששת מסכי `/dev/amirnet/*` מחזירים 200 ו-`/dev/amirnet`
 * עצמו החזיר 404. ⇒ ההליכה של `STEP 6.5` — הכלי **היחיד** שמצלם מסך — ⛔ מעולם
 * ⛔ לא צילמה ולו מסך אמירנט אחד, וב-`T-370` בדיוק עכשיו נפתחו ששת המסכים האלה
 * ללומד דרך הטבעת.
 *
 * ⛔ **הבדיקות האלה מודדות את הרשימה, ⛔ ולא מריצות הליכה** — בדיוק בשביל זה
 * `DEFAULT_ROUTES` יצא ל-`lib/walk-routes.mjs`: כל עוד הוא ישב בתוך סקריפט עם
 * `await` ברמה העליונה שמפעיל דפדפן, ⛔ אי אפשר היה לייבא אותו בלי להריץ את הכול.
 */
describe('🔭 T-371 — רשימת ההליכה רואה את amirnet', () => {
  it('שלושת מסכי amirnet שהלומד נוחת עליהם נמצאים ברשימה המוצהרת', () => {
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/dashboard');
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/practice');
    expect(DEFAULT_ROUTES).toContain('/dev/amirnet/simulation');
  });

  it('⛔ ולא ששת המסכים — שלושת מצבי הביניים ⛔ אינם ברשימה, וזו הצהרה', () => {
    // ⛔ «כל `page.tsx` במאגר» היה הופך את הרשימה לגלוב, וזה בדיוק מה שהקבוע ⛔ אינו.
    for (const midFlow of [
      '/dev/amirnet/question',
      '/dev/amirnet/levels',
      '/dev/amirnet/result',
    ]) {
      expect(DEFAULT_ROUTES).not.toContain(midFlow);
    }
  });

  it('🔴 המספר שהשורה מודדת: 21 מסכים, ⛔ ולא 10', () => {
    // ⟦עודכן C-0646 · `T-380`⟧ 13 ⇢ 14 עם `/dev/story/live`.
    // ⟦עודכן `T-395`⟧ 14 ⇢ 16 עם `/dev/deck` ו-`/dev/deck/done`. ⛔ המספר ⛔ אינו «נתון
    // שמתעדכן» — הוא ננעל כדי שהוספה תהיה **החלטה**, ולכן כל שינוי שלו נושא שורה.
    // ⟦עודכן C-0670 · `T-396`⟧ 16 ⇢ 19 עם `/dev/arcade` · `result` · `character`.
    // ⟦עודכן C-0789 · `T-415`⟧ 19 ⇢ 21 עם `/dev/deck/level-done` · `/dev/deck/returns`.
    expect(DEFAULT_ROUTES).toHaveLength(21);
    expect(DEFAULT_ROUTES.filter((r: string) => r.includes('amirnet'))).toHaveLength(3);
  });

  /**
   * 🔭 **`T-396` — מסך הקרב, המסך המרכזי של `arena`, ⛔ לא היה ברשימה.**
   *
   * 🔬 **נמדד `C-0664` בהליכה חיה (`next start`, 375×780), ⛔ ולא שוער:** הרשימה
   * המוצהרת החזיקה **16** כתובות ומהן **2 בלבד** של הזירה (`home` · `summary`),
   * בעוד `/dev/arcade` · `/dev/arcade/result` · `/dev/arcade/character` שלושתם
   * מחזירים **200**. ⇒ שלוש שורות הזירה הפתוחות נכתבות על מסך שההליכה — הכלי
   * **היחיד** שמצלם מסך — ⛔ מעולם ⛔ לא ראתה. ⛔ התקדים הוא `T-395` מילה במילה.
   */
  it('🔑 `T-396` — חמשת מסכי הזירה שהלומד נוחת עליהם ברשימה המוצהרת', () => {
    for (const arena of [
      '/dev/arcade',
      '/dev/arcade/home',
      '/dev/arcade/result',
      '/dev/arcade/character',
      '/dev/arcade/summary',
    ]) {
      expect(DEFAULT_ROUTES).toContain(arena);
    }
    expect(DEFAULT_ROUTES.filter((r: string) => r.startsWith('/dev/arcade'))).toHaveLength(5);
  });

  /**
   * 🔭 **`T-395` — מסך הכרטיס, המסך המרכזי של `cards`, ⛔ לא היה ברשימה.**
   *
   * 🔬 **נמדד `C-0659` לפני השינוי, ⛔ ולא שוער:** `grep -c '/dev/deck'` על הרשימה
   * המוצהרת ⇒ **0**, בעוד `/dev/deck` ו-`/dev/deck/done` שניהם מחזירים 200. ⇒ שלוש
   * עבודות `cards` רצופות (`T-325` · `F-269` · `T-392`) נמדדו על מסך שההליכה ⛔ מעולם
   * ⛔ לא צילמה. ⛔ התקדים הוא `T-371` מילה במילה.
   */
  it('🔑 `T-395` · `T-415` — ארבעת מסכי החפיסה שהלומד נוחת עליהם ברשימה המוצהרת', () => {
    expect(DEFAULT_ROUTES).toContain('/dev/deck');
    expect(DEFAULT_ROUTES).toContain('/dev/deck/done');
    // `T-415` · `F-282` — סוף הרמה, והחפיסה שנפתחה ממודול. ⛔ `/dev/deck/skeleton` נשאר בחוץ.
    expect(DEFAULT_ROUTES).toContain('/dev/deck/level-done');
    expect(DEFAULT_ROUTES).toContain('/dev/deck/returns');
    expect(DEFAULT_ROUTES.filter((r: string) => r.startsWith('/dev/deck'))).toHaveLength(4);
  });

  it('⛔ ולא חמישה — שלושת מצבי-הביניים של הכרטיס ⛔ אינם ברשימה, וזו הצהרה', () => {
    // אותו שיקול בדיוק שהשאיר את `/dev/card/choice` לבדו ואת `question`/`levels`/`result`
    // של `amirnet` בחוץ: הלומד **עובר דרכם** ו⛔ אינו נוחת עליהם.
    for (const midFlow of ['/dev/card/typed', '/dev/card/swap', '/dev/deck/skeleton']) {
      expect(DEFAULT_ROUTES).not.toContain(midFlow);
    }
  });

  it('🔑 `T-380` — ההליכה רואה את שרשרת הסיפור האמיתית, ⛔ ולא רק את הפיקסטורה', () => {
    // ⛔ **שניהם, ⛔ ולא אחד:** הפיקסטורה מודדת פריסה מול הרנדר ו⛔ אינה תלויה בסביבה;
    // החי מודד שרשרת. מי שמחליף אותם מאבד את הראשון ביום שאין env.
    expect(DEFAULT_ROUTES).toContain('/dev/story');
    expect(DEFAULT_ROUTES).toContain('/dev/story/live');
    expect(DEFAULT_ROUTES.indexOf('/dev/story/live')).toBe(
      DEFAULT_ROUTES.indexOf('/dev/story') + 1,
    );
  });

  it('⛔ ⛔ אין מסלול כפול, ו⛔ אין מסלול בלי / מוביל', () => {
    expect(new Set(DEFAULT_ROUTES).size).toBe(DEFAULT_ROUTES.length);
    for (const route of DEFAULT_ROUTES) expect(route.startsWith('/')).toBe(true);
  });

  it('⛔ `--routes=` ריק פירושו «⛔ לא נמסר דגל», ⛔ ולא «אפס מסכים»', () => {
    expect(walkRoutes('')).toBe(DEFAULT_ROUTES);
    expect(walkRoutes(undefined)).toBe(DEFAULT_ROUTES);
    expect(walkRoutes('   ')).toBe(DEFAULT_ROUTES);
  });

  it('🔴 `--routes=` מלא **כן** גובר — אחרת הדגל היה קוד מת ביום שנולד', () => {
    expect(walkRoutes('/a, /b ,')).toEqual(['/a', '/b']);
  });
});

describe('📜 T-380 — שגיאת קונסול שהיא החוזה, ⛔ ולא פגם', () => {
  const LIVE = '/dev/story/live';
  const HTTP_503 = 'HTTP 503 ⇐ http://127.0.0.1:3000/api/world/story';
  const BROWSER_503 =
    'Failed to load resource: the server responded with a status of 503 (Service Unavailable)';

  it('שתי שורות ה-503 של `/dev/story/live` מוצהרות ⇒ ⛔ אינן נספרות כפגם', () => {
    const split = splitExpected(LIVE, [HTTP_503, BROWSER_503]);
    expect(split.errors).toHaveLength(0);
    expect(split.expected).toHaveLength(2);
  });

  it('⛔ מפריד, ⛔ ולא מוחק — «⛔ אין שגיאות» ו«שתיים מוצהרות» ⛔ אינם אותו דבר', () => {
    expect(splitExpected(LIVE, []).expected).toHaveLength(0);
  });

  it('🔴 צר בסטטוס: 401 על אותו נתיב ⛔ אינו מוחרג', () => {
    const line = 'HTTP 401 ⇐ http://127.0.0.1:3000/api/world/story';
    expect(splitExpected(LIVE, [line]).errors).toEqual([line]);
  });

  it('🔴 צר בנתיב: 503 על נתיב אחר ⛔ אינו מוחרג', () => {
    const line = 'HTTP 503 ⇐ http://127.0.0.1:3000/api/study/queue';
    expect(splitExpected(LIVE, [line]).errors).toEqual([line]);
  });

  it('🔴 צר במסלול: אותה שורה בדיוק על `/dev/story` ⛔ אינה מוחרגת', () => {
    expect(splitExpected('/dev/story', [HTTP_503]).errors).toEqual([HTTP_503]);
  });

  it('⛔ ⛔ אין החרגה גורפת — מסלול בלי רשומה מחזיר את הכל', () => {
    expect(EXPECTED_CONSOLE['/dev/story']).toBeUndefined();
    expect(splitExpected('/', [BROWSER_503]).errors).toEqual([BROWSER_503]);
  });
});
