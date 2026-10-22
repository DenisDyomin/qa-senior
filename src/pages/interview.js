/* Mock-интервью, экзамен-режим и интервальное повторение. */
(function () {
  const QA = window.QA;
  QA.pages = QA.pages || {};

  let session = null;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function questionsForScope(scope) {
    if (!scope) return QA.data.questions;
    if (scope.indexOf('track:') === 0) {
      const tr = scope.slice(6);
      const ids = (QA.TRACKS && QA.TRACKS[tr] ? QA.TRACKS[tr].order : []);
      return QA.data.questions.filter((q) => ids.indexOf(q.moduleId) !== -1);
    }
    return QA.get.questionsOf(scope);
  }

  QA.pages.interview = function (params) {
    const ui = QA.ui;

    /* Запуск повторения из дашборда (очередь «повторить сегодня») */
    if (QA._pendingStart) {
      const ps = QA._pendingStart;
      QA._pendingStart = null;
      if (ps.ids && ps.ids.length) {
        const byId = {};
        ps.ids.forEach((id) => (byId[id] = true));
        const src = QA.data.questions.filter((q) => byId[q.id]);
        session = { list: shuffle(src), i: 0, timer: 0, results: [], label: 'Повторение', exam: false };
        return renderQuestion();
      }
    }

    const moduleId = params && params.moduleId;
    if (!QA.data.questions.length) {
      return ui.render('<h1>Mock-интервью</h1><p class="muted">Банк вопросов пока пуст.</p>');
    }

    const scopeOptions =
      '<option value="">Все модули</option>' +
      '<option value="track:sdet">Трек SDET</option>' +
      '<option value="track:devops">Трек DevOps</option>' +
      QA.data.modules
        .filter((m) => QA.get.questionsOf(m.id).length)
        .map((m) => '<option value="' + m.id + '"' + (m.id === moduleId ? ' selected' : '') + '>' + ui.esc(m.code + ' · ' + m.title) + '</option>')
        .join('');

    const due = QA.store.dueCount();

    ui.render(
      '<h1>Mock-интервью и экзамен</h1>' +
        '<p class="lead">Тренировка: вопрос → отвечаете вслух → сверяете с эталоном → честно оцениваете себя. ' +
        'Экзамен: таймер на всю сессию, результат и карта пробелов сохраняются. Оценки питают интервальное повторение.</p>' +
        (due > 0
          ? '<div class="verdict warn">К повторению сегодня: <b>' + due + '</b> вопрос(ов). ' +
            '<button class="btn" id="iv-review">Повторить сейчас</button></div>'
          : '') +
        ui.section(
          'Настройки сессии',
          '<div class="form-row"><label>Режим</label><select id="iv-mode"><option value="train" selected>Тренировка</option><option value="exam">Экзамен</option></select></div>' +
            '<div class="form-row"><label>Охват</label><select id="iv-scope">' + scopeOptions + '</select></div>' +
            '<div class="form-row"><label>Вопросов</label><select id="iv-count"><option>5</option><option selected>10</option><option>20</option><option>40</option></select></div>' +
            '<div class="form-row" id="iv-timer-row"><label>Таймер на ответ</label><select id="iv-timer"><option value="0">Без таймера</option><option value="60">1 минута</option><option value="120" selected>2 минуты</option><option value="180">3 минуты</option></select></div>' +
            '<p class="muted" id="iv-exam-note" hidden>Экзамен: ~1.5 минуты на вопрос, таймер идёт на всю сессию; результат сохранится в историю.</p>' +
            '<div class="row-actions"><button class="btn" id="iv-start">Начать</button></div>'
        ) +
        (QA.store.exams.length ? examHistory() : ''),
      moduleId
    );

    const modeSel = document.getElementById('iv-mode');
    const timerRow = document.getElementById('iv-timer-row');
    const examNote = document.getElementById('iv-exam-note');
    modeSel.onchange = () => {
      const exam = modeSel.value === 'exam';
      timerRow.hidden = exam;
      examNote.hidden = !exam;
    };

    const reviewBtn = document.getElementById('iv-review');
    if (reviewBtn) {
      reviewBtn.onclick = () => {
        const src = QA.store.dueReviewQuestions();
        if (!src.length) return;
        session = { list: shuffle(src), i: 0, timer: 0, results: [], label: 'Повторение', exam: false };
        renderQuestion();
      };
    }

    document.getElementById('iv-start').onclick = () => {
      const mode = document.getElementById('iv-mode').value;
      const scope = document.getElementById('iv-scope').value;
      const count = parseInt(document.getElementById('iv-count').value, 10);
      const exam = mode === 'exam';
      const timer = exam ? 0 : parseInt(document.getElementById('iv-timer').value, 10);
      const src = questionsForScope(scope);
      const list = shuffle(src).slice(0, count);
      session = {
        list: list, i: 0, timer: timer, results: [], exam: exam, scope: scope,
        label: exam ? 'Экзамен' : 'Тренировка',
        deadline: exam ? Date.now() + list.length * 90000 : 0,
      };
      renderQuestion();
    };
  };

  function fmt(sec) {
    sec = Math.max(0, Math.floor(sec));
    return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
  }

  function renderQuestion() {
    const ui = QA.ui;
    if (session.i >= session.list.length) return renderReport();
    if (session.exam && session.deadline && Date.now() >= session.deadline) return renderReport();
    const q = session.list[session.i];
    const m = QA.get.module(q.moduleId);

    ui.render(
      '<div class="iv-head"><span>' + ui.esc(session.label || 'Вопрос') + ': ' + (session.i + 1) + ' из ' + session.list.length + '</span>' +
        '<span class="muted">' + ui.esc(m ? m.code : '') + '</span>' +
        '<span id="iv-clock" class="clock"></span></div>' +
        '<h1 class="iv-q">' + ui.esc(q.question) + '</h1>' +
        '<div class="row-actions"><button class="btn" id="iv-show">Показать эталон</button></div>' +
        '<div id="iv-answer" hidden>' +
        ui.section('Эталонный ответ', '<div class="prose">' + QA.md(q.answer) + '</div>', 'good') +
        (q.mistake ? ui.section('Типичная ошибка', '<div class="prose">' + QA.md(q.mistake) + '</div>', 'bad') : '') +
        (q.topicId ? '<p><a href="#/topic/' + q.topicId + '">Перейти к теме →</a></p>' : '') +
        '<div class="row-actions"><b>Как вы ответили?</b> ' +
        '<button class="btn" data-grade="ok">Уверенно</button> ' +
        '<button class="btn ghost" data-grade="weak">Плавал</button> ' +
        '<button class="btn danger ghost" data-grade="no">Не знал</button></div>' +
        '</div>',
      q.moduleId
    );

    const clock = document.getElementById('iv-clock');
    if (session.exam && session.deadline) {
      const tick = () => {
        if (!document.getElementById('iv-clock')) return clearInterval(iv);
        const left = (session.deadline - Date.now()) / 1000;
        clock.textContent = 'экзамен ' + fmt(left);
        clock.classList.toggle('warn', left <= 60);
        if (left <= 0) { clearInterval(iv); renderReport(); }
      };
      var iv = setInterval(tick, 1000);
      tick();
    } else if (session.timer > 0) {
      let left = session.timer;
      const tick = () => {
        if (!document.getElementById('iv-clock')) return clearInterval(iv);
        clock.textContent = fmt(left);
        clock.classList.toggle('warn', left <= 20);
        if (left-- <= 0) {
          clearInterval(iv);
          const b = document.getElementById('iv-show');
          if (b) b.click();
        }
      };
      var iv = setInterval(tick, 1000);
      tick();
    }

    document.getElementById('iv-show').onclick = () => {
      document.getElementById('iv-answer').hidden = false;
      document.getElementById('iv-show').disabled = true;
    };
    document.querySelectorAll('[data-grade]').forEach((b) => {
      b.onclick = () => {
        const grade = b.dataset.grade;
        QA.store.reviewQuestion(q.id, grade);
        session.results.push({ q: q, grade: grade });
        session.i++;
        renderQuestion();
      };
    });
  }

  function examHistory() {
    const ui = QA.ui;
    const rows = QA.store.exams.slice(0, 5).map((e) => {
      const d = new Date(e.date);
      const when = d.toLocaleDateString('ru-RU') + ' ' + d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
      const pct = e.total ? Math.round((e.ok / e.total) * 100) : 0;
      return '<li><b>' + pct + '%</b> (' + e.ok + '/' + e.total + ') · ' + ui.esc(e.scopeLabel || 'все') + ' · <span class="muted">' + ui.esc(when) + '</span></li>';
    }).join('');
    return ui.section('История экзаменов', '<ul class="task-list">' + rows + '</ul>');
  }

  function scopeLabel(scope) {
    if (!scope) return 'все модули';
    if (scope === 'track:sdet') return 'трек SDET';
    if (scope === 'track:devops') return 'трек DevOps';
    const m = QA.get.module(scope);
    return m ? m.code : scope;
  }

  function renderReport() {
    const ui = QA.ui;
    const answered = session.results;
    const ok = answered.filter((r) => r.grade === 'ok').length;
    const answeredSet = {};
    answered.forEach((r) => (answeredSet[r.q.id] = true));
    // В экзамене неотвеченные (из-за истёкшего таймера) тоже считаются пробелом.
    const unanswered = session.exam ? session.list.filter((q) => !answeredSet[q.id]) : [];
    const total = session.exam ? session.list.length : answered.length;
    const weak = answered.filter((r) => r.grade !== 'ok').map((r) => r.q).concat(unanswered);
    const byModule = {};
    weak.forEach((q) => {
      const m = QA.get.module(q.moduleId);
      const key = m ? m.code + ' · ' + m.title : 'Прочее';
      byModule[key] = (byModule[key] || 0) + 1;
    });

    if (session.exam && total) {
      QA.store.recordExam({ scope: session.scope, scopeLabel: scopeLabel(session.scope), total: total, ok: ok, gaps: byModule });
    }

    const gaps = Object.keys(byModule).length
      ? '<ul>' + Object.entries(byModule).sort((a, b) => b[1] - a[1]).map(([k, v]) => '<li><b>' + ui.esc(k) + '</b> — ' + v + ' пробел(ов)</li>').join('') + '</ul>'
      : '<p class="ok">Пробелов не зафиксировано.</p>';

    const list = weak.length
      ? '<ul class="task-list">' +
        weak.map((q) => '<li><a href="' + (q.topicId ? '#/topic/' + q.topicId : '#/module/' + q.moduleId) + '"><span class="tt">' + ui.esc(q.question) + '</span></a></li>').join('') +
        '</ul>'
      : '';

    ui.render(
      '<h1>Итог: ' + ui.esc(session.label || 'сессия') + '</h1>' +
        (session.exam ? '<p class="muted">Результат сохранён в историю экзаменов.</p>' : '') +
        ui.section('Результат', '<div class="stat-row"><div class="stat"><b>' + ok + '</b><span>уверенных ответов из ' + total + '</span></div>' +
          '<div class="stat"><b>' + weak.length + '</b><span>требуют повторения</span></div></div>' + ui.progressBar(total ? Math.round((ok / total) * 100) : 0)) +
        ui.section('Карта пробелов', gaps) +
        (list ? ui.section('Что повторить', list) : '') +
        '<div class="row-actions"><a class="btn" href="#/interview">Ещё сессия</a> <a class="btn ghost" href="#/">На дашборд</a></div>'
    );
  }
})();
