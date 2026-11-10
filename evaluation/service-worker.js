const CACHE_NAME = 'evaluation-shell-v7';
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './social-card.png'];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key.startsWith('evaluation-shell-') && key !== CACHE_NAME).map(key => caches.delete(key))
        ))
    );
    self.clients.claim();
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;

    if (event.request.mode === 'navigate') {
        event.respondWith(fetch(event.request).then(async response => {
            const copy = response.clone();
            await (await caches.open(CACHE_NAME)).put('./index.html', copy);
            return response;
        }).catch(() => caches.match('./index.html')));
        return;
    }

    event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request)));
});
