import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./ArenaCharacterChoice.tsx', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

describe('ArenaCharacterChoice — `37 § 7` on the geometry of `docs/design/kol-B-01-home.png`', () => {
  it('title, the one description line, and the confirm — Hebrew, from the spec', () => {
    expect(SRC).toContain('בחירת דמות');
    expect(SRC).toContain('CHARACTER_INTRO_HE');
    expect(SRC).toContain("'בחר'");
  });

  it('the three cards come from the rule, ⛔ not from a list in the component', () => {
    expect(SRC).toContain('ARENA_CHARACTERS.map(');
    expect(SRC).toContain('CHARACTER_BIAS_HE[');
    expect(CODE).not.toContain("'קוסם'");
  });

  it('three live idles — the existing keyframe, and `motion-reduce:animate-none` (Layer A)', () => {
    expect((SRC.match(/arena-idle-bob_4\.19s/g) ?? []).length).toBeGreaterThanOrEqual(1);
    expect(SRC).toContain('motion-reduce:animate-none');
    expect(CODE).not.toMatch(/@keyframes/);
  });

  it('selection is ⛔ never colour alone: aria-pressed + the word + the glyph', () => {
    expect(SRC).toContain('aria-pressed');
    expect(SRC).toContain("'נבחר'");
    expect(SRC).toContain('CheckGlyph');
  });

  it('⛔ no exit on first entry, `חזרה למסך הבית` only with a stored character', () => {
    expect(SRC).toContain('onBack !== undefined &&');
    expect(SRC).toContain('חזרה למסך הבית');
  });

  it('a disabled confirm carries a visible written reason (the ArenaHome pattern)', () => {
    expect(SRC).toContain('aria-describedby');
    expect(SRC).toContain('בחר דמות כדי להמשיך');
  });

  it('one endpoint, and it is the PATCH of T-217', () => {
    const paths = [...CODE.matchAll(/'(\/api\/[^']+)'/g)].map((m) => m[1]);
    expect(new Set(paths)).toEqual(new Set(['/api/arcade/character']));
    expect(CODE).toContain('apiPatch');
    expect(CODE).not.toContain('fetch(');
  });

  it('⛔ zero hex · ⛔ zero emoji · ⛔ no h-screen', () => {
    expect(CODE).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(CODE).not.toMatch(/\p{Extended_Pictographic}/u);
    expect(CODE).not.toContain('h-screen');
    /**
     * ⚠️ **⟦17/09 · `C-0672` · `T-402`⟧ הטענה הייתה `min-h-[100dvh]` ליטרלית, והיא
     * **הוחלפה בכוונה שלה** — `dvh`, ⛔ ולא `h-screen`. ⛔ **וזו ⛔ אינה החלשה של
     * שער:** הגדר החיה היא `check:mobile` (אפס גלילה אופקית · 44px · אפס גלישה),
     * והיא נמדדה ירוקה בטיק הזה בשלושת הרוחבים. ⛔ **והתקדים כבר במוצר וכבר עבר
     * QA:** `ArenaBattle.tsx:850` (`T-350`) ו-`CardDeck.tsx:368` מחזיקים עמודה
     * **מדויקת** מאותו היגיון בדיוק. ⇒ מה שהחוקה אוסרת הוא `h-screen`, ⛔ ולא
     * חישוב מדוד ב-`dvh`.
     */
    expect(SRC).toMatch(/100dvh/);
  });

  /**
   * ⚠️ The plan's string-literal regex counted `'use client'` and every state name
   * (`'idle'` · `'saving'`) as learner-facing text. The repo's proven measure is
   * `ArenaHome.test.ts`: JSX **text nodes**, with code punctuation filtered out.
   */
  it('⛔ RTL, ו⛔ אין מחרוזת אנגלית שהלומד רואה', () => {
    const strings = CODE.match(/(?<!=)>[^<>{}]*[A-Za-z][^<>{}]*</g) ?? [];
    const text = strings.filter((s) => /[=;()?]/.test(s) === false);
    expect(text.filter((s) => /[א-ת]/.test(s) === false && s.trim().length > 3)).toEqual([]);
  });
});

