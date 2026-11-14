const CACHE_NAME = "sni-app-shell-v37";
const APP_SHELL = [
    "/",
    "/index.html",
    "/videos.html",
    "/wordsearch.html",
    "/diary.html",
    "/site-pages.css",
    "/site-shell.js",
    "/manifest.webmanifest",
    "/Images/pwa-icon-192.png",
    "/Images/pwa-icon-512.png",
];

// Pre-cache fresh assets from network (bypass disk cache)
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async cache => {
            for (const url of APP_SHELL) {
                try {
                    const res = await fetch(url, { cache: "no-cache" });
                    if (res.ok) await cache.put(url, res);
                } catch(e) {}
            }
        }).then(() => self.skipWaiting())
    );
});

// Purge all legacy caches immediately and claim clients
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys => Promise.all(
            keys.filter(key => key.startsWith("sni-app-shell-") && key !== CACHE_NAME)
                .map(key => caches.delete(key))
        )).then(() => self.clients.claim())
    );
});

// Message listener to skip waiting immediately on update
self.addEventListener("message", event => {
    if (event.data && (event.data.type === "SKIP_WAITING" || event.data === "skipWaiting")) {
        self.skipWaiting();
    }
});

// Network-First for ALL requests to guarantee live updates for everyone
self.addEventListener("fetch", event => {
    if (event.request.method !== "GET" || new URL(event.request.url).origin !== self.location.origin) return;

    event.respondWith(
        fetch(event.request, { cache: "no-cache" }).then(response => {
            if (response.ok && response.type === "basic") {
                const clone = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone)).catch(() => {});
            }
            return response;
        }).catch(async () => {
            // Offline fallback: retrieve from cache
            const cached = await caches.match(event.request);
            if (cached) return cached;
            if (event.request.mode === "navigate" || event.request.destination === "document" || event.request.url.endsWith(".html")) {
                const indexCached = await caches.match("/index.html");
                if (indexCached) return indexCached;
            }
            throw new Error("Offline asset not cached");
        })
    );
});
