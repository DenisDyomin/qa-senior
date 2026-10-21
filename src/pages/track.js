/* Треки: подборки модулей под конкретную карьерную цель. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  QA.TRACKS = {
    devops: {
      title: 'Трек DevOps',
      lead: 'DevOps-навыки для QA/SDET: от культуры и потока доставки до эксплуатации — ' +
        'контейнеры, Kubernetes, IaC, GitOps и мониторинг глазами инженера качества.',
      intro: `Трек собирает DevOps в дугу «основы → применение». **M19** — культура, поток и доставка
(CALMS, SRE/SLO, ветвление, артефакты, стратегии деплоя, секреты, DevSecOps). **M20** — инфраструктура
и эксплуатация (контейнеры, Kubernetes, Terraform, Ansible, GitOps, Prometheus/Grafana, логи, трейсинг,
облако). Смежные QA-модули проходите вместе с треком: **M7** (CI/CD), **M17** (тест-инфраструктура),
**M11** (наблюдаемость), **M8** (производительность).

**Порядок прохождения:** M19 → M20 → M7 → M17 → M11 → M8.`,
      order: ['m19', 'm20', 'm7', 'm17', 'm11', 'm8'],
    },
    sdet: {
      title: 'Трек SDET',
      lead: 'SDET — это разработчик, чей продукт: инструменты тестирования. 70–90% времени в коде, ' +
        'а результат работы — фреймворки и инфраструктура, которыми пользуются другие.',
      intro: `Компетенции SDET пересекаются с senior QA примерно на 70% — карта строилась вокруг компетенций,
а не должностей. Собственно «разработческая» часть роли закрывается двумя модулями: **M16** (код уровня
разработчика) и **M17** (тестовая инфраструктура как продукт). Остальное вы проходите вместе с основным треком.

**Порядок прохождения:** M16 → M17 → M10 → M7 → M8 → M5 → M4 → M15.

**Что спрашивают на SDET-собеседовании сверх обычного QA-собеса:** проекты на GitHub, опыт проектирования
фреймворка с нуля, живое кодирование алгоритмического уровня, контейнеризация и CI/CD,
trade-off'ы в архитектуре, тестовая инфраструктура (Grid, Docker, Kubernetes), моки и генерация данных.`,
      order: ['m16', 'm17', 'm10', 'm7', 'm8', 'm5', 'm4', 'm15'],
    },
  };

  QA.pages.track = function (params) {
    const ui = QA.ui;
    const track = QA.TRACKS[params.id];
    if (!track) return ui.notFound('/track/' + params.id);

    const cards = track.order
      .map((id) => QA.get.module(id))
      .filter(Boolean)
      .map((m, i) => {
        const st = QA.store.stats(m.id);
        const ready = st.topics + st.tasks > 0;
        return (
          '<a class="mod-card' + (ready ? '' : ' pending') + '" href="#/module/' + m.id + '">' +
          '<div class="mod-head"><span class="mod-code">' + (i + 1) + '. ' + ui.esc(m.code) + '</span>' +
          '<span class="mod-prio p' + ui.esc(m.priority) + '">' + ui.esc(m.priority) + '</span></div>' +
          '<h3>' + ui.esc(m.title) + '</h3><p>' + ui.esc(m.summary) + '</p>' +
          (ready
            ? ui.progressBar(st.percent) +
              '<div class="mod-meta">' + st.known + '/' + st.topics + ' тем · ' + st.solved + '/' + st.tasks + ' задач</div>'
            : '<div class="mod-meta muted">Контент в работе</div>') +
          '</a>'
        );
      })
      .join('');

    const ids = track.order;
    const topics = QA.data.topics.filter((t) => ids.includes(t.moduleId));
    const tasks = QA.data.tasks.filter((t) => ids.includes(t.moduleId));
    const known = topics.filter((t) => QA.store.topicStatus(t.id) === 'known').length;
    const solved = tasks.filter((t) => QA.store.taskStatus(t.id) === 'solved').length;
    const total = topics.length + tasks.length;
    const pct = total ? Math.round(((known + solved) / total) * 100) : 0;

    ui.render(
      ui.crumbs([{ text: 'Модули', href: '#/' }, { text: track.title }]) +
        '<h1>' + ui.esc(track.title) + '</h1>' +
        '<p class="lead">' + ui.esc(track.lead) + '</p>' +
        '<div class="prose">' + QA.md(track.intro) + '</div>' +
        ui.section('Прогресс по треку', ui.progressBar(pct) +
          '<div class="mod-meta">' + known + '/' + topics.length + ' тем · ' + solved + '/' + tasks.length + ' задач</div>') +
        '<h2 class="sec-title">Модули трека по порядку</h2>' +
        '<div class="mod-grid">' + cards + '</div>'
    );
  };
})();
