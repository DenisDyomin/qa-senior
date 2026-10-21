#!/usr/bin/env bash
# Локальный запуск тренажёра.
set -eu
PORT="${1:-8080}"
cd "$(dirname "$0")"
echo "Тренажёр: http://localhost:$PORT"
echo "Остановить: Ctrl+C"
python3 -m http.server "$PORT"
