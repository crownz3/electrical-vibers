// Electrical Vibers Service Worker (Offline PWA Cache)
const CACHE_NAME = 'electrical-vibers-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.webmanifest'
];

// Install: Cache critical core shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate: Clean old caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: Strategy depending on request type
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Skip non-GET requests or Firebase Firestore/Auth websocket/REST calls
  if (request.method !== 'GET' || url.protocol.startsWith('chrome-extension')) {
    return;
  }

  // Skip Firebase APIs & external analytics from SW interception
  if (url.origin.includes('firestore.googleapis.com') || 
      url.origin.includes('firebaseio.com') ||
      url.origin.includes('identitytoolkit.googleapis.com')) {
    return;
  }

  // 1. Navigation requests (HTML pages like /staff, /admin, /products): Network First, fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // If offline in low cellular basement, return cached HTML page or shell index.html
          const match = await caches.match(request);
          if (match) return match;
          return caches.match('/index.html');
        })
    );
    return;
  }

  // 2. Static Assets (JS chunks, CSS, Web Fonts, Images): Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return networkResponse;
      }).catch(() => {
        // Network failed (offline); cachedResponse will serve
      });

      return cachedResponse || fetchPromise;
    })
  );
});
