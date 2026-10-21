/* Прогресс пользователя: localStorage + экспорт/импорт JSON. */
(function () {
  const QA = (window.QA = window.QA || {});
  const KEY = 'qa-senior-trainer:v1';
  const DAY = 86400000;
  const BOX_DAYS = { 1: 1, 2: 2, 3: 4, 4: 8, 5: 16 };

  const empty = () => ({
    topics: {}, tasks: {}, questions: {}, reviews: {}, exams: [],
    settings: { theme: 'dark' }, updatedAt: null,
  });

  let state = empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = Object.assign(empty(), JSON.parse(raw));
  } catch (e) {
    console.warn('Прогресс не прочитан:', e);
  }

  function save() {
    state.updatedAt = new Date().toISOString();
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Прогресс не сохранён:', e);
    }
    document.dispatchEvent(new CustomEvent('qa:progress'));
  }

  QA.store = {
    get state() { return state; },
    topicStatus: (id) => state.topics[id] || 'new',
    setTopicStatus(id, s) { state.topics[id] = s; save(); },
    taskStatus: (id) => state.tasks[id] || 'new',
    setTaskStatus(id, s) { state.tasks[id] = s; save(); },
    questionStatus: (id) => state.questions[id] || 'new',
    setQuestionStatus(id, s) { state.questions[id] = s; save(); },

    /* Интервальное повторение (система Лейтнера) */
    reviewQuestion(id, grade) {
      state.questions[id] = grade === 'ok' ? 'ok' : 'weak';
      const prev = state.reviews[id] || { box: 1 };
      let box = prev.box || 1;
      if (grade === 'ok') box = Math.min(5, box + 1);
      else if (grade === 'weak') box = Math.max(1, box);
      else box = 1;
      const days = BOX_DAYS[box] || 1;
      state.reviews[id] = { box: box, due: Date.now() + days * DAY, last: Date.now() };
      save();
    },
    dueReviewIds() {
      const now = Date.now();
      return Object.keys(state.reviews).filter((id) => state.reviews[id] && state.reviews[id].due <= now);
    },
    dueReviewQuestions() {
      const set = {};
      this.dueReviewIds().forEach((id) => (set[id] = true));
      return QA.data.questions.filter((q) => set[q.id]);
    },
    dueCount() { return this.dueReviewIds().length; },

    /* История экзаменов */
    recordExam(exam) {
      exam.date = new Date().toISOString();
      if (!Array.isArray(state.exams)) state.exams = [];
      state.exams.unshift(exam);
      if (state.exams.length > 50) state.exams.length = 50;
      save();
    },
    get exams() { return Array.isArray(state.exams) ? state.exams : []; },

    get theme() { return (state.settings && state.settings.theme) || 'dark'; },
    setTheme(t) { state.settings.theme = t; save(); },
    reset() { state = empty(); save(); },
    export() { return JSON.stringify(state, null, 2); },
    import(json) {
      const parsed = JSON.parse(json);
      if (!parsed || typeof parsed !== 'object') throw new Error('Некорректный файл прогресса');
      state = Object.assign(empty(), parsed);
      save();
    },
    stats(moduleId) {
      const topics = moduleId ? QA.get.topicsOf(moduleId) : QA.data.topics;
      const tasks = moduleId ? QA.get.tasksOf(moduleId) : QA.data.tasks;
      const known = topics.filter((t) => state.topics[t.id] === 'known').length;
      const learning = topics.filter((t) => state.topics[t.id] === 'learning').length;
      const solved = tasks.filter((t) => state.tasks[t.id] === 'solved').length;
      const total = topics.length + tasks.length;
      return {
        topics: topics.length, known, learning,
        tasks: tasks.length, solved,
        percent: total === 0 ? 0 : Math.round(((known + solved) / total) * 100),
      };
    },
  };
})();
