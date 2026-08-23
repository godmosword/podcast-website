// v6：故事資源與 shell 共用同一 cache。禁止只為換 shell 檔而升版——
// activate 會刪掉非 CACHE_NAME 的整個 cache，回訪者最多 120MB 離線故事會被清光。
// shell 改 precache AVIF：SW 檔有 byte 差異就會重裝，install 補上新 URL 即可。
const CACHE_NAME = "chechecar-v6";
const CACHE_META_DB = "chechecar-cache-meta";
const CACHE_META_STORE = "story-assets";
const MAX_STORY_CACHE_BYTES = 120 * 1024 * 1024;
const MAX_STORY_CACHE_ENTRIES = 96;
const SHELL = [
  "/",
  "/manifest.json",
  "/hero-home.avif",
  "/icon-192.png",
  "/icon-512.png",
];

// 這個 Set 只保護目前 client 明確宣告的播放資源；service worker 重啟後
// 會自然清空，下一次播放頁載入時會重新宣告。
const activeStoryUrls = new Set();

function normalizeAssetUrl(raw) {
  try {
    return new URL(raw, self.location.origin).toString();
  } catch {
    return null;
  }
}

function openMetaDb() {
  return new Promise((resolve, reject) => {
    if (!self.indexedDB) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const request = self.indexedDB.open(CACHE_META_DB, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(CACHE_META_STORE, { keyPath: "url" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB open failed"));
  });
}

async function putAssetMeta(url, response) {
  try {
    const db = await openMetaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_META_STORE, "readwrite");
      tx.objectStore(CACHE_META_STORE).put({
        url,
        // Content-Length is not guaranteed for CDN responses. Unknown sizes are
        // still bounded by MAX_STORY_CACHE_ENTRIES.
        size: Number(response.headers.get("content-length")) || 0,
        lastUsed: Date.now(),
      });
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB write failed"));
    });
    db.close();
  } catch {
    // IndexedDB is an optimization; network/cache behavior remains available.
  }
}

async function listAssetMeta() {
  try {
    const db = await openMetaDb();
    const records = await new Promise((resolve, reject) => {
      const request = db
        .transaction(CACHE_META_STORE, "readonly")
        .objectStore(CACHE_META_STORE)
        .getAll();
      request.onsuccess = () => resolve(request.result ?? []);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB read failed"));
    });
    db.close();
    return records;
  } catch {
    return [];
  }
}

async function deleteAssetMeta(url) {
  try {
    const db = await openMetaDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CACHE_META_STORE, "readwrite");
      tx.objectStore(CACHE_META_STORE).delete(url);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB delete failed"));
    });
    db.close();
  } catch {
    // A stale metadata record is harmless and will be ignored on the next pass.
  }
}

async function trimStoryCache(cache) {
  const records = (await listAssetMeta()).sort((a, b) => a.lastUsed - b.lastUsed);
  let totalBytes = records.reduce((sum, record) => sum + (record.size || 0), 0);
  let totalEntries = records.length;

  for (const record of records) {
    if (
      totalBytes <= MAX_STORY_CACHE_BYTES &&
      totalEntries <= MAX_STORY_CACHE_ENTRIES
    ) {
      break;
    }
    if (activeStoryUrls.has(record.url)) continue;

    await cache.delete(record.url);
    await deleteAssetMeta(record.url);
    totalBytes -= record.size || 0;
    totalEntries -= 1;
  }
}

async function cacheStoryAsset(cache, request, response) {
  // Cache API rejects opaque/partial (206) bodies. Never let that fail playback.
  if (response.status !== 200) return;
  try {
    await cache.put(request, response.clone());
    await putAssetMeta(request.url, response);
    await trimStoryCache(cache);
  } catch {
    // 快取失敗時仍把網路回應交給頁面。
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(SHELL);
      // 清掉舊 shell JPG；新瀏覽器走 SiteHeader picture 的 AVIF。
      await cache.delete("/hero-home.jpg");
      await cache.delete(new URL("/hero-home.jpg", self.location.origin).href);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
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
        // 只重用完整 200。若先前誤存 206 Partial，Audio() 會報
        // NotSupportedError / MEDIA_ELEMENT_ERROR: Format error，且看不到網路 206。
        if (cached && cached.status === 200) {
          void putAssetMeta(request.url, cached);
          return cached;
        }
        const response = await fetch(request);
        if (response.status === 200) {
          await cacheStoryAsset(cache, request, response);
        }
        return response;
      }),
    );
    return;
  }

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((response) => response ?? caches.match("/"))),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || !Array.isArray(data.urls)) return;

  const urls = data.urls.map(normalizeAssetUrl).filter(Boolean);
  if (data.type === "PLAYBACK_ACTIVE") {
    urls.forEach((url) => activeStoryUrls.add(url));
    return;
  }
  if (data.type === "PLAYBACK_INACTIVE") {
    urls.forEach((url) => activeStoryUrls.delete(url));
    return;
  }
  if (data.type !== "CACHE_STORY") return;

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      for (const url of urls) {
        try {
          const response = await fetch(url);
          if (response.status === 200) {
            await cacheStoryAsset(cache, new Request(url), response);
          }
        } catch {
          // 略過單一資源快取失敗
        }
      }
    }),
  );
});
