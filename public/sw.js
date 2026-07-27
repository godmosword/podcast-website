const CACHE_NAME = "chechecar-v4";
const SNOWBOARD_PREFIX = "/snowboard/v2/";
const SHELL = [
  "/",
  "/manifest.json",
  "/hero-home.jpg",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  const isStoryAsset =
    url.pathname.startsWith("/stories/") &&
    (url.pathname.endsWith(".jpg") || url.pathname.endsWith(".mp3"));

  if (isStoryAsset) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) {
          void cache.put(request, response.clone());
        }
        return response;
      }),
    );
    return;
  }

  if (url.pathname.startsWith(SNOWBOARD_PREFIX)) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached && !url.pathname.endsWith("/index.html")) return cached;
        try {
          const response = await fetch(request);
          if (response.ok) void cache.put(request, response.clone());
          return response;
        } catch {
          return cached ?? Response.error();
        }
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r ?? caches.match("/"))),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_STORY" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        for (const raw of event.data.urls) {
          try {
            const response = await fetch(raw);
            if (response.ok) await cache.put(raw, response);
          } catch {
            // 略過單一資源快取失敗
          }
        }
      }),
    );
  }
});
