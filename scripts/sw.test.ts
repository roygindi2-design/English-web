import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * T-519 — `public/sw.js` runs in a ServiceWorkerGlobalScope, which vitest's node
 * environment does not have. ⇒ the file is loaded as-is into a `vm` context with a
 * `self` / `caches` / `fetch` stand-in, and driven through its own `fetch` listener.
 * ⛔ No copy of the handler lives here: the test executes the shipped file.
 *
 * Lives under `scripts/` and ⛔ not next to the worker, because everything in
 * `public/` is served to the learner verbatim — a `public/sw.test.ts` would be a
 * test file on the production origin.
 */

const SOURCE = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
const ORIGIN = 'https://kol.example';
const STATIC = 'public, max-age=0, s-maxage=31536000';
const DYNAMIC = 'private, no-cache, no-store, max-age=0, must-revalidate';

type Store = Map<string, Response>;
type SwEvent = {
  request?: { url: string; method: string; mode: string };
  respondWith?: (p: Promise<Response>) => unknown;
  waitUntil: (p: Promise<unknown>) => unknown;
};

function makeCaches() {
  const stores = new Map<string, Store>();
  const puts: Array<{ cache: string; url: string; body: Promise<string> }> = [];
  const keyOf = (req: string | { url: string }, ignoreSearch = false) => {
    const url = new URL(typeof req === 'string' ? req : req.url, ORIGIN);
    return ignoreSearch ? url.origin + url.pathname : url.href;
  };
  const openSync = (name: string) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name)!;
    return {
      async match(req: string | { url: string }, opts?: { ignoreSearch?: boolean }) {
        if (opts?.ignoreSearch) {
          const want = keyOf(req, true);
          for (const [k, v] of store) if (keyOf(k, true) === want) return v.clone();
          return undefined;
        }
        return store.get(keyOf(req))?.clone();
      },
      async put(req: string | { url: string }, res: Response) {
        puts.push({ cache: name, url: keyOf(req), body: res.clone().text() });
        store.set(keyOf(req), res);
      },
      async add() {},
    };
  };
  return {
    stores,
    puts,
    seed(name: string, path: string, body: string, cacheControl = STATIC) {
      openSync(name);
      stores.get(name)!.set(keyOf(path), new Response(body, { headers: { 'cache-control': cacheControl } }));
    },
    api: {
      open: async (name: string) => openSync(name),
      keys: async () => [...stores.keys()],
      delete: async (name: string) => stores.delete(name),
      match: async (req: string | { url: string }) => {
        for (const name of stores.keys()) {
          const hit = await openSync(name).match(req);
          if (hit) return hit;
        }
        return undefined;
      },
    },
  };
}

function loadWorker(fetchImpl: (req: { url: string }) => Promise<Response>) {
  const listeners: Partial<Record<string, (event: SwEvent) => void>> = {};
  const caches = makeCaches();
  const context = {
    self: {
      location: { origin: ORIGIN },
      addEventListener: (type: string, fn: (event: SwEvent) => void) => (listeners[type] = fn),
      skipWaiting: () => Promise.resolve(),
      clients: { claim: () => Promise.resolve() },
    },
    caches: caches.api,
    fetch: (req: { url: string }) => fetchImpl(req),
    Request: class {
      url: string;
      constructor(url: string) {
        this.url = new URL(url, ORIGIN).href;
      }
    },
    Response,
    URL,
    Promise,
    // resolved at call time, so `vi.useFakeTimers()` reaches the worker too
    setTimeout: (fn: () => void, ms: number) => globalThis.setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => globalThis.clearTimeout(id),
  };
  vm.runInNewContext(SOURCE, context);

  function navigate(path: string) {
    const background: Promise<unknown>[] = [];
    let responded: Promise<Response> | undefined;
    listeners.fetch!({
      request: { url: new URL(path, ORIGIN).href, method: 'GET', mode: 'navigate' },
      respondWith: (p: Promise<Response>) => (responded = p),
      waitUntil: (p: Promise<unknown>) => background.push(p),
    });
    if (!responded) throw new Error(`the worker did not respond to ${path}`);
    return { response: responded, background };
  }

  return { caches, listeners, navigate, context };
}

