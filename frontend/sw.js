/**
 * SentinelShield AI — Production Service Worker (PWA Full Feature Suite)
 */

const CACHE_NAME = 'sentinelshield-v3.5';
const OFFLINE_URL = './index.html';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './voice-shield.html',
  './link-shield.html',
  './sms-shield.html',
  './404.html',
  './css/style.css',
  './js/app.js',
  './js/voice-shield.js',
  './js/link-shield.js',
  './js/sms-shield.js',
  './js/forensic-pdf.js',
  './manifest.json',
  './img/icon-192.png',
  './img/icon-512.png',
  './img/icon-maskable-512.png',
  './img/screenshot-desktop.png',
  './img/screenshot-mobile.png'
];

// 1. Install Event (Pre-cache assets)
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// 2. Activate Event (Cache Clean-up)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Deleting outdated cache:', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event (Network First with Offline Fallback)
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) return cachedResponse;
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL);
          }
        });
      })
  );
});

// 4. Push Notification Support
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || '🚨 SentinelShield Threat Alert';
  const options = {
    body: data.body || 'Deepfake or Phishing threat detected on your active stream.',
    icon: './img/icon-192.png',
    badge: './img/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || './index.html'
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || './index.html')
  );
});

// 5. Background Sync Support
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-forensic-telemetry') {
    console.log('[ServiceWorker] Background Syncing Threat Telemetry');
  }
});

// 6. Periodic Background Sync Support
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-threat-database') {
    console.log('[ServiceWorker] Periodic Background Sync: Checking latest fraud signatures');
  }
});
