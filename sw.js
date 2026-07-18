// Service Worker — offline-support for Træning-appen
// Cache-first for appen selv, network-first for API-kald
const CACHE = 'traening-v3';
const CORE = ['./', './index.html'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // API-kald (Gemini osv.) skal altid gå til nettet
  if (url.origin !== location.origin) return;

  // App-filer: cache-først med baggrunds-opdatering (stale-while-revalidate)
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request).then(resp => {
          if (resp && resp.status === 200) cache.put(e.request, resp.clone());
          return resp;
        }).catch(() => cached);
        return cached || network;
      })
    )
  );
});
