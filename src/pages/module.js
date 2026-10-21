/* Страница модуля: список тем, задач и вопросов. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  QA.pages.module = function (params) {
    const ui = QA.ui;
    const m = QA.get.module(params.id);
    if (!m) return ui.notFound('/module/' + params.id);

    const topics = QA.get.topicsOf(m.id);
    const tasks = QA.get.tasksOf(m.id);
    const questions = QA.get.questionsOf(m.id);
    const st = QA.store.stats(m.id);

    const statusIcon = { new: '○', learning: '◐', known: '●' };

    const topicList = topics.length
      ? '<ol class="topic-list">' +
        topics
          .map(
            (t) =>
              '<li><a href="#/topic/' + t.id + '">' +
              '<span class="tstatus ' + QA.store.topicStatus(t.id) + '">' + statusIcon[QA.store.topicStatus(t.id)] + '</span>' +
              '<span class="tt">' + ui.esc(t.title) + '</span>' +
              ui.badge(t.level) +
              '</a></li>'
          )
          .join('') +
        '</ol>'
      : '<p class="muted">Темы этого модуля ещё не написаны.</p>';

    const taskList = tasks.length
      ? '<ul class="task-list">' +
        tasks
          .map(
            (t) =>
              '<li><a href="#/task/' + t.id + '">' +
              '<span class="kind k-' + ui.esc(t.kind) + '">' + ui.esc(QA.TASK_KIND[t.kind] || t.kind) + '</span>' +
              '<span class="tt">' + ui.esc(t.title) + '</span>' +
              '<span class="tstatus ' + QA.store.taskStatus(t.id) + '">' +
              (QA.store.taskStatus(t.id) === 'solved' ? '✓' : '') + '</span>' +
              '</a></li>'
          )
          .join('') +
        '</ul>'
      : '<p class="muted">Задачи этого модуля ещё не написаны.</p>';

    const html =
      ui.crumbs([{ text: 'Модули', href: '#/' }, { text: m.code + ' · ' + m.title }]) +
      '<h1>' + ui.esc(m.title) + '</h1>' +
      '<p class="lead">' + ui.esc(m.summary) + '</p>' +
      (m.intro ? '<div class="prose">' + QA.md(m.intro) + '</div>' : '') +
      ui.section(
        'Прогресс модуля',
        ui.progressBar(st.percent) +
          '<div class="mod-meta">' + st.known + '/' + st.topics + ' тем · ' + st.solved + '/' + st.tasks +
          ' задач · ' + questions.length + ' вопросов в банке</div>'
      ) +
      '<h2 class="sec-title">Темы</h2>' + topicList +
      '<h2 class="sec-title">Практика</h2>' + taskList +
      (questions.length
        ? '<h2 class="sec-title">Банк вопросов</h2>' +
          '<p><a class="btn" href="#/interview/' + m.id + '">Пройти по вопросам модуля (' + questions.length + ')</a></p>'
        : '');

    ui.render(html, m.id);
  };
})();
