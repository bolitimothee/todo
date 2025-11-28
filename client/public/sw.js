const CACHE_NAME = 'to-do-pro-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((k) => {
          if (k !== CACHE_NAME) return caches.delete(k);
        })
      );
    })
  );
  self.clients.claim();
});

// Strategy: Network first for API, Cache first for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignore non-GET
  if (request.method !== 'GET') return;

  // API requests: try network, fallback to cache
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // optionally update cache for GET responses
          return res;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // For navigation and static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        // cache the fetched asset
        return caches.open(CACHE_NAME).then((cache) => {
          // put a clone
          cache.put(request, response.clone());
          return response;
        });
      }).catch(() => {
        // fallback to index.html for navigation
        if (request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});