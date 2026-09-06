import { describe, expect, it } from 'vitest';
import { formatCycleId, maxCycleNumber } from './next-cycle-id.mjs';

describe('scripts/next-cycle-id.mjs', () => {
  it('finds the highest C-xxxx id across one text blob', () => {
    const log = 'loop(DEV): C-0201 fix x\nloop(PM): C-0199 plan y\n';
    expect(maxCycleNumber([log])).toBe(201);
  });

  it('returns 0 when no C-xxxx id is present, so the next id starts at C-0001', () => {
    expect(maxCycleNumber([''])).toBe(0);
    expect(maxCycleNumber(['no ids here'])).toBe(0);
  });

  /**
   * 🔴 Reproduces the measured collision, verbatim from
   * `docs/superpowers/plans/2026-09-05-improvement-plan.md` § 1.2 כ-1: commit
   * `bf4c785` locked in as `C-0426` on one branch view; the very next commit in
   * sequence, `e94a4ae`, had to fix itself with "previous commit wrongly called
   * itself C-0426". Two agents ran max+1 against only ONE branch each and got
   * the same number. The fix is structural: always take the max across BOTH
   * remotes together, never one alone.
   */
  it('🔴 takes the max ACROSS both branches, not the max of either alone — closes the C-0426 collision', () => {
    const devLog = 'loop(DEV): C-0425 a\nloop(QA): C-0424 merge\n';
    // work/current is AHEAD of dev by one commit that dev has not seen yet.
    const workCurrentLog = 'loop(DEV): C-0426 b\nloop(DEV): C-0425 a\n';
    // An agent that only reads `dev` would compute max(425) + 1 = C-0426 — a
    // collision with the id `work/current` already used.
    expect(maxCycleNumber([devLog])).toBe(425);
    // Reading both together is what closes it: C-0427, never C-0426 again.
    expect(maxCycleNumber([devLog, workCurrentLog])).toBe(426);
    expect(formatCycleId(maxCycleNumber([devLog, workCurrentLog]) + 1)).toBe('C-0427');
  });

  it('formats with zero-padding to 4 digits, no cap below 9999', () => {
    expect(formatCycleId(1)).toBe('C-0001');
    expect(formatCycleId(453)).toBe('C-0453');
    expect(formatCycleId(10000)).toBe('C-10000');
  });

  it('ignores ids embedded in unrelated tokens (word boundary, not substring)', () => {
    // "XC-0426Y" must not match — only a real `C-####` token counts.
    expect(maxCycleNumber(['XC-0426Y really-not-an-id'])).toBe(0);
  });
});
