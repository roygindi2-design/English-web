import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { anchorsOf, citationsIn, duplicateAnchors, resolves } from './check-rules-citations.mjs';

/**
 * 🔢 **‏C-0376 — שני דברים ששוב ושוב התיישנו בשקט, וכאן הם מפסיקים.**
 *
 * ⓐ **ציטוטי `RULES § x.y`.** ‏C-0375 סירבה במפורש למספר מחדש באותו קומיט של הקיצוץ,
 *    בנימוק «קיצוץ ומספור מחדש באותו קומיט שוברים ציטוט **בשקט**». ⇒ המספור נעשה כאן,
 *    ו-`scripts/check-rules-citations.mjs` הוא מה שהופך «⛔ אף ציטוט לא נשבר» **ממשפט
 *    למדידה**. הבדיקות למטה מוודאות ש**הכלי עצמו ⛔ אינו חלול**.
 *
 * ⓑ **מספר הפקודות ב-`npm run verify`.** השורה הזאת התיישנה **פעמיים** — «ארבע»⇢«חמש»
 *    ב-23/08, «חמש»⇢«שש» ב-31/08 — ובשני המקרים הסכנה זהה: סוכן שקורא «חמש», מריץ
 *    חמש ומכריז ירוק **מדלג בדיוק על הפקודה האחרונה**. ⇒ המספר ⛔ מפסיק להיכתב ביד:
 *    הוא נגזר מ-`package.json` ומושווה לטקסט.
 */
const read = (p: string): string => readFileSync(p, 'utf8');

