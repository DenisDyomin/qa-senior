/* Единый источник правил валидации контента — используется и build.js, и integrity.js. */
module.exports = function validate(data) {
  const errors = [];
  const ids = new Map();
  const seeId = (kind, id) => {
    if (id == null) { errors.push(kind + ': запись без id'); return; }
    if (ids.has(id)) errors.push('дубликат id "' + id + '" (' + kind + ')');
    ids.set(id, kind);
  };
  const moduleIds = new Set(data.modules.map((m) => m.id));
  const topicIds = new Set(data.topics.map((t) => t.id));

  data.modules.forEach((m) => {
    seeId('module', m.id);
    if (!data.topics.some((t) => t.moduleId === m.id)) errors.push('модуль ' + m.id + ': нет тем');
  });

  data.topics.forEach((t) => {
    seeId('topic', t.id);
    if (!moduleIds.has(t.moduleId)) errors.push('тема ' + t.id + ': неизвестный moduleId ' + t.moduleId);
    ['asked', 'theory', 'answer', 'mistake', 'checklist'].forEach((f) => {
      if (!t[f]) errors.push('тема ' + t.id + ': не заполнено поле ' + f);
    });
  });

  data.tasks.forEach((t) => {
    seeId('task', t.id);
    if (!moduleIds.has(t.moduleId)) errors.push('задача ' + t.id + ': неизвестный moduleId ' + t.moduleId);
    if (t.topicId && !topicIds.has(t.topicId)) errors.push('задача ' + t.id + ': неизвестный topicId ' + t.topicId);
    if (!t.statement) errors.push('задача ' + t.id + ': нет условия (statement)');
    if (!t.solution) errors.push('задача ' + t.id + ': нет эталонного решения');
    if (t.kind === 'sql' && !t.seed) errors.push('задача ' + t.id + ': SQL-задача без seed');
    if (t.kind !== 'sql' && !(t.criteria && t.criteria.length)) {
      errors.push('задача ' + t.id + ': нет критериев самопроверки');
    }
  });

  data.questions.forEach((q) => {
    seeId('question', q.id);
    if (!moduleIds.has(q.moduleId)) errors.push('вопрос ' + q.id + ': неизвестный moduleId ' + q.moduleId);
    if (q.topicId && !topicIds.has(q.topicId)) errors.push('вопрос ' + q.id + ': неизвестный topicId ' + q.topicId);
    if (!q.question) errors.push('вопрос ' + q.id + ': пусто question');
    if (!q.answer) errors.push('вопрос ' + q.id + ': пусто answer');
  });

  return errors;
};
