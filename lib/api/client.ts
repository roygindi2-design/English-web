/**
 * The ONLY layer that speaks HTTP from the client side.
 * When we move to React Native, this file is replaced and nothing else changes.
 */
/**
 * ⚠️ CHANGED C-0102 (T-065 task 6). This used to `throw new Error(...)` on any non-2xx,
 * which contradicted the contract the class below states for this whole file — *anything
 * the server answered comes back as data* — and threw the body away with it.
 * `GET /api/study/queue` answers three different failures that need three different
 * screens: `session_expired` (401 ⇒ sign in again), `schema_missing` (503 ⇒ "the bank is
 * not set up yet") and `unavailable` (503 ⇒ "try again"). A caller handed a bare `Error`
 * cannot tell them apart, so it has to show one sentence for all three — and two of those
 * three would then be false.
 *
 * ⚠️ Measured before changing it: `apiGet` had ZERO callers in `app/` and `components/`,
 * so no existing screen's error handling moved under it.
 */
export async function apiGet<T>(path: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, { headers: { accept: 'application/json' } });
  } catch {
    throw new ApiUnreachableError(path);
  }

  try {
    return (await res.json()) as T;
  } catch {
    // An answer that is not JSON is not one of our routes replying — it is a proxy, a
    // captive portal or an edge error page. To the screen that is indistinguishable from
    // being offline: there is no code in it to act on either way.
    throw new ApiUnreachableError(path);
  }
}

/** Thrown only when the request never reached the server. Anything the server
 *  answered — including a 4xx — comes back as data, because our API routes
 *  always describe failures in the body (see docs/api-contract.md). */
export class ApiUnreachableError extends Error {
  constructor(path: string) {
    super(`API ${path} unreachable`);
    this.name = 'ApiUnreachableError';
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new ApiUnreachableError(path);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new ApiUnreachableError(path);
  }
}
