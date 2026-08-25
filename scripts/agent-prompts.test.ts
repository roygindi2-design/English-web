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

  it('QA יודע ש-⛔ אין מיזוג בזמן נעילת DEV', () => {
    expect(text('CRITIC')).toMatch(/LOCK_HELD_BY: DEV/);
  });

  /** ⛔ פרומפט שהתרוקן הוא פרומפט שאיש לא ישים לב אליו עד שסוכן ירוץ בלי הוראות. */
  it('⛔ אף פרומפט ⛔ אינו מתרוקן — רצפה נמדדת, ⛔ לא מוצהרת', () => {
    for (const a of AGENTS) expect(text(a).length, a).toBeGreaterThan(8000);
  });
});
