#!/usr/bin/env python3
"""Прогоняет все SQL-задачи через системный SQLite и проверяет,
что эталонное решение выполняется и возвращает непустой результат.

Использование:
    node tools/dump.js > /tmp/content.json
    python3 tools/check_sql.py [/tmp/content.json]
"""
import json
import sqlite3
import sys

path = sys.argv[1] if len(sys.argv) > 1 else '/tmp/content.json'
data = json.load(open(path, encoding='utf-8'))

problems = 0
checked = 0
for task in data['tasks']:
    if task.get('kind') != 'sql':
        continue
    checked += 1
    con = sqlite3.connect(':memory:')
    try:
        con.executescript(task['seed'])
        cur = con.execute(task['solution'])
        rows = cur.fetchall()
        cols = [c[0] for c in cur.description] if cur.description else []
        status = 'OK  '
        note = f"колонки={cols} строк={len(rows)}"
        if not rows:
            status = 'ПУСТО'
            note += '  <- эталон вернул ноль строк, проверьте данные'
            problems += 1
        print(f"{status} {task['id']:10s} {note}")
    except Exception as exc:                      # noqa: BLE001
        print(f"ОШИБКА {task['id']:10s} {exc}")
        problems += 1
    finally:
        con.close()

print(f"\nПроверено SQL-задач: {checked}, проблем: {problems}")
sys.exit(1 if problems else 0)
