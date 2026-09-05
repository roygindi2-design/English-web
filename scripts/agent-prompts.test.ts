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
 * ⛔ ⛔ אין כאן בדיקת סגנון: כל טענה כאן היא כלל מ-`plan/RULES.md § 0.23` שאם
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
    // ⛔ **TWO occurrences since the lane split (30/08), ⛔ and the rule got STRICTER,
    // ⛔ not looser:** the gate lane and the full lane each carry the command once.
    // ⛔ The assertion is ⛔ not «how many» — it is that **every** line that pushes to
    // `dev` also carries the `--ff-only` on the SAME line. A push on its own line is
    // exactly the gate-bypass this test exists against, and it would have passed a
    // «contains ff-only somewhere» check.
    expect(pushes.length, '⛔ אף דחיפה ל-dev מחוץ לשני המסלולים').toBe(2);
    for (const line of pushes) expect(line).toContain('merge --ff-only work/current');
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

  /**
   * 🚦 **גל 3 · פיצול ה-QA לשני מסלולים.**
   *
   * ⚠️ **המודל יושב בהגדרת המשימה המתוזמנת ⛔ ולא בריפו** ⇒ הוא **ערוץ סמוי בדיוק כמו
   * שהפרומפטים היו לפני 24/08** (`RULES § 0.23ח`). ⛔ אי אפשר לבדוק מכאן על איזה מודל
   * טריגר רץ — **אבל אפשר לבדוק שהפרומפט יודע שיש שני מסלולים, שהזול נעצר, ושהחתימה
   * ⛔ אינה שלו.** זה כל מה שמפריד בין «טיק זול» ל«טיק שחותם על מה שלא קרא».
   */
  it('🚦 QA נושא שער מסלול בראש הקובץ, והזול נעצר בו', () => {
    const qa = text('CRITIC');
    expect(qa, 'שער המסלול').toMatch(/STEP 0\.1 — WHICH LANE ARE YOU/);
    expect(qa, 'שני המסלולים בשמם').toContain('מסלול: שער');
    expect(qa, 'שני המסלולים בשמם').toContain('מסלול: מלא');
    // ⛔ ⛔ ולא «מזכיר מסלול זול»: הוא חייב **לעצור** שם, אחרת Haiku יקרא 25KB
    // ויבצע את מה שקרא.
    expect(qa, '⛔ הזול נעצר').toMatch(/STOP HERE\. ⛔ Do not read the rest of this file/);
    // ⛔ ברירת המחדל בהיעדר הצהרה היא היקרה — הצהרה חסרה ⛔ אינה קונה את המסלול הזול.
    expect(qa, 'ברירת מחדל = מלא').toMatch(/⛔ No line at all ⇒ treat it as `מלא`/);
    /**
     * 🔴 **הסמנים ⛔ אינם קישוט — הטריגר הזול קורא ביניהם ב-`sed`.**
     * ⛔ הגרסה הראשונה של אותה פקודה ⛔ לא התאימה לסמן הסיום (`**⇒ STOP` מול
     * `⇒ **STOP`), ו-`sed` המשיך **עד סוף הקובץ** — כלומר Haiku היה מקבל את כל
     * 34KB, שהוא בדיוק הכשל שהמסלול הזול נבנה למנוע, **בשקט**.
     * ⇒ הקטע תחום בסמנים מפורשים, ו**גודלו נמדד כאן**: קטע שגדל מעבר לתקציב של
     * טיק זול הוא רגרסיה, ⛔ לא עריכה.
     */
    const gate = /<!-- LANE-GATE-START -->([\s\S]*?)<!-- LANE-GATE-END -->/.exec(qa)?.[1];
    expect(gate, '⛔ הסמנים חסרים ⇒ הטריגר הזול קורא את כל הקובץ').toBeDefined();
    expect(gate).toContain('STOP HERE');
    expect(Buffer.byteLength(gate ?? '', 'utf8'), 'תקציב הטיק הזול').toBeLessThan(6000);
  });

  /**
   * 🔴 **הטענה שמגינה על `36 § 13.1`.** חתימה היא **שיפוט** על 2.1MB של רגיסטרים מול
   * חלון של 200K. טיק זול שחותם ⛔ אינו חוסך — הוא **ממציא**, והחוקה של רוי הופכת
   * מחותמת מדודה לחותמת גומי בטיק אחד.
   */
  it('🔴 טיק השער ⛔ אינו חותם, ⛔ אינו מזיז מוקד ו⛔ אינו כותב ממצא', () => {
    const qa = text('CRITIC');
    for (const forbidden of [
      '⛔ seal a workstream',
      '⛔ move ACTIVE_WORKSTREAM',
      '⛔ write 61-deferred',
      '⛔ write a finding',
      '⛔ set RELEASE_READY',
    ]) {
      expect(qa, `⛔ אסור לטיק השער: ${forbidden}`).toContain(forbidden);
    }
    // ⛔ ומבחן הפיצול עצמו כתוב בפרומפט: טיק שער שכתב ממצא = ההפרדה ⛔ לא עבדה.
    expect(qa, 'מבחן הפיצול').toMatch(/lane separation ⛔ did not work/);
  });

  /**
   * 🎬 **‏D-148 · 30/08 — הטריגר המותנה של סקילי האנימציה, וארבע החוליות שבלעדיהן הוא מת.**
   *
   * ⛔ **למה כאן ו⛔ לא בטסט אחר.** התוספת כולה היא **טקסט בשני פרומפטים** — ⛔ אין לה
   * קומפיילר ו⛔ אין לה טסט יחידה. ⚠️ ובניגוד לשאר גל 1, **חצי ממנה היא איסור**, וכשל
   * של איסור ⛔ אינו נראה: פרומפט שאיבד את המילה «BLOCKED» ימשיך לעבוד יפה, והסקיל
   * פשוט ייטען במקום שבו חוקת העיצוב קפואה. ⇒ **הצד השלילי נבדק כאן במפורש, ⛔ ולא
   * רק הצד החיובי.**
   */
  it('🎬 סקילי האנימציה מותנים ב-`שכבה ב׳`, וה-DEV ⛔ אינו רשאי לסמן לעצמו (D-148)', () => {
    const dev = text('DEV');
    // ⓐ התנאי החיובי — שני התגים ביחד, ⛔ ולא אחד מהם
    expect(dev, 'DEV: D-148').toContain('D-148');
    expect(dev, 'DEV: תג השכבה עצמו').toContain('שכבה ב׳');
    expect(dev, 'DEV: `arena` ⛔ לבדה ⛔ אינה מספיקה').toMatch(/`arena`\*\* ⛔ \*\*AND\*\*/);
    expect(dev, 'DEV: הסקיל המפעיל').toContain('`animate`');
    // ⓑ המשניים ⛔ אינם עצמאיים
    expect(dev, 'DEV: apple-design/emil משניים').toMatch(/only if `animate` itself sends you/);
    // ⓒ הרשימה השלילית — ⛔ זו החוליה שאובדת בשקט
    expect(dev, 'DEV: איסור מפורש בכל שורה אחרת').toMatch(/Any other row these three are BLOCKED/);
    expect(dev, 'DEV: המסכים בשמם').toMatch(/study` \/ `onboarding` \/ `account`/);
    // ⓓ 🔴 השער ⛔ אינו נפתח מבפנים — הסוכן ⛔ אינו מסמן לעצמו את השורה
    expect(dev, '🔴 DEV: ⛔ אינו כותב את התג בעצמו').toMatch(/NEVER write `שכבה ב׳` onto a row/);
    // ⓔ והחוקה גוברת על הסקיל — עם המספרים, ⛔ לא כסיסמה
    expect(dev, 'DEV: החוקה גוברת').toMatch(/beats a design skill/);
    expect(dev, 'DEV: תקציב הזוהר במספר').toMatch(/max two per screen/);
    expect(dev, 'DEV: reduced-motion היא שכבה א׳').toContain('prefers-reduced-motion');
  });

  it('🎬 QA נושא את `review-animations`, ו⛔ אינו נושא אף סקיל בנייה (D-148)', () => {
    const qa = text('CRITIC');
    expect(qa, 'QA: D-148').toContain('D-148');
    expect(qa, 'QA: סקיל הביקורת').toContain('`review-animations`');
    // התנאי הוא הדיף, ⛔ ולא המשימה — QA ⛔ אינו בוחר שורה
    expect(qa, 'QA: התנאי הוא הדיף').toMatch(/animate\|transition\|motion\|glow\(/);
    // ⛔ ⛔ אינו חוסם מיזוג — חוץ מ-reduced-motion, שהיא שכבה א׳
    expect(qa, 'QA: ⛔ אינו חוסם').toMatch(/⛔ does not block the merge/);
    expect(qa, 'QA: והחריג היחיד ששכן חוסם').toContain('prefers-reduced-motion');
    // 🔴 והפרדת התפקידים: סקילי הבנייה ⛔ אינם שלו
    expect(qa, '🔴 QA: סקילי הבנייה ⛔ אינם שלו').toMatch(/⛔ NOT yours/);
  });

  /**
   * 🔴 **‏אי-הדליפה — הטענה שאיש ⛔ לא היה כותב, ובדיוק זו שנשברת ראשונה.**
   * ‏PM ו-CONTENT ⛔ אינם נוגעים בקוד תצוגה בכלל. אם שם של סקיל אנימציה יופיע
   * בפרומפט שלהם, זה ⛔ לא ייראה כשגיאה — הוא פשוט ייטען בכל טיק, בשקט, על חשבון
   * חלון ההקשר של סוכן שאין לו שום שימוש בו.
   */
  it('🔴 סקילי האנימציה ⛔ אינם דולפים ל-PM ול-CONTENT, ו-`write-swift` ⛔ אינו בשום פרומפט', () => {
    /**
     * 🆕 **‏31/08 — חריג אחד, ⛔ ואחד בלבד: `apple-design` ב-`PM.md`.**
     * רוי אישר 30/08 «טריגר נדיר ל-PM» (‏`D-162`), אחרי שהרצה ידנית אחת של הסקיל
     * פתחה **חמש** שורות (‏`T-230`…`T-234`). ⛔ **וזה ⛔ אינו ריכוך של הבדיקה:**
     * שלושת האחרים נשארים אסורים ל-PM, כל הארבעה נשארים אסורים ל-CONTENT,
     * ו⛔ החריג נדרש **להיות מגודר במונה** — האסרציה שמיד אחריו היא הגדר.
     */
    const ALLOWED: Record<string, readonly string[]> = { PM: ['apple-design'], CONTENT: [] };
    for (const a of ['PM', 'CONTENT'] as const) {
      for (const skill of ['animate', 'apple-design', 'emil-design-eng', 'review-animations']) {
        if (ALLOWED[a]!.includes(skill)) continue;
        expect(text(a), `${a}: ⛔ ${skill}`).not.toContain(skill);
      }
    }
    // ⛔ ‏החריג של PM חייב לשאת את המונה שגודר אותו, אחרת הוא היתר פתוח
    expect(text('PM'), 'PM: `apple-design` מגודר במונה, ⛔ ולא במצב רוח').toMatch(
      /zero open row whose `סקיל` cell prints `apple-design`/,
    );
    // ⛔ ‏Swift ⛔ אינו הסטאק הזה, ו-`find-animation-opportunities` הוא של רוי ביד
    for (const a of AGENTS) {
      expect(text(a), `${a}: ⛔ write-swift כהיתר`).not.toMatch(/run `write-swift`/);
    }
    expect(text('DEV'), 'DEV: find-animation-opportunities חסום').toMatch(
      /BLOCKED with ⛔ no condition: `find-animation-opportunities`/,
    );
  });

  /**
   * 🔬 **‏בדיקה ד׳ מהתוכנית — «הפניה, ⛔ לא העתקה», ⛔ ואינה כוונה אלא מספר.**
   * העיקרון שהתוספת נשענת עליו הוא שתוכן הסקיל נשאר ב-`SKILL.md` שלו והפרומפט רק
   * מפנה אליו. ⛔ **כוונה ⛔ אינה נמדדת** — ולכן התקרה כתובה כאן: התוספת המותנית
   * בשני הפרומפטים ⛔ אינה חורגת מ-**2,600 בתים** בכל אחד. חריגה מזה אומרת שמישהו
   * (‏אני, בטעות) התחיל להעתיק את הסקיל פנימה במקום להפנות אליו.
   */
  it('🔬 התוספת המותנית נשארה הפניה — ⛔ ולא העתקה של תוכן הסקיל', () => {
    const dev = text('DEV');
    const qa = text('CRITIC');
    const devBlock = dev.slice(dev.indexOf('### 🎬 CONDITIONAL'));
    const qaStart = qa.indexOf('### 🎬 CONDITIONAL');
    const qaBlock = qa.slice(qaStart, qa.indexOf('\n## ', qaStart));
    expect(devBlock.slice(0, devBlock.indexOf('\n## ')).length, 'DEV: גודל התוספת').toBeLessThan(2600);
    expect(qaBlock.length, 'QA: גודל התוספת').toBeLessThan(2600);
  });

  /** ⛔ פרומפט שהתרוקן הוא פרומפט שאיש לא ישים לב אליו עד שסוכן ירוץ בלי הוראות. */
  it('⛔ אף פרומפט ⛔ אינו מתרוקן — רצפה נמדדת, ⛔ לא מוצהרת', () => {
    for (const a of AGENTS) expect(text(a).length, a).toBeGreaterThan(8000);
  });

  /**
   * 📇 **‏C-0376 · אינדקס הסקילים — ו⛔ אין כאן «מסמך», יש חוזה.**
   *
   * 🔴 **מחלקת הכשל שהבדיקה הזאת מונעת נמדדה כבר פעמיים בלופ הזה:** הוראה נכתבה
   * לפרומפט, ⛔ אף בדיקה לא אכפה אותה, והיא הפכה לאות מתה בלי שאיש ראה. כך קרה
   * לשדה `Layer` (‏`grep -c "Layer" 50-tasks` ⇒ **0**), וכך קרה לציטוט התזמון
   * השקרי שכל סוכן קרא במשך שלושה שבועות. ⇒ **אינדקס שאיש ⛔ אינו מחויב לקרוא
   * הוא אינדקס שאיש ⛔ אינו קורא.**
   *
   * ⚠️ **ו⛔ זו ⛔ אינה בדיקת סגנון:** כל טענה כאן היא חוליה שבלעדיה המנגנון מת —
   * ⓐ האינדקס קיים · ⓑ שני קובצי הסקיל שהוא מפנה אליהם קיימים באמת · ⓒ ‏PM חייב
   * לקרוא אותו בתכנון · ⓓ ‏DEV ו-QA מחויבים לתג · ⓔ **השער ⛔ אינו נפתח מבפנים.**
   */
  describe('📇 אינדקס הסקילים — `docs/skills-registry.md`  ⟦C-0376⟧', () => {
    const registry = (): string => readFileSync('docs/skills-registry.md', 'utf8');

    it('ⓐ האינדקס קיים, והוא אינדקס — ⛔ ולא עותק של סקיל', () => {
      const r = registry();
      expect(r.length, 'האינדקס ⛔ אינו ריק').toBeGreaterThan(2000);
      // ⛔ תקרה: ברגע שמישהו יתחיל להדביק תוכן סקיל פנימה, הקובץ יתפוצץ והבדיקה תיפול.
      // ‏PM קורא אותו **במלואו** בכל טיק תכנון — זה המחיר שהתקרה שומרת עליו.
      expect(r.length, 'תקרת האינדקס — הפניה ⛔ ולא העתקה').toBeLessThan(14000);
      expect(r, 'תג הסקיל מוגדר בו').toContain('[SKILL:');
    });

    it('ⓑ כל נתיב `skills/**` שהאינדקס מבטיח — קיים בפועל ו⛔ אינו ריק', () => {
      const paths = [...registry().matchAll(/`(skills\/[A-Za-z0-9._\/-]+\.md)`/g)]
        .map((m) => m[1])
        .filter((x): x is string => x !== undefined);
      expect(paths.length, '⛔ האינדקס ⛔ אינו מפנה לאף סקיל בריפו').toBeGreaterThanOrEqual(2);
      for (const rel of [...new Set(paths)]) {
        // ⛔ נתיב שבור באינדקס הוא הבטחה שנשברת **בטיק**, ⛔ ולא בבדיקה.
        expect(readFileSync(rel, 'utf8').length, rel).toBeGreaterThan(1000);
      }
      expect(paths).toContain('skills/taste-skill/SKILL.md');
      expect(paths).toContain('skills/imagegen-frontend-mobile/SKILL.md');
    });

    it('ⓒ ‏PM מחויב לקרוא את האינדקס בתכנון, ולהצמיד תג לשורה שהוא גוזר', () => {
      const pm = text('PM');
      expect(pm, 'PM: הנתיב עצמו').toContain('docs/skills-registry.md');
      expect(pm, 'PM: הטריגר הוא מצב התכנון').toContain('STATE: PLANNING');
      expect(pm, 'PM: הצורה של התג').toContain('[SKILL:');
      expect(pm, 'PM: לאן התג נכתב').toContain('50-tasks.md');
    });

    it('ⓓ ‏DEV ו-QA מחויבים לטעון את הסקיל שהתג נוקב בו — לפני קוד ולפני סקירה', () => {
      for (const a of ['DEV', 'CRITIC'] as const) {
        const t = text(a);
        expect(t, `${a}: התג`).toContain('[SKILL:');
        expect(t, `${a}: האינדקס`).toContain('docs/skills-registry.md');
        expect(t, `${a}: הנתיב האמיתי`).toContain('skills/taste-skill/SKILL.md');
      }
    });

    it('ⓔ 🔴 השער ⛔ אינו נפתח מבפנים — ⛔ DEV ו-QA ⛔ אינם כותבים את תא `סקיל`', () => {
      for (const a of ['DEV', 'CRITIC'] as const) {
        expect(text(a), `${a}: ⛔ אינו כותב את התא`).toMatch(
          /⛔ \*\*(You|And you) ⛔ never write the `סקיל` cell/,
        );
      }
      // ⛔ וסקילי הבנייה נשארים חסומים ל-QA **גם** כשיש תג — אחרת התג הוא דלת אחורית.
      expect(text('CRITIC'), 'QA: תג ⛔ אינו פותח סקיל בנייה').toMatch(
        /⛔ A `\[SKILL: X\]` tag ⛔ does not unblock them/,
      );
    });
  });

  /**
   * 🧭 **‏C-0376 · `D-174` — הפרוסה הכללית, וארבע החוליות שבלעדיהן היא אות מתה.**
   *
   * 🔴 **המדידה, ⛔ ולא הרעיון:** 31/08 על שיבוט חי — `loop` נשא **10 ⬜** ו-`base` נשא
   * **15**. ⇒ **25 שורות פתוחות ש⛔ אף טיק DEV ⛔ לא יכול היה לקחת.** ⛔ אף בדיקה
   * ⛔ לא ראתה את זה: בדיקה 11 סופרת ⬜ **בזרימה הפעילה**, ו-`loop`/`base` מעולם ⛔ לא היו
   * הזרימה הפעילה. **מחלקת כשל שלישית מאותו סוג** — `D-122 § ב`, `D-171`, וזו.
   *
   * ⚠️ **והצד השלילי הוא חצי מהתוספת** — ומחדל של איסור ⛔ אינו נראה: פרומפט שאיבד את
   * המשפט «⛔ PM ⛔ אינו מזיז לזרימת פיצ׳ר» ימשיך להיקרא סביר, ו-PM יתחיל להזיז מוקד
   * שהוא של QA. ⇒ **שני הצדדים נבדקים כאן במפורש.**
   */
  describe('🧭 הפרוסה הכללית — `general`  ⟦D-174⟧', () => {
    it('ⓐ ‏DEV יודע שמוקד `general` פותח שלושה תגים — ⛔ ולא אחד', () => {
      const dev = text('DEV');
      expect(dev, 'DEV: הערך עצמו').toContain('ACTIVE_WORKSTREAM: general');
      expect(dev, 'DEV: הקבוצה, ⛔ ולא תג בודד').toMatch(/general · loop · base/);
      // ⛔ ואוצר המילים בטבלה חייב להכיל אותו — תג שהטבלה ⛔ אינה מכירה הוא תג שנמחק בעריכה.
      expect(dev, 'DEV: אוצר המילים').toMatch(/\*\*זרימה\*\* \|[^\n]*`general`/);
      // 🔴 ‏`cards` נעדר מהטבלה הזאת עד C-0376 — בדיוק הפער שיצר את `D-122 § ב`.
      expect(dev, 'DEV: ⛔ ו-`cards` ⛔ לא ייעלם שוב').toMatch(/\*\*זרימה\*\* \|[^\n]*`cards`/);
    });

    it('ⓑ ‏PM מחזיק את ההיתר — ובכיוון אחד בלבד', () => {
      const pm = text('PM');
      expect(pm, 'PM: ההיתר').toContain('ACTIVE_WORKSTREAM: general');
      expect(pm, 'PM: החוליה שבלעדיה הבדיקות ⛔ אינן מודדות').toContain('PREV_WORKSTREAM');
      expect(pm, 'PM: ההכרעה').toContain('D-174');
    });

    it('ⓒ 🔴 הצד השלילי — ⛔ PM ⛔ אינו מזיז את המוקד לזרימת פיצ׳ר, ו⛔ אינו חותם', () => {
      const pm = text('PM');
      expect(pm, '⛔ PM ⛔ אינו מזיז לפיצ׳ר').toMatch(/⛔ NEVER\. That is QA's alone/);
      expect(pm, '⛔ PM ⛔ אינו חותם').toMatch(/⛔ \*\*⛔ You ⛔ do not seal a workstream\*\*/);
    });

    it('ⓓ ‏QA יודע שהמוקד יכול לקרוא `general`, ושהחתימות שלו ⛔ לא זזו', () => {
      const qa = text('CRITIC');
      expect(qa, 'QA: הערך').toContain('general');
      expect(qa, 'QA: החזרה לרצף היא שלו').toMatch(/still YOURS ALONE/);
      expect(qa, 'QA: מעבר ל-general ⛔ אינו חתימה').toMatch(/is ⛔ \*\*not\*\* a seal/);
    });
  });

  /**
   * 🔴 **01/09 · C-0379 · הכרעת רוי, אפשרות ⓐ — הסתירה בין STEP 2 ל-STEP 5.**
   * ‏STEP 2 מחייב את PM לסגור כל ממצא-PM שחוסם שורה; STEP 5 אסר עליו לגעת ב-`60-findings.md`
   * בכל צורה. ⇒ שני החוזים דרשו פעולות סותרות. רוי אישר את הרישיון הצר: תא סטטוס בלבד,
   * לממצא שהכרעה כבר סגרה אותו — ⛔ לא כתיבת ממצא חדש ו⛔ לא עריכת נוסח.
   * ⛔ **הנוסח נדרש להיות מדויק** — `claude/for-roy.md` ⓐ נתן אותו מילה במילה, ומדובר
   * בהיתר שמעביר בעלות על קובץ שמוגן במפורש מלמעלה (`30-architecture` · `01-vision` · קוד).
   */
  it('PM: ⛔ 60-findings — היתר צר לתא סטטוס בלבד, ⛔ לא כתיבת ממצא (D-177, 01/09)', () => {
    const pm = text('PM');
    expect(pm, 'PM: הנוסח המדויק של STEP 5 אחרי הכרעת רוי ⓐ').toContain(
      'Never edit 30-architecture, 01-vision, or code. You may only edit 60-findings.md strictly to update the status cell (e.g., to V or ✅) for a finding that has already been resolved in a decision. Do not write new findings or alter their text.',
    );
    // ⛔ ⛔ הנוסח הישן (איסור גורף על 60-findings) ⛔ אינו חוזר — אחרת ⛔ ההרחבה בטלה.
    expect(pm, 'PM: ⛔ האיסור הגורף הישן ⛔ לא חוזר').not.toMatch(
      /⛔ Never `30-architecture`, `60-findings`, `01-vision`, or code\./,
    );
  });

  /**
   * ⛔ **01/09 · C-0379 — אצוות משימות (task batching), הוראת רוי.** ‏DEV מעבד שורת `T-xxx`
   * אחת בטיק; שורה שנפרסת לתת-סעיפים (a, b, c) חוסכת סבבי טיקים ריקים בין שינויים קטנים
   * ומקושרים באותו רכיב. ⛔ הכלל נבדק כאן כמו כל שאר טקסט הפרומפט — כלל שאיש לא אוכף
   * הוא כלל שנשכח בעריכה הבאה.
   */
  it('PM: כלל אצוות המשימות ב-STEP 5 — לקבץ שינויים קטנים לשורת T אחת עם תת-סעיפים', () => {
    const pm = text('PM');
    expect(pm, 'PM: נוסח כלל האצוות').toContain(
      'When writing tasks in 50-tasks.md, always group small, related changes within the same component into a single task row (T-xxx) using sub-bullets (a, b, c). The DEV agent processes only one row per tick, so make each row substantial yet safe to prevent idle ticks and maximize daily throughput.',
    );
  });

  /**
   * 🔴 **01/09 · חסם עומס (loop-overload emergency response), הוראת רוי.** DEV נתפס בטיקים
   * קודמים כותב קוד לפני שטען סקיל שהתג `[SKILL: X]` חייב, ואז «מוודא ציות» בדיעבד —
   * בדיוק ההצהרה-שלא-נבדקה ש-`RULES § 0.18` קיים נגדה. הכלל נבדק כאן, לא רק נכתב,
   * כי טקסט פרומפט שאין לו בדיקה הוא כלל שהעריכה הבאה יכולה למחוק בלי שאיש ישים לב.
   */
  it('DEV: STEP 4 — טעינת סקילים היא לפני קוד, ⛔ ואימות למפרע אסור (01/09, חסם עומס)', () => {
    const dev = text('DEV');
    expect(dev, 'DEV: הנוסח המדויק שהוראת רוי נתנה').toContain(
      'You MUST load and read all specified SKILL files *before* writing any code. Verifying compliance retroactively is strictly forbidden.',
    );
  });

  /**
   * 🔴 **01/09 · F-179 (C-0381) — DEV.md חייב תמיד `npm run generate-map`, אבל T-235
   * (בניית הסקריפט עצמו) ⛔ עדיין ⬜ בהרבה שיבוטים** ⇒ הצעד נכשל בכל טיק כזה. הכלל כאן
   * הופך אותו לתנאי, ⛔ ולא מוחלט, ומאמת שה«ONLY IF» לא נמחק בעריכה הבאה.
   */
  it('DEV: STEP 7 — generate-map רק אם הסקריפט קיים ב-package.json (01/09, F-179)', () => {
    const dev = text('DEV');
    expect(dev, 'DEV: התנאי המדויק').toContain(
      'Run `npm run generate-map` ONLY if the script exists in `package.json`.',
    );
    expect(dev, 'DEV: הפקודה המותנית').toContain('grep -q \'"generate-map"\' package.json');
  });

  /**
   * ⛔ **05/09 · T-167ⓔ · D-189 — the last open piece of the post-promotion check.**
   * ⓐⓑⓒ were already built (measured C-0439): the three-taps table exists, "please
   * review the site" is banned, and Roy's ❌ becomes a 🔴 finding quoting him
   * verbatim. ⓔ was the one gap: nothing told CRITIC the block does NOT grow
   * without bound. `D-189` resolved it — one dedicated `## POST-PROMOTION CHECK`
   * section that CRITIC REPLACES on every promotion, moving the outgoing section
   * (Roy's answer included, if he gave one) into the `## נסגר` table first. The
   * numbered escalation table in `RULES § 0.21` is untouched by this — this is
   * about the ONE section, ⛔ not about the numbered items.
   * ⇒ two things are pinned here: the prompt actually instructs the replace, and
   * the register — right now, in this clone — holds exactly one live section.
   */
  it('CRITIC: post-promotion check is one section CRITIC replaces, ⛔ not a list that grows (T-167ⓔ, D-189)', () => {
    const qa = text('CRITIC');
    expect(qa, 'CRITIC: the exact heading it must write').toContain('## POST-PROMOTION CHECK');
    expect(qa, 'CRITIC: replaces on every promotion, never a second live one').toMatch(
      /REPLACE this section on every promotion, ⛔ never append a second one/,
    );
    expect(qa, 'CRITIC: the outgoing section is closed BEFORE the new one is written').toMatch(
      /into the `## נסגר` table at the bottom of `plan\/03-for-roy\.md`/,
    );

    // ⛔ source scan of the register itself, ⛔ not just the prompt that describes it —
    // counts `## POST-PROMOTION CHECK` headings in the LIVE part (above `## נסגר`),
    // ⛔ not numbered items in the escalation table.
    const forRoy = readFileSync('plan/03-for-roy.md', 'utf8');
    const closedAt = forRoy.search(/^## נסגר/m);
    const live = closedAt === -1 ? forRoy : forRoy.slice(0, closedAt);
    const sections = live.split('\n').filter((l) => /^## .*POST-PROMOTION CHECK/.test(l));
    expect(sections.length, 'plan/03-for-roy.md: live POST-PROMOTION CHECK sections').toBe(1);
  });
});
