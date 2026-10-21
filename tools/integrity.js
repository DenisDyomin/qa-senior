/* Проверка целостности контента: ссылки, дубли id, полнота задач. */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

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

const problems = [];
const P = (s) => problems.push(s);

// --- дубли id ---
function dups(arr, label) {
  const seen = new Map();
  for (const x of arr) {
    if (!x.id) { P(`${label}: запись без id: ${JSON.stringify(x).slice(0,80)}`); continue; }
    if (seen.has(x.id)) P(`${label}: дубль id "${x.id}"`);
    seen.set(x.id, x);
  }
}
dups(data.modules, 'module');
dups(data.topics, 'topic');
dups(data.tasks, 'task');
dups(data.questions, 'question');

const moduleIds = new Set(data.modules.map((m) => m.id));
const topicIds = new Set(data.topics.map((t) => t.id));

// --- ссылки moduleId ---
for (const t of data.topics) if (!moduleIds.has(t.moduleId)) P(`topic ${t.id}: неизвестный moduleId ${t.moduleId}`);
for (const t of data.tasks) if (!moduleIds.has(t.moduleId)) P(`task ${t.id}: неизвестный moduleId ${t.moduleId}`);
for (const q of data.questions) if (!moduleIds.has(q.moduleId)) P(`question ${q.id}: неизвестный moduleId ${q.moduleId}`);

// --- ссылки topicId ---
for (const t of data.tasks) if (t.topicId && !topicIds.has(t.topicId)) P(`task ${t.id}: неизвестный topicId ${t.topicId}`);
for (const q of data.questions) if (q.topicId && !topicIds.has(q.topicId)) P(`question ${q.id}: неизвестный topicId ${q.topicId}`);

// --- полнота задач ---
for (const t of data.tasks) {
  if (!t.solution && t.kind !== 'sql') P(`task ${t.id}: нет solution`);
  if (t.kind === 'sql' && !t.seed) P(`task ${t.id}: sql без seed`);
  if (t.kind === 'sql' && !t.solution) P(`task ${t.id}: sql без solution`);
  if ((t.kind === 'case' || t.kind === 'testcase' || t.kind === 'bugreport' || t.kind === 'security')
      && (!t.criteria || !t.criteria.length)) P(`task ${t.id}: кейс без criteria`);
  if (!t.statement) P(`task ${t.id}: нет statement`);
}

// --- вопросы ---
for (const q of data.questions) { if (!q.question) P(`question ${q.id}: пусто question`); if (!q.answer) P(`question ${q.id}: пусто answer`); }

// --- темы без модуля в каталоге / модули без тем ---
for (const m of data.modules) {
  const tn = data.topics.filter((t) => t.moduleId === m.id).length;
  if (tn === 0) P(`module ${m.id}: нет тем`);
}


console.log('=== ИТОГО ===');
console.log('модулей', data.modules.length, 'тем', data.topics.length, 'задач', data.tasks.length, 'вопросов', data.questions.length, 'терминов', data.glossary.length);
console.log('kinds:', JSON.stringify(data.tasks.reduce((a,t)=>{a[t.kind]=(a[t.kind]||0)+1;return a;},{})));
if (problems.length) { console.log('\n=== ПРОБЛЕМЫ (' + problems.length + ') ==='); problems.forEach((p) => console.log('- ' + p)); process.exit(1); }
else console.log('\nПроблем целостности не найдено.');
