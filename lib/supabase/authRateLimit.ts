/**
 * The adapter half of the auth rate limiter (F-008ⓑ).
 *
 * ⛔ Deliberately NOT in `/lib/core`: it hashes (`node:crypto`), reads request
 * headers, reads `process.env`, and talks to PostgREST. The *decision* lives in
 * `lib/core/rateLimit.ts` and is pure; this file only supplies it with a count.
 */

import { createHash } from 'node:crypto';
import {
  decideRateLimit,
  strictest,
  LOGIN_PER_EMAIL,
  LOGIN_PER_IP,
  SIGNUP_PER_EMAIL,
  SIGNUP_PER_IP,
  type RateLimitDecision,
  type RateLimitPolicy,
} from '@/lib/core/rateLimit';

type RpcResult = { data: unknown; error: { message: string } | null };
type SupabaseLike = { rpc: (name: string, args: Record<string, unknown>) => PromiseLike<RpcResult> };

/**
 * ⚠️ `x-forwarded-for` is caller-controlled unless an edge overwrites it, so a
 * client could rotate it and get a fresh bucket per request. Netlify sets
 * `x-nf-client-connection-ip` from the connection itself, so that header wins and
 * XFF is only the fallback (local dev, another host).
 *
 * When neither is present the request joins one shared `unknown` bucket. ⛔ It
 * does NOT fail open — failing open is precisely F-003's mistake.
 */
export function clientIpFrom(headers: Headers): string {
  const edge = headers.get('x-nf-client-connection-ip')?.trim();
  if (edge) return edge;

  const firstHop = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (firstHop) return firstHop;

  return 'unknown';
}

/**
 * The bucket identity that reaches the database. Raw addresses and raw IPs never
 * leave this process: the table stores a salted digest and nothing else.
 * 32 hex chars (128 bits) is far past collision range for a counter table.
 */
export function bucketKey(scope: string, value: string): string {
  return createHash('sha256').update(`${SALT}:${scope}:${value}`).digest('hex').slice(0, 32);
}

/**
 * ⚠️ A constant fallback is documented, ⛔ not accidental: the salt keeps the
 * digests in `auth_attempts` from being reversible by dictionary against a known
 * address list. Without `AUTH_RATE_SALT` set the limiter still works and still
 * limits — only the anonymity of the stored keys is weakened — so an unset env
 * var must not take signup down. This is why the file cannot live in `/lib/core`.
 */
const SALT = process.env.AUTH_RATE_SALT ?? 'english-web:auth-rate:v1';

const POLICIES: Record<'signup' | 'login', { readonly ip: RateLimitPolicy; readonly email: RateLimitPolicy }> = {
  signup: { ip: SIGNUP_PER_IP, email: SIGNUP_PER_EMAIL },
  login: { ip: LOGIN_PER_IP, email: LOGIN_PER_EMAIL },
};

type CounterRow = { hits: number; window_started_at_ms: number };

function firstRow(data: unknown): CounterRow | null {
  const row = Array.isArray(data) ? data[0] : data;
  if (!row || typeof row !== 'object') return null;
  const { hits, window_started_at_ms: startedAt } = row as Record<string, unknown>;
  if (typeof hits !== 'number') return null;
  // Postgres `bigint` arrives over PostgREST as a JSON number or as a string,
  // depending on the client. Both are accepted; anything else is not a counter.
  const started = typeof startedAt === 'number' ? startedAt : Number(startedAt);
  if (!Number.isFinite(started)) return null;
  return { hits, window_started_at_ms: started };
}

async function consume(
  supabase: SupabaseLike,
  bucket: string,
  policy: RateLimitPolicy,
  nowMs: number
): Promise<RateLimitDecision> {
  const { data, error } = await supabase.rpc('consume_auth_attempt', {
    p_bucket: bucket,
    p_window_seconds: policy.windowSeconds,
  });

  if (error) {
    console.error('[authRateLimit] counter unavailable:', error.message);
    return { allowed: true };
  }

  const row = firstRow(data);
  if (!row) {
    console.error('[authRateLimit] counter returned no usable row');
    return { allowed: true };
  }

  return decideRateLimit(
    { hits: row.hits, windowStartedAtMs: row.window_started_at_ms },
    policy,
    nowMs
  );
}

/**
 * Both buckets are consumed, and the **stricter** verdict wins.
 *
 * Two buckets and not one, because they see different attacks: the per-IP bucket
 * is the only one that sees *many addresses from one client* (F-008's own
 * enumeration scenario), and the per-email bucket is the only one that sees *one
 * address from many clients* (credential stuffing). Shipping only one would leave
 * the other attack untouched.
 *
 * ⚠️ **Declared trade-off, ⛔ not an oversight.** If the RPC errors — and it will,
 * until `0012_auth_attempts.sql` is applied in the Supabase console — this returns
 * `{allowed:true}` and logs. Failing closed would take signup and login down for
 * every learner the moment the counter hiccups. F-003's fail-open lesson cuts the
 * other way only for a guard that protects *data*; this one protects *volume*.
 * Recorded as TD in `plan/30-architecture.md` with the trigger that flips it.
 */
export async function checkAuthRateLimit(
  supabase: SupabaseLike,
  input: { readonly headers: Headers; readonly email: string; readonly mode: 'signup' | 'login' },
  nowMs: number
): Promise<RateLimitDecision> {
  const policy = POLICIES[input.mode];

  try {
    const ip = await consume(
      supabase,
      bucketKey(`${input.mode}:ip`, clientIpFrom(input.headers)),
      policy.ip,
      nowMs
    );
    const email = await consume(
      supabase,
      bucketKey(`${input.mode}:email`, input.email),
      policy.email,
      nowMs
    );
    return strictest(ip, email);
  } catch (cause) {
    // A rejected promise (connection refused, DNS) must not become a 500 on the
    // login screen. Same declared trade-off as the `error` branch above.
    console.error('[authRateLimit] counter threw:', cause);
    return { allowed: true };
  }
}
