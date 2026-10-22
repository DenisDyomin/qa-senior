/* Сборка: проверяет контент и обновляет список подключаемых файлов в index.html.
   Запуск: node tools/build.js */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const validate = require('./content-rules');

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

/* --- проверки контента (единые правила content-rules.js) --- */
const errors = validate(data);
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
