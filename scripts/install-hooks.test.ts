import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { HOOKS, hookState, installHooks } from './install-hooks.mjs';

/**
 * ⛔ **הכרעה 100 ⓐ — הוק שאינו מותקן הוא הוק שאינו קיים.** כל טיק הוא שיבוט חדש,
 * ולכן `core.hooksPath` (ערך ב-`.git/config` של שיבוט אחד) ⛔ אינו נוסע לשום מקום.
 * הבדיקות כאן רצות על שורש זמני, ⛔ ולא על הריפו החי.
 */
const fixture = (): string => {
  const root = mkdtempSync(join(tmpdir(), 'hooks-'));
  mkdirSync(join(root, '.git'), { recursive: true });
  mkdirSync(join(root, 'scripts', 'hooks'), { recursive: true });
  writeFileSync(join(root, 'scripts', 'hooks', 'pre-push'), '#!/usr/bin/env bash\nexit 0\n', 'utf8');
  return root;
};

describe('scripts/install-hooks.mjs', () => {
  it('מתקין את ה-hook ומסמן אותו כניתן להרצה', () => {
    const root = fixture();
    const res = installHooks(root);
    expect(res.reason).toBeNull();
    expect(res.installed).toEqual(['pre-push']);
    const dest = join(root, '.git', 'hooks', 'pre-push');
    expect(existsSync(dest)).toBe(true);
    expect(readFileSync(dest, 'utf8')).toBe(
      readFileSync(join(root, 'scripts', 'hooks', 'pre-push'), 'utf8'),
    );
    expect(hookState(root).ok).toBe(true);
  });

  it('⛔ אינו נופל כשאין .git — הוא מדווח סיבה', () => {
    const root = mkdtempSync(join(tmpdir(), 'nogit-'));
    mkdirSync(join(root, 'scripts', 'hooks'), { recursive: true });
    const res = installHooks(root);
    expect(res.installed).toEqual([]);
    expect(res.reason).toContain('.git');
  });

  it('hookState מזהה hook חסר', () => {
    const root = fixture();
    expect(hookState(root).missing).toEqual(['pre-push']);
    expect(hookState(root).ok).toBe(false);
  });

  it('hookState מזהה hook ישן שאינו זהה למקור', () => {
    const root = fixture();
    installHooks(root);
    const dest = join(root, '.git', 'hooks', 'pre-push');
    writeFileSync(dest, '#!/usr/bin/env bash\n# stale\nexit 0\n', 'utf8');
    chmodSync(dest, 0o755);
    const st = hookState(root);
    expect(st.stale).toEqual(['pre-push']);
    expect(st.ok).toBe(false);
  });

  /**
   * ⛔ הרשימה סגורה ומוצהרת: hook שנוסף ל-`scripts/hooks/` בלי שורה כאן הוא hook
   * ש⛔ אף בדיקה ⛔ אינה מודדת.
   */
  it('הרשימה הסגורה של ההוקים היא בדיוק מה שיושב ב-scripts/hooks', () => {
    expect(HOOKS).toEqual(['pre-push']);
    expect(existsSync(join('scripts', 'hooks', 'pre-push'))).toBe(true);
  });

  /**
   * ⛔ **השער עצמו, ⛔ ולא רק ההתקנה:** ה-hook חייב להריץ `npm run verify` ולצאת
   * ב-1 כשהוא אדום. טקסט הוא הראיה היחידה שאפשר לבדוק בלי לדחוף באמת.
   */
  it('ה-hook מריץ verify, חוסם בכישלון, ומכיר מוצא חירום מוצהר', () => {
    const body = readFileSync(join('scripts', 'hooks', 'pre-push'), 'utf8');
    expect(body, 'מריץ verify').toContain('npm run verify');
    expect(body, 'חוסם').toMatch(/exit 1/);
    expect(body, 'מוצא חירום מוצהר').toContain('SKIP_VERIFY');
    expect(body, 'רושם הערה שבדיקה 16 מודדת').toContain('notes --ref=verify');
    expect(body, '⛔ אינו נכנס לרקורסיה בדחיפת ההערות').toContain('VERIFY_HOOK_INTERNAL');
  });
});
