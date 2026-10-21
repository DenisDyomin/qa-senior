/* Страница темы: единый шаблон подачи материала. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  QA.pages.topic = function (params) {
    const ui = QA.ui;
    const t = QA.get.topic(params.id);
    if (!t) return ui.notFound('/topic/' + params.id);
    const m = QA.get.module(t.moduleId);
    const topics = QA.get.topicsOf(t.moduleId);
    const idx = topics.findIndex((x) => x.id === t.id);
    const prev = topics[idx - 1];
    const next = topics[idx + 1];
    const related = QA.get.tasksOfTopic(t.id);

    const asked = (t.asked || [])
      .map((q) => '<li>' + ui.esc(q) + '</li>')
      .join('');

    const html =
      ui.crumbs([
        { text: 'Модули', href: '#/' },
        { text: m.code, href: '#/module/' + m.id },
        { text: t.title },
      ]) +
      '<h1>' + ui.esc(t.title) + ' ' + ui.badge(t.level) + '</h1>' +
      (asked
        ? ui.section('Что спросят на собеседовании', '<ul class="asked">' + asked + '</ul>', 'asked-card')
        : '') +
      (t.theory ? '<div class="prose">' + QA.md(t.theory) + '</div>' : '') +
      (t.answer
        ? ui.section('Эталонный ответ senior', '<div class="prose">' + QA.md(t.answer) + '</div>', 'good')
        : '') +
      (t.mistake
        ? ui.section('Типичная ошибка middle', '<div class="prose">' + QA.md(t.mistake) + '</div>', 'bad')
        : '') +
      (t.checklist
        ? ui.section('Чек-лист: применить на своём проекте', '<div class="prose">' + QA.md(t.checklist) + '</div>', 'check')
        : '') +
      (related.length
        ? ui.section(
            'Практика по теме',
            '<ul class="task-list">' +
              related
                .map(
                  (x) =>
                    '<li><a href="#/task/' + x.id + '"><span class="kind k-' + ui.esc(x.kind) + '">' +
                    ui.esc(QA.TASK_KIND[x.kind] || x.kind) + '</span><span class="tt">' + ui.esc(x.title) + '</span></a></li>'
                )
                .join('') +
              '</ul>'
          )
        : '') +
      (t.sources
        ? ui.section('Источники и что почитать', '<div class="prose">' + QA.md(t.sources) + '</div>', 'src')
        : '') +
      '<div class="topic-foot">' +
      '<div class="mark">Отметить тему: ' +
      '<button class="btn ghost" data-mark="learning">Учу</button> ' +
      '<button class="btn" data-mark="known">Знаю</button> ' +
      '<button class="btn ghost" data-mark="new">Сбросить</button>' +
      '<span class="cur">Сейчас: <b id="cur-status">' + ui.esc(QA.store.topicStatus(t.id)) + '</b></span>' +
      '</div>' +
      '<div class="pager">' +
      (prev ? '<a class="btn ghost" href="#/topic/' + prev.id + '">← ' + ui.esc(prev.title) + '</a>' : '<span></span>') +
      (next ? '<a class="btn ghost" href="#/topic/' + next.id + '">' + ui.esc(next.title) + ' →</a>' : '<span></span>') +
      '</div></div>';

    ui.render(html, m.id);
    ui.bindCollapsibles();
    document.querySelectorAll('[data-mark]').forEach((b) => {
      b.onclick = () => {
        QA.store.setTopicStatus(t.id, b.dataset.mark);
        document.getElementById('cur-status').textContent = b.dataset.mark;
      };
    });
  };
})();
