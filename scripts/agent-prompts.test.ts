import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * ⛔ **למה הקובץ הזה קיים.** עד 24/08 ארבעת פרומפטי הסוכנים חיו **אך ורק** בתוך
 * המשימות המתוזמנות: ⛔ אף סוכן לא יכול היה לקרוא אותם, ⛔ אף בדיקה לא יכלה לבדוק
 * אותם, ו⛔ אף שינוי בהם לא היה ניתן לסקירה. **זה בדיוק אותו סוג של קצה פתוח**
 * שכל תוכנית חיזוק הלופ נכתבה נגדו — הוראה שנכתבה, ⛔ ופעולה שאיש לא מדד.
 *
 * ⇒ הטקסט המחייב יושב כאן, והבדיקות למטה הן מה שהופך אותו מ«מסמך» ל**חוזה**.
 * ⛔ ⛔ אין כאן בדיקת סגנון: כל טענה כאן היא כלל מ-`plan/RULES.md § 0.17` שאם
 * ייעלם מפרומפט — הלופ ישבר בשקט.
 */
const DIR = 'docs/agents';
const AGENTS = ['DEV', 'PM', 'CRITIC', 'CONTENT'] as const;
const text = (name: string): string => readFileSync(join(DIR, `${name}.md`), 'utf8');

