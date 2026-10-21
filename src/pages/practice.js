/* Практика: список задач и страница задачи с тремя движками проверки. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  QA.TASK_KIND = {
    sql: 'SQL',
    case: 'Кейс',
    code: 'Код/конфиг',
    bugreport: 'Баг-репорт',
    testcase: 'Тест-кейсы',
    security: 'Безопасность',
  };

  QA.pages.practice = function () {
    const ui = QA.ui;
    const byModule = QA.data.modules
      .map((m) => {
        const tasks = QA.get.tasksOf(m.id);
        if (!tasks.length) return '';
        return (
          '<h2 class="sec-title">' + ui.esc(m.code) + ' · ' + ui.esc(m.title) + '</h2>' +
          '<ul class="task-list">' +
          tasks
            .map(
              (t) =>
                '<li><a href="#/task/' + t.id + '">' +
                '<span class="kind k-' + ui.esc(t.kind) + '">' + ui.esc(QA.TASK_KIND[t.kind] || t.kind) + '</span>' +
                '<span class="tt">' + ui.esc(t.title) + '</span>' +
                '<span class="tstatus ' + QA.store.taskStatus(t.id) + '">' +
                (QA.store.taskStatus(t.id) === 'solved' ? '✓' : '') + '</span></a></li>'
            )
            .join('') +
          '</ul>'
        );
      })
      .join('');

    ui.render(
      '<h1>Практика</h1><p class="lead">Задачи с проверкой: SQL исполняется по-настоящему, ' +
        'кейсы проверяются по критериям, для кода и конфигов есть эталон с разбором.</p>' +
        (byModule || '<p class="muted">Задачи ещё не добавлены.</p>')
    );
  };

  QA.pages.task = function (params) {
    const ui = QA.ui;
    const t = QA.get.task(params.id);
    if (!t) return ui.notFound('/task/' + params.id);
    const m = QA.get.module(t.moduleId);

    const head =
      ui.crumbs([
        { text: 'Практика', href: '#/practice' },
        { text: m.code, href: '#/module/' + m.id },
        { text: t.title },
      ]) +
      '<h1>' + ui.esc(t.title) + '</h1>' +
      '<div class="prose">' + QA.md(t.statement) + '</div>';

    let body = '';
    if (t.kind === 'sql') body = sqlBody(t);
    else if (t.kind === 'case' || t.kind === 'testcase' || t.kind === 'bugreport' || t.kind === 'security') body = caseBody(t);
    else body = codeBody(t);

    ui.render(head + body, m.id);
    ui.bindCollapsibles();
    if (t.kind === 'sql') bindSql(t);
    else bindGeneric(t);
  };

  /* ---------- SQL ---------- */

  function sqlBody(t) {
    const ui = QA.ui;
    return (
      ui.collapsible('Схема и данные', '<pre class="code"><code>' + ui.esc(t.schemaPreview || t.seed) + '</code></pre>') +
      '<div class="editor">' +
      '<textarea id="sql-input" spellcheck="false" placeholder="-- ваш запрос">' + ui.esc(t.starter || '') + '</textarea>' +
      '<div class="row-actions">' +
      '<button class="btn" id="sql-run">Выполнить и проверить</button>' +
      '<button class="btn ghost" id="sql-plain">Просто выполнить</button>' +
      '<button class="btn ghost" id="sql-reset">Сброс</button>' +
      '</div></div>' +
      '<div id="sql-result"></div>' +
      ui.collapsible('Эталонное решение', '<pre class="code"><code>' + ui.esc(t.solution) + '</code></pre>', 'sol') +
      (t.discussion ? ui.collapsible('Разбор: чем эталон лучше наивного решения', '<div class="prose">' + QA.md(t.discussion) + '</div>', 'sol') : '') +
      (t.hint ? ui.collapsible('Подсказка', '<div class="prose">' + QA.md(t.hint) + '</div>') : '')
    );
  }

  function table(res) {
    const ui = QA.ui;
    if (!res.columns.length) return '<p class="muted">Запрос не вернул набор строк.</p>';
    return (
      '<div class="tw"><table><thead><tr>' +
      res.columns.map((c) => '<th>' + ui.esc(c) + '</th>').join('') +
      '</tr></thead><tbody>' +
      res.rows
        .slice(0, 200)
        .map((r) => '<tr>' + r.map((c) => '<td>' + ui.esc(c === null ? 'NULL' : c) + '</td>').join('') + '</tr>')
        .join('') +
      '</tbody></table></div>' +
      (res.rows.length > 200 ? '<p class="muted">Показаны первые 200 строк из ' + res.rows.length + '.</p>' : '')
    );
  }

  function bindSql(t) {
    const out = document.getElementById('sql-result');
    const input = document.getElementById('sql-input');

    async function exec(check) {
      out.innerHTML = '<p class="muted">Выполняю…</p>';
      let actual;
      try {
        actual = await QA.sql.run(t.seed, input.value);
      } catch (e) {
        out.innerHTML = '<div class="verdict fail"><b>Ошибка SQL:</b> ' + QA.ui.esc(e.message) + '</div>';
        return;
      }
      if (!check) {
        out.innerHTML = table(actual);
        return;
      }
      let expected;
      try {
        expected = await QA.sql.run(t.seed, t.solution);
      } catch (e) {
        out.innerHTML = '<div class="verdict fail">Эталон не выполнился: ' + QA.ui.esc(e.message) + '</div>';
        return;
      }
      const verdict = QA.sql.compare(actual, expected, !!t.ordered);
      QA.store.setTaskStatus(t.id, verdict.ok ? 'solved' : 'failed');
      out.innerHTML =
        (verdict.ok
          ? '<div class="verdict ok"><b>Верно.</b> Результат совпал с эталоном' + (t.ordered ? ' с учётом порядка строк.' : '.') + '</div>'
          : '<div class="verdict fail"><b>Не совпало.</b> ' + QA.ui.esc(verdict.reason) + '</div>') +
        table(actual);
    }

    document.getElementById('sql-run').onclick = () => exec(true);
    document.getElementById('sql-plain').onclick = () => exec(false);
    document.getElementById('sql-reset').onclick = () => {
      input.value = t.starter || '';
      out.innerHTML = '';
    };

    QA.sql.init().catch(() => {
      out.innerHTML =
        '<div class="verdict warn"><b>SQL-движок не подключён.</b> Положите файлы <code>sql-wasm.js</code> и ' +
        '<code>sql-wasm.wasm</code> в папку <code>vendor/</code> (см. README) и откройте приложение через локальный сервер ' +
        '(<code>./start.sh</code>). Пока движка нет, доступны условие, эталон и разбор.</div>';
    });
  }

  /* ---------- Кейсы и код ---------- */

  function caseBody(t) {
    const ui = QA.ui;
    const criteria = (t.criteria || [])
      .map((c, i) => '<li><label><input type="checkbox" data-crit="' + i + '"> ' + ui.esc(c) + '</label></li>')
      .join('');
    return (
      '<div class="editor">' +
      '<textarea id="answer-input" spellcheck="false" placeholder="Ваш ответ — пишите так, как отвечали бы вслух на собеседовании"></textarea>' +
      '<div class="row-actions"><button class="btn" id="show-ref">Показать эталон и критерии</button></div>' +
      '</div>' +
      '<div id="ref-block" hidden>' +
      QA.ui.section('Эталонный ответ', '<div class="prose">' + QA.md(t.solution) + '</div>', 'good') +
      (criteria
        ? QA.ui.section(
            'Критерии самопроверки — отметьте то, что действительно было в вашем ответе',
            '<ul class="criteria">' + criteria + '</ul>' +
              '<div class="row-actions"><button class="btn" id="score-btn">Оценить</button>' +
              '<span id="score-out" class="score"></span></div>'
          )
        : '') +
      (t.mistake ? QA.ui.section('Типичная ошибка middle', '<div class="prose">' + QA.md(t.mistake) + '</div>', 'bad') : '') +
      (t.discussion ? QA.ui.section('Разбор', '<div class="prose">' + QA.md(t.discussion) + '</div>') : '') +
      '</div>' +
      (t.hint ? ui.collapsible('Подсказка', '<div class="prose">' + QA.md(t.hint) + '</div>') : '')
    );
  }

  function codeBody(t) {
    const ui = QA.ui;
    return (
      '<div class="editor">' +
      '<textarea id="answer-input" spellcheck="false" placeholder="Ваше решение">' + ui.esc(t.starter || '') + '</textarea>' +
      '<div class="row-actions"><button class="btn" id="show-ref">Показать эталон и разбор</button></div>' +
      '</div>' +
      '<div id="ref-block" hidden>' +
      QA.ui.section('Эталонное решение', '<pre class="code"><code>' + ui.esc(t.solution) + '</code></pre>', 'good') +
      (t.discussion ? QA.ui.section('Разбор: чем эталон лучше наивного решения', '<div class="prose">' + QA.md(t.discussion) + '</div>') : '') +
      ((t.criteria || []).length
        ? QA.ui.section(
            'Критерии самопроверки',
            '<ul class="criteria">' +
              t.criteria.map((c, i) => '<li><label><input type="checkbox" data-crit="' + i + '"> ' + ui.esc(c) + '</label></li>').join('') +
              '</ul><div class="row-actions"><button class="btn" id="score-btn">Оценить</button>' +
              '<span id="score-out" class="score"></span></div>'
          )
        : '') +
      '</div>' +
      (t.hint ? ui.collapsible('Подсказка', '<div class="prose">' + QA.md(t.hint) + '</div>') : '')
    );
  }

  function bindGeneric(t) {
    const btn = document.getElementById('show-ref');
    if (btn) {
      btn.onclick = () => {
        document.getElementById('ref-block').hidden = false;
        btn.disabled = true;
      };
    }
    const score = document.getElementById('score-btn');
    if (score) {
      score.onclick = () => {
        const boxes = Array.from(document.querySelectorAll('[data-crit]'));
        const hit = boxes.filter((b) => b.checked).length;
        const pct = Math.round((hit / boxes.length) * 100);
        QA.store.setTaskStatus(t.id, pct >= 70 ? 'solved' : 'failed');
        document.getElementById('score-out').innerHTML =
          hit + ' из ' + boxes.length + ' (' + pct + '%) — ' +
          (pct >= 70 ? '<b class="ok">зачтено</b>' : '<b class="fail">вернитесь к теории</b>');
      };
    }
  }
})();
