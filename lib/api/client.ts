/**
 * The ONLY layer that speaks HTTP from the client side.
 * When we move to React Native, this file is replaced and nothing else changes.
 */
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(path, { headers: { accept: 'application/json' } });
  if (!res.ok) throw new Error(`API ${path} failed with ${res.status}`);
  return (await res.json()) as T;
}
