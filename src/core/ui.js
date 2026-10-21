/* Каркас интерфейса: шапка, боковое меню, вспомогательные функции рендеринга. */
(function () {
  const QA = (window.QA = window.QA || {});

  const esc = (s) =>
    String(s === undefined || s === null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const LEVEL_LABEL = { M: 'Middle', S: 'Senior', MS: 'M → S' };

  const ui = {
    esc,
    LEVEL_LABEL,

    badge(level) {
      const cls = level === 'S' ? 'b-s' : level === 'M' ? 'b-m' : 'b-ms';
      return '<span class="badge ' + cls + '">' + esc(LEVEL_LABEL[level] || level) + '</span>';
    },

    progressBar(percent) {
      return (
        '<div class="pbar" title="' + percent + '%"><span style="width:' + percent + '%"></span></div>'
      );
    },

    layout(content, activeModuleId) {
      const modules = QA.data.modules;
      const total = QA.store.stats();
      const nav = modules
        .map((m) => {
          const st = QA.store.stats(m.id);
          const active = m.id === activeModuleId ? ' active' : '';
          const empty = st.topics + st.tasks === 0 ? ' empty' : '';
          return (
            '<a class="nav-item' + active + empty + '" href="#/module/' + m.id + '">' +
            '<span class="nav-code">' + esc(m.code) + '</span>' +
            '<span class="nav-title">' + esc(m.title) + '</span>' +
            '<span class="nav-pct">' + st.percent + '%</span>' +
            '</a>'
          );
        })
        .join('');

      return (
        '<header class="topbar">' +
          '<a class="brand" href="#/"><b>QA</b> middle → senior</a>' +
          '<nav class="topnav">' +
            '<a href="#/track/sdet">Трек SDET</a>' +
            '<a href="#/track/devops">Трек DevOps</a>' +
            '<a href="#/practice">Практика</a>' +
            '<a href="#/interview">Mock-интервью</a>' +
            '<a href="#/glossary">Глоссарий</a>' +
            '<a href="#/search">Поиск</a>' +
          '</nav>' +
          '<div class="topright">' +
            '<span class="total">Прогресс: <b>' + total.percent + '%</b></span>' +
            '<button class="btn ghost" id="theme-toggle" title="Сменить тему">◐</button>' +
          '</div>' +
        '</header>' +
        '<div class="shell">' +
          '<aside class="sidebar"><div class="side-title">Модули</div>' + nav + '</aside>' +
          '<main class="content">' + content + '</main>' +
        '</div>'
      );
    },

    render(content, activeModuleId) {
      document.getElementById('app').innerHTML = ui.layout(content, activeModuleId);
      const t = document.getElementById('theme-toggle');
      if (t) {
        t.onclick = () => {
          const next = QA.store.theme === 'dark' ? 'light' : 'dark';
          QA.store.setTheme(next);
          document.documentElement.setAttribute('data-theme', next);
        };
      }
    },

    notFound(path) {
      ui.render('<h1>Страница не найдена</h1><p>Маршрут <code>' + esc(path) + '</code> не существует.</p>');
    },

    crumbs(items) {
      return (
        '<div class="crumbs">' +
        items
          .map((i) => (i.href ? '<a href="' + i.href + '">' + esc(i.text) + '</a>' : '<span>' + esc(i.text) + '</span>'))
          .join('<i>/</i>') +
        '</div>'
      );
    },

    section(title, bodyHtml, cls) {
      return (
        '<section class="card ' + (cls || '') + '">' +
        (title ? '<h2 class="card-title">' + esc(title) + '</h2>' : '') +
        bodyHtml +
        '</section>'
      );
    },

    collapsible(title, bodyHtml, cls) {
      const id = 'c' + Math.random().toString(36).slice(2, 9);
      return (
        '<div class="collapse ' + (cls || '') + '">' +
        '<button class="collapse-head" data-target="' + id + '">' + esc(title) + '<i>▾</i></button>' +
        '<div class="collapse-body" id="' + id + '" hidden>' + bodyHtml + '</div>' +
        '</div>'
      );
    },

    bindCollapsibles(root) {
      (root || document).querySelectorAll('.collapse-head').forEach((b) => {
        b.onclick = () => {
          const body = document.getElementById(b.dataset.target);
          if (!body) return;
          body.hidden = !body.hidden;
          b.classList.toggle('open', !body.hidden);
        };
      });
    },
  };

  QA.ui = ui;
})();
