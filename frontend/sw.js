/**
 * SentinelShield AI — Offline Service Worker
 */

const CACHE_NAME = 'sentinelshield-v2.5';
const ASSETS_TO_CACHE = [
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
  './img/icon-192.svg',
  './img/icon-512.svg'
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
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
