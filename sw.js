const CACHE_NAME = "sni-app-shell-v2";
const APP_SHELL = [
    "/",
    "/index.html",
    "/videos.html",
    "/wordsearch.html",
    "/site-pages.css",
    "/site-shell.js",
    "/manifest.webmanifest",
    "/Images/pwa-icon-192.png",
    "/Images/pwa-icon-512.png",
];

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(APP_SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key.startsWith("sni-app-shell-") && key !== CACHE_NAME)
                .map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request).then(response => {
            if (response.ok && response.type === "basic") {
                return caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, response.clone()))
                    .then(() => response)
                    .catch(error => {
                        console.error("Could not cache an SNI page resource:", error);
                        return response;
                    });
            }
            return response;
        }).catch(async error => {
            const cached = await caches.match(event.request);
            if (cached) return cached;
            throw error;
        })
    );
});
