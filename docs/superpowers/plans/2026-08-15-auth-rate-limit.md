# Auth Rate Limiting Implementation Plan (F-008, ⓑ half)

> **For agentic workers:** implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> Written C-0159 (DEV, planning tick, `date -u` 2026-08-15T23:36:36Z). ⚠️ `superpowers:writing-plans` is **not installed in this session** — `ListSkills(["superpowers","writing-plans"])` returned `{"results":[]}`. The plan follows the format the loop prompt mandates (exact paths · `Interfaces` block · real test code · 2–5 minute steps · self-check), and the missing skill is recorded, ⛔ not claimed as used.

**Goal:** Close the half of **F-008** that does **not** depend on Q-001 — «אין שום הגבלת קצב באפליקציה». F-008's failure scenario is *«תוקף מריץ רשימה של 100 אלף כתובות מול `/api/auth/signup` ומקבל מהסטטוס בלבד רשימת חברות מלאה»*. The scenario needs **two** things: a status oracle **and** unlimited volume. This plan removes the volume.

**Architecture:** one pure leaf module in `/lib/core`, one durable counter (migration + `SECURITY DEFINER` RPC), one thin adapter in `/lib/supabase`, and the two auth routes wired to it. ⛔ Zero UI, zero new screen, zero new copy, zero new error code — `rate_limited` and its Hebrew message **already exist** in `lib/core/auth.ts:31,53` and `/api/auth/login` **already answers 429** for it (`route.ts:50`). The vocabulary was designed for this and never got a producer.

**Tech Stack:** TypeScript (⛔ no `any`, `noUncheckedIndexedAccess` on) · vitest (node env) · Postgres/Supabase.

---

## Why this and not the fix F-008 proposes

F-008's own «תיקון מוצע» is *«החזר 200 עם אותו מבנה `awaiting_email_confirmation` גם ל-`email_taken`»*, and it ends **«תלוי בהכרעת Q-001»**.

**Q-001 is closed the other way.** `plan/OPERATOR-LOG.md:8` — «✅ **Q-001 נסגרה: אימות מייל נשאר כבוי.**». With confirmation **off** no mail is ever sent, so answering `awaiting_email_confirmation` to a taken address would tell a real learner to go and read a mail that does not exist, and they could never get in. **The proposed fix would strand learners to hide a status code.** It unblocks only when **T-025** (SMTP + turning confirmation on) lands, and T-025 is ⛔ blocked on Roy.

⇒ ⓐ (the 409/200 oracle) stays open and stays owned by T-025. ⓑ (the volume) is independent of Q-001, of the PM, and of Roy, and is what this plan builds.

## Measurements this plan rests on — each read in C-0159, ⛔ none assumed

| # | Fact | How it was measured |
|---|---|---|
| M1 | The product has **zero** app-level rate limiting today | `grep -rn "rate_limit\|rateLimit\|rate-limit" --include=*.ts --include=*.tsx --include=*.sql --include=*.toml .` ⇒ 6 hits, **all** of them *mapping* a provider 429 (`lib/core/auth.ts:31,53,157` · `auth.test.ts:93,94` · `login/route.ts:50`). ⛔ Not one producer. |
| M2 | `rate_limited` is already a public `AuthErrorCode` with Hebrew copy | `lib/core/auth.ts:31` · `:53` («יותר מדי ניסיונות. אפשר לנסות שוב בעוד כמה דקות») |
| M3 | `/api/auth/login` already returns **429** on that code | `app/api/auth/login/route.ts:50` |
| M4 | `/api/auth/signup` has **no** 429 branch at all | `app/api/auth/signup/route.ts:47-52` — only 409/400 |
| M5 | Highest existing migration is `0011_content_read_policies.sql` ⇒ this plan writes **0012** | `ls supabase/migrations/` |
| M6 | Route handlers are Netlify serverless functions | `netlify.toml` `[[plugins]] package = "@netlify/plugin-nextjs"` |
| M7 | Route tests in this repo are **source guards**, not behaviour — vitest env is node and there is no Supabase project | `app/api/world/status/route.test.ts:1-12` (header comment, verbatim) |
| M8 | The contract is **already asymmetric**: `docs/api-contract.md:76` publishes a 429 `rate_limited` for **login**, and signup's section (`:45-68`) has **no** 429 row | `grep -n "auth/signup\|auth/login\|429" docs/api-contract.md` ⇒ `45 · 70 · 76`. ⚠️ So login has been *promising* a 429 that only the provider could ever produce (M1) — the contract was written for the limiter this plan builds. ⛔ Do not «add» a row to login; it is there. |