describe('docs/agents/*.md — הפרומפטים הם קובץ בריפו, ⛔ לא סוד במשימה מתוזמנת', () => {
  it('ארבעת הסוכנים קיימים, ו⛔ אין קובץ חמישי שאיש לא מכיר', () => {
    const found = readdirSync(DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    expect(found).toEqual([...AGENTS].sort());
  });

  /**
   * ⛔ **⛔ לא רק מפתח GitHub, וזה ⛔ אינו הידוק תיאורטי.** בגרסה הראשונה של
   * הבדיקה הזאת ניקיתי `github_pat_` בלבד — ו**טוקן Supabase (`sbp_…`) שישב באותו
   * פרומפט עבר, נדחף ל-GitHub, ורוי הוא שתפס אותו.** ⇒ רשימת התבניות היא **סגורה
   * ומוצהרת**, וכל סוד חדש שמישהו מוסיף לפרומפט חייב להיכנס לכאן.
   * ⛔ ריפו ⛔ אינו מקום לסוד — גם ריפו פרטי: כל סוכן שמשכפל מקבל עותק, וההיסטוריה
   * שומרת אותו לנצח גם אחרי מחיקה.
   */
  const SECRETS: readonly (readonly [RegExp, string])[] = [
    [/github_pat_[A-Za-z0-9_]{10,}/, 'GitHub PAT'],
    [/\bsbp_[0-9a-f]{20,}/, 'Supabase access token'],
    [/\bsb[ps]_[A-Za-z0-9]{20,}/, 'Supabase key'],
    [/\beyJ[A-Za-z0-9_-]{20,}\./, 'JWT (Supabase anon/service key)'],
    [/service_role["'\s:=]+[A-Za-z0-9._-]{20,}/, 'service_role key'],
    [/\bpostgres(ql)?:\/\/[^\s`]+:[^\s`]+@/, 'database URL with a password'],
  ];

  it('⛔ אפס סודות בריפו — כל אחד מהם חי במשימה המתוזמנת בלבד', () => {
    for (const a of AGENTS) {
      const body = text(a);
      for (const [pattern, label] of SECRETS) {
        expect(body, `${a}: ⛔ ${label}`).not.toMatch(pattern);
      }
    }
    // ⛔ ומפתח ה-GitHub עדיין **נדרש כמצייה**, אחרת הסוכן ⛔ אינו יודע מה להחליף.
    for (const a of AGENTS) expect(text(a), a).toContain('${GITHUB_PAT}');
  });

  it('⛔ הבדיקה עצמה ⛔ אינה חלולה — כל תבנית תופסת דוגמה אמיתית', () => {
    const samples = [
      'github_pat_11ABCDEFGH0123456789abcdefghij',
      'sbp_2a2d6dac74f5a9fafbcd0c969d503c27e7fbf2c7',
      'sbp_abcdefghijklmnopqrstuvwxyz012345',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload',
      'service_role = abcdefghijklmnopqrstuvwxyz123456',
      'postgresql://user:hunter2@db.example.com:5432/postgres',
    ];
    expect(samples).toHaveLength(SECRETS.length);
    for (const [i, sample] of samples.entries()) {
      expect(sample, `sample ${i}`).toMatch(SECRETS[i]![0]);
    }
  });

  it('כל סוכן משכפל את `work/current` — ⛔ ואף אחד ⛔ אינו משכפל את dev', () => {
    for (const a of AGENTS) {
      expect(text(a), a).toContain('git clone -b work/current');
      expect(text(a), a).not.toContain('git clone -b dev');
    }
  });

  /**
   * ⛔ **הטענה החשובה ביותר בקובץ.** נתיב יחיד ל-`dev`, והוא ה-`--ff-only` של QA.
   * סוכן שדוחף ל-`dev` ישירות עוקף את השער כולו, וזה ⛔ אינו נראה בשום מקום אחר.
   */
  it('⛔ ⛔ אף סוכן ⛔ אינו דוחף ל-dev — ול-QA יש בדיוק מופע אחד, על שורת ה-ff', () => {
    for (const a of ['DEV', 'PM', 'CONTENT'] as const) {
      expect(text(a), a).not.toMatch(/push +origin +dev\b/);
    }
    // ⛔ ל-QA מותר בדיוק **מופע אחד**, ורק כשהוא יושב על אותה שורה עם ה-`--ff-only`.
    // ⛔ הבדיקה ⛔ אינה «מכיל ff-only איפשהו»: דחיפה ל-dev בשורה נפרדת היא בדיוק
    // עקיפת השער, והיא הייתה עוברת בדיקה רופפת.
    const qa = text('CRITIC');
    const pushes = [...qa.matchAll(/^.*push +origin +dev\b.*$/gm)].map((m) => m[0]);
    expect(pushes).toHaveLength(1);
    expect(pushes[0]).toContain('merge --ff-only work/current');
  });

  it('QA לבדו ממזג, ורק ב-`--ff-only`', () => {
    expect(text('CRITIC')).toContain('merge --ff-only work/current');
    // ⛔ הפקודה עצמה, ⛔ ולא האזכור: ‏DEV **חייב** לדעת ש-QA ממזג ב-ff-only,
    // והוא כותב את זה בפרוזה. מה ש⛔ אסור לו הוא **להריץ** את זה.
    for (const a of ['DEV', 'PM', 'CONTENT'] as const) {
      expect(text(a), a).not.toContain('merge --ff-only work/current');
    }
  });

  it('DEV מרביץ ריבייס בתחילת טיק, ו⛔ אסור עליו לפתור התנגשות', () => {
    const dev = text('DEV');
    expect(dev).toContain('rebase origin/dev');
    expect(dev).toContain('rebase --abort');
  });

  it('שלושת הכותבים יודעים על `ACTIVE_WORKSTREAM`, ⛔ ולא רק QA שקובע אותה', () => {
    for (const a of ['DEV', 'PM', 'CRITIC'] as const) {
      expect(text(a), a).toContain('ACTIVE_WORKSTREAM');
    }
  });

  /**
   * ⛔ **שלב 3 · P3-1.** כלל הסיום התלת-תנאי וקומיט-למשימה הם מה שמאפשר ל-QA לסקור
   * ‏40 משימות בלי לקרוא 40 דיפים. ⛔ טיק שנדחס לקומיט אחד הורס בדיוק את זה,
   * ⛔ ואי אפשר לשחזר את זה בדיעבד.
   */
  it('DEV נושא את שני סוגי הטיק ואת כלל הסיום התלת-תנאי', () => {
    const dev = text('DEV');
    for (const needle of ['PLANNING TICK', 'BUILD TICK', 'ONE COMMIT PER TASK']) {
      expect(dev, needle).toContain(needle);
    }
    // ⛔ שלושה תנאים, ⛔ ולא «בערך שלושה»: מספור מפורש בפרומפט.
    for (const n of ['1. **The gate went red', '2. **The time box', '3. **The plan']) {
      expect(dev, n).toContain(n);
    }
  });

  /**
   * ⛔ **שני קצוות שנפתחו דווקא בגלל שלב 2, ⛔ ולא לפניו.**
   * ⓐ ‏QA הפסיק לסרוק תור — ואיתו נעלם מי שרענן את חותמות `⟨נבדק⟩`. ‏21 פריטים
   *    פתוחים, ובדיקה 3 מאדימה אחרי 7 ימים ⇒ הרצה לא מפוקחת הייתה מייצרת רעש.
   * ⓑ ‏DEV מסונן ל-`ACTIVE_WORKSTREAM`, ובה **6 משימות מול 12 טיקים ביום**.
   *    יציאה שקטה שאינה נוקבת בסיבה משאירה את QA בלי דרך לדעת שהלופ מדשדש.
   */
  it('QA יודע שהחותמות עברו לאחריותו אחרי שהסריקה בוטלה', () => {
    const qa = text('CRITIC');
    expect(qa).toContain('⟨נבדק: YYYY-MM-DD⟩');
    expect(qa).toMatch(/STAMPS ARE NOW YOURS/);
    expect(qa).toMatch(/03-for-roy/);
  });

  it('DEV נוקב בסיבה כשהזרימה הפעילה ריקה, ⛔ ואינו יוצא בשקט', () => {
    const dev = text('DEV');
    expect(dev).toContain('הזרימה הפעילה');
    expect(dev).toContain('ACTIVE_WORKSTREAM');
  });

  /**
   * ⛔ **הכלל נכשל בפועל 25/08, בפעם הראשונה שהלופ רץ.** הוא נכתב «נעילת DEV»,
   * ומיזוג עבר בזמן ש-**CONTENT** החזיק את הנעילה ⇒ הענף ו-`dev` התפצלו.
   * ⇒ הבדיקה דורשת את הנוסח הכולל, ו⛔ **פוסלת את הנוסח הישן במפורש**.
   */
  /**
   * ⛔ **F-122 — נמצא על ידי סוכן DEV עצמו בטיק הראשון שלו, 25/08.**
   * הפכתי את `36 § 14.4` ועדכנתי את המפרט, את `check-plan-shape` ואת פרומפט QA —
   * ⛔ **ולא את פרומפט DEV.** ⇒ הפרומפט הורה «בגימור החוקה גוברת» בזמן שהשער
   * **מפיל** תוכנית מסך שנשענת על הנוסח הזה. הסוכן קורא את הפרומפט ראשון.
   * ⇒ הבדיקה דורשת את הנוסח החדש **ופוסלת את הישן**, בשני הפרומפטים שנוגעים ברנדר.
   */
  /**
   * ⛔ **F-126 — נמצא בטיק הביצוע הראשון של הלופ, 26/08.** ‏DEV סימן חמש שורות 🟣,
   * ⛔ ופרומפט QA אומר במפורש שהוא ⛔ אינו הולך על תור 🟣. ⇒ **חמש שורות במצב שאיש
   * ⛔ לא יסגור לעולם**, וזה היה חוזר בכל טיק, 12 פעמים ביום.
   * ⇒ 🟣 קיבל משמעות מדויקת — «נבנה · ירוק · ⛔ עדיין לא על dev» — ו-QA הופך אותו
   * בתפזורת מתוך `git log`, ⛔ בלי שיקול דעת.
   */
  it('שני הצדדים של 🟣 כתובים: מי מסמן אותו ומי הופך אותו', () => {
    const dev = text('DEV');
    expect(dev, 'DEV חייב לדעת שהוא מסמן 🟣 ⛔ ולא ✅').toContain('🟣');
    expect(dev).toMatch(/⛔ NOT ✅/);
    const qa = text('CRITIC');
    expect(qa, 'QA חייב לדעת שהוא הופך 🟣 ל-✅ אחרי מיזוג').toMatch(/FLIP 🟣 TO ✅/);
    expect(qa).toContain('origin/dev');
  });

  it('⛔ הנוסח שהוחלף ב-D-114 ⛔ אינו חוזר לאף פרומפט', () => {
    for (const a of ['DEV', 'CRITIC'] as const) {
      const body = text(a);
      expect(body, `${a}: ⛔ «החוקה גוברת בגימור» חזר`).not.toMatch(
        /on finish, the constitution wins|בגימור.{0,20}החוקה גוברת/i,
      );
    }
    // ⛔ ⛔ ולא רק «אין את הישן» — **יש את החדש**, ואת ההחרגה היחידה.
    const dev = text('DEV');
    expect(dev).toMatch(/BINDING TOO/);
    expect(dev).toMatch(/Layer A (OVERRIDES|is the only carve-out)/);
  });

  it('QA ⛔ אינו ממזג בזמן נעילה של **סוכן כלשהו**, ⛔ ולא רק DEV', () => {
    const qa = text('CRITIC');
    expect(qa).toContain('LOCK_HELD_BY');
    expect(qa).toMatch(/ANY agent's lock/);
    expect(qa, '⛔ הנוסח הישן חזר').not.toMatch(/`LOCK_HELD_BY: DEV` in/);
  });

  /** ⛔ פרומפט שהתרוקן הוא פרומפט שאיש לא ישים לב אליו עד שסוכן ירוץ בלי הוראות. */
  it('⛔ אף פרומפט ⛔ אינו מתרוקן — רצפה נמדדת, ⛔ לא מוצהרת', () => {
    for (const a of AGENTS) expect(text(a).length, a).toBeGreaterThan(8000);
  });
});
