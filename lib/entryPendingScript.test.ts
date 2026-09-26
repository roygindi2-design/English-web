import { describe, expect, it } from 'vitest';
import { ENTRY_PENDING_ATTR, SIGNED_IN_HINT_COOKIE, hasSignedInHint } from '@/lib/core/entryRoute';
import { ENTRY_PENDING_MAX_MS, entryPendingScript } from './entryPendingScript';

describe('T-525 — the pre-hydration script agrees with hasSignedInHint', () => {
  function run(cookie: string) {
    const attrs = new Set<string>();
    const timers: (() => void)[] = [];
    const document = {
      cookie,
      documentElement: {
        setAttribute: (n: string) => attrs.add(n),
        removeAttribute: (n: string) => attrs.delete(n),
      },
    };
    const setTimeout = (fn: () => void) => timers.push(fn);
    new Function('document', 'setTimeout', entryPendingScript())(document, setTimeout);
    return { pending: attrs.has(ENTRY_PENDING_ATTR), timers, attrs };
  }

  for (const cookie of ['', 'a=b', `${SIGNED_IN_HINT_COOKIE}=1`, `a=b; ${SIGNED_IN_HINT_COOKIE}=1`, `x-${SIGNED_IN_HINT_COOKIE}=1`, `${SIGNED_IN_HINT_COOKIE}=0`]) {
    it(`cookie «${cookie}» ⇒ pending exactly when hasSignedInHint says so`, () => {
      expect(run(cookie).pending).toBe(hasSignedInHint(cookie));
    });
  }

  it('⛔ never stays pending forever — the fallback timer releases it', () => {
    const r = run(`${SIGNED_IN_HINT_COOKIE}=1`);
    expect(r.timers).toHaveLength(1);
    r.timers[0]?.();
    expect(r.attrs.has(ENTRY_PENDING_ATTR)).toBe(false);
    expect(ENTRY_PENDING_MAX_MS).toBeGreaterThan(6160);
  });
});