**M6 is the design constraint that decides storage.** A module-level `Map` lives inside **one warm lambda instance** and is not shared between concurrent instances. An attacker running 100k addresses fans out across instances by construction, so an in-memory limiter would be a **placebo** against exactly the scenario F-008 names. ⇒ the counter is durable (Postgres), and the pure module is kept storage-free so the decision is testable without a database.

## Two buckets, and why one is not enough

- **per-IP** — enumeration and password-spraying are *many different addresses from one client*. Only an IP bucket sees them. This is the bucket F-008's scenario actually needs.
- **per-email** — credential stuffing is *one address, many passwords, many clients*. Only an email bucket sees that.

Both are checked; the **stricter** verdict wins. A plan that shipped only the email bucket would leave F-008's own scenario untouched.

⚠️ **IP trust.** `x-forwarded-for` is caller-controlled unless an edge overwrites it. Netlify sets `x-nf-client-connection-ip`, so that header is preferred and XFF is the fallback. When neither is present the request goes into one shared `unknown` bucket — ⛔ **it does not fail open**, because failing open is exactly F-003's mistake.

---

### Task 1: `lib/core/rateLimit.ts` — the pure decision

**Files:**
- Create: `lib/core/rateLimit.ts`
- Test: `lib/core/rateLimit.test.ts`

**Interfaces** (exact signatures — the adapter in Task 3 imports these and nothing else):

```ts
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
export function windowStartMs(nowMs: number, windowSeconds: number): number;

export function decideRateLimit(
  counter: RateLimitCounter,
  policy: RateLimitPolicy,
  nowMs: number
): RateLimitDecision;

/** The stricter of two decisions. Ties keep the longer wait. */
export function strictest(a: RateLimitDecision, b: RateLimitDecision): RateLimitDecision;

/** Policies live here as named constants so the routes cannot drift apart on a number. */
export const SIGNUP_PER_IP: RateLimitPolicy;   // 10 / 600s
export const SIGNUP_PER_EMAIL: RateLimitPolicy; // 3 / 3600s
export const LOGIN_PER_IP: RateLimitPolicy;     // 20 / 600s
export const LOGIN_PER_EMAIL: RateLimitPolicy;  // 8 / 900s
```

⚠️ **Where the four numbers come from.** No spec in `plan/` publishes a rate limit — `grep -rn "הגבלת קצב\|rate limit" plan/ docs/api-contract.md` returns **only F-008 itself**. They are therefore **policy the route owns**, chosen against one measured anchor and written down here rather than invented in a route file: F-008's attacker needs 100k signups; at `SIGNUP_PER_IP` = 10/10min a single IP needs **~69 days** instead of minutes. `SIGNUP_PER_EMAIL` = 3/hour is above any honest retry (a learner who mistypes twice still gets in) and below automation. `LOGIN_PER_IP` is deliberately looser than signup: a school NAT puts a whole class behind one address, and locking out a classroom to slow an attacker is the worse trade. ⛔ If the PM later publishes numbers in `70-engines.md`, these constants move there and this paragraph becomes the citation.

**Steps:**

- [ ] Create `lib/core/rateLimit.test.ts` with the block below and run `npx vitest run lib/core/rateLimit.test.ts` — it must fail with `Failed to load … lib/core/rateLimit`. ⛔ Do not write the module first.

