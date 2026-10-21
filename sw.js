/* QA-тренажёр service worker: офлайн через runtime-кэш. */
const CACHE = 'qa-senior-v2';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => { e.waitUntil(self.clients.claim()); });
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isSql = url.href.includes('/sql.js/') || url.href.endsWith('sql-wasm.js') || url.href.endsWith('sql-wasm.wasm');
  if (!sameOrigin && !isSql) return; // чужое не трогаем
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(req);
    if (cached) {
      // фоново обновим, если онлайн
      event.waitUntil((async () => {
        try { const fresh = await fetch(req); if (fresh && fresh.ok && !fresh.redirected) await cache.put(req, fresh.clone()); } catch (e) {}
      })());
      return cached;
    }
    try {
      const resp = await fetch(req);
      if (resp && (resp.ok || resp.type === 'opaque') && !resp.redirected) await cache.put(req, resp.clone());
      return resp;
    } catch (e) {
      // офлайн и нет в кэше: для навигации вернём корневой index.html из кэша
      if (req.mode === 'navigate') {
        const root = await cache.match('./') || await cache.match('index.html');
        if (root) return root;
      }
      throw e;
    }
  })());
});
