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
const REGISTRY = 'docs/skills-registry.md';
const registry = readFileSync(REGISTRY, 'utf8');

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

  it('🌿 `ui-ux-pro-max:ui-styling` ⛔ אינו בקלון — ⇒ האינדקס נוקב בפקודה שמביאה אותו', () => {
    // ⛔ הסקיל הזה חי על ענף `skills/superpowers` בלבד, ⇒ נתיב יחסי היה מכזיב.
    // מה שנבדק כאן הוא שהאינדקס מוסר **איך** להגיע אליו, ⛔ ולא רק את שמו.
    expect(registry, 'שם הסקיל').toContain('ui-ux-pro-max');
    expect(registry, 'הענף').toContain('skills/superpowers');
    expect(registry, 'הפקודה, בדיוק כפי שנמדדה').toContain(
      'FETCH_HEAD:skills/ui-ux-pro-max/ui-styling/SKILL.md',
    );
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

  /** The three that sent DEV hunting. Named so the assertion cannot quietly pass again. */
  const NEVER_EXISTED = ['design-system', 'design-taste-frontend', 'redesign-existing-projects'];

  it('שלושת השמות שמעולם לא היו קיימים ⛔ אינם במרחב — הפיקסטורה מול המדידה', () => {
    for (const name of NEVER_EXISTED) expect(reachable.has(name), name).toBe(false);
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
