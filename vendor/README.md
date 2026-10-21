# vendor

Сюда кладутся два файла sql.js (SQLite в WebAssembly):

    sql-wasm.js
    sql-wasm.wasm

Способ 1:
    npm pack sql.js && tar -xzf sql.js-*.tgz
    cp package/dist/sql-wasm.js package/dist/sql-wasm.wasm .

Способ 2:
    https://github.com/sql-js/sql.js/releases -> sqljs-wasm.zip

Без этих файлов приложение работает, но SQL-задачи не исполняются:
видны условие, схема, эталон и разбор, а вместо результата - подсказка.
