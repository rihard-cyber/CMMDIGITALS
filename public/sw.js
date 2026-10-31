const CACHE_NAME = 'cmdigital-pwa-v3';
const SHELL_CACHE = 'cmdigital-shell-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './logo.png',
  './manifest.json'
];

// Jangan pernah menyajikan cache lama untuk request lintas-origin / API.
const BYPASS_HOSTS = [
  'supabase.co',
  'firebaseio.com',
  'worldtimeapi.org',
  'googleapis.com',
  'gstatic.com'
];

self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (e.data && e.data.type === 'GET_VERSION' && e.ports && e.ports[0]) {
    e.ports[0].postMessage({ version: CACHE_NAME });
  }
});

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL_CACHE)
      .then((cache) => Promise.allSettled(ASSETS_TO_CACHE.map((url) => cache.add(url))))
      .then(() => {
        // Worker baru menunggu; halaman menampilkan banner "Pembaruan tersedia".
        // skipWaiting hanya dikirim setelah pengguna menekan tombol.
        return self.skipWaiting();
      })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== SHELL_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

const isBypassed = (url) => {
  try {
    return BYPASS_HOSTS.some((host) => url.includes(host));
  } catch (_) {
    return true;
  }
};

// Navigasi selalu network-first tanpa cache HTTP, sehingga index.html baru
// (yang menunjuk asset hash terbaru) tidak pernah tertahan cache lama.
const handleNavigation = async (request) => {
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response && response.ok) {
      const cache = await caches.open(SHELL_CACHE);
      cache.put('./index.html', response.clone());
    }
    return response;
  } catch (_) {
    const cached = await caches.match('./index.html');
    if (cached) return cached;
    return new Response(
      '<!doctype html><meta charset="utf-8"><title>CMMDIGITAL Offline</title>' +
      '<body style="font-family:sans-serif;background:#0f172a;color:#e2e8f0;display:flex;align-items:center;justify-content:center;height:100vh;margin:0">' +
      '<div style="text-align:center"><h2>CMMDIGITAL</h2><p>Anda sedang offline. Sambungkan internet lalu muat ulang.</p></div></body>',
      { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
};

// Asset statis: tampilkan cache dulu agar cepat, lalu perbarui dari jaringan.
const handleAsset = async (request) => {
  const cached = await caches.match(request);
  const networkPromise = fetch(request)
    .then(async (response) => {
      if (response && response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);
  if (cached) return cached;
  const network = await networkPromise;
  return network || new Response('', { status: 504, statusText: 'Offline' });
};

self.addEventListener('fetch', (e) => {
  const { request } = e;
  if (request.method !== 'GET' || !request.url.startsWith('http')) return;
  if (isBypassed(request.url)) return;

  if (request.mode === 'navigate') {
    e.respondWith(handleNavigation(request));
    return;
  }

  const sameOrigin = (() => {
    try { return new URL(request.url).origin === self.location.origin; } catch (_) { return false; }
  })();

  if (sameOrigin) {
    e.respondWith(handleAsset(request));
  }
});
