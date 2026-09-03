import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEV_USER_EMAIL_VAR, DEV_USER_PASSWORD_VAR, readDevUserGate } from './devUser';

/**
 * D-057 · T-113 — קריאת הסביבה, ⛔ ולא ההכרעה. ההכרעה ב-`lib/core/devUser.ts`
 * ונבדקה שם על טבלת אמת מלאה; כאן נבדק **רק** שהמשתנים הנכונים מגיעים לשם.
 *
 * ⚠️ **הסריקה בסוף הקובץ היא החצי החשוב:** שער שיושב בקובץ אחד ⛔ אינו שווה כלום
 * אם קובץ שני קורא את אותם משתנים ישירות. ⇒ הבדיקה סופרת את **כל** המופעים בעץ
 * ומתעקשת על רשימה סגורה.
 *
 * ⚠️ `sourceFilesUnder` הועתק מכוון מ-`lib/supabase/serviceRole.test.ts` (⛔ אינו
 * מיוצא משם) — קובץ בדיקה שמייצא עוזרים מושך את vitest לגרף ייבוא של קובץ בדיקה
 * אחר, וזו תקלה גרועה מכפילות של שש שורות.
 */
const SOURCE_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

function sourceFilesUnderOne(dir: string): string[] {
  if (!existsSync(dir)) return [];
  const found: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      found.push(...sourceFilesUnderOne(path));
    } else if (SOURCE_EXTENSIONS.some((extension) => entry.endsWith(extension))) {
      found.push(path);
    }
  }
  return found;
}

function sourceFilesUnder(dirs: string[]): string[] {
  return dirs.flatMap(sourceFilesUnderOne);
}

afterEach(() => vi.unstubAllEnvs());

describe('readDevUserGate (D-057 · T-113)', () => {
  it('⛔ is closed with nothing set', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv(DEV_USER_EMAIL_VAR, '');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, '');
    expect(readDevUserGate().open).toBe(false);
  });

  it('⛔ stays closed in production with both set — the gate ⛔ is not the caller’s job', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv(DEV_USER_EMAIL_VAR, 'dev@example.test');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, 'a-long-enough-secret');
    expect(readDevUserGate()).toEqual({ open: false, reason: 'production' });
  });

  it('opens with both set outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv(DEV_USER_EMAIL_VAR, 'dev@example.test');
    vi.stubEnv(DEV_USER_PASSWORD_VAR, 'a-long-enough-secret');
    const gate = readDevUserGate();
    expect(gate.open).toBe(true);
    if (gate.open) expect(gate.credentials.email).toBe('dev@example.test');
  });

  it('reads the variables STATICALLY — a dynamic lookup is erased by the bundler', () => {
    const SRC = readFileSync('lib/supabase/devUser.ts', 'utf8');
    expect(SRC).toContain('process.env.DEV_TEST_USER_EMAIL');
    expect(SRC).toContain('process.env.DEV_TEST_USER_PASSWORD');
    expect(SRC).not.toMatch(/process\.env\[/);
  });

  it('is the ONLY file in the tree that reads them', () => {
    // ⚠️ אותה תבנית כמו `lib/supabase/serviceRole.test.ts`, ומאותו טעם: מחיקה
    // בלי שומר מבוטלת על ידי הסוכן הבא שיצטרך את הדבר שנמחק.
    const offenders = sourceFilesUnder(['app', 'components', 'lib', 'scripts'])
      .filter((f) => f !== 'lib/supabase/devUser.ts' && !f.endsWith('devUser.test.ts'))
      .filter((f) => /process\s*\.\s*env\s*[.[]\s*['"`]?DEV_TEST_USER_/.test(readFileSync(f, 'utf8')));
    expect(offenders).toEqual([]);
  });

  it('⛔ scans a non-empty set, so a passing run means something', () => {
    expect(sourceFilesUnder(['app', 'components', 'lib', 'scripts']).length).toBeGreaterThan(50);
  });
});
