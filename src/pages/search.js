/* Полнотекстовый поиск по темам, задачам и вопросам. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  function index() {
    const items = [];
    QA.data.topics.forEach((t) =>
      items.push({
        href: '#/topic/' + t.id,
        title: t.title,
        kind: 'Тема',
        module: t.moduleId,
        text: [t.title, (t.asked || []).join(' '), t.theory, t.answer, t.mistake, t.checklist].join(' '),
      })
    );
    QA.data.tasks.forEach((t) =>
      items.push({
        href: '#/task/' + t.id,
        title: t.title,
        kind: 'Задача',
        module: t.moduleId,
        text: [t.title, t.statement, t.solution, t.discussion].join(' '),
      })
    );
    QA.data.questions.forEach((q) =>
      items.push({
        href: q.topicId ? '#/topic/' + q.topicId : '#/module/' + q.moduleId,
        title: q.question,
        kind: 'Вопрос',
        module: q.moduleId,
        text: [q.question, q.answer, q.mistake].join(' '),
      })
    );
    return items;
  }

  QA.pages.search = function () {
    const ui = QA.ui;
    ui.render(
      '<h1>Поиск</h1>' +
        '<div class="form-row"><input id="s-input" placeholder="Например: изоляция, BOLA, перцентиль, quality gate" autofocus></div>' +
        '<div id="s-out"><p class="muted">Введите запрос — ищем по темам, задачам и вопросам.</p></div>'
    );

    const idx = index();
    const inp = document.getElementById('s-input');
    const out = document.getElementById('s-out');

    inp.oninput = () => {
      const q = inp.value.trim().toLowerCase();
      if (q.length < 2) {
        out.innerHTML = '<p class="muted">Введите минимум два символа.</p>';
        return;
      }
      const hits = idx
        .map((it) => {
          const text = (it.text || '').toLowerCase();
          let score = 0;
          if (it.title.toLowerCase().includes(q)) score += 10;
          let pos = text.indexOf(q);
          while (pos !== -1) {
            score++;
            pos = text.indexOf(q, pos + q.length);
          }
          return { it, score, text };
        })
        .filter((h) => h.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 40);

      if (!hits.length) {
        out.innerHTML = '<p class="muted">Ничего не найдено.</p>';
        return;
      }
      out.innerHTML =
        '<ul class="task-list">' +
        hits
          .map((h) => {
            const p = h.text.indexOf(q);
            const snippet = p === -1 ? '' : h.text.slice(Math.max(0, p - 60), p + 120);
            const m = QA.get.module(h.it.module);
            return (
              '<li><a href="' + h.it.href + '">' +
              '<span class="kind">' + ui.esc(h.it.kind) + '</span>' +
              '<span class="tt">' + ui.esc(h.it.title) + '</span>' +
              '<span class="muted small">' + ui.esc(m ? m.code : '') + '</span>' +
              '</a>' + (snippet ? '<div class="snippet muted">…' + ui.esc(snippet) + '…</div>' : '') + '</li>'
            );
          })
          .join('') +
        '</ul>';
    };
  };
})();
