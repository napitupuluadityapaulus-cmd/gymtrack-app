const CACHE_NAME = 'gymtrack-aditnapit-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js',
  'https://unpkg.com/lucide@latest',
  'https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600;700;800&display=swap'
];

// 1. Install: Cache aset inti
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

// 2. Activate: Bersihkan cache versi lama
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch: Strategi Stale-While-Revalidate (Cache dulu, update di belakang)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cachedResponse => {
      // Jika ada di cache, kembalikan langsung & update diam-diam
      if (cachedResponse) {
        fetch(e.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      // Jika tidak ada di cache, ambil dari network
      return fetch(e.request).then(networkResponse => {
        // Cache otomatis GIF dari jsDelivr & file CSV
        if (networkResponse && networkResponse.status === 200 && 
            (e.request.url.includes('jsdelivr') || e.request.url.includes('.gif'))) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => {
        // Fallback jika offline total & tidak ada di cache
        if (e.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});