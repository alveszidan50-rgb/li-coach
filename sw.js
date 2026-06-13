// LI Coach Global — Service Worker v2
const CACHE = 'li-coach-v2';

const ASSETS = [
  './li-coach-v2.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=DM+Sans:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js'
];

// ── Install: cache all assets ─────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(() => null))
      );
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for assets, network-first for API ─────
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go to network for API calls
  if(url.hostname === 'openrouter.ai' ||
     url.hostname === 'generativelanguage.googleapis.com' ||
     url.hostname === 'api.anthropic.com'){
    return; // let it go to network
  }

  // Cache-first for everything else
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful GET responses
        if(e.request.method === 'GET' && response.status === 200){
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback — return cached HTML
        if(e.request.destination === 'document'){
          return caches.match('./li-coach-v2.html');
        }
      });
    })
  );
});
