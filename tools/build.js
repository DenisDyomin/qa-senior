/* Сборка: проверяет контент и обновляет список подключаемых файлов в index.html.
   Запуск: node tools/build.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const contentDir = path.join(root, 'content');
const indexPath = path.join(root, 'index.html');

const data = { modules: [], topics: [], tasks: [], questions: [], glossary: [] };
const sandbox = {
  QA: {
    defineModule: (m) => data.modules.push(m),
    defineTopic: (t) => data.topics.push(t),
    defineTask: (t) => data.tasks.push(t),
    defineQuestion: (q) => data.questions.push(q),
    defineGlossary: (l) => l.forEach((g) => data.glossary.push(g)),
  },
  console,
};
vm.createContext(sandbox);

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
for (const f of files) {
  try {
    vm.runInContext(fs.readFileSync(path.join(contentDir, f), 'utf8'), sandbox, { filename: f });
  } catch (e) {
    console.error('ОШИБКА в ' + f + ': ' + e.message);
    process.exit(1);
  }
}

/* --- проверки контента --- */
const errors = [];
const ids = new Map();
const seeId = (kind, id, file) => {
  if (ids.has(id)) errors.push('дубликат id "' + id + '" (' + kind + ')');
  ids.set(id, kind);
};
const moduleIds = new Set(data.modules.map((m) => m.id));
const topicIds = new Set(data.topics.map((t) => t.id));

data.modules.forEach((m) => seeId('module', m.id));
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
});

if (errors.length) {
  console.error('Проверка контента не пройдена:');
  errors.forEach((e) => console.error(' - ' + e));
  process.exit(1);
}

/* --- обновление index.html --- */
const tags = files.map((f) => '<script src="./content/' + f + '"></script>').join('\n');
let html = fs.readFileSync(indexPath, 'utf8');
const start = '<!-- CONTENT:START -->';
const end = '<!-- CONTENT:END -->';
const rx = new RegExp(start + '[\\s\\S]*?' + end);
if (!rx.test(html)) {
  console.error('В index.html не найдены маркеры CONTENT:START / CONTENT:END');
  process.exit(1);
}
html = html.replace(rx, start + '\n' + tags + '\n' + end);
fs.writeFileSync(indexPath, html);

const byModule = {};
data.topics.forEach((t) => ((byModule[t.moduleId] = byModule[t.moduleId] || { t: 0, q: 0 }).t++));
data.tasks.forEach((t) => ((byModule[t.moduleId] = byModule[t.moduleId] || { t: 0, q: 0 }).q++));

console.log('Файлов контента: ' + files.length);
console.log(
  'Модулей: ' + data.modules.length +
  ', тем: ' + data.topics.length +
  ', задач: ' + data.tasks.length +
  ', вопросов: ' + data.questions.length +
  ', терминов: ' + data.glossary.length
);
Object.keys(byModule).forEach((m) => console.log('  ' + m + ': тем ' + byModule[m].t + ', задач ' + byModule[m].q));
console.log('index.html обновлён. Проверка контента пройдена.');
