/* Точка входа: маршруты и запуск. */
(function () {
  const QA = window.QA;

  document.documentElement.setAttribute('data-theme', QA.store.theme);

  QA.route('/', () => QA.pages.dashboard());
  QA.route('/module/:id', (p) => QA.pages.module(p));
  QA.route('/topic/:id', (p) => QA.pages.topic(p));
  QA.route('/task/:id', (p) => QA.pages.task(p));
  QA.route('/track/:id', (p) => QA.pages.track(p));
  QA.route('/practice', () => QA.pages.practice());
  QA.route('/interview', () => QA.pages.interview({}));
  QA.route('/interview/:moduleId', (p) => QA.pages.interview(p));
  QA.route('/glossary', () => QA.pages.glossary());
  QA.route('/search', () => QA.pages.search());

  window.addEventListener('error', (e) => {
    console.error('[QA]', e.message);
  });

  QA.startRouter();
})();
