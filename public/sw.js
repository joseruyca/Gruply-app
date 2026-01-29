const CACHE = "gruply-v2";
const OFFLINE = "/offline";
const CORE = ["/", OFFLINE];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // cache core routes one by one so a single failure doesn't break install
    await Promise.all(
      CORE.map(async (url) => {
        try {
          await cache.add(url);
        } catch (e) {
          // ignore (e.g. if /offline was temporarily failing)
        }
      })
    );
  })());
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k === CACHE ? null : caches.delete(k))));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;

  // only handle GET
  if (req.method !== "GET") return;

  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      const copy = res.clone();
      const cache = await caches.open(CACHE);
      cache.put(req, copy);
      return res;
    } catch {
      const cached = await caches.match(req);
      if (cached) return cached;
      const offline = await caches.match(OFFLINE);
      return offline || new Response("Offline", { status: 200 });
    }
  })());
});
