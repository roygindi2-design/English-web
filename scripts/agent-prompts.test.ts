import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { WORKSTREAMS } from '../lib/core/planTable';

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
const AGENTS = ['DEV', 'PM', 'QA', 'CONTENT'] as const;
/**
 * ⛔ **`PROMOTER` ⛔ אינו סוכן בנייה, ולכן הוא ⛔ אינו ב-`AGENTS`.** ⟦NEW 06/09 · הוראת רוי⟧
 * ארבעת הסוכנים שב-`AGENTS` חולקים חוזה אחד — נעילה, ענף עבודה, תור, שער דחיפה — וכל
 * טענה בקובץ הזה שרצה עליהם היא כלל מ-`RULES § 0.23`. ‏`PROMOTER` ⛔ אינו בונה, ⛔ אינו
 * פותח שורות, ⛔ אינו קורא תור, והוא הסוכן היחיד שנוגע ב-`main` ⇒ החלת 48 הטענות ההן
 * עליו הייתה **בודקת חוזה שהוא ⛔ אינו צד לו**.
 * ⚠️ ⛔ **וזה ⛔ אינו פטור מהכלל של § 9.9** («מה שנכתב לפרומפט אחד נכתב לארבעה»): מה
 * שמשותף לכולם — ⛔ אפס סוד בריפו, `${GITHUB_PAT}` כמצייה, ⛔ אפס טוקן ב-URL — נבדק על
 * **חמשת** הקבצים למטה, ו-`PROMOTER` מקבל בנוסף את הטענות על גבול הסמכות שלו.
 */
const PROMOTER = 'PROMOTER';
const ALL_PROMPTS = [...AGENTS, PROMOTER] as const;
const text = (name: string): string => readFileSync(join(DIR, `${name}.md`), 'utf8');

