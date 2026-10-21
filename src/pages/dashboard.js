/* Дашборд: карта компетенций, прогресс, повторение и экзамены. */
(function () {
  const QA = window.QA;

  QA.pages = QA.pages || {};
  QA.pages.dashboard = function () {
    const ui = QA.ui;
    const total = QA.store.stats();
    const due = QA.store.dueCount();
    const lastExam = QA.store.exams[0];

    const cards = QA.data.modules
      .map((m) => {
        const st = QA.store.stats(m.id);
        const ready = st.topics + st.tasks > 0;
        return (
          '<a class="mod-card' + (ready ? '' : ' pending') + '" href="#/module/' + m.id + '">' +
          '<div class="mod-head"><span class="mod-code">' + ui.esc(m.code) + '</span>' +
          '<span class="mod-prio p' + ui.esc(m.priority) + '">' + ui.esc(m.priority) + '</span></div>' +
          '<h3>' + ui.esc(m.title) + '</h3>' +
          '<p>' + ui.esc(m.summary) + '</p>' +
          (ready
            ? ui.progressBar(st.percent) +
              '<div class="mod-meta">' + st.known + '/' + st.topics + ' тем · ' + st.solved + '/' + st.tasks + ' задач</div>'
            : '<div class="mod-meta muted">Контент в работе</div>') +
          '</a>'
        );
      })
      .join('');

    let reviewHtml = '';
    if (due > 0 || lastExam) {
      const parts = [];
      if (due > 0) {
        parts.push('<div class="stat"><b>' + due + '</b><span>вопрос(ов) к повторению сегодня</span></div>');
      }
      if (lastExam) {
        const pct = lastExam.total ? Math.round((lastExam.ok / lastExam.total) * 100) : 0;
        parts.push('<div class="stat"><b>' + pct + '%</b><span>последний экзамен (' + ui.esc(lastExam.scopeLabel || 'все') + ')</span></div>');
      }
      reviewHtml = ui.section(
        'Повторение и экзамены',
        '<div class="stat-row">' + parts.join('') + '</div>' +
          '<div class="row-actions">' +
          (due > 0 ? '<button class="btn" id="start-review">Повторить сегодня (' + due + ')</button> ' : '') +
          '<a class="btn ghost" href="#/interview">Mock-интервью / экзамен</a>' +
          '</div>'
      );
    }

    const html =
      '<h1>Карта компетенций: middle → senior</h1>' +
      '<p class="lead">Тренажёр закрывает разрыв между «умею тестировать фичу» и «отвечаю за качество продукта». ' +
      'Каждая тема построена одинаково: что спросят на собеседовании → теория senior-уровня → эталонный ответ → ' +
      'типичная ошибка middle → практика → чек-лист.</p>' +
      ui.section(
        'Общий прогресс',
        ui.progressBar(total.percent) +
          '<div class="stat-row">' +
          '<div class="stat"><b>' + total.known + '</b><span>тем освоено из ' + total.topics + '</span></div>' +
          '<div class="stat"><b>' + total.learning + '</b><span>в процессе</span></div>' +
          '<div class="stat"><b>' + total.solved + '</b><span>задач решено из ' + total.tasks + '</span></div>' +
          '</div>' +
          '<div class="row-actions">' +
          '<button class="btn" id="export-progress">Экспорт прогресса</button>' +
          '<button class="btn ghost" id="import-progress">Импорт</button>' +
          '<button class="btn danger ghost" id="reset-progress">Сбросить</button>' +
          '</div>'
      ) +
      reviewHtml +
      '<h2 class="sec-title">Модули</h2>' +
      '<div class="mod-grid">' + cards + '</div>';

    ui.render(html);

    const reviewBtn = document.getElementById('start-review');
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        QA._pendingStart = { ids: QA.store.dueReviewIds() };
        location.hash = '#/interview';
      };
    }

    document.getElementById('export-progress').onclick = () => {
      const blob = new Blob([QA.store.export()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'qa-progress.json';
      a.click();
      URL.revokeObjectURL(a.href);
    };
    document.getElementById('import-progress').onclick = () => {
      const inp = document.createElement('input');
      inp.type = 'file';
      inp.accept = 'application/json';
      inp.onchange = () => {
        const f = inp.files[0];
        if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try {
            QA.store.import(String(r.result));
            QA.pages.dashboard();
          } catch (e) {
            alert('Не удалось импортировать: ' + e.message);
          }
        };
        r.readAsText(f);
      };
      inp.click();
    };
    document.getElementById('reset-progress').onclick = () => {
      if (confirm('Сбросить весь прогресс?')) {
        QA.store.reset();
        QA.pages.dashboard();
      }
    };
  };
})();
