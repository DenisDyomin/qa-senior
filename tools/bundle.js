/* Сборка одного самодостаточного HTML-файла для iPad/офлайна. */
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, '..', 'qa-trainer-ipad.html');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const scriptSrcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const CDN = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.11.0/';
function readScript(rel) {
  let src = fs.readFileSync(path.join(root, rel), 'utf8');
  if (rel.includes('sqlrunner.js')) {
    src = src.replace("await loadScript('./vendor/sql-wasm.js')", `await loadScript('${CDN}sql-wasm.js')`);
    src = src.replace("locateFile: (f) => './vendor/' + f", `locateFile: (f) => '${CDN}' + f`);
  }
  if (rel.includes('practice.js')) {
    src = src.replace(
      /'<div class="verdict warn"><b>SQL-движок не подключён\.<\/b>[\s\S]*?разбор\.<\/div>';/,
      `'<div class="verdict warn"><b>SQL-движок не загрузился.</b> Для выполнения SQL-задач нужен интернет — ' +
        'движок SQLite подгружается один раз с CDN. Проверьте соединение и обновите страницу. ' +
        'Условие, схема, эталон и разбор доступны офлайн.</div>';`
    );
  }
  return src.replace(/<\/script/gi, '<\\/script');
}
const inlineScripts = scriptSrcs.map((s) => `<script>\n${readScript(s)}\n</script>`).join('\n');
const result = `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="QA senior">
<meta name="theme-color" content="#0f1115">
<title>QA: middle → senior</title>
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
${inlineScripts}
</body>
</html>
`;
fs.writeFileSync(out, result);
console.log('Собран один файл:', out, '| скриптов:', scriptSrcs.length, '| размер КБ:', Math.round(Buffer.byteLength(result) / 1024));
