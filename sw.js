const CACHE_NAME = "sni-app-shell-v3";
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

    // For HTML page navigations, ALWAYS fetch fresh from network to guarantee live updates
    if (event.request.mode === "navigate" || event.request.destination === "document" || event.request.url.endsWith(".html")) {
        event.respondWith(
            fetch(event.request, { cache: "no-cache" }).then(response => {
                if (response.ok) {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                }
                return response;
            }).catch(async () => {
                const cached = await caches.match(event.request);
                if (cached) return cached;
                return caches.match("/index.html");
            })
        );
        return;
    }

    event.respondWith(
        fetch(event.request).then(response => {
            if (response.ok && response.type === "basic") {
                return caches.open(CACHE_NAME)
                    .then(cache => cache.put(event.request, response.clone()))
                    .then(() => response)
                    .catch(() => response);
            }
            return response;
        }).catch(async error => {
            const cached = await caches.match(event.request);
            if (cached) return cached;
            throw error;
        })
    );
});
