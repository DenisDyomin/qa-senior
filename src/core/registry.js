/* Реестр контента. Контент-файлы вызывают QA.defineModule / defineTopic / defineTask / defineQuestion. */
(function () {
  const QA = (window.QA = window.QA || {});
  QA.data = { modules: [], topics: [], tasks: [], questions: [], glossary: [] };

  function req(obj, fields, kind) {
    for (const f of fields) {
      if (obj[f] === undefined || obj[f] === null || obj[f] === '') {
        throw new Error(`[content] ${kind} "${obj.id || '?'}": отсутствует поле "${f}"`);
      }
    }
  }

  QA.defineModule = function (m) {
    req(m, ['id', 'code', 'title', 'summary', 'priority'], 'module');
    QA.data.modules.push(m);
  };
  QA.defineTopic = function (t) {
    req(t, ['id', 'moduleId', 'title', 'level'], 'topic');
    QA.data.topics.push(t);
  };
  QA.defineTask = function (t) {
    req(t, ['id', 'moduleId', 'title', 'kind', 'statement'], 'task');
    QA.data.tasks.push(t);
  };
  QA.defineQuestion = function (q) {
    req(q, ['id', 'moduleId', 'question', 'answer'], 'question');
    QA.data.questions.push(q);
  };
  QA.defineGlossary = function (list) {
    list.forEach((g) => QA.data.glossary.push(g));
  };

  QA.get = {
    module: (id) => QA.data.modules.find((m) => m.id === id),
    topic: (id) => QA.data.topics.find((t) => t.id === id),
    task: (id) => QA.data.tasks.find((t) => t.id === id),
    topicsOf: (moduleId) => QA.data.topics.filter((t) => t.moduleId === moduleId),
    tasksOf: (moduleId) => QA.data.tasks.filter((t) => t.moduleId === moduleId),
    questionsOf: (moduleId) => QA.data.questions.filter((q) => q.moduleId === moduleId),
    tasksOfTopic: (topicId) => QA.data.tasks.filter((t) => t.topicId === topicId),
  };
})();
