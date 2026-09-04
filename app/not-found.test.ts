import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SRC = readFileSync('app/not-found.tsx', 'utf8');

/**
 * T-253ⓒ · D-186 — סריקת `<Link href>` על `app/`+`components/` מצאה `/` עם
 * שני שמות: `חזרה למסך הפתיחה` כאן, `חזרה למסך הבית` ב-`app/sources/page.tsx`.
 * `חזרה למסך הבית` היא הקבועה שכבר קיימת בכל שאר המוצר (`docs/superpowers/plans/
 * 2026-08-12-navigation-shell.md` וכו') — כאן היא הצד שהשתנה.
 */
describe('NotFound — `/` נקרא בשם אחד בלבד (T-253ⓒ)', () => {
  it('חוזר ל-`/` בתווית `חזרה למסך הבית`, ⛔ לא `חזרה למסך הפתיחה`', () => {
    expect(SRC).toContain('href="/"');
    expect(SRC).toContain('חזרה למסך הבית');
    expect(SRC).not.toContain('חזרה למסך הפתיחה');
  });
});