```ts
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

  it('rounds the wait UP — 0.4s left must not be reported as 0', () => {
    const d = decideRateLimit({ hits: 4, windowStartedAtMs: 0 }, P, 59_600);
    expect(d).toEqual({ allowed: false, retryAfterSeconds: 1 });
  });

  it('reports at least 1 second even on the final millisecond', () => {
    const d = decideRateLimit({ hits: 9, windowStartedAtMs: 0 }, P, 59_999);
    expect(d.allowed).toBe(false);
    if (!d.allowed) expect(d.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it('treats a counter from an EXPIRED window as a fresh one, ⛔ not as a lockout', () => {
    // The stored row belongs to the window [0,60s). `nowMs` is in the next window.
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
    // The honest-learner floor and the attacker ceiling are the two ends this file trades between.
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
```

- [ ] Write `lib/core/rateLimit.ts` until all of the above is green. `windowStartMs` is `Math.floor(nowMs / (windowSeconds * 1000)) * windowSeconds * 1000`. `decideRateLimit` returns `{allowed:true}` whenever `counter.windowStartedAtMs !== windowStartMs(nowMs, policy.windowSeconds)` (stale row ⇒ fresh window) **or** `counter.hits <= policy.limit`; otherwise `retryAfterSeconds = Math.max(1, Math.ceil((windowStart + windowSeconds*1000 - nowMs) / 1000))`.
- [ ] `npx vitest run lib/core/rateLimit.test.ts` — green. Record the exact count.
- [ ] **Mutation 1:** change `hits <= policy.limit` to `hits < policy.limit`. Expect *«allows the hit that reaches the limit exactly»* to fail **by name**. Restore, confirm with `git diff --stat` ⇒ 0 lines.
- [ ] **Mutation 2:** change `Math.ceil` to `Math.floor`. Expect *«rounds the wait UP»* to fail **by name**. Restore and confirm.
- [ ] **Mutation 3:** delete the stale-window branch. Expect *«treats a counter from an EXPIRED window as a fresh one»* **and** *«a clock that went backwards»* to fail — two names. Restore and confirm.
- [ ] `npm run check:core` ⇒ `/lib/core purity: OK`. The module takes `nowMs` as an argument for exactly this reason — ⛔ no `Date.now()` inside `/lib/core`.

---

### Task 2: `0012_auth_attempts.sql` — the durable counter

**Files:**
- Create: `supabase/migrations/0012_auth_attempts.sql`
- Test: `supabase/migrations/0012_auth_attempts.test.ts`

**Why an RPC and not a table write.** The auth routes run **before** anyone is logged in, on the anon key. An RLS policy that let anon `insert`/`update` a counter row would let a caller reset their own counter, which is the same as having none. ⇒ the table has **no** anon policy at all, and the only door is one `SECURITY DEFINER` function that increments and returns — the caller can raise the count and can never lower it.

**Interfaces** (SQL surface the adapter in Task 3 calls, exact names):

```sql
-- returns the hit count INCLUDING this call, and the window it belongs to
create or replace function public.consume_auth_attempt(
  p_bucket text,             -- e.g. 'signup:ip:9f3c…'
  p_window_seconds integer
) returns table (hits integer, window_started_at_ms bigint)
```

**Steps:**

- [ ] Create `supabase/migrations/0012_auth_attempts.test.ts` with the block below and run it — it fails on the missing file. ⛔ Do not write the SQL first. (Same class of test as `lib/supabase/telemetry.test.ts` — the migration file is the artefact under test; there is no Postgres in CI, M7.)