/** A network that answers after `ms` with `body`. */
function slowNetwork(ms: number, make: () => Response) {
  return vi.fn(
    () => new Promise<Response>((resolve) => globalThis.setTimeout(() => resolve(make()), ms))
  );
}

const page = (body: string, cacheControl = STATIC) =>
  new Response(body, { status: 200, headers: { 'cache-control': cacheControl } });

/** Settles `p` and records the fake-clock time at which it did. */
function timed<T>(p: Promise<T>) {
  const out: { value?: T; at?: number } = {};
  p.then((v) => {
    out.value = v;
    out.at = Date.now();
  });
  return out;
}

describe('public/sw.js — navigation (T-519)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => vi.useRealTimers());

  it('bumps the cache name to english-web-v4 and drops the old one on activate', async () => {
    const w = loadWorker(() => Promise.reject(new Error('offline')));
    w.caches.seed('english-web-v3', '/cards', 'old');
    let done: Promise<unknown> = Promise.resolve();
    w.listeners.activate!({ waitUntil: (p: Promise<unknown>) => (done = p) });
    await done;
    expect([...w.caches.stores.keys()]).not.toContain('english-web-v3');
    expect(SOURCE).toMatch(/const CACHE = 'english-web-v4'/);
  });

  it('a stored static screen + a network that takes 3,000ms ⇒ the stored copy, in under 1,000ms, and the late answer refreshes the cache', async () => {
    const net = slowNetwork(3000, () => page('fresh'));
    const w = loadWorker(net);
    w.caches.seed('english-web-v4', '/cards', 'stored');

    const nav = w.navigate('/cards');
    const got = timed(nav.response);
    await vi.advanceTimersByTimeAsync(999);
    expect(got.at).toBeDefined();
    expect(got.at!).toBeLessThan(1000);
    expect(await got.value!.text()).toBe('stored');

    // the request kept going in the background and wrote the fresh copy
    expect(nav.background.length).toBeGreaterThan(0);
    await vi.advanceTimersByTimeAsync(2100);
    await Promise.all(nav.background);
    const put = w.caches.puts.find((p) => p.url === `${ORIGIN}/cards`);
    expect(put).toBeDefined();
    expect(await put!.body).toBe('fresh');
  });

  it('failure scenario ①: the next open gets the version the late answer wrote, ⛔ not the one before it', async () => {
    let version = 'v-new';
    const w = loadWorker(slowNetwork(3000, () => page(version)));
    w.caches.seed('english-web-v4', '/cards', 'v-old');

    const first = w.navigate('/cards');
    await vi.advanceTimersByTimeAsync(3100);
    await Promise.all(first.background);
    expect(await (await first.response).text()).toBe('v-old');

    version = 'v-newer';
    const second = timed(w.navigate('/cards').response);
    await vi.advanceTimersByTimeAsync(999);
    expect(await second.value!.text()).toBe('v-new');
  });

  it('a network that answers inside the window wins, exactly as today', async () => {
    const w = loadWorker(slowNetwork(200, () => page('fresh')));
    w.caches.seed('english-web-v4', '/cards', 'stored');
    const got = timed(w.navigate('/cards').response);
    await vi.advanceTimersByTimeAsync(250);
    expect(await got.value!.text()).toBe('fresh');
  });

  it('ⓑ nothing stored ⇒ the network, however slow it is', async () => {
    const w = loadWorker(slowNetwork(3000, () => page('fresh')));
    const got = timed(w.navigate('/cards').response);
    await vi.advanceTimersByTimeAsync(2999);
    expect(got.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10);
    expect(await got.value!.text()).toBe('fresh');
  });

  it('ⓑ nothing stored and no network ⇒ the offline screen, as today', async () => {
    const w = loadWorker(() => Promise.reject(new TypeError('offline')));
    w.caches.seed('english-web-v4', '/offline', 'אין חיבור');
    const res = await w.navigate('/cards').response;
    expect(await res.text()).toBe('אין חיבור');
  });

  it('no network but a stored copy ⇒ the stored copy, as today', async () => {
    const w = loadWorker(() => Promise.reject(new TypeError('offline')));
    w.caches.seed('english-web-v4', '/cards', 'stored');
    const res = await w.navigate('/cards').response;
    expect(await res.text()).toBe('stored');
  });

  it('ⓒ /login is ⛔ never served from the cache and ⛔ never written to it', async () => {
    const w = loadWorker(slowNetwork(3000, () => page('login-live')));
    w.caches.seed('english-web-v4', '/login', 'login-stale');
    const nav = w.navigate('/login');
    const got = timed(nav.response);
    await vi.advanceTimersByTimeAsync(3100);
    expect(await got.value!.text()).toBe('login-live');
    expect(w.caches.puts.filter((p) => p.url.includes('/login'))).toEqual([]);
  });

  it('ⓓ a 307 is ⛔ not written to the cache', async () => {
    const w = loadWorker(() => Promise.resolve(new Response(null, { status: 307, headers: { location: '/login' } })));
    const nav = w.navigate('/cards');
    await nav.response;
    await Promise.all(nav.background);
    await vi.advanceTimersByTimeAsync(10);
    expect(w.caches.puts).toEqual([]);
  });

  it('ⓓ an answer that followed a redirect (/cards ⇒ /login) is ⛔ not written as /cards', async () => {
    const w = loadWorker(() => {
      const res = page('the login screen');
      Object.defineProperty(res, 'redirected', { value: true });
      return Promise.resolve(res);
    });
    const nav = w.navigate('/cards');
    await nav.response;
    await Promise.all(nav.background);
    await vi.advanceTimersByTimeAsync(10);
    expect(w.caches.puts).toEqual([]);
  });

  it('a stored screen rendered per learner (no-store / private) is ⛔ not served while the network is merely slow', async () => {
    // Sign-out does not clear this cache. A server-rendered /me served on a slow
    // network would show the previous learner's page on a shared phone.
    const w = loadWorker(slowNetwork(3000, () => page('me-live', DYNAMIC)));
    w.caches.seed('english-web-v4', '/me', 'me-of-someone-else', DYNAMIC);
    const got = timed(w.navigate('/me').response);
    await vi.advanceTimersByTimeAsync(2999);
    expect(got.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10);
    expect(await got.value!.text()).toBe('me-live');
  });

  it('/ is ⛔ never painted from the cache — the proxy sends a signed-in learner on from it', async () => {
    // manifest `start_url` is `/`, and `proxy.ts` redirects a signed-in learner from
    // `/` to `/studies` (`lib/core/entryRoute.ts` ENTRY_PATHS). A redirect is never
    // stored, so a stored `/` would paint the signed-out landing on EVERY cold open.
    const w = loadWorker(slowNetwork(3000, () => page('whatever the proxy decided')));
    w.caches.seed('english-web-v4', '/', 'the signed-out landing');
    const got = timed(w.navigate('/').response);
    await vi.advanceTimersByTimeAsync(2999);
    expect(got.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(10);
    expect(await got.value!.text()).toBe('whatever the proxy decided');
  });

  it('/ with no network still falls back to the stored landing, as today', async () => {
    const w = loadWorker(() => Promise.reject(new TypeError('offline')));
    w.caches.seed('english-web-v4', '/', 'the signed-out landing');
    expect(await (await w.navigate('/').response).text()).toBe('the signed-out landing');
  });

  it('the fast path matches the exact URL — a stored /world/story?id=1 ⛔ does not answer ?id=2', async () => {
    const w = loadWorker(slowNetwork(3000, () => page('story-2')));
    w.caches.seed('english-web-v4', '/world/story?id=1', 'story-1');
    const got = timed(w.navigate('/world/story?id=2').response);
    await vi.advanceTimersByTimeAsync(999);
    expect(got.value).toBeUndefined();
    await vi.advanceTimersByTimeAsync(2100);
    expect(await got.value!.text()).toBe('story-2');
  });
});