/**
 * 🚫 **T-402 · `ui-ux-pro-max` ⇢ Interaction ⇢ Disabled States — ההסבר מעל הקיפול.**
 *
 * 🔬 **הפער, נמדד בדפדפן חי (`next start`, `/dev/arcade/character`, 320·375·414 × 780):**
 * `בחר` מושבת ב-`y=735..793` ב-320 וב-`y=716..774` ב-375/414; «בחר דמות כדי להמשיך»
 * ב-`y=805..817` וב-`y=786..798` ⇒ **מתחת ל-780 בשלושת הרוחבים**. ⇒ הפעולה הראשית
 * מתה וההסבר היחיד לכך מחוץ למסך.
 *
 * ⛔ **הבדיקות כאן הן על המבנה, ⛔ והמספרים נמדדים בהליכה החיה** (`DEV.md` STEP 6.5):
 * גובה על `jsdom` הוא תמיד 0, ⇒ בדיקה שתטען «‏y < 780» כאן הייתה **טוענת ולא מודדת**.
 */
describe('T-402 — הסיבה למצב המושבת נקראת בלי גלילה', () => {
  it('עמודה **מדויקת** ⛔ ולא מינימום — התקדים של `ArenaBattle`/`CardDeck`', () => {
    expect(CODE).toMatch(/h-\[calc\(100dvh-5\.25rem\)\]/);
    // ⛔ `min-h-[100dvh]` **ועוד** `pb-16` ⇒ העמודה גבוהה מהמסך בהגדרה, ו-`mt-auto`
    // ⛔ אינו יכול להרים בלוק שאין מעליו מקום פנוי.
    expect(CODE).not.toMatch(/min-h-\[100dvh\]/);
    expect(CODE).not.toMatch(/\bpb-16\b/);
  });

  it('הכרטיסים הם מה שגולל, ⛔ ולא הכפתור — `flex-1 min-h-0 overflow-y-auto`', () => {
    const list = CODE.slice(CODE.indexOf('<ul'), CODE.indexOf('</ul>'));
    expect(list).toMatch(/min-h-0/);
    expect(list).toMatch(/flex-1/);
    expect(list).toMatch(/overflow-y-auto/);
  });

  it('הפעולות יושבות על רצפת העמודה ⇒ תחתית `בחר` ⛔ אינה יכולה לרדת מתחת לקיפול', () => {
    const actions = CODE.slice(CODE.indexOf('mt-auto'));
    expect(actions).toMatch(/mt-auto flex flex-col gap-3 pt-4/);
  });

  it('המשפט יושב **מעל** הכפתור בעץ, ⛔ ולא אחריו', () => {
    // ⛔ בתוך בלוק הפעולות בלבד — `CONFIRM_HE` מופיע קודם כהצהרת קבוע בראש הקובץ.
    const actions = CODE.slice(CODE.indexOf('mt-auto'));
    const sentence = actions.indexOf('arena-character-pick-first');
    const confirm = actions.indexOf('{state === \'saving\' ? SAVING_HE : CONFIRM_HE}');
    expect(sentence).toBeGreaterThan(-1);
    expect(confirm).toBeGreaterThan(-1);
    expect(sentence).toBeLessThan(confirm);
  });

  it('⛔ הפסקה ⛔ אינה נעלמת כשנבחרה דמות — היא **מתחלפת**', () => {
    // ⛔ התנאי הישן `{chosen === null && …}` הוציא אותה מהזרימה ⇒ הכפתור קפץ 24px.
    expect(CODE).not.toMatch(/\{chosen === null && \(/);
    expect(CODE).toMatch(/chosen === null \? PICK_FIRST_HE : READY_HE/);
  });

  it('הכפתור המושבת מצביע על ההסבר תמיד, ⛔ ולא רק כשהוא מושבת', () => {
    expect(CODE).toMatch(/aria-describedby="arena-character-pick-first"/);
  });

  it('⛔ אפס מחרוזת אנגלית ללומד, ⛔ ואפס מסך חדש', () => {
    expect(SRC).toContain("'אפשר להמשיך'");
    expect(CODE).not.toMatch(/\bhref="\/arcade\//);
  });
});