```ts
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const SQL = readFileSync('supabase/migrations/0012_auth_attempts.sql', 'utf8');
const BODY = SQL.replace(/--[^\n]*$/gm, '');

describe('0012_auth_attempts', () => {
  it('is re-runnable — an applied migration must be a no-op, ⛔ not an error', () => {
    expect(BODY).toMatch(/create table if not exists public\.auth_attempts/i);
    expect(BODY).toMatch(/create or replace function public\.consume_auth_attempt/i);
  });

  it('turns RLS ON and grants anon NOTHING — the RPC is the only door', () => {
    expect(BODY).toMatch(/alter table public\.auth_attempts enable row level security/i);
    // ⚠️ Measured, ⛔ not assumed: a `create policy … for select … to anon` would still let a
    // caller read every bucket in the table, so ANY anon policy on this table is the defect.
    expect(BODY).not.toMatch(/create policy[\s\S]{0,400}?on public\.auth_attempts/i);
  });

  it('is SECURITY DEFINER with a pinned search_path — an unpinned one is hijackable', () => {
    expect(BODY).toMatch(/security definer/i);
    expect(BODY).toMatch(/set search_path\s*=\s*(public|pg_catalog)/i);
  });

  it('grants EXECUTE on the function to anon, or the anon routes cannot call it', () => {
    expect(BODY).toMatch(/grant execute on function public\.consume_auth_attempt[^;]*to anon/i);
  });

  it('increments atomically in ONE statement — read-then-write races under load', () => {
    // Two lambdas hitting the same bucket in the same millisecond must not both read 1.
    expect(BODY).toMatch(/on conflict[\s\S]{0,200}do update[\s\S]{0,200}set[\s\S]{0,200}hits\s*=/i);
    expect(BODY).not.toMatch(/select\s+hits[\s\S]{0,200}?;\s*[\s\S]{0,200}?update public\.auth_attempts/i);
  });

  it('stores a bucket KEY and ⛔ never a raw email or a raw IP', () => {
    expect(BODY).not.toMatch(/\bemail\b/i);
    expect(BODY).not.toMatch(/\bip_address\b|\binet\b/i);
  });

  it('can be swept — an unbounded counter table grows forever', () => {
    expect(BODY).toMatch(/create index if not exists[\s\S]{0,120}window_started_at/i);
  });
});
```

- [ ] Write `0012_auth_attempts.sql`: table `(bucket text, window_started_at_ms bigint, hits integer not null default 0, primary key (bucket, window_started_at_ms))`; `enable row level security` with **no** policy; the `consume_auth_attempt` function computing `window_started_at_ms` in SQL by the **same** epoch-aligned formula as Task 1, then `insert … values (p_bucket, w, 1) on conflict (bucket, window_started_at_ms) do update set hits = public.auth_attempts.hits + 1 returning hits, window_started_at_ms`; `security definer`, `set search_path = public`; `grant execute … to anon`; index on `window_started_at_ms`.
- [ ] Run the test — green.
- [ ] **Mutation:** drop `set search_path = public` from the function. Expect *«is SECURITY DEFINER with a pinned search_path»* to fail by name. Restore, confirm `git diff --stat` ⇒ 0 lines.
- [ ] **Mutation:** replace the `on conflict … do update` with a bare `insert`. Expect *«increments atomically»* to fail by name. Restore and confirm.
- [ ] Add a line to `plan/03-for-roy.md`: `0012_auth_attempts.sql` needs to be run in the Supabase console, exactly like `0011` (C-0145). ⛔ Do not claim it is applied.

---

### Task 3: wire the two routes, and update the contract in the same commit

**Files:**
- Create: `lib/supabase/authRateLimit.ts`
- Modify: `app/api/auth/signup/route.ts` · `app/api/auth/login/route.ts` · `docs/api-contract.md`
- Test: `lib/supabase/authRateLimit.test.ts` · `app/api/auth/signup/route.test.ts` · `app/api/auth/login/route.test.ts`

**Interfaces:**

