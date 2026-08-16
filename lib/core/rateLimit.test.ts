import { describe, expect, it } from 'vitest';
import {
  decideRateLimit,
  strictest,
  windowStartMs,
  SIGNUP_PER_IP,
  SIGNUP_PER_EMAIL,
  LOGIN_PER_IP,
  LOGIN_PER_EMAIL,
} from './rateLimit';

const P = { limit: 3, windowSeconds: 60 } as const;

describe('windowStartMs', () => {
  it('aligns to the epoch so two instances agree without talking', () => {
    expect(windowStartMs(60_000, 60)).toBe(60_000);
    expect(windowStartMs(119_999, 60)).toBe(60_000);
    expect(windowStartMs(120_000, 60)).toBe(120_000);
  });

  it('never returns a start in the future', () => {
    for (const now of [0, 1, 59_999, 60_000, 1_755_300_123_456]) {
      expect(windowStartMs(now, 60)).toBeLessThanOrEqual(now);
    }
  });
});

describe('decideRateLimit', () => {
  it('allows the hit that reaches the limit exactly — the limit is inclusive', () => {
    expect(decideRateLimit({ hits: 3, windowStartedAtMs: 0 }, P, 10_000)).toEqual({ allowed: true });
  });

  it('refuses the hit AFTER the limit, and says how long to wait', () => {
    expect(decideRateLimit({ hits: 4, windowStartedAtMs: 0 }, P, 10_000)).toEqual({
      allowed: false,
      retryAfterSeconds: 50,
    });
  });

  it('rounds the wait UP — 1.5s left is 2 seconds, ⛔ not 1', () => {
    // ⚠️ This case, ⛔ not the 0.4s one below, is what actually pins `Math.ceil`.
    // Measured in C-0160: with 0.4s left `Math.floor` returns 0 and the
    // `Math.max(1, …)` floor lifts it back to 1, so a floor/ceil mutation
    // survived the assertion the plan wrote. 1.5s left separates them.
    const d = decideRateLimit({ hits: 4, windowStartedAtMs: 0 }, P, 58_500);
    expect(d).toEqual({ allowed: false, retryAfterSeconds: 2 });
  });

  it('never reports 0 — 0.4s left is reported as 1 second, ⛔ not "retry now"', () => {
    const d = decideRateLimit({ hits: 4, windowStartedAtMs: 0 }, P, 59_600);
    expect(d).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it('reports at least 1 second even on the final millisecond', () => {
    const d = decideRateLimit({ hits: 9, windowStartedAtMs: 0 }, P, 59_999);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('treats a counter from an EXPIRED window as a fresh one, ⛔ not as a lockout', () => {
    expect(decideRateLimit({ hits: 99, windowStartedAtMs: 0 }, P, 60_001)).toEqual({ allowed: true });
  });

  it('a clock that went backwards does not resurrect an old window', () => {
    expect(decideRateLimit({ hits: 99, windowStartedAtMs: 600_000 }, P, 10_000)).toEqual({
      allowed: true,
    });
  });
});

describe('strictest', () => {
  const no = (s: number) => ({ allowed: false, retryAfterSeconds: s }) as const;

  it('one refusal beats any number of allowances', () => {
    expect(strictest({ allowed: true }, no(5))).toEqual(no(5));
    expect(strictest(no(5), { allowed: true })).toEqual(no(5));
  });

  it('two refusals keep the LONGER wait', () => {
    expect(strictest(no(5), no(90))).toEqual(no(90));
    expect(strictest(no(90), no(5))).toEqual(no(90));
  });

  it('two allowances stay allowed', () => {
    expect(strictest({ allowed: true }, { allowed: true })).toEqual({ allowed: true });
  });
});

describe('the four published policies', () => {
  it('are all positive integers — a zero window divides by zero', () => {
    for (const p of [SIGNUP_PER_IP, SIGNUP_PER_EMAIL, LOGIN_PER_IP, LOGIN_PER_EMAIL]) {
      expect(Number.isInteger(p.limit)).toBe(true);
      expect(p.limit).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(p.windowSeconds)).toBe(true);
      expect(p.windowSeconds).toBeGreaterThanOrEqual(1);
    }
  });

  it('let a mistyping learner retry, and still cost an attacker ~69 days for F-008 100k', () => {
    expect(SIGNUP_PER_EMAIL.limit).toBeGreaterThanOrEqual(3);
    const perDay = (SIGNUP_PER_IP.limit * 86_400) / SIGNUP_PER_IP.windowSeconds;
    expect(100_000 / perDay).toBeGreaterThan(60);
  });

  it('keeps login per-IP LOOSER than signup — a NAT classroom must not be locked out', () => {
    const loginPerHour = (LOGIN_PER_IP.limit * 3600) / LOGIN_PER_IP.windowSeconds;
    const signupPerHour = (SIGNUP_PER_IP.limit * 3600) / SIGNUP_PER_IP.windowSeconds;
    expect(loginPerHour).toBeGreaterThan(signupPerHour);
  });
});
