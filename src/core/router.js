/* Хеш-роутер: работает и через http://, и через file://. */
(function () {
  const QA = (window.QA = window.QA || {});
  const routes = [];

  QA.route = function (pattern, handler) {
    const names = [];
    const rx = new RegExp(
      '^' + pattern.replace(/:([a-zA-Z]+)/g, (_, n) => { names.push(n); return '([^/]+)'; }) + '$'
    );
    routes.push({ rx, names, handler });
  };

  QA.navigate = function (path) { location.hash = '#' + path; };

  QA.currentPath = function () {
    const h = location.hash.replace(/^#/, '');
    return h || '/';
  };

  function resolve() {
    const path = QA.currentPath();
    for (const r of routes) {
      const m = r.rx.exec(path);
      if (m) {
        const params = {};
        r.names.forEach((n, i) => (params[n] = decodeURIComponent(m[i + 1])));
        return r.handler(params);
      }
    }
    return QA.ui.notFound(path);
  }

  QA.startRouter = function () {
    window.addEventListener('hashchange', () => { resolve(); window.scrollTo(0, 0); });
    resolve();
  };
})();