```ts
// lib/supabase/authRateLimit.ts — ⛔ NOT /lib/core: it hashes (node:crypto), reads headers and talks to PostgREST.
import type { RateLimitDecision } from '@/lib/core/rateLimit';

/** Netlify's own header first; XFF is the fallback; absent ⇒ the shared 'unknown' bucket. */
export function clientIpFrom(headers: Headers): string;

/** sha256 over `${salt}:${scope}:${value}`, first 32 hex chars. Raw values never leave the process. */
export function bucketKey(scope: string, value: string): string;

/** Both buckets, stricter wins. A DB failure returns `{allowed:true}` and logs — see the TD below. */
export function checkAuthRateLimit(
  supabase: SupabaseLike,
  input: { readonly headers: Headers; readonly email: string; readonly mode: 'signup' | 'login' },
  nowMs: number
): Promise<RateLimitDecision>;
```

⚠️ **Declared trade-off, ⛔ not an oversight.** If the RPC itself errors (migration not yet run — and it will not be, until Roy runs it), `checkAuthRateLimit` **allows** the request and `console.error`s. Failing closed would take signup and login down for every learner the moment the counter table hiccups, and F-003's lesson cuts the other way only for a *guard that protects data*; this one protects *volume*. This is recorded as technical debt in `plan/30-architecture.md`, with the trigger that flips it: once `0012` is applied and `/api/health` reports the table, the fallback becomes fail-closed.

**Steps:**

- [ ] Write `lib/supabase/authRateLimit.test.ts` first — behaviour for `clientIpFrom` and `bucketKey` (both pure enough to call directly), and a `checkAuthRateLimit` test driven by a hand-written stub `{ rpc: (name, args) => … }`, ⛔ no network:

```ts
import { describe, expect, it, vi } from 'vitest';
import { bucketKey, checkAuthRateLimit, clientIpFrom } from './authRateLimit';

const h = (o: Record<string, string>) => new Headers(o);

describe('clientIpFrom', () => {
  it('prefers the header the edge sets over the one the caller can forge', () => {
    expect(clientIpFrom(h({ 'x-nf-client-connection-ip': '1.1.1.1', 'x-forwarded-for': '9.9.9.9' })))
      .toBe('1.1.1.1');
  });

  it('falls back to the FIRST hop of x-forwarded-for', () => {
    expect(clientIpFrom(h({ 'x-forwarded-for': '2.2.2.2, 3.3.3.3' }))).toBe('2.2.2.2');
  });

  it('does not fail open when neither header is present', () => {
    expect(clientIpFrom(h({}))).toBe('unknown');
  });
});

describe('bucketKey', () => {
  it('is stable, scoped, and ⛔ does not contain the raw value', () => {
    const k = bucketKey('signup:email', 'roy@example.com');
    expect(k).toBe(bucketKey('signup:email', 'roy@example.com'));
    expect(k).not.toContain('roy@example.com');
    expect(k).not.toBe(bucketKey('login:email', 'roy@example.com'));
    expect(k).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('checkAuthRateLimit', () => {
  const stub = (rows: Array<{ hits: number; window_started_at_ms: number }>) => {
    const calls: string[] = [];
    let i = 0;
    return {
      calls,
      rpc: vi.fn(async (_n: string, args: { p_bucket: string }) => {
        calls.push(args.p_bucket);
        return { data: [rows[i++]], error: null };
      }),
    };
  };

  it('checks TWO buckets — the IP one is what F-008 actually needs', async () => {
    const s = stub([{ hits: 1, window_started_at_ms: 0 }, { hits: 1, window_started_at_ms: 0 }]);
    await checkAuthRateLimit(s as never, { headers: h({}), email: 'a@b.co', mode: 'signup' }, 1_000);
    expect(s.rpc).toHaveBeenCalledTimes(2);
    expect(new Set(s.calls).size).toBe(2);
  });

  it('refuses when EITHER bucket is over, even if the other is quiet', async () => {
    const s = stub([{ hits: 1, window_started_at_ms: 0 }, { hits: 999, window_started_at_ms: 0 }]);
    const d = await checkAuthRateLimit(s as never, { headers: h({}), email: 'a@b.co', mode: 'signup' }, 1_000);
    expect(d.allowed).toBe(false);
  });

  it('allows and logs when the RPC errors — the declared TD, ⛔ not silence', async () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = { rpc: vi.fn(async () => ({ data: null, error: { message: 'relation does not exist' } })) };
    const d = await checkAuthRateLimit(s as never, { headers: h({}), email: 'a@b.co', mode: 'login' }, 1_000);
    expect(d).toEqual({ allowed: true });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
```

