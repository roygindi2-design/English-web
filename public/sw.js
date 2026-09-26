// App shell + offline fallback. Extended by the Dev agent as real routes land.
//
// Precache is deliberately tiny: the landing screen and the offline screen.
// API responses are never cached — stale learning data is worse than no data.
const CACHE = 'english-web-v4';
const OFFLINE_ROUTE = '/offline';
const OFFLINE_FALLBACK = '/offline.html';
const PRECACHE = ['/', OFFLINE_ROUTE, OFFLINE_FALLBACK];

// Auth screens and everything behind the session wall are never cached
// (UX plan T-002). A cached /onboarding would survive a sign-out and show the
// next person on the phone a screen they are not signed in to, and a cached
// auth screen can be served against a session that no longer exists.
// Offline navigation to these paths gets the real Hebrew offline screen.
const NEVER_CACHE = ['/signup', '/login', '/logout', '/onboarding'];

// Routes the proxy answers per session: a signed-in learner opening `/` (the
// manifest start_url) is redirected on (lib/core/entryRoute.ts ENTRY_PATHS).
// Redirects are never stored, so a stored `/` is always the signed-out landing —
// painting it early would strand a learner there on every cold open. Stored
// copies still serve as the offline fallback.
const SESSION_ROUTED = ['/'];

function isPrivateRoute(pathname) {
  return NEVER_CACHE.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // addAll() rejects the whole batch if one request fails; cache each
      // entry on its own so a single miss cannot leave us with no offline page.
      .then((cache) =>
        Promise.all(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' })).catch(() => {})))
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function offlineResponse() {
  const cache = await caches.open(CACHE);
  return (
    (await cache.match(OFFLINE_ROUTE)) ||
    (await cache.match(OFFLINE_FALLBACK)) ||
    new Response('אין חיבור כרגע.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  );
}

// T-519 — how long a navigation waits for the network before a stored copy is
// painted instead. 800ms: a warm function answers in ~170ms (C-0794) and a warm
// /cards in ~305ms (F-255), so a healthy network still wins with room to spare;
// a cold start is 2–6s, so past 800ms the learner is waiting on a server that is
// waking up, not on a slow page. Anything longer is a white screen they can see.
const NAV_CACHE_WINDOW_MS = 800;

// A redirect is never stored: /cards answered by a redirect to /login must not be
// saved (or later painted) as /cards.
function isStorable(res) {
  return res.ok && !res.redirected && res.type !== 'opaqueredirect';
}

// Only a screen the server built for everyone may be painted before the network
// answers. A page rendered per learner says no-store/private, and sign-out does
// not clear this cache — on a shared phone that copy is someone else's screen.
// Those copies still serve as the offline fallback, exactly as before.
function isSharedScreen(res) {
  if (!isStorable(res)) return false;
  const cc = (res.headers.get('cache-control') || '').toLowerCase();
  return !cc.includes('no-store') && !cc.includes('private');
}

// Navigations race the network against a stored copy of the same URL:
// - the network answers inside NAV_CACHE_WINDOW_MS ⇒ it is served, as always;
// - it does not ⇒ the stored copy is painted, and the request keeps running in the
//   background and refreshes the cache for the next open;
// - nothing stored ⇒ network, then the real Hebrew offline screen — never a
//   browser error. API responses are not handled here at all (see the listener).
async function handleNavigation(request, event) {
  const pathname = new URL(request.url).pathname;
  if (isPrivateRoute(pathname)) {
    try {
      return await fetch(request);
    } catch {
      return offlineResponse();
    }
  }

  const cache = await caches.open(CACHE);
  const network = fetch(request).then((fresh) => {
    if (isStorable(fresh)) cache.put(request, fresh.clone()).catch(() => {});
    return fresh;
  });
  // Exact URL only: /world/story?id=1 must never paint for ?id=2.
  const stored = await cache.match(request);

  if (!stored || !isSharedScreen(stored) || SESSION_ROUTED.includes(pathname)) {
    try {
      return await network;
    } catch {
      const hit = stored || (await cache.match(request, { ignoreSearch: true }));
      return hit || offlineResponse();
    }
  }

  // Keep the worker alive until the late answer has been written.
  if (event) event.waitUntil(network.catch(() => {}));
  let timer;
  const deadline = new Promise((resolve) => {
    timer = setTimeout(() => resolve(stored), NAV_CACHE_WINDOW_MS);
  });
  return Promise.race([network.catch(() => stored), deadline]).finally(() => clearTimeout(timer));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API responses

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, event));
    return;
  }

  // Static assets: cache-first, then network. Next.js hashes its filenames.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then((res) => {
            if (res.ok && res.type === 'basic') {
              caches.open(CACHE).then((c) => c.put(request, res.clone()).catch(() => {}));
            }
            return res;
          })
          .catch(() => offlineResponse())
    )
  );
});
