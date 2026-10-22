# Расширение учебника Go (GoBurrow) — вширь и вглубь, фокус QA/SDET

Дата: 2026-10-22. Формат данных: `var TOPICS = [{ id, depth, title, theory(HTML, hl() для кода), tasks[] }]`.
Типы задач: `write` (regex-checks + hint), `choice` (options/correct/explanation).

## Сейчас
13 тем / 9 этапов / 27 задач.

## Цель
~30 тем / ~75+ задач. Каждая тема: 3-5 абзацев теории + пример (hl) + 3 задачи (микс write/choice).
Угол сохраняем: Go именно для тестировщика/SDET.

## Что углубляем в существующих темах
- 1.1 Типы/срезы/map/структуры: + strings/strconv/time для генерации данных; +1 задача.
- 1.2 Интерфейсы и ошибки: + errors.Is/As/Join, sentinel vs typed, кастомные ошибки; +1 задача.
- 1.3 Горутины и каналы: + select, буферизация, закрытие, deadlock; +1 задача.
- 1.4 Организация проекта: + go.mod/модули, internal/, build tags (unit vs integration).
- Этап 2 «из коробки»: разбить на 2.1 table-driven + t.Run подтесты, 2.2 TestMain/t.Cleanup/fixtures, 2.3 coverage/-race/флаги.
- Этап 3: 3.1 testify (assert/require/suite), 3.2 моки gomock/mockgen; 3.x Ginkgo остаётся.
- Этап 5 UI/E2E: расширить пример chromedp/rod.
- Этап 6 Архитектура: конфиг, DI, page objects, data builders.
- Этап 7 CI/CD: golangci-lint, go vet, кэш модулей, матрицы.

## Новые темы (вширь)
- 1.5 Дженерики (generics) для типобезопасных тестовых хелперов.
- 1.6 context.Context: таймауты и отмена в тестах и API-клиентах.
- 1.7 Синхронизация: Mutex/RWMutex/atomic/Once/WaitGroup/errgroup.
- 2.4 Бенчмарки (testing.B) и профилирование (pprof).
- 2.5 Фаззинг (go test -fuzz).
- 2.6 Golden files / snapshot-тесты.
- 3.4 httptest: сервер и ResponseRecorder.
- 4.2 Тестирование БД: database/sql, sqlmock.
- 4.3 Testcontainers-go: реальная БД/контейнер в тестах.
- 4.4 gRPC-тесты (bufconn).
- 4.5 Контрактное тестирование / JSON-схемы.

## Порядок (вертикально)
Сначала образец — 3 темы целиком, затем остальное по накатанной:
1. 1.5 Дженерики для тестовых хелперов (new)
2. 1.6 context.Context в тестах (new)
3. 2.1 Table-driven тесты и подтесты t.Run (new/углубление)

Проверка после каждой пачки: node --check встроенного JS + headless-рендер (кол-во тем/задач, первая тема).