describe('docs/agents/*.md — הפרומפטים הם קובץ בריפו, ⛔ לא סוד במשימה מתוזמנת', () => {
  it('חמשת הפרומפטים קיימים, ו⛔ אין קובץ שישי שאיש לא מכיר', () => {
    const found = readdirSync(DIR)
      .filter((f) => f.endsWith('.md'))
      .map((f) => f.replace(/\.md$/, ''))
      .sort();
    /**
     * 🌉 ⟦09/09⟧ **`CRITIC.md` הוא גשר, ⛔ ולא פרומפט שישי.** הודעת הפתיחה של שתי
     * משימות ה-QA חיה **בשרת** ואומרת `Read docs/agents/CRITIC.md IN FULL`; ⛔ אין
     * לסוכן דרך לשנות אותה. ⇒ בלי הקובץ, כל טיק QA נעצר על קובץ חסר — **נמדד לפני
     * הפעלה, ⛔ ולא אחריה.** הטענה למטה מוודאת שהוא נשאר **מצביע ריק מהוראות**,
     * שזה מה שמפריד «גשר» מ«עותק שני שסוטה».
     */
    expect(found).toEqual([...ALL_PROMPTS, 'CRITIC'].sort());
    const bridge = readFileSync(join(DIR, 'CRITIC.md'), 'utf8');
    expect(bridge, 'הגשר מפנה ל-QA.md').toContain('docs/agents/QA.md');
    expect(bridge.length, '⛔ והוא ⛔ אינו מחזיק הוראות — גשר, ⛔ לא עותק').toBeLessThan(1600);
    for (const step of ['STEP 0', 'STEP 1', 'STEP 5', 'merge --ff-only']) {
      expect(bridge, `⛔ הגשר ⛔ אינו נושא «${step}»`).not.toContain(step);
    }
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
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      for (const [pattern, label] of SECRETS) {
        expect(body, `${a}: ⛔ ${label}`).not.toMatch(pattern);
      }
    }
    // ⛔ ומפתח ה-GitHub עדיין **נדרש כמצייה**, אחרת הסוכן ⛔ אינו יודע מה להחליף.
    for (const a of ALL_PROMPTS) expect(text(a), a).toContain('${GITHUB_PAT}');
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
    const qa = text('QA');
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
    expect(text('QA')).toContain('merge --ff-only work/current');
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
    for (const a of ['DEV', 'PM', 'QA'] as const) {
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
    const qa = text('QA');
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
    const qa = text('QA');
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
    const qa = text('QA');
    expect(qa, 'QA חייב לדעת שהוא הופך 🟣 ל-✅ אחרי מיזוג').toMatch(/FLIP 🟣 TO ✅/);
    expect(qa).toContain('origin/dev');
  });

  it('⛔ הנוסח שהוחלף ב-D-114 ⛔ אינו חוזר לאף פרומפט', () => {
    for (const a of ['DEV', 'QA'] as const) {
      const body = text(a);
      expect(body, `${a}: ⛔ «החוקה גוברת בגימור» חזר`).not.toMatch(
        /on finish, the constitution wins|בגימור.{0,20}החוקה גוברת/i,
      );
    }
    // ⛔ ⛔ ולא רק «אין את הישן» — **יש את החדש**, ואת ההחרגה היחידה.
    const dev = text('DEV');
    expect(dev).toMatch(/BINDING TOO/);
    // ⟦שוכתב 10/09⟧ «שכבה א׳» ⛔ אינה קיימת עוד — החוקה נכתבה מחדש בלי שכבות.
    // מה שהטענה באמת שומרת עליו ⛔ לא השתנה: **שער הנגישות גובר על הרנדר**, והוא
    // ההחרגה היחידה. ⇒ אותה טענה, בשם שהמאגר באמת נושא היום.
    expect(dev).toMatch(/THE ACCESSIBILITY GATES OVERRIDE|accessibility gates are the only carve-out/);
  });

  it('QA ⛔ אינו ממזג בזמן נעילה של **סוכן כלשהו**, ⛔ ולא רק DEV', () => {
    const qa = text('QA');
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
    expect(text('QA'), 'QA: המיזוג שלו').toContain('superpowers:finishing-a-development-branch');
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

  /**
   * 🔴 T-258 — measured `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 3:
   * all five feature workflows measured ⬜=0 at once and no rule forced PM into 📐
   * planning, so the loop idled on 🩺/💤 instead of cutting a new slice for five days.
   * Same pattern as `scripts/rules-citations.test.ts`'s "npm run verify has N commands"
   * guard: the condition is asserted to exist, word-for-word, in BOTH the rules
   * document and the agent prompt that must obey it — a wording drift between them is
   * exactly the defect class `D-190`/`RULES § 0.12` exists against.
   */
  it('🔴 T-258 — תכנון-חובה על חמישיית הזרימות כתוב זהה גם ב-RULES וגם ב-PM.md', () => {
    const rules = readFileSync('plan/RULES.md', 'utf8');
    const pm = text('PM');
    const FIVE_FLOWS = '`story` · `nav` · `cards` · `arena` · `studies`';
    expect(rules, 'RULES § 0.6: תנאי התכנון-חובה מזכיר את חמישיית הזרימות').toContain(FIVE_FLOWS);
    expect(pm, 'PM STEP 1.7: אותה חמישייה, מילה במילה').toContain(FIVE_FLOWS);
    expect(rules, 'RULES: התנאי מדבר על בו-זמנית').toContain('בו-זמנית');
    expect(pm, 'PM: גובר על IMPROVE ועל שקט').toMatch(/OUTRANKS 🩺 IMPROVE/);
  });

  /** ⛔ D-145 — QA כותב את החוב הנדחה **בזמן החתימה**, ⛔ ו-`36 § 13.1` ⛔ אינו משתנה. */
  it('QA נושא את הרגיסטר הנדחה, ⛔ ובלי לגעת בשלוש החותמות', () => {
    const qa = text('QA');
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
    const qa = text('QA');
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
    const qa = text('QA');
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
    const qa = text('QA');
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
    const qa = text('QA');
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

    /**
     * 🔴 **⟦08/09 · הוראה מפורשת של רוי⟧ הסיבה האמיתית של `F-189`, כשער.**
     *
     * ‏`F-189` נרשם כ«‏DEV ו-PM דילגו על האינדקס, או הפעילו `superpowers:using-superpowers`
     * בעיוורון». ⛔ **הם ⛔ לא דילגו.** נמדד 08/09 בסשן CCR: `ListPlugins` ⇒ `[]`,
     * ‏`SearchPlugins(['superpowers'])` ⇒ `[]` — **התוסף ⛔ אינו בקטלוג של רוי כלל**,
     * וכל שש המשימות המתוזמנות נושאות `enabled_plugins: []`. ⇒ 13 שורות באינדקס הפנו
     * ל«תוסף» שאינו קיים, ו-`docs/agents/*.md` הורה עליו **17 פעמים**, מתוכן ארבע
     * כ«⚡ לפני כל דבר אחר בסשן הזה» — בפתיחת **כל טיק**.
     *
     * ⇒ הסקילים הובאו לריפו (`skills/superpowers/**`), ⛔ והשער הזה הוא מה שמונע
     * מהניתוק לחזור **בשקט**: כל שורה שנושאת תג `superpowers:` **חייבת** להצביע על
     * קובץ בריפו. שורה שתחזור לומר «תוסף» ⛔ תיתפס כאן, ⛔ ולא בטיק.
     *
     * ⚠️ ⛔ **`ui-ux-pro-max` ⛔ אינו נתבע כאן, ובכוונה** — 3.3MB שנדרשים לפי תג ונדיר,
     * ולכן הוא נשאר על הענף הקבוע `skills/superpowers` ונקרא ב-`git show`. שורתו
     * ⛔ אינה נושאת נתיב בגרשיים, ולכן בדיקה ⓑ שמעל ⛔ אינה תובעת אותו.
     */
    it('ⓑ2 🔴 כל שורת `superpowers:` באינדקס מצביעה על קובץ בריפו — ⛔ ולא על «תוסף»', () => {
      // ⛔ ⛔ רק הטבלה החיובית. **הרשימה השלילית נושאת אף היא תגי `superpowers:`**
      // (`using-git-worktrees` חסום לארבעתם, ו-`finishing-a-development-branch` מוגבל
      // ל-QA) — ולאלה ⛔ אין נתיב בריפו **בכוונה**: סקיל חסום בהישג יד הוא מלכודת.
      // 📎 ⟦09/09⟧ שנים-עשר השורות עברו ל-`docs/skills-registry-superpowers.md` כשהאינדקס
      // הראשי עמד **465 תווים** מתחת לתקרת ה-14,000. ⇒ הטענה קוראת את **שני** הקבצים,
      // ⛔ ואינה מניחה באיזה מהם הן יושבות — פיצול עתידי נוסף ⛔ לא ישבור אותה בשקט.
      const files = ['docs/skills-registry.md', 'docs/skills-registry-superpowers.md'];
      const rows = files.flatMap((f) =>
        (readFileSync(f, 'utf8').split('### ⛔ הרשימה השלילית')[0] ?? '')
          .split('\n')
          // ⛔ ו⛔ לא שורת המצביע עצמה (`superpowers:*`) — היא הפניה, ⛔ לא סקיל.
          .filter((l) => l.startsWith('|') && l.includes('`superpowers:') && !l.includes('superpowers:*')),
      );

      // ⛔ שער שפוי: אם השורות נעלמו, הבדיקה חלולה ⇒ היא נופלת, ⛔ לא עוברת.
      expect(rows.length, '⛔ האינדקס ⛔ אינו נושא שורות superpowers').toBe(12);
      // 🔴 ⛔ והמצביע מהאינדקס הראשי חייב להתקיים, אחרת PM ⛔ לא ימצא את הקובץ השני.
      expect(registry(), 'האינדקס הראשי מפנה לקובץ שהופרד').toContain(
        'docs/skills-registry-superpowers.md',
      );

      for (const row of rows) {
        const tag = /`(superpowers:[a-z-]+)`/.exec(row)?.[1] ?? row.slice(0, 40);
        expect(row, `${tag}: ⛔ עדיין מפנה ל«תוסף» שאינו בקטלוג`).not.toContain('תוסף `superpowers`');
        const path = /`(skills\/superpowers\/[A-Za-z0-9._-]+\/SKILL\.md)`/.exec(row)?.[1];
        expect(path, `${tag}: ⛔ אין נתיב בריפו בעמודת «נתיב»`).toBeDefined();
        expect(readFileSync(path!, 'utf8').length, `${tag} ⇒ ${path}`).toBeGreaterThan(1000);
      }
    });

    it('ⓒ ‏PM מחויב לקרוא את האינדקס בתכנון, ולהצמיד תג לשורה שהוא גוזר', () => {
      const pm = text('PM');
      expect(pm, 'PM: הנתיב עצמו').toContain('docs/skills-registry.md');
      expect(pm, 'PM: הטריגר הוא מצב התכנון').toContain('STATE: PLANNING');
      expect(pm, 'PM: הצורה של התג').toContain('[SKILL:');
      expect(pm, 'PM: לאן התג נכתב').toContain('50-tasks.md');
    });

    it('ⓓ ‏DEV ו-QA מחויבים לטעון את הסקיל שהתג נוקב בו — לפני קוד ולפני סקירה', () => {
      for (const a of ['DEV', 'QA'] as const) {
        const t = text(a);
        expect(t, `${a}: התג`).toContain('[SKILL:');
        expect(t, `${a}: האינדקס`).toContain('docs/skills-registry.md');
        expect(t, `${a}: הנתיב האמיתי`).toContain('skills/taste-skill/SKILL.md');
      }
    });

    it('ⓔ 🔴 השער ⛔ אינו נפתח מבפנים — ⛔ DEV ו-QA ⛔ אינם כותבים את תא `סקיל`', () => {
      for (const a of ['DEV', 'QA'] as const) {
        expect(text(a), `${a}: ⛔ אינו כותב את התא`).toMatch(
          /⛔ \*\*(You|And you) ⛔ never write the `סקיל` cell/,
        );
      }
      // ⛔ וסקילי הבנייה נשארים חסומים ל-QA **גם** כשיש תג — אחרת התג הוא דלת אחורית.
      expect(text('QA'), 'QA: תג ⛔ אינו פותח סקיל בנייה').toMatch(
        /⛔ A `\[SKILL: X\]` tag ⛔ does not unblock them/,
      );
    });

    /**
     * 🚪 **שער הסקיל — 06/09, הנחיה חד-פעמית של רוי דרך סשן ארכיטקטורה (Cowork), C-0476.**
     *
     * הכשל שנמדד (ברמת התהליך): DEV ו-PM דילגו על `docs/skills-registry.md` בפתיחת הטיק,
     * או הפעילו את `superpowers:using-superpowers` בעיוורון כברירת מחדל, ודיווחו על כך
     * **בדיעבד** כ«פספוס תהליכי». ⇒ הכרעה בינארית מפורשת ומדווחת, **לפני** קוד/סקירה:
     * `[SKILL: <שם>] — כי …` או `[SKILL: none] — נבדק מול האינדקס …`.
     *
     * ⛔ הבדיקה סורקת את **שני** הקבצים יחד — בדיקה על קובץ אחד היא בדיוק הכשל של
     * `§ 8.4`: כלל שחי בכמה מקומות ונבדק באחד הוא כלל שנשבר בשאר.
     */
    describe('🚪 שער הסקיל — הכרעה בינארית לפני כל פעולה על המשימה  ⟦06/09 · C-0476⟧', () => {
      const GATE = ['DEV', 'PM'] as const;
      const HEAD = 'שער סקיל, לפני כל פעולה אחרת על המשימה';
      const TAIL = 'הוא קורה לפני קוד, לא אחריו.';
      const gateBlock = (a: (typeof GATE)[number]): string => {
        const t = text(a);
        const from = t.indexOf(HEAD);
        const to = t.indexOf(TAIL, from);
        expect(from, `${a}: כותרת השער`).toBeGreaterThan(-1);
        expect(to, `${a}: סוף השער`).toBeGreaterThan(from);
        return t.slice(from, to + TAIL.length);
      };

      it('ⓕ השער קיים בשני הקבצים, על ארבעת חלקיו — ⛔ לא באחד בלבד', () => {
        for (const a of GATE) {
          const g = gateBlock(a);
          expect(g, `${a}: קורא את האינדקס מול המשימה`).toContain('קרא את docs/skills-registry.md מול המשימה שנבחרה');
          expect(g, `${a}: אפשרות א — סקיל אחד, ורק הוא`).toContain('"[SKILL: <שם>] — כי <משפט אחד>"');
          expect(g, `${a}: אפשרות ב — none`).toContain(
            '"[SKILL: none] — נבדק מול האינדקס, אין סקיל ייעודי רלוונטי למשימה הזאת"',
          );
          expect(g, `${a}: ⛔ אין ברירת מחדל`).toContain(
            'אסור להפעיל superpowers:using-superpowers (או כל סקיל כללי אחר) כברירת מחדל בלי לעבור את השלב הזה קודם',
          );
          expect(g, `${a}: דיווח בדיעבד ⛔ אינו סוגר`).toContain('דיווח בדיעבד ("הייתי צריך להפעיל X") אינו סוגר את השלב');
        }
      });

      it('ⓖ הנוסח זהה מילה במילה ב-DEV וב-PM — מלבד מספר ה-STEP', () => {
        expect(gateBlock('DEV')).toEqual(gateBlock('PM'));
      });

      it('ⓗ השער קודם לקריאת `superpowers:using-superpowers` ולפרק הסקילים — ⛔ לא אחריהם', () => {
        for (const a of GATE) {
          const t = text(a);
          const gate = t.indexOf(HEAD);
          const general = t.indexOf('run `superpowers:using-superpowers`');
          expect(general, `${a}: הקריאה הכללית עדיין קיימת — STEP 4/3 ⛔ לא בוטל`).toBeGreaterThan(-1);
          expect(gate, `${a}: השער לפני הקריאה הכללית`).toBeLessThan(general);
          // ⛔ ומספר ה-STEP של השער עצמו נכתב בכותרת — הוא חלק מאנטומיית הטיק, ⛔ לא הערת שוליים.
          expect(t.slice(Math.max(0, gate - 80), gate), `${a}: כותרת STEP עשרונית`).toMatch(/STEP \d+\.\d+ —\s*$/);
        }
      });
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
      const qa = text('QA');
      expect(qa, 'QA: הערך').toContain('general');
      expect(qa, 'QA: החזרה לרצף היא שלו').toMatch(/still YOURS ALONE/);
      expect(qa, 'QA: מעבר ל-general ⛔ אינו חתימה').toMatch(/is ⛔ \*\*not\*\* a seal/);
    });
  });

  /**
   * 🧵 T-260 · `D-190 § 1.2` ⓑ — `ACTIVE_TASK_ID` becomes a queue, and the one
   * invariant that must survive the format change unchanged: DEV drains it by
   * reading, never by writing. A prompt that lost the "DEV never writes" line
   * while gaining "up to 3 ids" would read as more permission, not less.
   */
  describe('🧵 ACTIVE_TASK_ID כתור מנוהל — ⟦D-190 § 1.2 ⓑ · T-260⟧', () => {
    it('DEV יודע שהשדה הוא רשימה, וקורא אותה משמאל לימין', () => {
      const dev = text('DEV');
      expect(dev, 'DEV: פורמט הרשימה').toMatch(/ACTIVE_TASK_ID: \[T-xxx, T-yyy\]/);
      expect(dev, 'DEV: קריאה משמאל לימין, המזהה הראשון שעדיין ⬜').toMatch(
        /read the list left to right and take the FIRST id whose row is still ⬜/,
      );
    });

    it('⛔ DEV ⛔ אינו כותב לשדה — בשום פורמט', () => {
      const dev = text('DEV');
      expect(dev, 'DEV: איסור כתיבה נשאר').toMatch(
        /⛔ You ⛔ do NOT write to this field, in any format/,
      );
    });

    it('הסעיף מצוטט וקיים — `RULES § 0.28` ⛔ אינו ציטוט חלול', () => {
      const dev = text('DEV');
      expect(dev, 'DEV: מצטט את RULES § 0.28').toContain('RULES § 0.28');
      const rules = readFileSync('plan/RULES.md', 'utf8');
      expect(rules, 'RULES: הסעיף קיים בפועל').toMatch(/### 0\.28 ·/);
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
  /**
   * 🔴 **⟦09/09 · אישור אישי ומפורש של רוי⟧ ‏PM קיבל היתר לכתוב קוד — ⛔ צר, ⛔ ולא גורף.**
   *
   * 🔬 **המדידה שהצדיקה:** ב-24 שעות עד 09/09 כתב DEV **36** קומיטים ו-PM **2**, והטיק
   * האחרון של PM הפיק **⛔ אפס קוד** — בעוד `docs/plan-open.md` נשא **7 שורות `נוחות`
   * פתוחות**, ליטוש על פיצ׳רים ש-DEV כבר סיפק. ⇒ DEV היה הבנאי היחיד והתור נערם.
   *
   * 🔴 **ומה שכמעט מנע את זה — כלל של הלופ עצמו:** `C-0366` («⛔ השער אינו נפתח מבפנים»)
   * אוסר על DEV לכתוב לעצמו את תא `סקיל`, ו-ⓔ למטה **בודק את זה**. ⛔ אבל **PM הוא
   * שכותב את התג.** ⇒ היתר גורף היה נותן לו לפתוח שורה, לתייג אותה ולבנות אותה **בתנועה
   * אחת** — ⛔ אותו כשל בדיוק, קומה אחת מעל.
   *
   * ⇒ ולכן חמשת התנאים ⛔ אינם קישוט, והבדיקה הזאת דורשת את **כולם**: ⛔ ארבעה מתוך
   * חמישה הם ⛔ אפס מתוך חמישה. ⛔ **אל תרכך אף אחד מהם בלי מדידה חדשה.**
   */
  it('🔴 PM: היתר הקוד הצר — חמשת התנאים, ⛔ וכולם (09/09)', () => {
    const pm = text('PM');
    expect(pm, 'הפרק עצמו').toContain('STEP 5.5');
    // ⓐ סוג העבודה — ⛔ נוחות בלבד
    expect(pm, 'ⓐ נוחות בלבד').toMatch(/`סוג עבודה` is `נוחות`/);
    // ⓑ ⛔ לא שורה שנפתחה בטיק הזה — זה הסעיף שמונע «השער נפתח מבפנים»
    expect(pm, 'ⓑ טיק קודם').toMatch(/EARLIER tick, ⛔ never this one/);
    expect(pm, 'ⓑ במשפט אחד').toContain('⛔ you may not build a row you opened in the same tick');
    expect(pm, 'ⓑ הכלל שמאחוריו').toContain('C-0366');
    // ⓓ שלושת הנתיבים שנשארים של DEV
    for (const dir of ['lib/core/**', 'supabase/**', 'app/api/**']) {
      expect(pm, `ⓓ ${dir} ⛔ אינו של PM`).toContain(dir);
    }
    // ⓔ ⛔ אין פטור משער QA, ו-PM ⛔ אינו מסמן ✅ לעצמו
    expect(pm, 'ⓔ שער QA ללא פטור').toMatch(/QA's gate exactly like DEV's code/);
    expect(pm, '⛔ PM ⛔ אינו מסמן ✅').toMatch(/do ⛔ NOT mark it ✅/);
    // ⛔ והמכסה קודמת — אחרת PM החליף את התפקיד שלו בזה של DEV
    expect(pm, '⛔ מכסת הממצאים קודמת').toContain('D-164');
    // 🔴 והשורה הראשונה ⛔ אינה אומרת עוד «never write code» — אחרת היא סותרת את הפרק
    expect(pm.split('\n')[0], '⛔ הסתירה בשורה 1 הוסרה').not.toContain('You never write code');
  });

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
   * verbatim. ⓔ was the one gap: nothing told QA the block does NOT grow
   * without bound. `D-189` resolved it — one dedicated `## POST-PROMOTION CHECK`
   * section that QA REPLACES on every promotion, moving the outgoing section
   * (Roy's answer included, if he gave one) into the `## נסגר` table first. The
   * numbered escalation table in `RULES § 0.21` is untouched by this — this is
   * about the ONE section, ⛔ not about the numbered items.
   * ⇒ two things are pinned here: the prompt actually instructs the replace, and
   * the register — right now, in this clone — holds exactly one live section.
   */
  it('QA: post-promotion check is one section QA replaces, ⛔ not a list that grows (T-167ⓔ, D-189)', () => {
    const qa = text('QA');
    expect(qa, 'QA: the exact heading it must write').toContain('## POST-PROMOTION CHECK');
    expect(qa, 'QA: replaces on every promotion, never a second live one').toMatch(
      /REPLACE this section on every promotion, ⛔ never append a second one/,
    );
    expect(qa, 'QA: the outgoing section is closed BEFORE the new one is written').toMatch(
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

  /**
   * 🔴 **⟦NEW 06/09 · `F-185` · Roy's explicit instruction⟧ ⛔ NO TOKEN IN A GIT URL.**
   *
   * ⚠️ **What this is actually guarding, and why a rule in prose was not enough.**
   * `F-120` (a live Supabase token in public git history) and `F-166` (three days
   * of `dev` builds failing on `Exposed secrets detected`) were both the SAME
   * shape: a secret written where it could be read. A token concatenated into a
   * remote URL is in `argv`, in the process table, in `git remote -v`, and in
   * every error line git prints. ⇒ the ban is a TEST, ⛔ not a paragraph.
   *
   * ⇒ the prompts may still SHOW the forbidden form — that is how an agent learns
   * to recognise it — so the assertion is: any line that concatenates the token
   * into a URL must be marked ⛔, ⛔ never offered as a command to run.
   */
  it('⛔ no agent prompt offers a token-in-URL git command (F-185)', () => {
    for (const a of AGENTS) {
      const offending = text(a)
        .split('\n')
        .filter((l) => /\$\{GITHUB_PAT\}@/.test(l))
        .filter((l) => !l.includes('⛔'));
      expect(offending, `${a}: token concatenated into a URL on an unmarked line`).toEqual([]);
    }
  });

  /**
   * The other half: the clone each prompt actually tells the agent to run must be
   * the CLEAN url. ⛔ A ban on `push` alone leaves the same secret in the same
   * process table one command earlier.
   */
  it('every STEP 0 clones a clean URL (F-185)', () => {
    for (const a of AGENTS) {
      expect(text(a), `${a}: clean clone URL`).toContain(
        'git clone -b work/current https://github.com/roygindi2-design/English-web.git repo',
      );
    }
  });

  /**
   * 🔴 **⟦08/09 · הוראה מפורשת של רוי⟧ ההנחה התהפכה, ⛔ ולכן גם השער.**
   *
   * עד היום הבדיקה הזאת דרשה ש**כל** פרומפט **יישא** עוזר askpass ויְיצא `GIT_ASKPASS` —
   * הנוהל של הסנדבוקס הלגסי. ⛔ **המסלול הזה ⛔ אינו קיים עוד:** כל שש המשימות המתוזמנות
   * רצות ב-Claude Code Remote, שם **הפרוקסי הוא האישור**.
   *
   * 🔬 **נמדד חי 08/09 בסשן CCR, אותו ריפו:** `git ls-remote --heads origin` ⇒ יציאה **0**,
   * `./scripts/g ls-remote --heads origin` ⇒ יציאה **0**, `$HOME/.git-askpass.sh` ⛔ **אינו
   * קיים**, ו-`GITHUB_TOKEN` שווה מילולית לסמן `proxy-injected` (אומת בהשוואת `sha256`,
   * ⛔ לא בהדפסת ערך) ⇒ **שני** סמני הזיהוי של `scripts/g` חיים, ⛔ ולא אחד.
   *
   * ⇒ בלוק שכותב סוד לדיסק היה מכאן ואילך ⛔ **קוד מת** — **וגם** הצורה האחת שמסווג
   * הרשאות רואה ומסרב לה. ⇒ ⛔ **הוא נמחק, ⛔ ולא הוסווה.** והשער שהגן עליו הפך לשער
   * שאוסר אותו: ⛔ **אותה עוצמה בדיוק, כלל הפוך.**
   *
   * ⚠️ ⛔ **אל תרכך את זה ל-`toContain` יחיד.** ארבעת הביטויים תופסים ארבע צורות שונות
   * של אותו כשל, וסוכן שממציא אחת מהן ⛔ אינו מעתיק את השלוש האחרות.
   */
  it('🔴 ⛔ אף פרומפט ⛔ אינו כותב סוד לדיסק — ⛔ ולא רק ⛔ אינו שם אותו ב-URL', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      expect(body, `${a}: ⛔ כתיבת הטוקן לקובץ`).not.toMatch(/printf[^\n]*GITHUB_PAT[^\n]*>/);
      expect(body, `${a}: ⛔ chmod על קובץ סוד`).not.toMatch(/chmod [67]00 "\$HOME/);
      expect(body, `${a}: ⛔ עוזר askpass על הדיסק`).not.toContain('$HOME/.git-askpass.sh');
      expect(body, `${a}: ⛔ ביטול פרוקסי — ב-CCR הפרוקסי הוא האישור`).not.toMatch(
        /export[^\n]*https_proxy=/,
      );
    }
  });
});

/**
 * ⛔ **הכרעות 100 · 101 · 22 — 06/09, הוראה מפורשת של רוי.** שלושתן חיות בטקסט של
 * הפרומפטים, ולכן ⛔ אין להן ראיה מלבד בדיקה. פרומפט שחזר לנוסח הישן הוא לופ ששקט
 * בלי שאיש ידע — בדיוק הכשל של 04/09–06/09.
 */
describe('docs/agents/*.md — שער ה-verify, סוף הנסיגה השקטה, וזמני המסלולים', () => {
  const ALL = ['DEV', 'PM', 'QA', 'CONTENT'] as const;

  it('⛔ אף פרומפט ⛔ אינו מורה עוד על יציאה שקטה (הכרעה 101)', () => {
    for (const a of ALL) {
      expect(text(a), `${a}: ⛔ «exit silently» חזר`).not.toMatch(/exit (?:immediately and )?silently/i);
    }
  });

  it('שלושת הסוכנים שנסוגים מדווחים שורת סיבה עם מחזיק, גיל נעילה ומספר קומיטים', () => {
    for (const a of ['DEV', 'PM', 'CONTENT', 'QA'] as const) {
      const body = text(a);
      expect(body, `${a}: שורת הנסיגה`).toContain('יציאה מוקדמת — נעילה של');
      expect(body, `${a}: מי מחזיק`).toContain('LOCK_HELD_BY');
      expect(body, `${a}: גיל הנעילה`).toContain('LOCK_AT');
      expect(body, `${a}: מספר הקומיטים`).toContain('origin/dev..origin/work/current');
    }
  });

  /**
   * ⛔ **Smart Wait — 06/09, הוראה מפורשת של רוי.** נסיגה מנעילה זרה ⛔ אינה
   * מיידית עוד: `sleep 180`, קריאה חוזרת של `plan/00-control.md`, ורק אם עדיין
   * תפוסה — נסיגה עם שורת הדיווח. הספים עצמם (DEV 90 דק׳, השאר 30) ⛔ לא השתנו.
   */
  it('ארבעת הפרומפטים ממתינים 3 דקות ובודקים שוב לפני נסיגה מנעילה זרה (Smart Wait)', () => {
    for (const a of ALL) {
      const body = text(a);
      expect(body, `${a}: Smart Wait מוזכר`).toMatch(/Smart Wait/);
      expect(body, `${a}: sleep 180`).toContain('sleep 180');
      expect(body, `${a}: קריאה חוזרת של 00-control.md`).toMatch(/re-read `plan\/00-control\.md`/);
    }
  });

  it('ארבעת הפרומפטים מכירים את שער ה-verify בדחיפה (הכרעה 100)', () => {
    for (const a of ALL) {
      const body = text(a);
      expect(body, `${a}: התקנת ההוק`).toContain('npm run hooks:install');
      expect(body, `${a}: מוצא החירום המוצהר`).toContain('SKIP_VERIFY');
      expect(body, `${a}: הבדיקה שמודדת`).toMatch(/check 16|בדיקה 16/);
    }
  });

  /**
   * ⛔ **הכרעה 22 — ההצהרה חייבת להתאים למה שנמדד בשרת.** המודל והשעות יושבים
   * בהגדרת המשימה המתוזמנת ⛔ ולא בריפו; זו בדיוק הסיבה שהם מוצהרים כאן.
   * נמדד ב-`list_triggers` ב-06/09 14:41Z.
   */
  it('זמני שני מסלולי QA בקובץ הם הזמנים שנמדדו בשרת (הכרעה 23)', () => {
    const qa = text('QA');
    // ⚠️ ⟦09/09⟧ ארבע ⇒ **שמונה**, באישור מפורש של רוי. QA-שער מיזג 4 פעמים ביום מול
    // 12 חלונות של DEV ⇒ `main..dev` הגיע ל-80. הטענה עוקבת אחרי המדידה, ⛔ לא להפך.
    expect(qa, 'שער — שמונה יריות').toContain('01:55Z · 04:55Z · 07:55Z · 10:55Z · 13:55Z · 16:55Z · 19:55Z · 22:55Z');
    expect(qa, '⛔ ארבע היריות הישנות ⛔ לא חזרו').not.toContain('01:45Z · 07:45Z · 13:45Z · 19:45Z');
    expect(qa, 'מלא — ארבע יריות').toContain('05:15Z · 11:15Z · 15:15Z · 21:15Z');
    expect(qa, '⛔ הזמנים הישנים ⛔ לא חזרו').not.toContain('05:00Z and 23:00Z');
  });

  /**
   * 🔓 **`D-203` — הקידום `dev`⇢`main` מנותק מעבודת `work`⇢`dev`.** ⟦NEW 08/09 · הוראת רוי⟧
   *
   * ⛔ **שדה אחד בשתי משמעויות הוא הנזילה, ⛔ ולא השם.** עד 08/09 QA כתב «מה שחוסם את
   * המיזוג» ו-PROMOTER כתב «מה שחוסם את הקידום» לאותה שורה בדיוק, ו-`DEV.md` הורה לקחת
   * אותה **FIRST, before anything else** ⇒ חסם סביבה על `dev`⇢`main`, שאף סוכן בונה
   * ⛔ אינו יכול לסגור, נכנס לראש תור DEV. ⇒ שני שדות, שני בעלים, ⛔ ואפס חפיפה.
   */
  it('שדה החוסמים מפוצל: DEV קורא MERGE_BLOCKERS ו⛔ אינו יודע על PROMOTION_BLOCKERS (D-203ⓒ)', () => {
    for (const a of ALL_PROMPTS) {
      expect(text(a), `${a}: ⛔ השם המאוחד חזר`).not.toContain('RELEASE_BLOCKERS');
    }
    const dev = text('DEV');
    expect(dev, 'DEV: קורא את חסם המיזוג').toContain('MERGE_BLOCKERS');
    // ⛔ המופע היחיד המותר ב-DEV הוא האיסור עצמו — ⛔ לא הוראת קריאה.
    expect(dev, 'DEV: נאסר עליו במפורש').toMatch(/`PROMOTION_BLOCKERS` is ⛔ NOT yours/);
    expect(text('QA'), 'QA: כותב את חסם המיזוג').toContain('MERGE_BLOCKERS');
    expect(text('PROMOTER'), 'PROMOTER: חסם הקידום').toContain('PROMOTION_BLOCKERS');
  });

  /**
   * ⛔ **`NEXT_AGENT=HUMAN` עוצר את חמשת הסוכנים.** ⇒ כשל פריסה — שורת PROMOTER בלבד —
   * היה מכבה לופ שלם על משהו שלאף סוכן בונה ⛔ אין בו נגיעה. `F-200` כבר מדד שהבדיקה
   * ⛔ אינה יכולה לרוץ כאן כלל (403 `CONNECT tunnel failed`, 14 ניסיונות).
   */
  it('כשל בדיקת עשן ⛔ אינו מדליק NEXT_AGENT=HUMAN, ודומיין חסום ⛔ אינו «עבר» (D-203ⓑ)', () => {
    // ⛔ **שורה שאוסרת ⛔ אינה שורה שמורה.** הטענה נקראת שורה-שורה כי הטקסט שמכיל את
    // האיסור מכיל בהכרח גם את המחרוזת עצמה — רגקס על הקובץ כולו היה נופל על האיסור.
    const FORBIDS = /⛔ ?not |⛔ NOT |never |⛔ אינו|⛔ אין/i;
    for (const a of ['QA', 'PROMOTER'] as const) {
      const body = text(a);
      const offenders = body
        .split('\n')
        .filter((l) => /NEXT_AGENT[:=] ?`?HUMAN/.test(l))
        .filter((l) => /health|smoke|deploy|עשן|פריסה/i.test(l))
        .filter((l) => !FORBIDS.test(l));
      expect(offenders, `${a}: כשל פריסה מדליק NEXT_AGENT=HUMAN ⇒ עוצר חמישה סוכנים`).toEqual([]);
      expect(body, `${a}: האיסור מוצהר`).toMatch(/`D-203`ⓑ/);
      expect(body, `${a}: «⛔ לא נמדד» מוצהר`).toContain('⛔ לא נמדד');
    }
  });

  it('⛔ אף פרומפט ⛔ אינו קורא לקידום «פעולה ידנית של רוי» עוד (D-203ⓔ)', () => {
    for (const a of ALL_PROMPTS) {
      expect(text(a), `${a}: נוסח שלפני 06/09 חזר`).not.toMatch(/promotion is Roy's manual action/i);
    }
  });

  /**
   * 🔴 **צינור על פקודת שער מחזיר את קוד היציאה של `tail`, ⛔ לא של הפקודה.**
   *
   * ⛔ **וזו ⛔ אינה מחלקת כשל חדשה — היא כבר מוכרת ונבדקת במאגר הזה,** ‏`scripts/g.test.ts`:
   * «execs git rather than wrapping it in a subshell that swallows the exit code». ⇒ מה
   * שחסר ⛔ אינו הידע, אלא **ההכללה**: `npm run verify | tail -20` מסיים ב-`0` גם כשהבנייה
   * נפלה, ומדווח «ירוק» על ריצה אדומה. `scripts/hooks/pre-push` עצמו נקי (`if ! npm run
   * verify; then`), ⇒ השער האמיתי תקין — מה ש⛔ לא היה מוגן הוא ה**טקסט** שסוכן מעתיק ממנו.
   *
   * ⚠️ **הטענה נבנתה נגד טקסט עתידי, ⛔ ולא כדי למחוק טקסט קיים:** ⛔ אף מופע ⛔ לא היה
   * בסקריפט או בפרומפט — שבעת המופעים חיו ב-`docs/superpowers/plans/**`, ומשם DEV קורא
   * הוראות בנייה. ⛔ נגענו בצורת הפקודה בלבד; ⛔ אף ציטוט, מדידה או מספר ⛔ לא שונה.
   */
  const EXIT_SWALLOWED =
    /npm (?:run )?(?:verify|test|build|typecheck|lint|check:[a-z:-]+|loop:health|measure:[a-z-]+)\b[^\n`]*\|\s*(?:tail|head|tee|grep|cut|sed|awk)\b/;

  const swallowingLines = (body: string): string[] =>
    body.split('\n').filter((l) => EXIT_SWALLOWED.test(l));

  it('⛔ אף פרומפט ⛔ אינו מדגים פקודת שער שקוד היציאה שלה נבלע בצינור', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      // ⛔ טענה חיובית תחילה — אחרת פרומפט ש⛔ אינו מזכיר את השער כלל «עובר» בריק.
      expect(body, `${a}: השער עצמו מוזכר`).toMatch(/npm run verify/);
      expect(swallowingLines(body), `${a}: צינור בולע קוד יציאה`).toEqual([]);
    }
  });

  /**
   * 🗂️ **וגם התוכניות — כי DEV קורא מהן פקודות ומריץ אותן כלשונן.** נמדד 08/09: שבעה
   * מופעים חיים, הגרוע `2026-08-20-flashcard-interaction.md` — חמש פקודות שער ברצף
   * שהסתיימו ב-`| tail -20`, כלומר `exit 0` מובטח.
   */
  /**
   * 🪝 **`F-195` · `T-277` — ההוק מותקן לפני קומיט הלוק, ⛔ ולא אחריו.**  ⟦NEW 08/09⟧
   *
   * ‏`.git/hooks/` ⛔ אינו חלק מ-`git clone`, וכל טיק הוא קלון טרי. עד 08/09 ההוק הגיע רק
   * עם `npm install` — שרץ **צעדים אחרי** דחיפת הלוק ⇒ **הקומיט הראשון של כל טיק, בכל
   * קלון, נדחף בלי שער `verify` בכלל.** נמדד: `b872b19` (קומיט לוק) ⛔ ללא חותמת, מול
   * `cbba5c1` ו-`87ca9fd` באותו טיק — `verify: exit 0`.
   *
   * ⛔ **הטענה היא על סֵדֶר, ⛔ ולא על נוכחות** — `:978` כבר בודקת שהמחרוזת קיימת, וזה
   * בדיוק מה שלא הספיק: היא הייתה קיימת כל הזמן, 84–335 שורות **אחרי** הדחיפה.
   */
  it('חמשת הפרומפטים מתקינים את ההוק לפני קומיט הלוק, ⛔ ולא אחריו (F-195 · T-277)', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      const install = body.indexOf('npm run hooks:install');
      const lockPush = body.indexOf('push immediately');
      expect(install, `${a}: ⛔ אין התקנת hook כלל`).toBeGreaterThan(-1);
      expect(lockPush, `${a}: ⛔ אין דחיפת לוק מזוהה`).toBeGreaterThan(-1);
      expect(install, `${a}: ההוק מותקן אחרי דחיפת הלוק ⇒ הקומיט הראשון ללא שער`).toBeLessThan(
        lockPush,
      );
    }
  });

  /**
   * 📓 **`T-280`ⓒ — חמשת הסוכנים מחויבים בשורת יומן על ריצה בלי קומיט עבודה.**  ⟦NEW 08/09⟧
   *
   * ⛔ **עד 08/09 רק PROMOTER חויב** (`RULES § 0.29 ו׳`), ⇒ **סוכן שנחסם כדין נראה מבחוץ
   * זהה לסוכן מת.** נמדד: CONTENT — שלושה חלונות רצופים, ריצות `SUCCEEDED`, אפס קומיטים,
   * ⛔ כי `F-194` חוסם כל אצווה; PM — 23 שעות.
   * ⚠️ **ו«⛔ NEVER silently» ש⛔ כבר היה בארבעת הפרומפטים ⛔ אינו זה:** הוא מייצר טקסט
   * בפלט הסשן, ו-`git log` הוא הדבר היחיד שבדיקה 17 יכולה לקרוא.
   */
  /**
   * 🧭 **`QA.md` ⛔ לא אמר למי ממצא מנותב — וזו הסיבה המבנית ל-31:1.**  ⟦NEW 08/09⟧
   *
   * 🔬 נמדד 08/09: חיפוש `owner`·`route`·`פתוח →` ב-`QA.md` ⇒ **0 תוצאות**, בעוד
   * `plan/60-findings.md` נושא **58** מופעים של `פתוח →`. ⇒ הקונבנציה עברה **בחיקוי
   * שורה שכנה**, והתוצאה: **31 מתוך 40** הממצאים הפתוחים בבעלות PM מול **1** ל-DEV —
   * ו-**19 מהם** נוקבים נתיב תחת `app/` או `components/`, כלומר יושבים בתור של הסוכן
   * היחיד ש⛔ אינו רשאי לכתוב קוד (`PM.md:1`).
   * ⇒ ⛔ **⛔ לא כשל של PM — משפט חסר בקובץ של QA.**
   */
  it('QA.md מורה למי ממצא מנותב — שלושת היעדים, ⛔ לא חיקוי שורה שכנה', () => {
    const qa = text('QA');
    expect(qa, 'ניתוב ל-DEV').toMatch(/⬜ פתוח → \*\*DEV\*\*/);
    expect(qa, 'ניתוב ל-PM').toMatch(/⬜ פתוח → \*\*PM\*\*/);
    expect(qa, 'ניתוב לרוי').toMatch(/⬜ פתוח → \*\*רוי\*\*/);
    expect(qa, 'המבחן הוא מה סגירתו דורשת').toMatch(/touches CODE/);
    // ⛔ QA ⛔ אינו מנתב לעצמו — הוא מתייק, ⛔ ולא בונה.
    expect(qa, '⛔ QA ⛔ אינו נמען').toMatch(/⛔ do not route a finding to yourself/i);
  });

  /**
   * 🩺 **`F-204` · `T-279` — ההליכה במוצר רצה מול `next start`, ⛔ ולא `next dev`.** ⟦NEW 08/09⟧
   *
   * 🔬 נמדד: בסביבת CCR `npx next dev` מחזיר **403 על כל chunk שבקשתו נושאת כותרת
   * `Origin`** ⇒ הדף נצבע, ⛔ שום דבר ⛔ אינו עולה (hydration), והליכה שמקישה על משהו
   * מודדת מוצר ש⛔ אינו קיים. ⛔ **צילום של דף מת ⛔ אינו הליכה.**
   * ⇒ `next start` מגיש את **בניית הייצור** — בדיוק מה ש-`scripts/verify-mobile.mjs`
   * עושה מאז ומתמיד, ⇒ ההליכה סוף-סוף תואמת את השער.
   */
  it('⛔ אף פרומפט ⛔ אינו מריץ next dev — ההליכה היא מול next start (F-204)', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      const runs = body
        .split('\n')
        .filter((l) => /`?(npx |npm run )?next dev/.test(l))
        .filter((l) => !/⛔|403|F-204|pkill/.test(l));
      expect(runs, `${a}: ⛔ next dev חזר כפקודה`).toEqual([]);
    }
    for (const a of ['DEV', 'PM', 'QA'] as const) {
      expect(text(a), `${a}: ההליכה מול next start`).toMatch(/npx next start -p 3000/);
      expect(text(a), `${a}: build קודם — אחרת ⛔ אין מה להגיש`).toMatch(/npm run build && \(npx next start/);
    }
  });

  /**
   * 🚢 **`T-279` — לבדיקת העשן שני חצאים, ו⛔ אף אחד ⛔ אינו מחליף את השני.**
   * ① מחבר Netlify מוכיח ש**הבנייה עלתה על ה-SHA שקודם**; ② `/api/health` מוכיח
   * ש**המוצר עונה**. ⛔ `state: ready` על פונקציות שכולן 500 הוא עדיין `ready`.
   */
  it('PROMOTER בודק גם את commit_ref של הפריסה, וגם שהמוצר עונה (T-279)', () => {
    const pr = text('PROMOTER');
    expect(pr, 'מחבר Netlify').toMatch(/get-deploy-for-site/);
    expect(pr, 'ה-SHA שקודם, ⛔ לא «main»').toMatch(/commit_ref/);
    expect(pr, 'עדיין דורש את המוצר החי').toMatch(/api\/health/);
    expect(pr, '⛔ ready ⛔ אינו מחליף בדיקה חיה').toMatch(/⛔ does ⛔ NOT say the product answers/);
    expect(pr, 'חסם רשת ⇒ «⛔ לא נמדד»').toMatch(/connect_rejected/);
  });

  /**
   * 🧑‍⚖️ **ההרשאה העומדת של PROMOTER — ⛔ ושתי הצלעות שלה ⛔ אינן ניתנות להפרדה.** ⟦NEW 09/09⟧
   *
   * הפסקה קיימת כדי שהקידום ייקרא כ**התנהגות מכוונת של בעל הריפו**, ⛔ ולא כיוזמה של
   * סוכן — וזו כל הסיבה שהסוכן הזה קיים. ⛔ **אבל הרשאה בלי גבול היא הרשאה אחרת:**
   * הגבול (⛔ אין force · ⛔ אין ניסוח מחדש · סירוב הוא סופי לריצה) הוא **חלק ממנה**,
   * ⛔ ולא הסתייגות עליה. ⇒ הבדיקה טוענת על **שתיהן**; אחת בלי השנייה ⛔ אינה עוברת.
   */
  it('PROMOTER נושא את ההרשאה העומדת ואת הגבול שלה — שתיהן, ⛔ לא אחת', () => {
    const pr = text('PROMOTER');
    expect(pr, 'ההרשאה מוצהרת').toMatch(/STANDING AUTHORISATION/);
    expect(pr, 'ושהיא שלוש הפקודות האלה, ⛔ ולא רשות כללית').toMatch(
      /these three, in this order/,
    );
    expect(pr, '⛔ הגבול: סירוב הוא סופי לריצה').toMatch(/refusal is FINAL for this run/);
    expect(pr, '⛔ ⛔ ואין ניסוח מחדש').toMatch(/not\s+rephrase it/);
    expect(pr, 'וסירוב מותיר ראיה קריאה').toMatch(/PROMOTION_BLOCKERS/);
    // ⛔ ההרשאה ⛔ אינה מטפסת לסוכנים אחרים.
    for (const a of ['DEV', 'PM', 'QA', 'CONTENT'] as const) {
      expect(text(a), `${a}: ⛔ ההרשאה ⛔ אינה שלו`).not.toMatch(/STANDING AUTHORISATION/);
    }
  });

  it('חמשת הפרומפטים מחויבים בשורת יומן על ריצה בלי קומיט עבודה (T-280ⓒ)', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      expect(body, `${a}: היעד`).toContain('plan/archive/control-log.md');
      expect(body, `${a}: הצורה שבדיקה 17 מזהה`).toMatch(/idle — <the reason/);
      expect(body, `${a}: ⛔ ולא דרך מוצא החירום`).toMatch(/⛔ never `SKIP_VERIFY=1` for it/);
    }
  });

  it('⛔ אף תוכנית ב-docs/superpowers/plans ⛔ אינה מדגימה פקודת שער עם קוד יציאה בלוע', () => {
    const dir = 'docs/superpowers/plans';
    const plans = readdirSync(dir).filter((f) => f.endsWith('.md'));
    expect(plans.length, '⛔ אין תוכניות — הבדיקה הייתה עוברת בריק').toBeGreaterThan(0);
    const offenders = plans.flatMap((f) =>
      swallowingLines(readFileSync(join(dir, f), 'utf8')).map((l) => `${f}: ${l.trim()}`),
    );
    expect(offenders, 'צינור בולע קוד יציאה בתוכנית').toEqual([]);
  });
});

/**
 * 🚢 **`docs/agents/PROMOTER.md` — הסוכן היחיד שנוגע ב-`main`.**  ⟦NEW 06/09 · הוראת רוי⟧
 *
 * ⛔ **למה יש כאן בדיקות בכלל, ולמה הן ⛔ אינן בדיקות סגנון.** עד היום הקידום ל-`main`
 * היה **פעולה של רוי** (`RULES § 0.1 ב׳`), וזה היה שער אנושי: מישהו הסתכל לפני שמשהו
 * עלה לאוויר. ⇒ ברגע שהשער הזה עובר לסוכן, **שתי ההגנות היחידות שנשארו הן ⓐ שהוא ⛔ לא
 * ידלג על `verify` ועל בדיקת העשן, ו-ⓑ שהוא ⛔ לא יכריע במה שרוי שמר לעצמו.** שתיהן
 * טקסט בפרומפט, וטקסט בפרומפט ⛔ אינו חוזה עד שמשהו מודד אותו — זה השיעור של § 8.4,
 * שמונה פעמים.
 */
describe('docs/agents/PROMOTER.md — גבול הסמכות ושער הקידום', () => {
  const body = text(PROMOTER);

  it('רשימת ההחרגה קיימת במלואה — שבעה סעיפים, ⛔ ולא שישה', () => {
    for (const rule of [
      'Any design decision at all',
      'Scheduling',
      'brake',
      'D-101',
      'product direction',
      'licences',
      'word_progress',
    ]) {
      expect(body, `⛔ החרגה חסרה: ${rule}`).toContain(rule);
    }
  });

  it('שער הקידום ⛔ אינו ניתן לדילוג — verify · ff-only · בדיקת עשן', () => {
    expect(body, 'תשע הפקודות').toContain('npm run verify');
    expect(body, 'ff-only בלבד').toContain('--ff-only');
    expect(body, 'בדיקת עשן חובה — RULES § 0.1 ד׳').toContain('/api/health');
    expect(body, 'התוצאה הנדרשת').toContain('"ok": true');
    expect(body, 'כישלון עשן ⇒ בן אדם').toContain('NEXT_AGENT: HUMAN');
    // ⛔ מוצא החירום של הכרעה 100 ⛔ אינו שלו — הוא קיים כדי ש-verify שבור לא ינעל את
    // הריפו, ⛔ ולא כדי לשלוח מעבר לשער אדום.
    expect(body, '⛔ SKIP_VERIFY ⛔ אינו שלו').toMatch(/`SKIP_VERIFY=1` is ⛔ NEVER yours/);
  });

  it('הבלמים שהוא ⛔ אינו רשאי לעקוף מוזכרים במפורש', () => {
    expect(body, 'תקרת הפריסות החודשית').toContain('PROMOTIONS_THIS_MONTH');
    expect(body, '⛔ לא יותר מאחת ליממה').toMatch(/one in 24 hours|24 hours/);
    expect(body, 'תקרת 00-control').toContain('12,288');
    expect(body, 'תקרת ההכרעות').toMatch(/THREE decisions per run/);
  });

  it('הוא כותב שורת יומן בכל ריצה — אחרת בדיקה 17 מודדת אותו כמת', () => {
    expect(body, 'תחילית הקומיט שבדיקה 17 מחפשת').toContain('loop(PROMOTER)');
    expect(body, 'היעד').toContain('plan/archive/control-log.md');
    expect(body, 'גם בריצה שקטה').toMatch(/EVERY RUN, INCLUDING THE QUIET ONES/);
  });

  it('⛔ אינו סוכן בנייה — האיסור כתוב, ⛔ ולא מונח', () => {
    expect(body, '⛔ לא כותב קוד מוצר').toMatch(/⛔ NOT A BUILDING AGENT/);
    expect(body, '⛔ לא נוגע בתורים').toContain('plan/50-tasks.md');
  });
});

/**
 * ⛔ **אוצר המילים של הזרימה — מקור אחד, שלושה עותקים, ו⛔ אף שער.**
 * נמדד 09/09 על שיבוט חי: `plan/RULES.md § 0.6ב` ו-`docs/agents/PM.md` נקבו **חמישה**
 * ערכים בלי `cards`, `amirnet` ו-`general`; `docs/agents/DEV.md` נקב **תשעה** בלי
 * `amirnet`; ו-`lib/core/planTable.ts` — המקור שהמכונה קוראת — נוקב **עשרה**.
 * ⇒ PM שכתב שורה מתויגת `cards` ⛔ לא מצא את התג בחוקה שלו, ו-DEV שסינן לפי
 * `ACTIVE_WORKSTREAM=amirnet` ⛔ לא מצא את הזרימה באף אחד משני הקבצים שהוא קורא.
 * ⛔ **שלוש רשימות שאיש ⛔ אינו משווה ⛔ אינן אוצר מילים סגור — הן שלוש דעות.**
 * ⇒ הטענה למטה היא השער: כל ערך ב-`WORKSTREAMS` חייב להופיע בשורת «זרימה» של שלושת
 * הקבצים, ו⛔ אף טוקן שאינו בו ⛔ אינו רשאי להופיע שם.
 */
describe('אוצר המילים של הזרימה זהה בשלושת המקומות שקוראים אותו (§ 0.6ב)', () => {
  const SOURCES: ReadonlyArray<readonly [string, string]> = [
    ['plan/RULES.md', 'plan/RULES.md'],
    ['docs/agents/PM.md', join(DIR, 'PM.md')],
    ['docs/agents/DEV.md', join(DIR, 'DEV.md')],
  ];

  /** השורה היחידה בקובץ שהתא הראשון בה הוא `**זרימה**` — טבלת אוצר המילים. */
  const flowRow = (file: string): string => {
    const line = readFileSync(file, 'utf8')
      .split('\n')
      .find((l) => l.trimStart().startsWith('| **זרימה**'));
    expect(line, `${file}: ⛔ אין שורת «זרימה» בטבלת אוצר המילים`).toBeTruthy();
    return line as string;
  };

  /** הטוקנים בתוך גרשי-אחור בשורה — ⛔ הפרוזה שסביבם ⛔ אינה נספרת. */
  const backticked = (line: string): string[] =>
    [...line.matchAll(/`([a-z]+)`/g)].map((m) => m[1] ?? '');

  for (const [label, file] of SOURCES) {
    it(`${label} נוקב את כל עשרת הערכים של WORKSTREAMS, ו⛔ לא ערך מומצא`, () => {
      const tokens = backticked(flowRow(file));
      for (const w of WORKSTREAMS) {
        expect(tokens, `${label}: הזרימה \`${w}\` ⛔ חסרה מאוצר המילים`).toContain(w);
      }
      for (const t of tokens) {
        expect(
          WORKSTREAMS as readonly string[],
          `${label}: \`${t}\` ⛔ אינו ב-lib/core/planTable.ts`,
        ).toContain(t);
      }
    });
  }
});

/**
 * 🔴 **התור של CONTENT — נמדד 09/09 ו⛔ לא שוער.**
 * ‏`docs/amirnet-coverage-report.md` דיווח **640 מתוך 3,382** כותרות Tier 1+2 בבנק
 * (‏19%), דלתא **−10**, ו-**161** רדודות. ⛔ ובאותו זמן `STEP 4` בפרומפט הפנה את
 * הסוכן ל-NGSL בסדר תדירות, ⇒ ארבע חמישיות מהטווח שהמוצר מתיימר ללמד ⛔ לא היו
 * בתור של אף אחד. הטענות כאן הן מה שמונע חזרה שקטה.
 */
describe('docs/agents/CONTENT.md — טבלת אמירם היא התור, ⛔ ולא NGSL', () => {
  const body = text('CONTENT');

  it('הקובץ עצמו נקוב בשם, עם ארבע הדרגות ובסדר', () => {
    expect(body, 'הקובץ').toContain('data/amirnet-vocab.csv');
    expect(body, 'הכותרות של ה-CSV').toContain('headword,pos,cefr,tier,tier_name');
    for (const tier of ['tier 1', 'tier 2', 'tier 3', 'tier 4']) {
      expect(body, `הדרגה ${tier}`).toContain(tier);
    }
    expect(body, 'הפקודה שמודדת כיסוי').toContain('npm run measure:amirnet-coverage');
  });

  it('‏NGSL הוא נפילה-לאחור מוצהרת, ⛔ ולא המקור', () => {
    const amirnet = body.indexOf('data/amirnet-vocab.csv');
    const ngsl = body.indexOf('NGSL v1.2');
    expect(amirnet, 'טבלת אמירם נזכרת').toBeGreaterThan(-1);
    expect(amirnet, 'והיא קודמת ל-NGSL בתוך STEP 4').toBeLessThan(ngsl);
    expect(body, 'הנפילה-לאחור מוצהרת ככזאת').toMatch(/fall back to \*\*NGSL/);
  });

  it('⛔ אין תקרת גודל לאצווה — ההוראה כתובה, ⛔ ולא מונחת', () => {
    expect(body, '⛔ אין תקרה').toMatch(/⛔ NO PER-BATCH CEILING/);
  });

  it('הרישוי מוכרע בפרומפט, ⇒ הסוכן ⛔ אינו נעצר לשאול', () => {
    expect(body, 'האזהרה שמכריעה').toContain('R-027');
    expect(body, 'המסמך שקובע').toContain('plan/20-alerts.md');
  });
});

/**
 * 🔴 **הסבב של 09/09 — חמשת התפקידים שוכתבו, וזה מה ששומר על השכתוב.**
 * כל טענה כאן היא **חוזה בין שני קבצים**: מה שסוכן אחד כותב, סוכן אחר קורא. ⛔ טענת
 * ניסוח אחת ⛔ אין כאן — נוסח שנשבר בלי שהצד השני ידע הוא בדיוק המחלקה שהקובץ הזה קיים נגדה.
 */
describe('09/09 — PM עובד מול מחלקה ויעדים, ⛔ ולא מול רשימה', () => {
  const pm = text('PM');

  it('קורא את מה ש-DEV באמת בנה — מ-`git log`, ⛔ לא מהרגיסטר', () => {
    expect(pm, 'הצעד עצמו').toContain('STEP 1.9');
    expect(pm, 'הפקודה, ולא «הסתכל על הקומיטים»').toContain(
      'origin/dev..origin/work/current',
    );
    expect(pm, 'תחילית הקומיטים שהוא מחפש').toContain('loop(DEV)');
    // ⛔ וזו ⛔ אינה ביקורת: 🟣 ⇢ ✅ נשאר של QA בלבד (`F-126`).
    expect(pm, '⛔ אינו מאשר ואינו דוחה').toMatch(/⛔ not a review|⛔ do ⛔ not approve/);
  });

  it('הזרימה היא מחלקה עם יעדים, ו⛔ אין תקרה על שורות נגזרות', () => {
    expect(pm, 'המסגור').toMatch(/A DEPARTMENT WITH GOALS/);
    expect(pm, '⛔ אין תקרה על שורות נגזרות').toMatch(/⛔ no ceiling on how many rows you write/);
    // ⛔ **והבלם שכן נשאר, ⛔ ואינו מונה:** ⟦10/09⟧ קטגוריית «שורה שהומצאה» ותקרת
    // השלוש שלה נמחקו. מה שמגביל הוא **המקור** — רגיסטר קיים או תמונה ב-`docs/design`.
    expect(pm, 'הבלם על המקור נשאר').toContain('§ 0.17');
    expect(pm, '⛔ שורה בלי מקור ⛔ אינה נכתבת').toMatch(/⛔ not written/);
  });

  it('הרנדרים הם רצפה לעבור, ⛔ לא תמונה להעתיק', () => {
    expect(pm, 'המסגור').toMatch(/A FLOOR TO CLEAR, ⛔ NOT A PICTURE TO COPY/);
    expect(pm, 'שלושת הוורדיקטים').toContain('🟡 meets it');
    expect(pm, 'ובסתירה — `36` גובר').toMatch(/`36` wins/);
  });

  it('לפני קוד UI — סקיל עיצוב, ו«אף אחד» ⛔ אינה תשובה', () => {
    const step = pm.slice(pm.lastIndexOf('## STEP 5.5'));
    expect(step, 'הסקיל שבקלון').toContain('skills/taste-skill/SKILL.md');
    expect(step, 'הסקיל השני שבקלון').toContain('skills/imagegen-frontend-mobile/SKILL.md');
    expect(step, 'והשלישי, שמובא מהענף').toContain('ui-ux-pro-max:ui-styling');
    expect(step, '⛔ «אף אחד» אינה תשובה כאן').toMatch(/«⛔ none» is\s*\n?⛔ \*\*not\*\* an available answer/);
  });

  it('מריץ `npm run archive` — ו⛔ אינו מוחק שורה', () => {
    expect(pm, 'הפקודה').toContain('npm run archive && npm run measure:plan');
    expect(pm, '⛔ ואינה מוחקת').toMatch(/⛔ AND IT DOES ⛔ NOT DELETE/);
    expect(pm, 'שלוש הסיבות שנמדדו').toContain('scripts/archive-registers.mjs');
  });
});

describe('09/09 — `WORKSTREAM_ENDING` הוא חוזה בין שלושה קבצים', () => {
  it('PM כותב · QA קורא · והשדה קיים ב-`plan/00-control.md`', () => {
    expect(text('PM'), 'PM כותב').toContain('WORKSTREAM_ENDING:');
    expect(text('QA'), 'QA קורא').toContain('WORKSTREAM_ENDING');
    expect(readFileSync('plan/00-control.md', 'utf8'), 'השדה קיים בקובץ עצמו').toMatch(
      /^WORKSTREAM_ENDING:/m,
    );
  });

  it('⛔ ואינו היתר להזיז את `ACTIVE_WORKSTREAM` מוקדם — בשני הקבצים', () => {
    for (const a of ['PM', 'QA'] as const) {
      expect(text(a), `${a}: «מוצתה» עדיין אפס`).toMatch(/§ 0\.23 ז׳/);
    }
    expect(text('QA'), 'QA: אזהרה, ⛔ לא היתר').toMatch(/⛔ NOT permission to move/);
  });
});

describe('09/09 — QA: ארבע חובות, ותקרה על מה שמועבר ל-DEV', () => {
  const qa = text('QA');

  it('ארבע החובות כתובות ובסדר, ו⛔ אף אחת ⛔ אינה «בנה»', () => {
    for (const duty of ['①  GATE', '②  WALK', '③  FILE', '④  HAND OVER']) {
      expect(qa, duty).toContain(duty);
    }
    expect(qa, '⛔ אינו בונה').toMatch(/⛔ Nothing here says «build»/);
  });

  it('התקרה היא ארבעה ל-DEV, ⛔ ו-🔴 מחוץ לה', () => {
    expect(qa, 'התקרה').toMatch(/At most FOUR findings routed to `→ DEV` per tick/);
    expect(qa, '⛔ ואינה חלה על PM או על רוי').toMatch(/routed to PM or to Roy are ⛔ uncapped/);
    expect(qa, '🔴 מחוץ לתקרה').toMatch(/CRITICAL is ⛔ outside the cap/);
    // ⛔ והשמירה שהופכת «תקרה» ל⛔ לא «השמטה»: ממצא שמוחזק עדיין נכתב במלואו.
    expect(qa, '⛔ שום דבר ⛔ אינו נזרק').toMatch(/⛔ Nothing is thrown away/);
  });
});

describe('09/09 — DEV: בונה מול יעד, ⛔ אינו ממתין, ⛔ ואינו עושה תחזוקה במקום מוצר', () => {
  const dev = text('DEV');

  it('רשאי לפתוח שורה בעצמו — בשלושה תנאים, ו⛔ בלי לתייג לעצמו סקיל', () => {
    expect(dev, 'ההיתר').toMatch(/YOU BUILD TOWARD A GOAL, ⛔ NOT DOWN A LIST/);
    expect(dev, 'הגדר — אותה גדר של C-0366').toContain('C-0366');
    expect(dev, '⛔ אינו כותב לעצמו תג סקיל').toMatch(/⛔ never write your\s*\n?own `\[SKILL: X\]` tag/);
  });

  it('⛔ אינו ממתין לאיש', () => {
    expect(dev, '⛔ אינו ממתין').toMatch(/YOU WAIT FOR ⛔ NOBODY/);
    expect(dev, 'ובמקום להמתין — מנתב').toContain('RULES § 0.20');
  });

  it('תחזוקה היא תקורה של טיק, ⛔ ולא תפוקתו', () => {
    expect(dev, 'הכותרת').toMatch(/⛔ NOT MAINTENANCE INSTEAD OF PRODUCT CODE/);
    expect(dev, 'המדידה שמצדיקה אותה').toContain('161 of 516');
    expect(dev, '⛔ ואינו אוסר את התקורה עצמה').toMatch(/This does ⛔ not ban the overhead/);
  });

  it('היתר העיצוב ניתן מראש — וארבע הגדרות שלו כתובות', () => {
    expect(dev, 'ההיתר').toMatch(/PRE-APPROVED/);
    expect(dev, '⛔ אין לחזור לשאול').toMatch(/⛔ DO ⛔ NOT COME BACK TO ASK/);
    expect(dev, 'גדר 1 — השערים קפואים').toContain('THE GATES ARE FROZEN');
    expect(dev, 'גדר 3 — ההתראות שאוסרות UI מסוים').toContain('R-016');
    expect(dev, 'גדר 4 — בלתי הפיך').toContain('RULES § 0.22');
  });
});

/**
 * 🔴 **היציאה השקטה — ⛔ הכלל היחיד שנכתב לחמישה קבצים מילה במילה (`§ 9.9`).**
 * ⛔ נמדד: **489 קומיטי סוכנים ב-14 יום, ⛔ ורק 123 מהם — 25% — נגעו בקוד מוצר.**
 * ⇒ «⛔ אין מה לעשות» היה תשובה לגיטימית לכל סוכן, בלי ולו שאלה אחת לפניה.
 */
describe('היציאה השקטה זהה בחמשת הפרומפטים, ⛔ ולא «דומה»', () => {
  const bodies = ALL_PROMPTS.map((a) => [a, text(a)] as const);

  it('שלוש השאלות והיציאה הלגיטימית היחידה — בכל החמישה', () => {
    for (const [a, body] of bodies) {
      expect(body, `${a}: הכותרת`).toMatch(/THE ONE QUIET EXIT/);
      expect(body, `${a}: היציאה הלגיטימית`).toMatch(
        /department is FINISHED and its work is waiting\s*\n?for QA to merge to `dev`/,
      );
      expect(body, `${a}: קריאה קדימה לזרימה הבאה`).toContain('36 § 13');
      expect(body, `${a}: ⛔ אינו ממתין לרוי`).toMatch(/⛔ ⛔ NOT {10}"I am waiting for Roy"/);
    }
  });

  it('ו⛔ אינה שקטה — שורת היומן, אותה שורה בדיוק', () => {
    for (const [a, body] of bodies) {
      expect(body, `${a}: היעד`).toContain('plan/archive/control-log.md');
      expect(body, `${a}: הצורה`).toContain('idle — <the reason, one line');
      expect(body, `${a}: הסיווג לפי הדיף`).toMatch(/by the DIFF, ⛔ not by the wording/);
    }
  });

  it('🔬 והנוסח **זהה** — ⛔ לא «דומה», כי חמישה עותקים סוטים בשקט', () => {
    const cut = (b: string): string =>
      b.slice(b.indexOf('## 🚪 THE ONE QUIET EXIT'), b.indexOf('🔴 total silence is the'));
    const cuts = bodies.map(([, b]) => cut(b));
    const first = cuts[0] ?? '';
    const rest = cuts.slice(1);
    expect(first.length, 'הבלוק נמצא').toBeGreaterThan(500);
    for (const other of rest) expect(other).toEqual(first);
  });
});

/**
 * 🔴 **ההליכה בדפדפן — חמשת הסוכנים, ⛔ ולא שלושה.**
 * ⛔ נמדד 09/09: `CONTENT.md` ו-`PROMOTER.md` ⛔ לא נשאו הוראת דפדפן **כלשהי** —
 * ⇒ CONTENT כתב **1,200 משמעויות** ו⛔ מעולם ⛔ לא ראה אחת מהן מרונדרת.
 */
describe('הליכת מוצר בדפדפן — חובה בחמישה, ⛔ ולא נפילה-לאחור', () => {
  it('כל חמשת הפרומפטים נוקבים ב-`next start`, ⛔ ולעולם לא ב-`next dev`', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      expect(body, `${a}: מריץ בנייה אמיתית`).toContain('next start');
      expect(body, `${a}: הרוחב`).toMatch(/375/);
    }
  });

  it('⛔ «Chromium חסר» ⛔ אינה סיבה לדלג — בשני הקבצים שקיבלו את ההליכה היום', () => {
    for (const a of ['CONTENT', 'PROMOTER'] as const) {
      expect(text(a), `${a}: § 0.27`).toContain('RULES § 0.27');
      expect(text(a), `${a}: ⛔ «דילגתי» אינה תוצאה`).toMatch(/⛔ NOT a reason to skip|⛔ NOT a reason to skip/);
    }
  });

  it('⛔ ואף אחת מהשתיים ⛔ אינה חוסמת — היא מדידה, ⛔ לא שער', () => {
    expect(text('CONTENT'), 'CONTENT: ⛔ אינה שער').toMatch(/⛔ And this is ⛔ not a gate/);
    expect(text('PROMOTER'), 'PROMOTER: ⛔ אינה חוסמת').toMatch(/⛔ NOTHING HERE BLOCKS ANYTHING/);
  });

  it('📐 ומדד המקצועיות קיים — בפרומפט וביומן — ו⛔ אינו חוסם', () => {
    const promoter = text('PROMOTER');
    expect(promoter, 'הכותרת שהוא כותב אליה').toContain('## 📐 מדד המקצועיות');
    expect(promoter, '⛔ ואינו שער').toMatch(/IT BLOCKS ⛔ NOTHING/);
    expect(promoter, 'מספר שלא נמדד ⛔ אינו 0').toMatch(/⛔ לא נמדד`, ⛔ never `0`/);
    expect(
      readFileSync('plan/archive/control-log.md', 'utf8'),
      'והטבלה קיימת ביומן עצמו',
    ).toContain('## 📐 מדד המקצועיות');
  });
});

/**
 * 🔒 **שער הנעילה — נכתב לחמישה, ⛔ כי הוא חל על חמישה.**
 * ⛔ נמדד 09/09: `git grep LOCK_HELD_BY -- scripts/` ⇒ **אפס**. ⇒ המנעול היחיד של
 * הלופ ⛔ לא נקרא בידי שום שער, ו-`F-191` הוא מה שזה עלה.
 */
describe('שער הנעילה מוצהר בחמשת הפרומפטים', () => {
  it('כל חמישה אומרים מה עובר תחת נעילה זרה ומה ⛔ לא', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      expect(body, `${a}: השער עצמו`).toContain('scripts/hooks/pre-push');
      expect(body, `${a}: השדה`).toContain('LOCK_HELD_BY');
      expect(body, `${a}: הפטור לרגיסטר`).toMatch(/anything touching code is REFUSED/);
      expect(body, `${a}: ⛔ ו-SKIP_VERIFY ⛔ אינו פותח אותו`).toMatch(
        /`SKIP_VERIFY` ⛔ does ⛔ not\s*\n?open it/,
      );
    }
  });
});

/**
 * 🔢 **`RULES § 0.15` — «⛔ אסור לכתוב לפרומפט מספר חי» — ⛔ לא נאכף עד 09/09.**
 * 🔬 נמדד באותו יום: שלושה פרומפטים הכריזו שהרגיסטרים הם **667KB** (בפועל **443KB**),
 * ו-`DEV.md` שלח לבדוק «46 תוכניות, 8 יתומות» כשהיו **74 ו-5**. ⇒ שלושה מספרים
 * שכולם התיישנו, וסוכן שפעל לפיהם פעל על תמונה ש⛔ אינה קיימת.
 * ⚠️ **מדידה היסטורית מנוסחת ככזאת ⛔ אינה מספר חי** (`§ 0.15` אומר זאת במפורש) ⇒
 * הטענה מחפשת את הטענות **בהווה** בלבד.
 */
describe('⛔ אף פרומפט ⛔ אינו מכריז מספר חי על גודל הרגיסטרים (§ 0.15)', () => {
  it('⛔ אין הכרזה בהווה על גודל הרגיסטרים או על מניין התוכניות', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      for (const raw of body.split('\n')) {
        // 🔴 ⛔ **הסתייגות ב-⟦…⟧ פוטרת את הסוגריים, ⛔ לא את השורה.** עד 09/09 השורה
        // כולה נפטרה, ו-`QA.md` הכריזה «The index is **78KB**» באותה שורה שבה ⟦⟧
        // ציטטה את § 0.15 עצמה. ⇒ מסירים את הסוגריים ובודקים את מה שנשאר.
        const line = raw.replace(/⟦[^⟧]*⟧/g, '');
        // ⛔ מדידה מתוארכת ככזאת, או ציטוט הכלל — מותרות במפורש.
        if (/Measured \d|נמדד|§ 0\.15/.test(line)) continue;
        // ⛔ **תקרה ⛔ אינה מדידה** — «≤4KB» · «hard cap 12KB» · «under its 12KB ceiling»
        // הם כללים שהקובץ חייב לקיים, ⛔ ולא טענות על מצבו היום.
        if (/≤ ?\d+ ?KB|hard cap \*?\*?\d+ ?KB|under its \d+ ?KB|\d+ ?KB ceiling/.test(line)) continue;
        // ⛔ **קירוב שמסמן את עצמו** — «~53KB» ⛔ אינו נקרא כעובדה, וסטייה של 20%
        // בו ⛔ אינה מטעה. טענה **בלי** ~ נקראת כעובדה, ולכן היא זו שמתיישנת.
        const claim = line.replace(/~\s?\d+([–\-]\d+)? ?KB/g, '');
        expect(
          /\d+ ?KB/.test(claim) || /\b\d+ exist and \d+ are orphaned/.test(claim),
          `${a}: מספר חי בשורה — ${raw.slice(0, 100)}`,
        ).toBe(false);
      }
    }
  });
});

/**
 * 🛰️ **סוכני משנה — `RULES § 0.5` התיר אותם מזמן, ו⛔ אף פרומפט ⛔ לא אמר מתי.**
 * ⟦NEW 09/09 · `T-197`⟧ ‏PM יורה 3×/יום ומזין את DEV שיורה 12×/יום ⇒ טיק PM שכותב
 * פרוסה אחת מותיר את DEV קורא רגיסטרים בשמונה חלונות. הכלי היה מותר ו⛔ לא היה בשימוש.
 * 🔴 **והטענה שחייבת להתקיים בשניהם היא הגבול, ⛔ לא ההיתר.**
 */
describe('🛰️ סוכני משנה — ההיתר נכתב, ו⛔ הגבול נכתב איתו', () => {
  it('‏PM מקבל את הסקיל, ⛔ והוא מוגבל לעבודה נגזרת', () => {
    const pm = text('PM');
    expect(pm, 'הסקיל').toContain('superpowers:dispatching-parallel-agents');
    expect(pm, 'התקרה מ-§ 0.5').toContain('RULES § 0.5');
    // ⛔ **הטענה שמונעת את הקריאה השגויה**: ⟦שוכתב 10/09⟧ ארבעה תת-סוכנים ⛔ אינם
    // מקור שלישי. `§ 0.17` מתיר שני מקורות בלבד, וזה ⛔ לא משתנה עם מקביליות.
    expect(pm, '⛔ אינו מוסיף מקור').toMatch(/⛔ do ⛔ not become\s*\n?a third source/);
    expect(pm, 'ומכוון לעבודה נגזרת').toContain('§ 0.17');
  });

  it('‏DEV מקבל את הסקיל, ⛔ ורק על צעדים עצמאיים', () => {
    const dev = text('DEV');
    expect(dev, 'הסקיל').toContain('superpowers:subagent-driven-development');
    expect(dev, '⛔ ולא על 🔴').toMatch(/⛔ never on a 🔴/);
    expect(dev, 'קומיט אחד למשימה נשאר').toMatch(/One commit per task still holds/);
  });

  it('🔴 ובשניהם — תת-סוכן ⛔ אינו כותב לרגיסטר, ⛔ אינו מקמט, ⛔ אינו דוחף', () => {
    for (const a of ['PM', 'DEV'] as const) {
      const body = text(a);
      expect(body, `${a}: שלושת האיסורים`).toMatch(
        /does ⛔ (not write to a register|NOT write to plan\/\*\*)/,
      );
      expect(body, `${a}: ⛔ אינו דוחף`).toMatch(/⛔ does ⛔ NOT push|⛔ does ⛔ not push/);
    }
    // 📎 ו-`F-191` הוא התקדים: טיק אחד שכתב לרגיסטר הוריד אותו מ-237 שורות ל-26.
    expect(text('DEV'), 'התקדים נקוב בשמו').toContain('F-191');
  });
});

/**
 * 🔴 **`hebrew-content-writer` — חובה ל-CONTENT בכל ריצה.**  ⟦NEW 09/09 · דרישת רוי⟧
 *
 * ⛔ **למה טענה ולא רק שורה בפרומפט:** ההוראה הזאת היא בדיוק הסוג שנשחק בעריכה
 * עתידית בלי שאיש ישים לב — משפט אחד בקובץ של 40KB. ⇒ הטענה היא מה שהופך אותה
 * מ«נכתבה» ל«לא יכולה להיעלם בשקט».
 * ⚠️ **והסקיל הוא קובץ בשכפול, ⛔ לא תוסף** — נמדד ש-`account_skills` ריק בשש
 * המשימות המתוזמנות ⇒ סקיל מסונכרן ⛔ אינו ערובה, וקובץ בריפו כן.
 */
describe('🔴 CONTENT מחויב ב-`hebrew-content-writer` — ⛔ בכל ריצה', () => {
  const SKILL = 'skills/hebrew-content-writer/SKILL.md';

  it('הסקיל עצמו בריפו, ⛔ ולא רק בקטלוג של החשבון', () => {
    expect(existsSync(SKILL), `⛔ ${SKILL} ⛔ אינו בעץ`).toBe(true);
    expect(readFileSync(SKILL, 'utf8').length, '⛔ ואינו בדל ריק').toBeGreaterThan(5000);
    // 📎 שני הנלווים שההוראה נוקבת בהם — שורה שמפנה לקובץ שאינו קיים היא F-189.
    for (const extra of [
      'skills/hebrew-content-writer/SKILL_HE.md',
      'skills/hebrew-content-writer/references/hebrew-grammar-quick-ref.md',
    ]) {
      expect(existsSync(extra), `⛔ ${extra} ⛔ אינו בעץ`).toBe(true);
    }
  });

  it('ההוראה ב-`CONTENT.md` מחייבת, ⛔ ואינה מותנית', () => {
    const body = text('CONTENT');
    expect(body, 'הנתיב נקוב במפורש').toContain(SKILL);
    expect(body, '⛔ בכל ריצה').toMatch(/⛔ בכל ריצה, ⛔ בלי יוצא מן הכלל/);
    // 🔴 **הטענה שמונעת את הריכוך** — «כשרלוונטי» היא בדיוק הנוסח שרוי פסל.
    expect(body, '⛔ ⛔ ולא «כשרלוונטי»').toMatch(/⛔ ולא «כשרלוונטי»/);
    expect(body, 'ומדווח בשורת הסקילים').toMatch(/בשורת הסקילים: `hebrew-content-writer`/);
  });

  it('והוא מופיע באינדקס שהסוכן קורא בפועל', () => {
    const registry = readFileSync('docs/skills-registry.md', 'utf8');
    expect(registry, 'שם הסקיל').toContain('hebrew-content-writer');
    expect(registry, 'הנתיב, ⛔ ולא רק השם').toContain(SKILL);
    expect(registry, 'ומסומן חובה').toMatch(/חובה ל-CONTENT בכל ריצה/);
  });
});

/**
 * 🧹 **שרידי Cowork — הכלים ש⛔ אינם קיימים באף משימה מתוזמנת.**  ⟦NEW 09/09⟧
 *
 * 🔬 **נמדד ב-`allowed_tools` של שש המשימות, 09/09:** ⛔ אין `project_read` ו⛔ אין
 * `project_write` באף אחת. ⇒ `PM.md` החזיק **53 שורות** (STEP 1.8) ועוד צעד שלם
 * (STEP 6.5) שנשענו עליהם, **וכל טיק PM מאז המעבר ל-CCR ביצע את ענף הגיבוי** ⛔ בלי
 * לדעת שזה כל מה שיש. ⛔ **ענף שלא ניתן לביצוע ⛔ אינו «לא מזיק» — הוא הוראה שקרית.**
 * ⚠️ **וגם הראיה השלילית שלו נפלה:** הצעד טען ש-`ls claude/` מחזיר ריק, ומאז 09/09
 * `claude/LOOP-ARCHITECTURE.md` יושב שם.
 */
describe('🧹 ⛔ אף פרומפט ⛔ אינו מורה לקרוא או לכתוב דרך כלי Cowork', () => {
  const PHANTOM_TOOLS = ['project_read', 'project_write'];
  const PHANTOM_DOCS = ['claude/for-roy.md', 'claude/roadmap.md'];

  it('⛔ אין הוראה חיה שנשענת על `project_read`/`project_write`', () => {
    for (const a of ALL_PROMPTS) {
      for (const line of text(a).split('\n')) {
        if (!PHANTOM_TOOLS.some((t) => line.includes(t))) continue;
        // ⚠️ אזכור **שמסביר שהכלי ⛔ אינו קיים** הוא תיעוד ⇒ מותר, ומזוהה לפי כך.
        expect(
          /⛔ אינם קיימים|⛔ אינם באף|was removed|⛔ in ⛔ no scheduled task|הצעד הורה|היו מסמכי-פרויקט/.test(line) ||
            PHANTOM_TOOLS.every((t) => !line.includes(t)),
          `${a}: הוראה חיה על כלי Cowork — ${line.slice(0, 90)}`,
        ).toBe(true);
      }
    }
  });

  it('⛔ ואף פרומפט ⛔ אינו שולח לכתוב לשני מסמכי הפרויקט שנעלמו', () => {
    for (const a of ALL_PROMPTS) {
      const body = text(a);
      for (const doc of PHANTOM_DOCS) {
        if (!body.includes(doc)) continue;
        // ⛔ הם מותרים **רק** בתוך המשפט שאומר שהם ⛔ אינם קיימים.
        const lines = body.split('\n').filter((l) => l.includes(doc));
        for (const l of lines) {
          expect(
            /⛔ אינם קיימים|אל תיצור|was removed|הצעד הורה|⛔ אינו קיים|היו מסמכי-פרויקט/.test(l),
            `${a}: ${doc} מוזכר כיעד חי — ${l.slice(0, 90)}`,
          ).toBe(true);
        }
      }
    }
  });

  it('🗂️ ושולחן העבודה היחיד נקוב בשמו', () => {
    expect(text('PM'), 'PM: השולחן היחיד').toMatch(/שולחן העבודה של רוי הוא `plan\/03-for-roy\.md`/);
  });
});

/**
 * 📏 **גודל שורה — 30–60 דקות, ו⛔ זה חוזה בין שני קבצים.**  ⟦NEW 09/09 · הוראת רוי⟧
 * 🔬 **נבדק לפני שנכתב, כפי שרוי ביקש:** הנוסח הקודם אמר «שורה שDEV נוחת בטיק אחד»,
 * ו-«טיק» ⛔ מעולם ⛔ לא קיבל משך עבור DEV — `RULES:704` מגדיר קופסת זמן ל-**QA**
 * (15/40 דקות), ו-`DEV.md` מסיים טיק כש«קופסת הזמן נגמרה» ⛔ בלי מספר. ⇒ הקריטריון
 * ⛔ לא היה מדיד, וזו המדידה שלו.
 */
describe('📏 גודל היעד נמדד בדקות, ⛔ ולא ב«טיק»', () => {
  it('‏PM כותב שורות של 30–60 דקות, ושתי הסטיות מנומקות', () => {
    const pm = text('PM');
    expect(pm, 'המספר עצמו').toContain('30–60 minutes');
    expect(pm, '⛔ קטן מדי עולה בתיאום').toMatch(/⛔ under 30 min/);
    expect(pm, '⛔ גדול מדי ⛔ אינו נגמר').toMatch(/⛔ over 60 min/);
    // 🔴 השסתום שמונע «נצהיר 45 דקות ונקווה» — שורה שאינה ניתנת לפיצול מוצהרת ככזאת.
    expect(pm, 'שורה שאינה ניתנת לפיצול מוצהרת').toContain('⛔ אינה ניתנת לפיצול');
  });

  it('ו-DEV קורא את אותו מספר כמדידה, ⛔ ולא כעידוד', () => {
    const dev = text('DEV');
    expect(dev, 'אותו מספר בדיוק').toContain('30–60 minutes');
    expect(dev, 'הפניה לצד שכותב').toContain('STEP 2 ③');
    expect(dev, '⛔ ואינו גורר שורה חצי-בנויה לטיק הבא').toMatch(
      /⛔ not carry a half-built row/,
    );
  });
});

/**
 * 🧭 **‏`DEV.md` — לינאריות, ו⛔ אפס סתירות פנימיות.**  ⟦NEW 09/09 · חשד מפורש של רוי⟧
 *
 * 🔬 **שלוש מדידות שהצדיקו את הסבב:**
 * ⓐ «STEP C» (מיגרציות) ישב **לפני `STEP 0`** — לפני שהסוכן בכלל שיבט — ו⛔ מעולם
 *    ⛔ לא היו «STEP A» או «STEP B».
 * ⓑ הטבלה ב-`STEP 4.5` אמרה «טיק תכנון: you touch code ⇒ ⛔ never» בעוד `STEP 3`
 *    מחייב מאז 08/09 להנחית את משימה 1 באותו טיק. ⇒ **⛔ אי אפשר היה לציית לשניהם.**
 * ⓒ שורת `ACTIVE_TASK_ID` אמרה «⛔ never a licence for more than one pick per tick»
 *    בעוד `STEP 4.5` ו-`STEP 5` אומרים «N tasks, ⛔ not one».
 */
describe('🧭 `DEV.md` — רצף אחד, ⛔ ובלי סתירה פנימית', () => {
  const dev = text('DEV');

  it('הרצף מוצהר, וההפרדה בין «רצף» ל«עיון» כתובה', () => {
    expect(dev, 'מפת הקריאה').toMatch(/מה כאן רצף, ומה כאן עיון/);
    expect(dev, 'הרצף עצמו').toContain('STEP 0 · 0.5 · 1 · 2 · 2.5 · 3 · 4 · 4.5 · 5 · 6 · 6.5 · 7 · 8');
    expect(dev, '⛔ ואין «מסלולים» להכריע ביניהם').toMatch(/⛔ ואין «מסלולים» להכריע ביניהם/);
  });

  it('⛔ אין «STEP C» — נוהל המיגרציות יושב בתוך הבנייה, ⛔ ולא לפני השיבוט', () => {
    expect(dev, '⛔ אין STEP C').not.toMatch(/^## STEP C —/m);
    const sql = dev.indexOf('STEP 5.5 — SQL AND MIGRATIONS');
    const step0 = dev.indexOf('## STEP 0 — CONNECT');
    expect(sql, 'הנוהל קיים').toBeGreaterThan(-1);
    expect(sql, '⛔ והוא אחרי השיבוט, ⛔ לא לפניו').toBeGreaterThan(step0);
  });

  it('🔴 טיק תכנון נוגע בקוד — הטבלה ו-STEP 3 אומרים את אותו דבר', () => {
    // ⛔ הטענה השלילית היא העיקר: הנוסח הישן היה «⛔ **never**» בעמודת טיק התכנון.
    expect(dev, '⛔ הסתירה הוסרה').not.toMatch(/\| you touch code \| ⛔ \*\*never\*\* \|/);
    expect(dev, 'ומה שנכתב במקומה').toMatch(/task 1 of the plan/);
    expect(dev, 'ו-STEP 3 עדיין מחייב').toMatch(/LAND TASK 1 OF THE PLAN IN THE SAME TICK/);
  });

  it('🔴 ו-`ACTIVE_TASK_ID` ⛔ אינו מגביל לטיק-משימה-אחת', () => {
    // ⚠️ המחרוזת עדיין מופיעה — **בתוך המשפט שמסביר שהיא סתרה**. ⇒ הטענה היא שהיא
    // ⛔ אינה הוראה חיה: כל שורה שנושאת אותה חייבת לשאת גם את המילה «סתר».
    for (const line of dev.split('\n')) {
      if (!line.includes('never a licence for more than one pick per tick')) continue;
      expect(/סתר/.test(line), `⛔ נוסח סותר חי — ${line.slice(0, 80)}`).toBe(true);
    }
    expect(dev, 'ומה שנשאר — N משימות').toMatch(/N tasks, ⛔ not one/);
  });
});

/**
 * 🗺️ **מפת קריאה לפי תפקיד ב-`docs/plan-open.md`.**  ⟦NEW 09/09 · סעיף F.1⟧
 * 🔬 נמדד: הקובץ ~53KB, ו-DEV קורא אותו 12 פעמים ביום. «ממצאים פתוחים» ~18KB,
 * «חסומות» ~9KB ⇒ **שני שלישים ⛔ אינם נוגעים לבחירה של DEV.**
 */
describe('🗺️ `docs/plan-open.md` ⛔ אינו נקרא במלואו', () => {
  it('הקובץ הנגזר נושא מפת קריאה לפי תפקיד', () => {
    const idx = readFileSync('docs/plan-open.md', 'utf8');
    expect(idx, 'הכותרת').toContain('מה לקרוא, לפי תפקיד');
    for (const a of ['DEV', 'QA', 'PM', 'CONTENT', 'PROMOTER']) {
      expect(idx, `${a} מופיע במפה`).toMatch(new RegExp(`^${a}\\s`, 'm'));
    }
    // 🔴 הטענה שמונעת את הקריאה השגויה «מותר לדלג».
    expect(idx, '⛔ ואינה רשות לדלג').toMatch(/⛔ זו ⛔ אינה רשות לדלג/);
  });

  it('ו-DEV מופנה לפרוסה שלו, ⛔ ולא לקובץ כולו', () => {
    expect(text('DEV'), 'DEV: ההפניה למפה').toContain('מה לקרוא, לפי תפקיד');
    expect(text('DEV'), 'DEV: ⛔ בספק קרא').toMatch(/⛔ בספק: קרא/);
  });
});

/**
 * 📇 **`plan/05-departments.md` — מי קורא אותו, ומי נאמר לו במפורש ש⛔ לא.**  ⟦NEW 09/09⟧
 * 🔬 נמדד: `QA.md` הזכיר את הקובץ **אפס פעמים** בעוד QA הוא זה שחותם מחלקות ⇒
 * «מוצתה» יכלה לומר רק «⛔ אפס שורות ⬜», שזו עובדה על **הרגיסטר** ו⛔ לא על הלומד.
 * ⚠️ **והשתיקה היא הבעיה השנייה:** סוכן ש⛔ לא נאמר לו שקובץ ⛔ אינו שלו — קורא אותו.
 */
describe('📇 קובץ המחלקות — נמען מוצהר לכל סוכן', () => {
  it('‏PM כותב · DEV ו-QA קוראים', () => {
    for (const a of ['PM', 'DEV', 'QA'] as const) {
      expect(text(a), `${a}: הקובץ נקוב`).toContain('plan/05-departments.md');
    }
    expect(text('QA'), 'QA: ⛔ אינו עורך אותו').toMatch(/⛔ You ⛔ never edit it/);
    // 🔴 הטענה שמונעת את הקריאה השגויה «יעד פתוח ⇒ אסור לחתום».
    expect(text('QA'), 'QA: «מוצתה» ⛔ לא זזה').toMatch(/⛔ does ⛔ not change what «exhausted» means/);
  });

  it('⛔ ו-CONTENT ו-PROMOTER נאמר להם במפורש שהוא ⛔ אינו שלהם', () => {
    for (const a of ['CONTENT', 'PROMOTER'] as const) {
      expect(text(a), `${a}: נאמר במפורש`).toMatch(/⛔ `plan\/05-departments\.md` ⛔ אינו שלך/);
    }
  });
});
