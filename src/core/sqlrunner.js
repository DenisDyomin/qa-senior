/* Обёртка над sql.js (SQLite в WebAssembly). Файлы кладутся в ./vendor/. */
(function () {
  const QA = (window.QA = window.QA || {});
  let SQLPromise = null;

  function loadScript(src) {
    return new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = res;
      s.onerror = () => rej(new Error('Не найден ' + src));
      document.head.appendChild(s);
    });
  }

  QA.sql = {
    available: false,
    async init() {
      if (SQLPromise) return SQLPromise;
      SQLPromise = (async () => {
        if (!window.initSqlJs) await loadScript('./vendor/sql-wasm.js');
        const SQL = await window.initSqlJs({ locateFile: (f) => './vendor/' + f });
        QA.sql.available = true;
        return SQL;
      })();
      return SQLPromise;
    },
    async run(seedSql, userSql) {
      const SQL = await QA.sql.init();
      const db = new SQL.Database();
      try {
        if (seedSql) db.run(seedSql);
        const res = db.exec(userSql);
        if (!res.length) return { columns: [], rows: [] };
        const last = res[res.length - 1];
        return { columns: last.columns, rows: last.values };
      } finally {
        db.close();
      }
    },
  };

  QA.sql.compare = function (actual, expected, ordered) {
    const norm = (v) =>
      v === null || v === undefined
        ? 'NULL'
        : typeof v === 'number'
        ? String(Math.round(v * 1e6) / 1e6)
        : String(v);
    const rowKey = (r) => r.map(norm).join('');
    if (actual.columns.length !== expected.columns.length) {
      return { ok: false, reason: 'Ожидалось колонок: ' + expected.columns.length + ', получено: ' + actual.columns.length };
    }
    if (actual.rows.length !== expected.rows.length) {
      return { ok: false, reason: 'Ожидалось строк: ' + expected.rows.length + ', получено: ' + actual.rows.length };
    }
    const a = actual.rows.map(rowKey);
    const e = expected.rows.map(rowKey);
    if (ordered) {
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== e[i]) return { ok: false, reason: 'Строка ' + (i + 1) + ' не совпадает (в этой задаче важен порядок сортировки)' };
      }
      return { ok: true };
    }
    const bag = e.slice();
    for (const key of a) {
      const idx = bag.indexOf(key);
      if (idx === -1) return { ok: false, reason: 'В результате есть строка, которой нет в эталоне' };
      bag.splice(idx, 1);
    }
    return { ok: true };
  };
})();
