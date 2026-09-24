import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { withoutComments } from '@/lib/testSource';

/**
 * A source guard and not a render test: the environment is node and jsdom is
 * deliberately not installed (vitest.config.ts). Geometry belongs to
 * check:mobile, through the /dev/onboarding fixture.
 */
const SRC = readFileSync('components/OnboardingForm.tsx', 'utf8');

/** C-0032/C-0071/C-0076: a guard a comment can satisfy guards nothing. */
function markupOnly(source: string): string {
  return withoutComments(source);
}

const CODE = markupOnly(SRC);

/**
 * D-056 · T-111 — «לא צריך את זה, שחרר את זה, מיותר» (רוי, 19/08).
 * זו הבדיקה שנוקבת בה שורת המשימה: **סריקת מקור ש-`institution` ⛔ אינו מופיע
 * באף רכיב onboarding.**
 *
 * ⚠️ **הטענה על `enterKeyHint` ⛔ אינה נמחקת, והיא הסיבה שהבלוק הזה ⛔ אינו
 * ריק:** F-015 · TD-5 — `enterKeyHint="go"` הוא **טענה מוקלדת** שזה השדה האחרון
 * במסך. עד היום היא הייתה נכונה **בזכות** מיקום שדה המוסד מעליו (הבדיקה
 * «sits above the target-score field»). מרגע שהשדה יורד, השדה האחרון הוא ציון
 * היעד **מעצם היותו האחרון** — ולכן הטענה עוברת מ«סדר יחסי» ל«הרמז קיים על
 * השדה האחרון בפועל», ⛔ ואינה נעלמת עם השדה שהצדיק אותה.
 *
 * ⚠️ **`fieldElement()` נמחקה עם הבלוק, ⛔ ולא נשארה "למקרה שנצטרך":** היא
 * הייתה נקראת מהבדיקות שירדו בלבד, `noUnusedLocals` היה מפיל עליה את
 * `typecheck`, וזו בדיוק הפונקציה שתפתה את הסוכן הבא להחזיר שדה.
 */
describe('the institution question is gone from the screen (D-056 · T-111)', () => {
  it('⛔ has no institution input, state or label', () => {
    expect(CODE).not.toMatch(/institution/i);
    expect(CODE).not.toContain('INSTITUTION_');
  });

  it('⛔ never sends the key the route stopped reading', () => {
    const body = CODE.match(/apiPost<SaveResponse>\('\/api\/profile',\s*\{([^}]*)\}/);
    expect(body, 'the /api/profile call is not in the source').not.toBeNull();
    // ⚠️ `[^}]*` ⛔ אינו יכול לצאת מהסוגריים שפתח — זה בדיוק התיקון של C-0081,
    // שם `[\s\S]*?` יצא מהאובייקט ומצא את המילה במרקאפ 60 שורות מתחת.
    expect(body?.[1]).toMatch(/^\s*(?:[A-Za-z]+,\s*)*$/);
    expect(body?.[1]).toContain('dailyMinutes');
    expect(body?.[1]).toContain('examDate');
    expect(body?.[1]).toContain('targetScore');
  });

  it('leaves enterKeyHint="go" on what is now genuinely the last field (F-015 · TD-5)', () => {
    const scoreAt = CODE.indexOf('name="target_score"');
    expect(scoreAt).toBeGreaterThan(-1);
    expect(CODE).toContain('enterKeyHint="go"');
    // ⛔ ואין שדה קלט אחרי ציון היעד. ⚠️ `type="submit"` ⛔ אינו שדה.
    expect(CODE.slice(scoreAt)).not.toMatch(/<input\s/);
  });
});

/**
 * ⚠️ **שער חוקה על הרכיב כולו — הועבר לכאן ב-T-111 ו⛔ לא נמחק עם הבלוק.**
 * הוא ⛔ מעולם לא היה על שדה המוסד: F-011 · F-016 אוסרים מרכוז אנכי בכל מסך.
 */
describe('the onboarding screen obeys the design constitution', () => {
  it('still anchors its column to the top (F-011 · F-016)', () => {
    expect(CODE).not.toMatch(/flex-1[^"\'`]*justify-center/);
  });
});
