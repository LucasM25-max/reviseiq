// ReviseIQ service worker - network-first, self-updating.
// Bumping CACHE forces a fresh cache; old caches are purged on activate so a
// new deploy is always picked up instead of frozen at the first cached bundle.
const CACHE = "reviseiq-shell-v4";
const ASSET_RE = /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|svg|gif|webp|ico)$/;

self.addEventListener("install", () => {
  // Take over as soon as possible so users get the new worker immediately.
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;

  const isNav = r.mode === "navigate" || u.pathname === "/";
  if (!isNav && !ASSET_RE.test(u.pathname)) return;

  // Network-first: always prefer the freshest response when online, and fall
  // back to cache only when the network is unavailable (offline support).
  e.respondWith(
    (async () => {
      try {
        const fresh = await fetch(r);
        const cache = await caches.open(CACHE);
        cache.put(r, fresh.clone());
        return fresh;
      } catch (_) {
        const cached = await caches.match(r);
        if (cached) return cached;
        if (isNav) {
          const shell = await caches.match("/");
          if (shell) return shell;
        }
        return new Response("Offline", {
          status: 503,
          headers: { "Content-Type": "text/plain" },
        });
      }
    })(),
  );
});
