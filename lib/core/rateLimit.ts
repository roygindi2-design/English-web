/**
 * Pure rate-limit decision — F-008ⓑ. No React, no DOM, no network, no env, no clock.
 *
 * This file decides *whether* a request is over its budget; it never counts and
 * never stores. The counter is durable (Postgres, `0012_auth_attempts.sql`)
 * because the auth routes are Netlify serverless functions: a module-level `Map`
 * lives in one warm lambda and is invisible to the next one, so an in-memory
 * limiter would be a placebo against exactly the attack F-008 names.
 *
 * `nowMs` is an argument on purpose — `/lib/core` may not read the clock.
 */

export type RateLimitPolicy = {
  /** Requests allowed inside one window. Must be >= 1. */
  readonly limit: number;
  /** Window length in seconds. Must be >= 1. */
  readonly windowSeconds: number;
};

export type RateLimitCounter = {
  /** Hits already recorded in the window that contains `nowMs`, INCLUDING this one. */
  readonly hits: number;
  /** Unix ms at which the window containing `nowMs` began. */
  readonly windowStartedAtMs: number;
};

export type RateLimitDecision =
  | { readonly allowed: true }
  | { readonly allowed: false; readonly retryAfterSeconds: number };

/** Windows are aligned to the epoch, so two processes agree on the boundary without talking. */
export function windowStartMs(nowMs: number, windowSeconds: number): number {
  const windowMs = windowSeconds * 1000;
  return Math.floor(nowMs / windowMs) * windowMs;
}

export function decideRateLimit(
  counter: RateLimitCounter,
  policy: RateLimitPolicy,
  nowMs: number
): RateLimitDecision {
  const start = windowStartMs(nowMs, policy.windowSeconds);

  // A stored row from another window says nothing about this one. Both an
  // expired row and a row from the future (clock skew) are treated as absent —
  // ⛔ never as a lockout, or a backwards clock would jail a real learner.
  if (counter.windowStartedAtMs !== start) return { allowed: true };

  if (counter.hits <= policy.limit) return { allowed: true };

  const msLeft = start + policy.windowSeconds * 1000 - nowMs;
  // Rounded UP, and floored at 1: telling a caller to retry in 0 seconds is an
  // invitation to retry immediately and be refused again.
  return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(msLeft / 1000)) };
}

/** The stricter of two decisions. Ties keep the longer wait. */
export function strictest(a: RateLimitDecision, b: RateLimitDecision): RateLimitDecision {
  if (a.allowed) return b;
  if (b.allowed) return a;
  return a.retryAfterSeconds >= b.retryAfterSeconds ? a : b;
}

/**
 * Policies live here as named constants so the two routes cannot drift apart on
 * a number. ⚠️ No spec in `plan/` publishes a rate limit — these are policy the
 * route owns, chosen against one measured anchor: F-008's attacker needs 100k
 * signups, and at 10 per 10 minutes a single IP needs ~69 days instead of
 * minutes. 3 signups/hour per address is above any honest retry and below
 * automation. Login per-IP is deliberately looser than signup, because a school
 * NAT puts a whole classroom behind one address and locking out the class to
 * slow an attacker is the worse trade.
 * ⛔ If the PM later publishes numbers in `70-engines.md`, these move there.
 */
export const SIGNUP_PER_IP: RateLimitPolicy = { limit: 10, windowSeconds: 600 };
export const SIGNUP_PER_EMAIL: RateLimitPolicy = { limit: 3, windowSeconds: 3600 };
export const LOGIN_PER_IP: RateLimitPolicy = { limit: 20, windowSeconds: 600 };
export const LOGIN_PER_EMAIL: RateLimitPolicy = { limit: 8, windowSeconds: 900 };
