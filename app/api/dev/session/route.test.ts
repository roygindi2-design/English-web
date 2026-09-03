import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * D-057 · T-113 — שומר מקור, באותה צורה ובאותן מגבלות כמו
 * `app/api/auth/login/route.test.ts`: הסביבה היא `node`, אין פרויקט Supabase
 * כאן, ולכן ההתנהגות ⛔ אינה ניתנת להגעה. **מה שכן נמדד הוא הדבר שאחרת מאמינים
 * לו במקום למדוד אותו — ה-סדר**, שהוא כל תכונת האבטחה של הפיצ׳ר הזה.
 */
const SRC = readFileSync('app/api/dev/session/route.ts', 'utf8');
// ⚠️ הייבואים מוסרים, וזו הטענה שנושאת את הקובץ — הלקח של C-0160: עם בלוק
// הייבוא במקומו, `indexOf('readDevUserGate')` מוצא את ה-**ייבוא**, שהוא מעל כל
// פקודה בהגדרה, ולכן מבחן הסדר עובר גם אחרי שהשער הועבר מתחת להתחברות.
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/^[ \t]*\/\/[^\n]*$/gm, '')
  .replace(/^import[\s\S]*?;$/gm, '');

describe('GET /api/dev/session — the gate', () => {
  it('checks the gate BEFORE it reads env or builds a client', () => {
    const gate = CODE.indexOf('readDevUserGate(');
    expect(gate).toBeGreaterThan(-1);
    for (const after of ['readSupabaseEnv(', 'createRouteClient(', 'signInWithPassword']) {
      expect(CODE.indexOf(after), `${after} must come after the gate`).toBeGreaterThan(gate);
    }
  });

  it('answers a bare 404 when the gate is closed — ⛔ no body, ⛔ no reason', () => {
    const closed = CODE.slice(CODE.indexOf('readDevUserGate('), CODE.indexOf('readSupabaseEnv('));
    expect(closed).toMatch(/status:\s*404/);
    // ⛔ הסיבה מהשער ⛔ לעולם אינה יוצאת בתשובה — היא אורקל.
    for (const leak of ['not_configured', 'unsafe_password', 'reason']) {
      expect(closed).not.toContain(leak);
    }
  });

  it('⛔ never embeds a password and ⛔ never names the variables itself', () => {
    expect(CODE).not.toMatch(/DEV_TEST_USER_/);
    expect(CODE).not.toMatch(/process\s*\.\s*env/);
  });

  it('signs in as an ordinary user — ⛔ no signUp, ⛔ no admin, ⛔ no service role', () => {
    expect(CODE).toContain('signInWithPassword');
    for (const forbidden of ['signUp', 'auth.admin', 'SERVICE_ROLE', 'createServerClient']) {
      expect(CODE).not.toContain(forbidden);
    }
  });

  it('is force-dynamic, so the 404 is ⛔ never cached as the answer for everyone', () => {
    expect(SRC).toMatch(/export const dynamic = 'force-dynamic'/);
  });

  it('⛔ is not a page: nothing under app/dev/ is touched by this route', () => {
    expect(SRC).not.toContain('app/dev/');
    expect(SRC).not.toMatch(/data-primary-action/); // F-027 — סימון בלי מדידה
  });
});
