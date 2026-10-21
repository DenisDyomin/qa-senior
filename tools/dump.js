/* Выгружает весь контент в JSON для проверок. Запуск: node tools/dump.js > /tmp/content.json */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const contentDir = path.join(root, 'content');

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
  const code = fs.readFileSync(path.join(contentDir, f), 'utf8');
  try {
    vm.runInContext(code, sandbox, { filename: f });
  } catch (e) {
    console.error('Ошибка в файле контента ' + f + ': ' + e.message);
    process.exit(1);
  }
}

process.stdout.write(JSON.stringify({ files, ...data }, null, 1));