- [ ] Write `lib/supabase/authRateLimit.ts` until green. `AUTH_RATE_SALT` is read from `process.env` with a documented constant fallback (⛔ this is why the file is not in `/lib/core`).
- [ ] Write the two route source guards, in the shape M7 documents (`readFileSync` + strip comments). Each must assert, on its own file: the rate-limit check runs **before** any `supabase.auth.` call; a 429 branch exists; and — the assertion that carries the weight — `expect(CODE).toMatch(/Retry-After/)`.

```ts
// app/api/auth/signup/route.test.ts (login's is the same file with the paths swapped)
const SRC = readFileSync('app/api/auth/signup/route.ts', 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^[ \t]*\/\/[^\n]*$/gm, '');

it('rate-limits BEFORE it asks the provider — an oracle answered late is still an oracle', () => {
  const gate = CODE.indexOf('checkAuthRateLimit');
  const provider = CODE.indexOf('supabase.auth.');
  expect(gate).toBeGreaterThan(-1);
  expect(provider).toBeGreaterThan(gate);
});

it('answers 429 with Retry-After, ⛔ not a bare 429', () => {
  expect(CODE).toMatch(/status:\s*429/);
  expect(CODE).toMatch(/'Retry-After':\s*String\(/);
});

it('still rate-limits AFTER the shape guard, so a junk body costs no database call', () => {
  expect(CODE.indexOf('isCredentialPayload')).toBeLessThan(CODE.indexOf('checkAuthRateLimit'));
});
```

- [ ] Wire both routes: after `checkCredentials` succeeds and the Supabase client exists, `await checkAuthRateLimit(...)`; on refusal return `{ ok: false, code: 'rate_limited', message: messageFor('rate_limited') }` with status **429** and header `Retry-After`. ⛔ Reuse `messageFor` — no new copy.
- [ ] Update `docs/api-contract.md` **in this same commit**, and note the two halves are **not** symmetric (M8): `/api/auth/login` **already has** a 429 `rate_limited` row at `:76` — it gains the `Retry-After` header and the sentence saying the limit is now *ours* and not only the provider's relay. `/api/auth/signup` has **no** 429 row at all and gains the whole line. (The loop rule: the contract moves with the endpoint, ⛔ not after it.)
- [ ] **Mutation:** move the `checkAuthRateLimit` call below `supabase.auth.signUp`. Expect *«rate-limits BEFORE it asks the provider»* to fail by name in the signup guard. Restore, `git diff --stat` ⇒ 0 lines.
- [ ] **Mutation:** drop the `Retry-After` header. Expect *«answers 429 with Retry-After»* to fail by name. Restore and confirm.

---

## Self-check before the tick closes

- [ ] `npm run typecheck && npm run check:core && npm test && npm run build` — all four in **one** message, and the real output pasted into the report. ⛔ «אמור לעבוד» is not a result.
- [ ] `npm run measure:plan` — `tasks: … 0 malformed` still holds.
- [ ] `git status --porcelain` empty after `npm test` — a dirty tree means a generator wrote over a managed file (F-048ⓑ).
- [ ] The test count is **recorded as measured**, ⛔ not predicted. This plan deliberately publishes **no** expected total (F-044 · F-045 · F-047 were all this exact defect).
- [ ] `plan/30-architecture.md` carries: the TD for the fail-open fallback, and the TD that `0012` is unapplied until Roy runs it.
- [ ] **F-008 is marked 🔓 partial, ⛔ not ✅.** Half ⓐ — the 409/200 status oracle — is untouched and stays owned by **T-025**. A tick that marks F-008 closed is lying about the oracle.
