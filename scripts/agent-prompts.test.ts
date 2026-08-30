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

  /**
   * 🔴 **הסריקה הרחבה — הכלל שלמדנו ב-28/08 בדרך הקשה.**
   *
   * הבדיקה שמעל סרקה **ארבעה קבצים בלבד** (`docs/agents/*.md`), מפני שזה המקום שממנו
   * דלף הסוד ב-24/08. ⛔ **וזה בדיוק היה החור:** הטוקן החי של Supabase חזר לריפו
   * ב-`scripts/agent-prompts.test.ts` — **בקובץ הזה עצמו** — ועבר, מפני שהסורק
   * ⛔ לא הביט בו. ⇒ **סורק שמחריג את עצמו ⛔ אינו סורק.**
   *
   * ⇒ מכאן הסריקה עוברת על **כל קובץ מלווה-מקור בריפו**, ⛔ בלי החרגה לאיש.
   * ⛔ ⛔ אין רשימת פטורים, ⛔ ואין «הקובץ הזה מיוחד».
   */
  const SCAN_ROOTS = ['docs', 'plan', 'scripts', 'lib', 'app', 'components', 'supabase'];
  const SCAN_EXT = ['.ts', '.tsx', '.mjs', '.js', '.md', '.sql', '.json', '.toml', '.yml'];

  const walk = (dir: string): readonly string[] => {
    const out: string[] = [];
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      const full = join(dir, e.name);
      if (e.isDirectory()) out.push(...walk(full));
      else if (SCAN_EXT.some((x) => e.name.endsWith(x))) out.push(full);
    }
    return out;
  };

  it('🔴 ⛔ אפס סודות בכל הריפו — ⛔ ולא רק בארבעת הפרומפטים', () => {
    const files = SCAN_ROOTS.flatMap((r) => walk(r));
    // ⛔ שער שפוי: אם ההליכה החזירה כלום, הבדיקה חלולה ⇒ היא נופלת, ⛔ לא עוברת.
    expect(files.length, '⛔ הסריקה ⛔ לא מצאה קבצים').toBeGreaterThan(200);

    const hits: string[] = [];
    for (const f of files) {
      const body = readFileSync(f, 'utf8');
      for (const [pattern, label] of SECRETS) {
        const m = pattern.exec(body);
        if (m) hits.push(`${f} ⇒ ${label} (${m[0].slice(0, 12)}…)`);
      }
    }
    expect(hits, `⛔ סוד בריפו:\n${hits.join('\n')}`).toEqual([]);
  });

  /**
   * 🔴 **⛔ אף דוגמה כאן ⛔ אינה כתובה כמחרוזת שלמה, וזה ⛔ אינו סגנון — זה תיקון של
   * כשל שקרה פעמיים.**
   *
   * ⓐ **הכשל הראשון (28/08, תפס רוי):** הדוגמה השנייה ברשימה הזאת הייתה **טוקן
   * ה-Supabase החי עצמו**. הקובץ הזה נכתב כדי למנוע בדיוק את הדליפה של F-120, ובאותה
   * נשימה החזיק את הסוד שהוא שומר עליו. ⇒ **סוד ⛔ לעולם ⛔ אינו «דוגמה».**
   *
   * ⓑ **הכשל השני (אותו יום):** סורק הסודות של Netlify מחפש **תבניות מוכרות** בקוד
   * המקור, ⛔ לא רק ערכים של משתני סביבה. מחרוזת שנראית כמו `github_pat_…` הפילה את
   * `Branch Deploy: dev` ב-25/08 וב-26/08 עם `Exposed secrets detected`, ⇒ **`dev`
   * ⛔ לא נבנה במשך שלושה ימים ו⛔ איש לא הבחין.**
   *
   * ⇒ **הפתרון שעונה על שניהם:** הדוגמאות **מורכבות בזמן ריצה** מחלקים. הרגקסים עדיין
   * נבדקים מול מחרוזת מלאה, אבל שום קובץ בריפו ⛔ אינו מחזיק את התבנית ברצף.
   * ⚠️ **⛔ אל תאחד אותן בחזרה למחרוזת אחת** — הבנייה תיפול שוב, ובשקט.
   */
  const cat = (...parts: readonly string[]) => parts.join('');

  it('⛔ הבדיקה עצמה ⛔ אינה חלולה — כל תבנית תופסת דוגמה אמיתית', () => {
    const samples = [
      cat('github', '_pat_', '11ABCDEFGH0123456789abcdefghij'),
      cat('sbp', '_', '0'.repeat(40)),
      cat('sbp', '_', 'abcdefghijklmnopqrstuvwxyz012345'),
      cat('ey', 'JhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9', '.payload'),
      cat('service', '_role = ', 'abcdefghijklmnopqrstuvwxyz123456'),
      cat('postgres', 'ql://', 'user:hunter2@db.example.com:5432/postgres'),
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
  /**
   * ⛔ **D-120 — הרנדר הוא הרצפה, ההתקדמות של הלומד היא הרף.**
   * ⛔ הסכנה בכלל הזה היא **קריאה שגויה לשני הכיוונים**, ולכן שני הצדדים נבדקים:
   * ⓐ ‏QA חייב לשאת את **סף ההפרש** — גוון ⛔ אינו ממצא, מבנה כן.
   * ⓑ ‏PM חייב לשאת את **השאלה במספר** — «תואם לרנדר» ⛔ אינה תשובה.
   * ⛔ ואף אחד מהם ⛔ אינו רשאי לקרוא בזה ביטול של D-114: הרנדר עדיין מחייב.
   */
  it('סף ההפרש אצל QA, והשאלה במספר אצל PM — ⛔ ושניהם ⛔ אינם מבטלים את D-114', () => {
    const qa = text('CRITIC');
    expect(qa, 'QA: סף ההפרש').toMatch(/DELTA THRESHOLD/);
    expect(qa, 'QA: המבחן היחיד').toMatch(/does the learner get hurt/i);
    const pm = text('PM');
    expect(pm, 'PM: השאלה במספר').toMatch(/What does this buy the learner/i);
    expect(pm, 'PM: «תואם לרנדר» ⛔ אינה תשובה').toMatch(/⛔ NOT an answer/);
    // ⛔ D-114 שריר: הרנדר עדיין מחייב גם בגימור.
    expect(text('DEV')).toMatch(/BINDING TOO/);
  });

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

  /**
   * 🔬 **גל 1 · 30/08 — הטענות שהופכות את שינויי הטקסט מ«אפשר לאבד בשקט» ל**חוזה**.**
   *
   * ⛔ **למה זה ⛔ אינו בדיקת סגנון.** כל שינוי בגל 1 הוא **טקסט בפרומפט** — ⛔ אין לו
   * קומפיילר, ⛔ אין לו טסט יחידה, ו⛔ אין שום דבר שיצעק אם הקומיט הבא ידרוס אותו.
   * ‏`agent-prompts.test.ts` הוא **המקום היחיד בריפו שמפיל את הבנייה על סטייה בפרומפט**,
   * ולכן כל חוליה שבלעדיה מנגנון שלם מת נבדקת כאן, ⛔ ולא במקום אחר.
   */
  it('🔬 ארבעתם נושאים את שורת הסקילים בדוח — הפריט הזול ביותר בלופ', () => {
    for (const a of AGENTS) {
      expect(text(a), `${a}: שורת הסקילים`).toContain('סקילים:');
      // ⛔ ו«⛔ אף אחד» חייב להישאר תשובה חוקית — בלעדיה הסוכן ינחש כדי לא להישמע ריק,
      // וזו בדיוק המדידה היחידה שהשורה קיימת בשבילה.
      expect(text(a), `${a}: «⛔ אף אחד» כתשובה חוקית`).toContain('⛔ אף אחד');
      expect(text(a), `${a}: using-superpowers בפתיחה`).toContain('superpowers:using-superpowers');
    }
  });

  /**
   * ⛔ **הרשימה השלילית, וזו ⛔ אינה החמרה תיאורטית.** ענף יחיד `work/current` + נעילה
   * אחת ב-`00-control` הם מה שמחזיק את F-121 ואת בדיקה 10 ב-`loop:health`. סוכן
   * שמפצל ענף שובר את שניהם **בשקט** — ⛔ אף בדיקה קיימת ⛔ לא הייתה רואה אותו.
   */
  it('⛔ worktrees אסור לארבעתם, ו-finishing-a-development-branch הוא של QA לבדו', () => {
    for (const a of AGENTS) {
      expect(text(a), `${a}: איסור worktrees`).toContain('superpowers:using-git-worktrees');
    }
    for (const a of ['DEV', 'PM', 'CONTENT'] as const) {
      expect(text(a), `${a}: finishing שייך ל-QA`).toMatch(/finishing-a-development-branch` is QA/);
    }
    expect(text('CRITIC'), 'QA: המיזוג שלו').toContain('superpowers:finishing-a-development-branch');
  });

  /**
   * ⛔ **D-144 — שתי צורות לפרוסה, והתבנית שבלעדיה «דלתא» היא מילה.**
   * ⛔ הרשימה השלילית של D-098 נבדקת כאן במפורש, מפני ש**היא** מה שההרחבה מסכנת.
   */
  it('PM נושא את הצורה השנייה של פרוסה — ותבנית הדלתא, ⛔ לא סיסמה', () => {
    const pm = text('PM');
    expect(pm, 'PM: D-144').toContain('D-144');
    expect(pm, 'PM: תבנית «מ-X ל-Y»').toContain('מ-X ל-Y');
    // ⛔ הרשימה השלילית ⛔ אינה נפתחת בהרחבה — זו כל הנקודה.
    expect(pm, 'PM: הרשימה השלילית שרירה').toMatch(/schema-only/);
    expect(pm, 'PM: מקור השורות ⛔ אינו זיכרון').toContain('61-deferred');
  });

  /**
   * 🔴 **החוליה של D-146, וזו הטענה שמצדיקה את הבדיקה הזאת לבדה.**
   * ‏PM כותב שורות שיפור בזרימה **חתומה**; ‏DEV מסנן כל שורה שאינה ב-`ACTIVE_WORKSTREAM`.
   * ⇒ ⛔ בלי הצעד האחרון בסדר הבחירה של DEV, השורות נכתבות ו**איש ⛔ לעולם לא לוקח
   * אותן** — המנגנון כולו הופך לאות מתה, ⛔ ושום בדיקה אחרת ⛔ אינה רואה את זה.
   */
  it('🔴 שני צדי מצב IMPROVE כתובים: PM כותב, ו-DEV לוקח כשהזרימה ריקה', () => {
    const pm = text('PM');
    expect(pm, 'PM: המפתח').toContain('IMPROVE_TARGET');
    expect(pm, 'PM: המצב הרביעי').toMatch(/IMPROVE MODE/);
    const dev = text('DEV');
    expect(dev, '🔴 DEV: החוליה — ⛔ בלעדיה השורות ⛔ לעולם לא יבוצעו').toContain('IMPROVE_TARGET');
    // ⛔ ⛔ ולא «מזכיר את המפתח»: הוא חייב לשאת אותו כ**צעד אחרון**, ⛔ אחרי הזרימה הפעילה.
    expect(dev, 'DEV: אחרון בסדר הבחירה').toMatch(/LAST STEP OF THE PICK ORDER/);
  });

  /** ⛔ D-145 — QA כותב את החוב הנדחה **בזמן החתימה**, ⛔ ו-`36 § 13.1` ⛔ אינו משתנה. */
  it('QA נושא את הרגיסטר הנדחה, ⛔ ובלי לגעת בשלוש החותמות', () => {
    const qa = text('CRITIC');
    expect(qa, 'QA: הרגיסטר').toContain('plan/61-deferred.md');
    expect(qa, 'QA: לפני הזזת המוקד').toContain('ACTIVE_WORKSTREAM');
    // ⛔ החותמות נשארות שלוש — הטענה נכתבה כדי שהרגיסטר ⛔ לא יזחל לחוקה של רוי.
    expect(qa, 'QA: 36 § 13.1 ⛔ אינו משתנה').toMatch(/36 § 13\.1` is UNCHANGED/);
  });

  /** ⛔ D-147 — הכרעה אחת בכל טיק, ⛔ והיא מחליפה עבודה ⛔ ולא מוסיפה. */
  it('PM נושא את חובת ההכרעה, ואת ההיתר המפורש לטיק בלי פרוסה', () => {
    const pm = text('PM');
    expect(pm, 'PM: D-147').toContain('D-147');
    expect(pm, 'PM: טיק שהכריע הוא טיק מוצלח').toMatch(/SUCCESSFUL tick/);
  });

  /** ⛔ פרומפט שהתרוקן הוא פרומפט שאיש לא ישים לב אליו עד שסוכן ירוץ בלי הוראות. */
  it('⛔ אף פרומפט ⛔ אינו מתרוקן — רצפה נמדדת, ⛔ לא מוצהרת', () => {
    for (const a of AGENTS) expect(text(a).length, a).toBeGreaterThan(8000);
  });
});
