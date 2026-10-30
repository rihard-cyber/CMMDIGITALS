const CACHE_NAME = 'smpjdc-pwa-v5';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo.png',
  './manifest.json'
];

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Only handle GET requests and http/https schemes
  if (e.request.method !== 'GET' || !e.request.url.startsWith('http')) {
    return;
  }

  // Bypass cache for Supabase and external real-time APIs
  if (e.request.url.includes('supabase.co') || e.request.url.includes('firebaseio.com') || e.request.url.includes('worldtimeapi.org')) {
    return;
  }

  // Network-first with cache fallback
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const resClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, resClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((cached) => {
          if (cached) return cached;
          if (e.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
      })
  );
});