describe('scripts/check-rules-citations.mjs — «⛔ אף ציטוט לא נשבר» הוא מדידה', () => {
  it('קורא את העוגנים של `plan/RULES.md`, כולל תת-הסעיפים באותיות', () => {
    const a = anchorsOf(read('plan/RULES.md'));
    expect(a.has('0.0'), 'מפת המספור').toBe(true);
    expect(a.has('0.1'), 'הסעיף הראשון').toBe(true);
    expect(a.has('0.6א'), 'תת-סעיף ממוספר').toBe(true);
    expect(a.has('0.23ט'), 'תת-סעיף באות תחת הורה ממוספר').toBe(true);
    // ⛔ והמספרים הישנים ⛔ אינם עוגנים יותר — אחרת הבדיקה הייתה עוברת גם בלי המיפוי.
    expect(a.has('0.14ב'), '⛔ מספר לשעבר ⛔ אינו עוגן').toBe(false);
    expect(a.has('0.1.1'), '⛔ מספר לשעבר ⛔ אינו עוגן').toBe(false);
  });

  it('רואה גם תת-סעיף שנכתב כשורה מודגשת, ⛔ ולא רק ככותרת ####', () => {
    const a = anchorsOf(read('plan/RULES.md'));
    // ‏`§ 0.29` כותב את ששת סעיפיו כ-`**א׳ · …**`, ⛔ ולא ככותרות. עד 09/09 הפרסר
    // ⛔ לא ראה אותם ⇒ 11 ציטוטים חיים ל-`§ 0.29ב`·`ג`·`ו` נשענו **אך ורק** על
    // נפילה-להורה, וזו בדיוק הנפילה שהחביאה אות שגויה.
    expect(a.has('0.29ו'), 'סעיף מודגש תחת הורה ממוספר').toBe(true);
    expect(a.has('0.29ב'), 'סעיף מודגש תחת הורה ממוספר').toBe(true);
  });

  it('🔴 אות שאינה קיימת ⛔ אינה נפתרת דרך ההורה — הכשל שנמדד 09/09', () => {
    const a = anchorsOf(read('plan/RULES.md'));
    // ‏`§ 0.17` הוא «תקרת המשימות של ה-PM», ו⛔ אין לו ולו תת-סעיף אחד באות.
    expect(a.has('0.17'), 'ההורה קיים').toBe(true);
    expect(a.has('0.17ח'), '⛔ והאות ⛔ אינה').toBe(false);
    // ⇒ שישה ציטוטים חיים ל-«ח׳» ההיא הצביעו על הסעיף הלא נכון, והשער דיווח 0 שבורים.
    expect(resolves(a, { ref: '0.17ח', bare: '0.17', line: 1 }), '⛔ ההורה ⛔ אינו תחליף').toBe(
      false,
    );
    expect(resolves(a, { ref: '0.23ח', bare: '0.23', line: 1 }), 'הסעיף האמיתי').toBe(true);
  });

  it('🔴 ⛔ אף מספר סעיף ⛔ אינו מוכרז פעמיים ב-`plan/RULES.md`', () => {
    // ⛔ `anchorsOf` מחזיר **קבוצה**, ⇒ כותרת כפולה ⛔ אינה נראית לו בכלל והשער
    // מדווח `0 שבורים` בזמן שכל קורא של המספר ההוא נוחת על אחד משני סעיפים.
    // נמדד 09/09: `0.6ד` הוכרז פעמיים ו-`0.1ח` הוכרז פעמיים.
    expect(duplicateAnchors(read('plan/RULES.md'))).toEqual([]);
  });

  it('הגלאי עצמו ⛔ אינו חלול — הוא מוצא כפילות שהוזרקה', () => {
    const injected = ['### 0.6 · א', '#### 0.6ד · ראשון', '#### 0.6ד · שני', '### 0.7 · ב'].join(
      '\n',
    );
    expect(duplicateAnchors(injected)).toEqual(['0.6ד']);
  });

  it('⛔ ⛔ אינו סופר את סמן ⟨לשעבר⟩ ו⛔ לא את § 0.1 של `00-control`', () => {
    expect(citationsIn('### 0.18 · בריאות הלופ  ⟨לשעבר § 0.14ב⟩')).toEqual([]);
    expect(citationsIn('שורה ב-`plan/00-control.md § 0.1` שאומרת למה')).toEqual([]);
    // ⛔ אבל ציטוט אמיתי כן נספר — אחרת הסינון היה בולע הכול והבדיקה הייתה חלולה.
    expect(citationsIn('לפי `RULES § 0.23ז` בלבד')).toEqual([
      { ref: '0.23ז', bare: '0.23', line: 1 },
    ]);
  });

  it('🔬 ⛔ ⛔ אינו חלול — ציטוט לסעיף שאינו קיים ⛔ אינו עובר', () => {
    const anchors = anchorsOf(read('plan/RULES.md'));
    // ⛔ הציטוט המזויף נבנה מחלקים במכוון: כתוב שלם, `npm run check:rules` היה נופל
    // **על קובץ הבדיקה הזה עצמו** — והשער סורק את כל הריפו החי, כולל אותו.
    const fake = `RULES § 0.${'9'}9`;
    const [c] = citationsIn(`ראה \`${fake}\``);
    expect(c?.ref).toBe('0.99');
    // ⛔ **וגם הודעת הכישלון ⛔ אינה מכילה אותו כטקסט שלם.** הגרסה הראשונה בנתה
    // את `fake` מחלקים אבל הותירה את הציטוט המזויף, שלם, במחרוזת ההודעה כאן —
    // ו-`check:rules` נפל על **קובץ הבדיקה של השער עצמו**:
    // 313 ציטוטים תקינים ואחד «שבור» שהוא בעצם הפיקסטורה. נמדד 01/09/2026.
    expect(anchors.has(c?.ref ?? ''), `⛔ ${fake} ⛔ אינו קיים ⇒ חייב ליפול`).toBe(false);
  });
});

