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

/* --- обновление precache-списка в sw.js --- */
const swPath = path.join(root, 'sw.js');
if (fs.existsSync(swPath)) {
  const walk = (dir) => {
    let acc = [];
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      if (fs.statSync(full).isDirectory()) acc = acc.concat(walk(full));
      else if (name.endsWith('.js')) acc.push('./' + path.relative(root, full).split(path.sep).join('/'));
    }
    return acc;
  };
  const urls = ['./', './index.html', './styles.css', './manifest.webmanifest',
    './icon-180.png', './icon-192.png', './icon-512.png']
    .concat(walk(path.join(root, 'src')))
    .concat(files.map((f) => './content/' + f));
  ['vendor/sql-wasm.js', 'vendor/sql-wasm.wasm', 'public/go/index.html', 'public/git/index.html']
    .forEach((p) => { if (fs.existsSync(path.join(root, p))) urls.push('./' + p); });

  let sw = fs.readFileSync(swPath, 'utf8');
  const sStart = '/* PRECACHE:START */';
  const sEnd = '/* PRECACHE:END */';
  const swrx = new RegExp(sStart.replace(/[*/]/g, '\\$&') + '[\\s\\S]*?' + sEnd.replace(/[*/]/g, '\\$&'));
  if (swrx.test(sw)) {
    sw = sw.replace(swrx, sStart + '\nconst PRECACHE = ' + JSON.stringify(urls, null, 2) + ';\n' + sEnd);
    fs.writeFileSync(swPath, sw);
    console.log('sw.js: precache-список обновлён (' + urls.length + ' файлов).');
  } else {
    console.warn('sw.js: маркеры PRECACHE не найдены — список не обновлён.');
  }
}

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
