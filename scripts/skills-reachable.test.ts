import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * 🔴 ⛔ **A SKILL AN AGENT ⛔ CANNOT LOAD IS ⛔ WORSE THAN NO SKILL AT ALL.**
 *
 * ⛔ **Why this file exists, and every number in it is MEASURED.** `docs/agents/DEV.md`
 * carried, for weeks, «Design skills: `ui-styling` · `design-system` ·
 * **`design-taste-frontend` on every screen in `36 § 4–§ 12`** ·
 * **`redesign-existing-projects` on `/arcade` and `לימודים`**». Measured 09/09 on a live
 * clone: of those four, **three exist nowhere** — ⛔ not under `skills/`, ⛔ not on the
 * `skills/superpowers` branch, ⛔ not in `docs/skills-registry.md`. ⇒ every UI tick that
 * tried to obey a rule marked «on every screen» spent itself hunting files that were
 * ⛔ never written, and then reported the miss as a process slip. **That is `F-189`'s
 * exact class, one level up: the instruction, ⛔ not the agent.**
 *
 * ⇒ this gate holds ONE invariant: **every skill named as a repo path in the registry is
 * a file that exists**, and **every skill a prompt tells an agent to read is one the
 * registry declares.** ⛔ It says ⛔ nothing about which skill is right for which row —
 * that is the registry's job and it stays prose.
 */
/**
 * 📎 ⟦09/09⟧ האינדקס פוצל לשניים כשהראשי עמד **465 תווים** מתחת לתקרת ה-14,000.
 * ⇒ «האינדקס» כאן הוא **שני הקבצים יחד**: טענה שקוראת רק אחד מהם הופכת חלולה
 * ברגע שמישהו מזיז שורה בין השניים, וזה בדיוק מה שקרה כאן.
 */
const REGISTRY_FILES = ['docs/skills-registry.md', 'docs/skills-registry-superpowers.md'];
const REGISTRY = REGISTRY_FILES[0] as string;
const registry = REGISTRY_FILES.map((f) => readFileSync(f, 'utf8')).join('\n');

/** Every ``skills/…/SKILL.md`` path the registry names, in backticks. */
const declaredPaths = [...registry.matchAll(/`(skills\/[A-Za-z0-9/_-]+\/SKILL\.md)`/g)].map(
  (m) => m[1] as string,
);

describe('docs/skills-registry.md — כל נתיב שהוא מצהיר עליו הוא קובץ שקיים', () => {
  it('מצהיר על נתיבים בכלל — אחרת הטענה הבאה חלולה', () => {
    expect(new Set(declaredPaths).size).toBeGreaterThanOrEqual(14);
  });

  it('⛔ אף נתיב מוצהר ⛔ אינו חסר בקלון', () => {
    const missing = [...new Set(declaredPaths)].filter((p) => !existsSync(p));
    expect(missing, `⛔ נתיבים שהאינדקס מצהיר עליהם ו⛔ אינם בעץ: ${missing.join(' · ')}`).toEqual(
      [],
    );
  });

  /**
   * 🌿 **התהפך 11/09 בהוראת רוי — והטענה הקודמת כאן נעשתה שגויה, ⛔ ולא חלשה.**
   * עד 11/09 הסקיל חי על ענף `skills/superpowers` **בלבד**, והטענה הזאת בדקה שהאינדקס
   * מוסר את פקודת ה-`FETCH_HEAD` שמביאה אותו. ⇒ הסוכנים מריצים `clone -b work/current`,
   * ולכן 59 הקבצים ⛔ **לא הגיעו לאף שכפול** — סקיל שאיש ⛔ אינו יכול לטעון.
   * ⇒ הוא הועבר לעץ, והטענה **התהפכה**: עכשיו נבדק שהוא **כן** כאן, ו⛔ שאין יותר
   * הוראת `fetch` שתשלח סוכן לענף שהוא ⛔ אינו מחזיק.
   * 🔬 **נמדד 11/09:** 59 קבצים · **3.4MB** · `skills/` גדל מ-0.4MB ⇒ פי **9**.
   * ⚠️ **והמחיר הזה אמיתי וכל שכפול משלם אותו** — 12 טיקי DEV ביום. זו הייתה הכרעת רוי.
   */
  it('🌿 `ui-ux-pro-max` — שני תתי-הסקילים בעץ, ו⛔ אין יותר הוראת fetch', () => {
    for (const sub of ['ui-styling', 'ui-ux-pro-max'] as const) {
      const path = `skills/ui-ux-pro-max/${sub}/SKILL.md`;
      expect(existsSync(path), `${sub}: ⛔ אינו בעץ`).toBe(true);
      expect(registry, `${sub}: האינדקס ⛔ אינו נוקב בנתיב`).toContain(path);
    }
    // ⛔ הכלי, ⛔ ולא רק ההצהרה: בלעדיו השורה באינדקס שולחת להריץ קובץ שאינו קיים.
    expect(
      existsSync('skills/ui-ux-pro-max/ui-ux-pro-max/scripts/search.py'),
      '⛔ כלי החיפוש חסר ⇒ שורת האינדקס שולחת לפקודה שתיכשל',
    ).toBe(true);
    // 🔴 וההוראה הישנה ⛔ אינה נשארת מאחור: סוכן שיקרא אותה יבזבז טיק על ענף שאין לו.
    expect(registry, '⛔ הוראת fetch לענף ⛔ אינה נשארת באינדקס').not.toContain('FETCH_HEAD:');
  });
});

