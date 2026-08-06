// App shell + offline fallback. Extended by the Dev agent as real routes land.
//
// Precache is deliberately tiny: the landing screen and the offline screen.
// API responses are never cached — stale learning data is worse than no data.
const CACHE = 'english-web-v3';
const OFFLINE_ROUTE = '/offline';
const OFFLINE_FALLBACK = '/offline.html';
const PRECACHE = ['/', OFFLINE_ROUTE, OFFLINE_FALLBACK];

// Auth screens and everything behind the session wall are never cached
// (UX plan T-002). A cached /onboarding would survive a sign-out and show the
// next person on the phone a screen they are not signed in to, and a cached
// auth screen can be served against a session that no longer exists.
// Offline navigation to these paths gets the real Hebrew offline screen.
const NEVER_CACHE = ['/signup', '/login', '/logout', '/onboarding'];

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

// Network-first for navigations: the learner should always get the live screen
// when online, and a real Hebrew offline screen — never a browser error — when not.
async function handleNavigation(request) {
  const isPrivate = isPrivateRoute(new URL(request.url).pathname);
  try {
    const fresh = await fetch(request);
    if (!isPrivate) {
      const cache = await caches.open(CACHE);
      cache.put(request, fresh.clone()).catch(() => {});
    }
    return fresh;
  } catch {
    if (isPrivate) return offlineResponse();
    const cache = await caches.open(CACHE);
    const hit = await cache.match(request, { ignoreSearch: true });
    return hit || offlineResponse();
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return; // never cache API responses

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
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