describe('🔢 מספר הפקודות ב-`npm run verify` נגזר, ⛔ ולא נכתב ביד', () => {
  const verify = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts
    .verify as string;
  const commands = verify.split('&&').map((c) => c.trim().replace(/^npm (run )?/, ''));
  const WORDS: Record<number, string> = { 5: 'five', 6: 'six', 7: 'seven', 8: 'eight', 9: 'nine' };
  const HEB: Record<number, string> = { 5: 'חמש', 6: 'שש', 7: 'שבע', 8: 'שמונה', 9: 'תשע' };

  it('כל פקודה ב-`verify` היא סקריפט אמיתי ב-`package.json`', () => {
    const scripts = (JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts;
    for (const c of commands) expect(Object.keys(scripts), c).toContain(c);
    expect(commands).toContain('check:rules');
  });

  it('🔴 `plan/RULES.md` נוקב במספר הנכון — ובשמות הפקודות בפועל', () => {
    const rules = read('plan/RULES.md');
    const word = HEB[commands.length];
    expect(word, `⛔ אין מילה עברית ל-${commands.length}`).toBeDefined();
    expect(rules, `RULES: «${word} פקודות»`).toContain(`${word} פקודות`);
    // ⛔ ⛔ ולא רק המספר: הרשימה עצמה. מספר נכון עם רשימה ישנה הוא בדיוק אותו שקר.
    for (const c of commands) expect(rules, `RULES: הפקודה ${c}`).toContain(c);
  });

  /**
   * ⚡ **⟦NEW 09/09 · שלב 4⟧ שני שערים, ⛔ ושניהם נגזרים מ-`package.json`.**
   * ‏`verify:fast` הוא **תת-קבוצה ממש** של `verify` — שבע פקודות מתוך תשע, בלי
   * `build` ובלי Playwright — ⇒ הוא תופס טעות הקלדה, ציטוט שבור וטסט אדום ב-**40
   * שניות** במקום בזמן הדחיפה. 🔴 **ו⛔ הוא ⛔ אינו תחליף:** הוא ⛔ אינו רואה בנייה
   * שבורה ו⛔ אינו רואה מסך שבור, ⇒ הדחיפה ממשיכה להריץ את כל התשע. הכרעה 100
   * ⛔ אינה זזה — ההוק הוא מה שהופך את השער המלא למכני, ו⛔ שום דבר כאן ⛔ אינו נוגע בו.
   */
  const fast = ((JSON.parse(read('package.json')) as { scripts: Record<string, string> }).scripts[
    'verify:fast'
  ] ?? '')
    .split('&&')
    .map((c) => c.trim().replace(/^npm (run )?/, ''))
    .filter(Boolean);

  it('⚡ `verify:fast` הוא תת-קבוצה ממש של `verify`, ⛔ ולא רשימה שנייה', () => {
    expect(fast.length, 'הוא קיים ואינו ריק').toBeGreaterThan(0);
    expect(fast.length, '⛔ והוא קצר מהמלא — אחרת ⛔ אין לו טעם').toBeLessThan(commands.length);
    for (const c of fast) expect(commands, `${c} ⛔ אינו ב-verify המלא`).toContain(c);
    // ⛔ **שתי הפקודות שהוא קיים כדי ⛔ לא להריץ** — ⛔ ולא «בערך»: אם אחת מהן תזחל
    // פנימה, «מהיר» יהפוך ל-3–5 דקות ואיש ⛔ לא יבחין.
    expect(fast, '⛔ ⛔ בלי build').not.toContain('build');
    expect(fast, '⛔ ⛔ בלי Playwright').not.toContain('check:mobile');
    // ⛔ **וההפרש הוא בדיוק השתיים** — ⇒ פקודה חדשה ב-verify ⛔ לא תיפול בשקט בין השניים.
    expect(commands.filter((c) => !fast.includes(c)).sort()).toEqual(['build', 'check:mobile']);
  });

  it('⚡ וחמשת הפרומפטים נוקבים בשני השערים ובמספריהם', () => {
    const words: Record<number, string> = { 6: 'SIX', 7: 'SEVEN', 8: 'EIGHT', 9: 'NINE' };
    for (const a of ['DEV', 'PM', 'QA', 'CONTENT', 'PROMOTER']) {
      const body = read(`docs/agents/${a}.md`);
      expect(body, `${a}: השער המהיר`).toContain('npm run verify:fast');
      expect(body, `${a}: מספר הפקודות המהיר`).toContain(`${words[fast.length]} commands`);
      expect(body, `${a}: מספר הפקודות המלא`).toContain(`${words[commands.length]} commands`);
      // 🔴 הטענה שמונעת את הקריאה השגויה «מהיר ⇒ אפשר לדווח ירוק».
      expect(body, `${a}: ⛔ אינו תחליף`).toMatch(/⛔ NOT a substitute/);
    }
  });

  it('🔴 ‏`QA.md` ו-`CONTENT.md` נוקבים באותו מספר — הם השער והכותב', () => {
    const word = WORDS[commands.length];
    for (const a of ['QA', 'CONTENT']) {
      expect(read(`docs/agents/${a}.md`), `${a}: «${word} commands»`).toContain(
        `${word} commands`,
      );
    }
  });
});

/**
 * ⛔ **הצהרת הטיפוסים ⛔ אינה רשאית להיפרד מהמודול.** אותו דפוס בדיוק כמו
 * `scripts/motion-gate.test.ts`: `allowJs: false`, ולכן `check-rules-citations.d.mts`
 * נכתב ביד — והסכנה היא **סחיפה**: הצהרה שחדלה להתאים מטייפצ׳קת **שקר**.
 */
describe('scripts/check-rules-citations.d.mts — ההצהרה ⛔ אינה נפרדת מהמודול', () => {
  it('כל שם שההצהרה מייצאת קיים במודול, ולהפך', () => {
    const declared = [...read('scripts/check-rules-citations.d.mts').matchAll(/export (?:declare )?(?:function|const) (\w+)/g)]
      .map((m) => m[1])
      .sort();
    const actual = [...read('scripts/check-rules-citations.mjs').matchAll(/^export function (\w+)/gm)]
      .map((m) => m[1])
      .sort();
    expect(declared).toEqual(actual);
  });
});

/**
 * 🔢 **שני מספרים חיים נוספים, ⛔ ושניהם התיישנו בשקט בדיוק כמו «חמש פקודות».**
 * ⟦NEW 09/09 · שלב 2 של סבב התשתית⟧
 *
 * ⓐ **ספירת בדיקות `loop:health`.** ‏`docs/agents/QA.md` הורה לדווח `loop health: N/14`
 *    בכל טיק — בזמן ש-`scripts/loop-health.mjs` מחזיק **19**. ⇒ QA שדיווח «14/14»
 *    דיווח ציון מלא על חמש בדיקות ש⛔ לא ידע שקיימות. אותה מחלקה בדיוק כמו הסוכן
 *    שקורא «חמש פקודות», מריץ חמש, ומדלג על השישית.
 * ⓑ **המודל המוצהר.** `docs/agents/roster.json` הוא **הקובץ שנכתב כדי למנוע ערוץ סמוי**
 *    (`RULES § 0.23ח`) ⇒ מסמך כזה ⛔ אינו רשאי להיות בעצמו סחוף.
 */
describe('🔢 שני מספרים חיים שנגזרים, ⛔ ולא נכתבים ביד', () => {
  it('ⓐ `QA.md` נוקב בספירת הבדיקות של `loop-health.mjs`, ⛔ ולא במספר ישן', () => {
    const total = (read('scripts/loop-health.mjs').match(/^check\(/gm) ?? []).length;
    expect(total, 'הבודק מכריז בדיקות בכלל').toBeGreaterThanOrEqual(15);
    const qa = read('docs/agents/QA.md');
    // ⛔ שלושה מקומות, ⛔ ולא אחד — נמדד 09/09: `N/14` הופיע פעמיים ו-`⇐ 14 checks` פעם.
    expect(qa, `הדוח: loop health: N/${total}`).toContain(`loop health: N/${total}`);
    expect(qa, `רשימת הפקודות: ⇐ ${total} checks`).toContain(`⇐ ${total} checks`);
    // 🔴 ו⛔ אף מספר אחר ⛔ אינו נשאר מאחור — טענה חיובית לבדה ⛔ אינה תופסת עותק ישן.
    const others = [...qa.matchAll(/loop health: N\/(\d+)/g)].map((m) => Number(m[1]));
    expect(new Set(others), '⛔ אין שתי ספירות שונות באותו קובץ').toEqual(new Set([total]));
  });

  it('ⓑ המודל המוצהר ב-`roster.json` תקף, ו⛔ אין סוכן בלי הצהרה', () => {
    const roster = JSON.parse(read('docs/agents/roster.json')) as {
      agents: { name: string; model?: string }[];
    };
    expect(roster.agents.length, 'חמישה סוכנים').toBe(5);
    for (const a of roster.agents) {
      expect(a.model, `${a.name}: ⛔ אין הצהרת מודל`).toBeTruthy();
      expect(a.model, `${a.name}: מזהה מודל, ⛔ לא כינוי`).toMatch(/claude-[a-z0-9.-]+/);
    }
    // ⛔ **הפער היחיד שנסגר ידנית 09/09, בהוראת רוי** — תצורת המשימה מריצה `claude-opus-5`
    // מאז 2026-09-07T20:31:30Z, וההצהרה אמרה `claude-fable-5-1`. ⛔ הטענה נועלת את
    // התוצאה, ⛔ לא את התהליך: ⛔ אין כאן דרך לקרוא את השרת מתוך הריפו.
    const dev = roster.agents.find((a) => a.name === 'DEV');
    expect(dev?.model, 'DEV — מיושר לתצורת המשימה שנמדדה').toBe('claude-opus-5');
  });
});

/**
 * 🔤 **הצורה המרווחת — `§ 0.1 ז׳` — עקפה את השער שנבנה בדיוק נגדה.**  ⟦NEW 10/09⟧
 *
 * 🔬 **נמדד לפני התיקון:** **150** ציטוטים מאותיינים כתובים עם רווח מול **98** צמודים.
 * ‏`citationsIn` דרשה שהאות תיצמד למספר ⇒ **רוב** הציטוטים המאותיינים במאגר נבדקו
 * מול ההורה בלבד, והאות ⛔ לא אומתה מעולם. זה בדיוק החור ש-`resolves` תוקנה 09/09
 * כדי לסגור — היא נסגרה לצורה אחת מתוך שתיים.
 *
 * ⚠️ **והגרש הוא המבחין, ⛔ לא הרווח.** «`§ 0.4 נסיגה`» היא פסקה שמתחילה במילה.
 * ⇒ שלוש הטענות: הצמודה נקראת · המרווחת-עם-גרש נקראת · והמילה ⛔ אינה נקראת.
 */
describe('🔤 ציטוט מאותיין נקרא בשתי הצורות, ⛔ והמילה ⛔ אינה אות', () => {
  it('⛔ הצורה הצמודה — `§ 0.1ז` — נקראת כאות', () => {
    const c = citationsIn('ראה `§ 0.1ז` כאן.');
    expect(c.map((x) => x.ref)).toContain('0.1ז');
  });

  it('🔴 הצורה המרווחת עם גרש — `§ 0.1 ז׳` — נקראת כאות', () => {
    const c = citationsIn('ראה `§ 0.1 ז׳` כאן.');
    expect(c.map((x) => x.ref), 'זו הצורה ש⛔ נשמטה עד 10/09').toContain('0.1ז');
  });

  it('⛔ מילה אחרי רווח ⛔ אינה אות — `§ 0.4 נסיגה` היא `0.4`', () => {
    const c = citationsIn('`§ 0.4` נסיגה מפני נעילה.');
    expect(c.map((x) => x.ref)).toContain('0.4');
    expect(c.map((x) => x.ref)).not.toContain('0.4נ');
  });

  it('⛔ ציטוט מרווח לאות שאינה קיימת ⛔ אינו נפתר', () => {
    const anchors = anchorsOf(read('plan/RULES.md'));
    // ⛔ הסימן ⛔ אינו כתוב כאן כליטרל: השער סורק את קובץ המקור של עצמו, וציטוט
    // פיקטיבי בטקסט היה נספר כשבור אמיתי — אותה סיבה שבגללה `0.17ח` בקובץ הבודק
    // כתוב בלי הסימן. ⇒ נבנה בזמן ריצה.
    const SIGN = String.fromCharCode(0xa7);
    const [c] = citationsIn(`ראה \`${SIGN} 0.99 ת׳\`.`);
    expect(c, 'הציטוט נקרא').toBeDefined();
    expect(c?.ref).toBe('0.99ת');
    expect(resolves(anchors, c!)).toBe(false);
  });
});
