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

  it('does not fail open on a blank or whitespace header value', () => {
    // ⚠️ An empty XFF is not the same as a missing one, and `''` as a bucket key
    // would put every such caller in a bucket keyed by nothing — which is what
    // `unknown` already is, but only if we get there deliberately.
    expect(clientIpFrom(h({ 'x-forwarded-for': '   ' }))).toBe('unknown');
    expect(clientIpFrom(h({ 'x-nf-client-connection-ip': '', 'x-forwarded-for': '4.4.4.4' })))
      .toBe('4.4.4.4');
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

  it('allows and logs when the RPC throws, not just when it returns an error', async () => {
    // PostgREST refusing the connection rejects the promise; an unguarded await
    // would turn a counter outage into a 500 on every login.
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = { rpc: vi.fn(async () => { throw new Error('fetch failed'); }) };
    const d = await checkAuthRateLimit(s as never, { headers: h({}), email: 'a@b.co', mode: 'login' }, 1_000);
    expect(d).toEqual({ allowed: true });
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });

  it('sends signup and login to DIFFERENT buckets for the same caller', async () => {
    // Otherwise a learner who mistyped their password three times could no longer
    // create an account, and the two policies would silently share one budget.
    const a = stub([{ hits: 1, window_started_at_ms: 0 }, { hits: 1, window_started_at_ms: 0 }]);
    const b = stub([{ hits: 1, window_started_at_ms: 0 }, { hits: 1, window_started_at_ms: 0 }]);
    const req = { headers: h({ 'x-nf-client-connection-ip': '5.5.5.5' }), email: 'a@b.co' } as const;
    await checkAuthRateLimit(a as never, { ...req, mode: 'signup' }, 1_000);
    await checkAuthRateLimit(b as never, { ...req, mode: 'login' }, 1_000);
    expect(new Set([...a.calls, ...b.calls]).size).toBe(4);
  });

  it('passes each policy its OWN window length to the RPC', async () => {
    // A single hard-coded window would make the per-email hour and the per-IP
    // ten minutes share one row, and the stricter policy would win by accident.
    const windows: number[] = [];
    const s = {
      rpc: vi.fn(async (_n: string, args: { p_window_seconds: number }) => {
        windows.push(args.p_window_seconds);
        return { data: [{ hits: 1, window_started_at_ms: 0 }], error: null };
      }),
    };
    await checkAuthRateLimit(s as never, { headers: h({}), email: 'a@b.co', mode: 'signup' }, 1_000);
    expect(new Set(windows)).toEqual(new Set([600, 3600]));
  });
});