describe('⛔ אף פרומפט ⛔ אינו מפנה לסקיל שאינו במרחב הנגיש', () => {
  /**
   * ⛔ **המרחב הנגיש, מוגדר במדידה:** מה שיושב בעץ, מה שיושב על ענף הסקילים, וזהו.
   * ‏`enabled_plugins` · `account_plugins` · `account_skills` נמדדו **ריקים בשש
   * המשימות המתוזמנות** (09/09), ⇒ «סקיל סשן» ⛔ אינו מרחב.
   */
  const inTree = execFileSync('git', ['ls-files', 'skills/'], { encoding: 'utf8' })
    .split('\n')
    .filter((f) => f.endsWith('SKILL.md'))
    .map((f) => f.split('/').at(-2) as string);
  const onBranch = ['ui-styling', 'ui-ux-pro-max'];
  const reachable = new Set([...inTree, ...onBranch]);

  /**
   * 🔴 **שניים, ⛔ ולא שלושה — תוקן 11/09, והתיקון הוא על טענה שהקובץ הזה עצמו קבע.**
   * הרשימה מנתה גם `design-taste-frontend` כשם ש«מעולם ⛔ לא היה קיים». ⛔ **שגוי:**
   * הוא שם ה-`name:` המוצהר בתוך `skills/taste-skill/SKILL.md` שורה 2 ⇒ **הסקיל קיים.**
   * ⇒ הטענה כאן מדדה **שמות ספריות** (`f.split('/').at(-2)`) והציגה את התוצאה כאילו
   * מדדה **שמות סקילים**. ⇒ זו בדיוק מחלקת `F-064`: שער שמודד את הצורה ⛔ ולא את הטענה.
   * 🔬 **והמחיר היה אמיתי:** חמשת הפרומפטים נדרשו להתייחס אל שם של סקיל **שקיים**
   * כאילו אינו קיים, ושורת `T-192` תויגה בו ⇒ האינדקס הנגזר הציג תג «מת» שהיה חי.
   */
  const NEVER_EXISTED = ['design-system', 'redesign-existing-projects'];

  it('שני השמות שמעולם לא היו קיימים ⛔ אינם במרחב — הפיקסטורה מול המדידה', () => {
    for (const name of NEVER_EXISTED) expect(reachable.has(name), name).toBe(false);
  });

  /**
   * 🆕 ⟦11/09⟧ **שם הספרייה מול השם המוצהר — והחריגה היחידה מוצהרת בשמה.**
   * ⛔ בלי הטענה הזאת, מיזוג-שמות **שני** היה נוצר בשקט, ואף אחד ⛔ לא היה יודע עד
   * שסוכן יתויג בשם שאינו ניתן לפתרון כנתיב — בדיוק מה שקרה ל-`taste-skill`.
   * 🔬 נמדד 11/09: **17** קובצי `SKILL.md`, **16 מתאימים**, אחד ⛔ לא.
   */
  it('🆕 שם הספרייה = השם המוצהר, ⛔ למעט `taste-skill` שמוצהר כאן בשמו', () => {
    const KNOWN = new Map([['taste-skill', 'design-taste-frontend']]);
    const files = execFileSync('git', ['ls-files', 'skills/'], { encoding: 'utf8' })
      .split('\n')
      .filter((f) => f.endsWith('SKILL.md'));
    expect(files.length, '⛔ אין קובצי סקיל ⇒ הטענה חלולה').toBeGreaterThanOrEqual(17);
    const drift: string[] = [];
    for (const f of files) {
      const dir = f.split('/').at(-2) as string;
      const declared = /^name:\s*(.+)$/m.exec(readFileSync(f, 'utf8'))?.[1]?.trim() ?? '';
      if (declared === dir) continue;
      if (KNOWN.get(dir) === declared) continue;
      drift.push(`${dir} ⇒ «${declared}»`);
    }
    expect(drift, `⛔ מיזוג-שם חדש ⇒ תג שאינו ניתן לפתרון כנתיב: ${drift.join(' · ')}`).toEqual(
      [],
    );
  });

  for (const agent of ['DEV', 'PM', 'QA', 'CONTENT', 'PROMOTER']) {
    it(`docs/agents/${agent}.md ⛔ אינו נוקב באחד מהשלושה כהוראה`, () => {
      const body = readFileSync(`docs/agents/${agent}.md`, 'utf8');
      for (const name of NEVER_EXISTED) {
        // ⚠️ ⛔ אזכור בתוך ההסבר «⛔ אלה ⛔ אינם קיימים» הוא **תיעוד** ו⛔ לא הוראה —
        // ⇒ מותר, בתנאי שהשורה נושאת גם את הסימן ש⛔ אינו קיים.
        for (const line of body.split('\n')) {
          if (!line.includes(name)) continue;
          expect(
            /⛔|CORRECTED|⛔ none of the three/.test(line),
            `${agent}.md: «${name}» מופיע בשורה שאינה מסויגת — ${line.slice(0, 80)}`,
          ).toBe(true);
        }
      }
    });
  }
});

