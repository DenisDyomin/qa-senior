/* QA-тренажёр service worker: офлайн через precache + runtime-кэш. */
const CACHE = 'qa-senior-v3';

/* Список критичных файлов для предзагрузки генерируется build.js. */
/* PRECACHE:START */
const PRECACHE = [
  "./",
  "./index.html",
  "./styles.css",
  "./manifest.webmanifest",
  "./icon-180.png",
  "./icon-192.png",
  "./icon-512.png",
  "./src/app.js",
  "./src/core/md.js",
  "./src/core/registry.js",
  "./src/core/router.js",
  "./src/core/sqlrunner.js",
  "./src/core/store.js",
  "./src/core/ui.js",
  "./src/pages/dashboard.js",
  "./src/pages/glossary.js",
  "./src/pages/interview.js",
  "./src/pages/module.js",
  "./src/pages/practice.js",
  "./src/pages/search.js",
  "./src/pages/topic.js",
  "./src/pages/track.js",
  "./content/00-modules.js",
  "./content/glossary.js",
  "./content/m1-strategy-tasks.js",
  "./content/m1-strategy-topics.js",
  "./content/m10-autoarch-tasks.js",
  "./content/m10-autoarch-topics.js",
  "./content/m11-obs-tasks.js",
  "./content/m11-obs-topics.js",
  "./content/m12-mobile-tasks.js",
  "./content/m12-mobile-topics.js",
  "./content/m13-ai-tasks.js",
  "./content/m13-ai-topics.js",
  "./content/m14-soft-tasks.js",
  "./content/m14-soft-topics.js",
  "./content/m15-go-tasks.js",
  "./content/m15-go-topics.js",
  "./content/m16-sdet-dev-tasks.js",
  "./content/m16-sdet-dev-topics.js",
  "./content/m17-infra-tasks.js",
  "./content/m17-infra-topics.js",
  "./content/m18-agile-tasks.js",
  "./content/m18-agile-topics.js",
  "./content/m19-devops-tasks.js",
  "./content/m19-devops-topics.js",
  "./content/m2-design-tasks.js",
  "./content/m2-design-topics.js",
  "./content/m20-infra-ops-tasks.js",
  "./content/m20-infra-ops-topics.js",
  "./content/m3-requirements-tasks.js",
  "./content/m3-requirements-topics.js",
  "./content/m4-arch-tasks.js",
  "./content/m4-arch-topics.js",
  "./content/m5-api-tasks.js",
  "./content/m5-api-topics.js",
  "./content/m6-sql-tasks.js",
  "./content/m6-sql-topics.js",
  "./content/m7-cicd-tasks.js",
  "./content/m7-cicd-topics.js",
  "./content/m8-perf-tasks.js",
  "./content/m8-perf-topics.js",
  "./content/m9-sec-tasks-deep.js",
  "./content/m9-sec-tasks-method.js",
  "./content/m9-sec-tasks.js",
  "./content/m9-sec-topics-access.js",
  "./content/m9-sec-topics-advanced.js",
  "./content/m9-sec-topics-api.js",
  "./content/m9-sec-topics-infra.js",
  "./content/m9-sec-topics-inject.js",
  "./content/m9-sec-topics-method.js",
  "./content/m9-sec-topics-owasp.js",
  "./content/questions-m1-m16-m17.js",
  "./content/questions-m12-m13-m15.js",
  "./content/questions-m18.js",
  "./content/questions-m19-m20.js",
  "./content/questions-m2-m4-m5.js",
  "./content/questions-m3-m10-m11-m14.js",
  "./content/questions-m7-m8.js",
  "./content/questions-m9-deep.js",
  "./content/questions.js",
  "./vendor/sql-wasm.js",
  "./vendor/sql-wasm.wasm",
  "./public/go/index.html",
  "./public/git/index.html"
];
/* PRECACHE:END */

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    try {
      const cache = await caches.open(CACHE);
      // Предзагружаем по одному: одна осечка не должна срывать всю установку.
      await Promise.allSettled(PRECACHE.map(async (url) => {
        try {
          const resp = await fetch(url, { cache: 'no-cache' });
          // Не кэшируем редиректы (экран логина Cloudflare Access) и ошибки.
          if (resp && resp.ok && !resp.redirected) await cache.put(url, resp.clone());
        } catch (e) {}
      }));
    } catch (e) {}
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // Удаляем кэши прошлых версий, чтобы не копить мусор и не отдавать старьё.
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

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
