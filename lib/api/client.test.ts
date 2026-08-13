import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiUnreachableError, apiGet, apiPost } from '@/lib/api/client';

/**
 * The HTTP layer, and the one asymmetry that had to go.
 *
 * `apiPost` already documents the contract of this whole file: *anything the server
 * answered — including a 4xx — comes back as data, because our API routes always describe
 * failures in the body*. `apiGet` contradicted it by throwing a bare `Error` on any
 * non-2xx, which discards the body and with it the only thing that distinguishes the three
 * failures `/api/study/queue` can return: `session_expired` (401), `schema_missing` (503,
 * "the bank is not set up yet") and `unavailable` (503, "try again"). A screen that cannot
 * tell them apart has to show one sentence for all three, and two of those three would be
 * lies.
 *
 * ⚠️ Changed C-0102 with zero callers to break: `apiGet` had none in the product before
 * this tick (measured with grep across `app/` and `components/`).
 */
afterEach(() => {
  vi.unstubAllGlobals();
});

function stubFetch(implementation: (...args: unknown[]) => unknown): void {
  vi.stubGlobal('fetch', vi.fn(implementation));
}

describe('apiGet', () => {
  it('returns the parsed body on 200', async () => {
    stubFetch(async () => new Response(JSON.stringify({ ok: true, total: 3 }), { status: 200 }));
    await expect(apiGet<{ ok: boolean; total: number }>('/api/study/queue')).resolves.toEqual({
      ok: true,
      total: 3,
    });
  });

  it('returns the body of a 401 as DATA — the code is the whole message', async () => {
    stubFetch(
      async () => new Response(JSON.stringify({ ok: false, code: 'session_expired' }), { status: 401 }),
    );
    await expect(apiGet<{ code: string }>('/api/study/queue')).resolves.toEqual({
      ok: false,
      code: 'session_expired',
    });
  });

  it('returns the body of a 503 as DATA — schema_missing is not "try again"', async () => {
    stubFetch(
      async () =>
        new Response(JSON.stringify({ ok: false, code: 'schema_missing', message: 'x' }), {
          status: 503,
        }),
    );
    const body = await apiGet<{ code: string }>('/api/study/queue');
    expect(body.code).toBe('schema_missing');
  });

  it('throws ApiUnreachableError when the request never left the device', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiGet('/api/study/queue')).rejects.toBeInstanceOf(ApiUnreachableError);
  });

  it('throws ApiUnreachableError when the answer is not JSON', async () => {
    // A proxy or a captive portal answering HTML is indistinguishable from being offline
    // as far as the screen is concerned: there is no body to act on either way.
    stubFetch(async () => new Response('<html>504</html>', { status: 504 }));
    await expect(apiGet('/api/study/queue')).rejects.toBeInstanceOf(ApiUnreachableError);
  });
});

describe('apiPost', () => {
  it('returns the body of a 400 as data', async () => {
    stubFetch(
      async () => new Response(JSON.stringify({ ok: false, code: 'unavailable' }), { status: 400 }),
    );
    await expect(apiPost<{ code: string }>('/api/practice', {})).resolves.toEqual({
      ok: false,
      code: 'unavailable',
    });
  });

  it('throws ApiUnreachableError when the request never left the device', async () => {
    stubFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    await expect(apiPost('/api/practice', {})).rejects.toBeInstanceOf(ApiUnreachableError);
  });
});
