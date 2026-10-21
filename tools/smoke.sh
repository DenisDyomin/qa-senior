#!/usr/bin/env bash
# Дымовой тест: рендерит ключевые маршруты в headless-браузере и проверяет содержимое.
# Использование: tools/smoke.sh [путь_к_chrome]
set -u
CH="${1:-/opt/pw-browsers/chromium-1194/chrome-linux/chrome}"
PORT=8099
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -x "$CH" ]; then
  echo "Не найден браузер: $CH"; exit 1
fi

cd "$ROOT"
python3 -m http.server "$PORT" >/tmp/qa-smoke-srv.log 2>&1 &
SRV=$!
trap 'kill $SRV 2>/dev/null' EXIT
sleep 1

fail=0
check() {
  local route="$1"; shift
  local dom
  dom="$("$CH" --headless --no-sandbox --disable-gpu --virtual-time-budget=4000 \
        --dump-dom "http://localhost:$PORT/#$route" 2>/dev/null)"
  for needle in "$@"; do
    if ! grep -qF -- "$needle" <<<"$dom"; then
      echo "FAIL $route: не найдено «$needle»"; fail=1; return
    fi
  done
  if grep -qF 'Страница не найдена' <<<"$dom"; then
    echo "FAIL $route: маршрут не разрешился"; fail=1; return
  fi
  echo "OK   $route"
}

check "/"              "Карта компетенций" "Общий прогресс" "SQL и данные"
check "/module/m6"     "SQL и данные" "Темы" "Практика" "Банк вопросов"
check "/module/m9"     "Тестирование безопасности" "OWASP"
check "/topic/m6-t5"   "Оконные функции" "Эталонный ответ senior" "Типичная ошибка middle" "DENSE_RANK"
check "/topic/m9-t2"   "Нарушение контроля доступа" "IDOR" "Чек-лист"
check "/topic/m9-t1"   "Software Supply Chain Failures" "WSTG" "ASVS"
check "/task/m6-q4"    "Вторая по величине" "Выполнить и проверить" "Эталонное решение"
check "/task/m6-q12"   "Ревью медленного запроса" "Показать эталон"
check "/task/m9-p6"    "баг-репорт" "Показать эталон"
check "/module/m7"     "CI/CD" "Темы" "Практика"
check "/module/m8"     "производительности" "Темы"
check "/topic/m7-t4"   "Flaky" "карантин" "Эталонный ответ senior"
check "/topic/m8-t3"   "coordinated omission" "перцентил"
check "/task/m7-p2"    "GitHub Actions" "Показать эталон"
check "/task/m8-p3"    "узкое место" "Показать эталон"
check "/track/sdet"    "Трек SDET" "Модули трека"
check "/module/m1"     "Тест-стратегия" "Темы"
check "/module/m16"    "Разработка для SDET" "Темы"
check "/module/m17"    "Тестовая инфраструктура" "Темы"
check "/topic/m1-t2"   "Риск-ориентированное" "Эталонный ответ senior"
check "/topic/m16-t7"  "мутационное" "Mutation score"
check "/topic/m17-t3"  "Testcontainers" "testcontainers"
check "/task/m1-p1"    "перевод денег" "Показать эталон"
check "/task/m16-p1"   "скобочной последовательности" "Показать эталон"
check "/task/m17-p2"   "Compose" "Показать эталон"
check "/module/m2"     "Тест-дизайн" "Темы"
check "/module/m4"     "Архитектура" "Темы"
check "/module/m5"     "API" "Темы"
check "/topic/m2-t4"   "переходов" "Эталонный ответ senior"
check "/topic/m4-t5"   "гонки" "инвариант"
check "/topic/m5-t4"   "Идемпотентность" "Idempotency-Key"
check "/task/m2-p2"    "Матрица состояний" "Показать эталон"
check "/task/m4-p1"    "саги" "Показать эталон"
check "/task/m5-p1"    "эндпоинта" "Показать эталон"
check "/topic/m9-t15"  "WSTG" "Эталонный ответ senior"
check "/topic/m9-t20"  "OAuth" "PKCE"
check "/topic/m9-t22"  "инъек" "second-order"
check "/topic/m9-t26"  "smuggling" "Host"
check "/task/m9-p11"   "изоляц" "Показать эталон"
check "/task/m9-p13"   "инъекции по коду" "Показать эталон"
check "/topic/m9-t28"  "бизнес-логики" "гонк"
check "/topic/m9-t31"  "prompt injection" "LLM"
check "/topic/m9-t33"  "Burp" "PortSwigger"
check "/module/m3"     "Требования, документация, метрики" "Темы"
check "/module/m10"    "Автоматизация: архитектура" "Темы"
check "/module/m11"    "Наблюдаемость и инциденты" "Темы"
check "/module/m14"    "Soft skills senior" "Темы"
check "/topic/m3-t1"   "требованиями до кода" "Эталонный ответ senior"
check "/topic/m10-t1"  "Стратегия автоматизации" "Эталонный ответ senior"
check "/topic/m11-t1"  "столпа наблюдаемости" "Эталонный ответ senior"
check "/topic/m14-t1"  "Влияние без полномочий" "Эталонный ответ senior"
check "/task/m3-p1"    "Показать эталон"
check "/task/m10-p1"   "Показать эталон"
check "/task/m11-p1"   "наблюдаемости" "Показать эталон"
check "/task/m14-p1"   "рискован" "Показать эталон"
check "/module/m12"    "Мобильное тестирование" "Темы"
check "/module/m13"    "AI в QA" "Темы"
check "/module/m15"    "Go для QA" "учебник" "Темы"
check "/topic/m12-t2"  "жизненного цикла" "Эталонный ответ senior"
check "/topic/m13-t2"  "ложное покрытие" "Эталонный ответ senior"
check "/topic/m15-t2"  "Табличные тесты" "go test"
check "/task/m12-p3"   "deep link" "Показать эталон"
check "/task/m13-p1"   "AI-сгенерированных" "Показать эталон"
check "/task/m15-p6"   "гонк" "Показать эталон"
check "/task/m15-p1"   "Табличный тест" "Показать эталон"
check "/module/m18"    "Agile, Scrum и роль QA в процессе" "Темы"
check "/topic/m18-t2"  "Scrum" "события" "Эталонный ответ senior"
check "/topic/m18-t3"  "Definition of Done" "критериев приёмки"
check "/task/m18-p1"   "Definition of Done" "Показать эталон"
check "/task/m18-p2"   "узкое место" "Показать эталон"
check "/practice"      "Практика" "SQL" "Безопасность"
check "/interview"     "Mock-интервью" "Настройки сессии" "Начать"
check "/glossary"      "Глоссарий" "boundary value analysis" "coordinated omission"
check "/search"        "Поиск"

check "/track/devops"  "Трек DevOps" "Модули трека"
check "/module/m19"    "DevOps: культура" "Темы"
check "/module/m20"    "инфраструктура и эксплуатация" "Темы"

if [ $fail -eq 0 ]; then echo "Все маршруты отрендерились."; else echo "Есть ошибки."; fi
exit $fail
