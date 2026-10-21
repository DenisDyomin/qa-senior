# QA: middle → senior — веб-тренажёр

Многостраничное веб-приложение на русском: теория senior-уровня, банк вопросов с эталонными ответами,
практика с проверкой (SQL исполняется реальным движком SQLite в браузере), режим mock-интервью,
глоссарий RU/EN и поиск по всему контенту.

**Зависимостей нет.** Ни npm, ни сборщика, ни фреймворка — обычные файлы, которые открывает браузер.

---

## Запуск

```bash
./start.sh          # поднимет http://localhost:8080
```

или вручную:

```bash
python3 -m http.server 8080
```

Открыть <http://localhost:8080>.

Можно открыть `index.html` и напрямую двойным щелчком (роутинг хеш-основанный и работает через `file://`),
но SQL-раннер в этом режиме не заработает: браузер не грузит WebAssembly с `file://`.
Для полноценной работы используйте локальный сервер.

## Подключение SQL-движка (один раз)

Приложение использует [sql.js](https://github.com/sql-js/sql.js) — SQLite, скомпилированный в WebAssembly.
Два файла надо положить в папку `vendor/`:

```
vendor/sql-wasm.js
vendor/sql-wasm.wasm
```

Способ 1 — через npm:

```bash
npm pack sql.js
tar -xzf sql.js-*.tgz
cp package/dist/sql-wasm.js package/dist/sql-wasm.wasm vendor/
```

Способ 2 — скачать релиз вручную:
<https://github.com/sql-js/sql.js/releases> → архив `sqljs-wasm.zip` → взять оттуда `sql-wasm.js` и `sql-wasm.wasm`.

Пока файлов нет, приложение работает полностью, кроме исполнения SQL: на страницах SQL-задач видны
условие, схема, эталонное решение и разбор, а вместо результата выполнения — подсказка о том, что движок
не подключён.

---

## Структура

```
index.html            точка входа, подключает все скрипты
styles.css            оформление, тёмная и светлая тема
src/core/             движок приложения
  registry.js           реестр контента и валидация полей
  md.js                 markdown-рендерер
  store.js              прогресс в localStorage, экспорт/импорт
  router.js             хеш-роутер
  sqlrunner.js          обёртка над sql.js и сравнение результата с эталоном
  ui.js                 каркас интерфейса
src/pages/            страницы: дашборд, модуль, тема, практика, интервью, глоссарий, поиск
content/              весь учебный материал (обычные .js файлы)
tools/build.js        проверка контента + пересборка списка скриптов в index.html
tools/smoke.sh        дымовой тест: рендерит ключевые маршруты в headless-браузере
tools/dump.js         выгрузка контента в JSON (для внешних проверок)
```

## Добавление контента

Контент — это вызовы `QA.defineTopic`, `QA.defineTask`, `QA.defineQuestion` в файлах `content/*.js`.
Новый файл автоматически подхватывается после `node tools/build.js`.

Тема заполняется по единому шаблону:

```js
QA.defineTopic({
  id: 'm7-t1', moduleId: 'm7', level: 'S', title: 'Название',
  asked: ['Формулировка вопроса с собеседования'],
  theory: `markdown`,
  answer: `эталонный ответ senior — как отвечать вслух`,
  mistake: `типичная ошибка middle`,
  checklist: `чек-лист применения на своём проекте`,
  sources: `ссылки`,
});
```

SQL-задача проверяется исполнением: seed создаёт схему, решение пользователя сравнивается с эталоном.
Флаг `ordered: true` включает сравнение с учётом порядка строк.

```js
QA.defineTask({
  id: 'm6-q99', moduleId: 'm6', topicId: 'm6-t5', kind: 'sql',
  title: 'Название', statement: `условие`,
  seed: `CREATE TABLE ...; INSERT ...;`,
  schemaPreview: `описание схемы для панели «Схема и данные»`,
  solution: `SELECT ...`,
  discussion: `чем эталон лучше наивного решения`,
});
```

Задачи-кейсы (`kind: 'case' | 'security' | 'bugreport' | 'code'`) проверяются самооценкой
по списку `criteria` — зачёт от 70%.

## Проверки перед коммитом

```bash
node tools/build.js      # валидация контента и обновление index.html
bash tools/smoke.sh      # рендер ключевых маршрутов в headless Chrome
```

`tools/smoke.sh` принимает путь к браузеру первым аргументом, если Chrome лежит в нестандартном месте:

```bash
bash tools/smoke.sh "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
```

Дополнительно все SQL-решения можно прогнать через системный SQLite:

```bash
node tools/dump.js > /tmp/content.json
python3 tools/check_sql.py
```

## Прогресс

Хранится в `localStorage` браузера. На дашборде есть экспорт и импорт JSON — так прогресс переносится
между браузерами и машинами. Бэкенда нет.
