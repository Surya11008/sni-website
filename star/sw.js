// Star Galaxy Service Worker - Clean PWA Compliant
const CACHE_NAME = 'star-galaxy-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key.startsWith('star-galaxy-') && key !== CACHE_NAME).map((key) => {
          return caches.delete(key);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Non-interfering fetch listener: ensures Chrome PWA criteria without hijacking Firebase/Firestore network streams
self.addEventListener('fetch', (event) => {
  // Pass through all requests natively to prevent connection drops with Firestore WebChannel or Auth
  return;
});
