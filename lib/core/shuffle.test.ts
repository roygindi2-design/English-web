import { describe, expect, it } from 'vitest';
import { mulberry32, shuffle } from './shuffle';

/**
 * ⛔ זהב, ⛔ ולא טענה כללית: ארבע השורות האלה נמדדו על **העותק שישב ב-`arcadeRound.ts`**
 * לפני ההעברה (C-0321), והן הראיה היחידה שההעברה לא שינתה התנהגות. מוטציה בגנרטור או
 * בכיוון הלולאה של פישר-ייטס מפילה אותן **בשם**.
 */
describe('shuffle — ההעברה מ-arcadeRound ⛔ לא שינתה התנהגות', () => {
  const base = ['a', 'b', 'c', 'd', 'e', 'f'] as const;

  it('mulberry32(7) — שלושת הערכים הראשונים כפי שנמדדו לפני ההעברה', () => {
    const rnd = mulberry32(7);
    expect([rnd(), rnd(), rnd()]).toEqual([
      0.011704753153026104, 0.06195825757458806, 0.97690763277933,
    ]);
  });

  it('seed 7 ⇒ התמורה שנמדדה לפני ההעברה', () => {
    expect(shuffle(base, mulberry32(7))).toEqual(['e', 'b', 'c', 'd', 'f', 'a']);
  });

  it('seed 1 ⇒ תמורה אחרת, ⛔ ולא אותה אחת', () => {
    expect(shuffle(base, mulberry32(1))).toEqual(['e', 'b', 'f', 'c', 'a', 'd']);
  });

  it('אורך אחר, seed אחר — נמדד גם הוא לפני ההעברה', () => {
    expect(shuffle([1, 2, 3, 4], mulberry32(42))).toEqual([1, 4, 2, 3]);
  });

  it('⛔ אינו משנה את המערך שהתקבל', () => {
    const input = ['a', 'b', 'c'];
    shuffle(input, mulberry32(3));
    expect(input).toEqual(['a', 'b', 'c']);
  });

  it('אותו seed פעמיים ⇒ אותה תוצאה, ⛔ תמיד', () => {
    expect(shuffle(base, mulberry32(99))).toEqual(shuffle(base, mulberry32(99)));
  });
});
