import { describe, expect, it } from 'vitest';
import { driftingNames } from './journeyDrift';

describe('driftingNames', () => {
  it('⛔ אינו מדווח יעד שנקרא בשם אחד', () => {
    expect(driftingNames(new Map([['/cards', new Set(['למפת הרמה'])]]))).toEqual([]);
  });

  it('🔴 מדווח יעד ששני מסכים קוראים לו אחרת — וזה הממצא', () => {
    const labels = new Map([['/cards', new Set(['למפת הרמה', 'חזרה למפת הרמה'])]]);
    expect(driftingNames(labels)).toEqual(['/cards ⇒ «למפת הרמה» · «חזרה למפת הרמה»']);
  });

  it('⛔ אינו קורס על יעד בלי תוויות בכלל', () => {
    expect(driftingNames(new Map([['/x', new Set()]]))).toEqual([]);
  });
});
