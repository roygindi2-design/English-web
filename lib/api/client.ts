/**
 * The ONLY layer that speaks HTTP from the client side.
 * When we move to React Native, this file is replaced and nothing else changes.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return (await res.json()) as T;
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