/**
 * 🔴 ⛔ **«סקיל סשן» ⛔ אינו זמינות — הוא תקווה.**  ⟦NEW 09/09 · אומת בידי רוי בממשק⟧
 *
 * נמדד בשתי דרכים בלתי תלויות: ⓐ בתצורת שש המשימות המתוזמנות — `enabled_plugins` ·
 * `account_plugins` · `account_skills` **ריקים בכולן**; ⓑ בממשק עצמו — ה-API **מקבל**
 * `enabled_plugins` ו**משליך אותו בשקט**, והמדור ⛔ אינו קיים במסך.
 * ⇒ **⛔ אין פעולה שרוי יכול לעשות** כדי להנגיש סקיל תוסף לטיק מתוזמן. ⇒ שורה כזאת
 * חייבת לשאת **סימון** ו**נפילה-לאחור**, אחרת סוכן שורף טיק בחיפוש אחר משהו שאינו קיים.
 */
describe('כל שורת «סקיל תוסף» מסומנת ⛔ לא מובטח, ⛔ ואינה מבטלת את הטריגר', () => {
  const main = readFileSync('docs/skills-registry.md', 'utf8');

  it('⛔ אין שורה שמפנה לתוסף בלי הסימון', () => {
    const rows = main.split('\n').filter((l) => l.startsWith('|') && l.includes('סקיל תוסף'));
    expect(rows.length, '⛔ הטבלה ⛔ אינה נושאת שורות תוסף כלל ⇒ הטענה חלולה').toBeGreaterThanOrEqual(
      8,
    );
    for (const row of rows) {
      const name = /`([a-z-]+)`/.exec(row)?.[1] ?? row.slice(0, 40);
      expect(row, `${name}: ⛔ בלי הסימון «⛔ לא מובטח»`).toContain('⛔ לא מובטח');
    }
  });

  it('🔴 והכלל אומר במפורש שהטריגר נשאר, ⛔ ורק הכלי נעדר', () => {
    // 🆕 ⟦תוקן 14/09⟧ הראיה עברה ל-`skills-registry-superpowers.md § הארכיון`, והאינדקס
    // הראשי נושא את **המדידה העדכנית**: `account_skills: []` בכל שש המשימות. ⛔ הטענה
    // נשארת «מדידה ⛔ ולא השערה» — ⛔ רק המספר התחלף במספר טרי יותר.
    expect(main, 'המדידה, ⛔ לא ההשערה').toMatch(/"account_skills": \[\]/);
    // 🆕 ⟦תוקן 14/09⟧ «⛔ אין פעולה שרוי יכול לעשות» ⛔ אינו מדויק עוד — תצורת ה-Routine
    // **כן** נושאת `account_skills` כשדה. ⇒ הטענה עברה ממה ש⛔ אי אפשר לעשות
    // למה ש**צריך להכריע**, ⛔ וזה נשאר אמירה מפורשת בקובץ.
    expect(main, 'ההכרעה מנותבת לרוי').toMatch(/וזו הכרעה של רוי/);
    // ⛔ **זו הטענה שמונעת את הקריאה השגויה** «הסקיל חסר ⇒ דלג על הדרישה».
    expect(main, 'הטריגר ⛔ לא בוטל').toMatch(/הטריגר ⛔ לא בוטל, הכלי בוטל/);
    expect(main, 'ודוגמה קונקרטית לנפילה-לאחור').toContain('npm run check:palette');
  });
});
