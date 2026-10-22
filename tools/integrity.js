/* Проверка целостности контента: ссылки, дубли id, полнота задач.
   Правила валидации — единый модуль content-rules.js (как в build.js). */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const validate = require('./content-rules');

const root = path.join(__dirname, '..');
const contentDir = path.join(root, 'content');

const data = { modules: [], topics: [], tasks: [], questions: [], glossary: [] };
const QA = {
  data,
  defineModule: (m) => data.modules.push(m),
  defineTopic: (t) => data.topics.push(t),
  defineTask: (t) => data.tasks.push(t),
  defineQuestion: (q) => data.questions.push(q),
  defineGlossary: (list) => list.forEach((g) => data.glossary.push(g)),
};
const sandbox = { QA, window: { QA }, console };
sandbox.window = sandbox;
vm.createContext(sandbox);

const files = fs.readdirSync(contentDir).filter((f) => f.endsWith('.js')).sort();
for (const f of files) {
  const src = fs.readFileSync(path.join(contentDir, f), 'utf8');
  try { vm.runInContext(src, sandbox, { filename: f }); }
  catch (e) { console.log('LOAD FAIL', f, e.message); }
}

const problems = validate(data);

console.log('=== ИТОГО ===');
console.log('модулей', data.modules.length, 'тем', data.topics.length, 'задач', data.tasks.length, 'вопросов', data.questions.length, 'терминов', data.glossary.length);
console.log('kinds:', JSON.stringify(data.tasks.reduce((a,t)=>{a[t.kind]=(a[t.kind]||0)+1;return a;},{})));
if (problems.length) { console.log('\n=== ПРОБЛЕМЫ (' + problems.length + ') ==='); problems.forEach((p) => console.log('- ' + p)); process.exit(1); }
else console.log('\nПроблем целостности не найдено.');
