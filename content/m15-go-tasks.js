/* M15. Go для QA - задания (QA-ориентированные, на Go). */
(function () {
  const code = (o) => QA.defineTask(Object.assign({ moduleId: 'm15', kind: 'code' }, o));

  /* 1 */
  code({
    id: 'm15-p1', topicId: 'm15-t2', title: 'Табличный тест на валидацию',
    statement: `Есть функция валидации возраста пользователя:
\`\`\`go
// ValidateAge возвращает nil, если возраст допустим (0..150), иначе ошибку.
func ValidateAge(age int) error {
    if age < 0 {
        return errors.New("age must not be negative")
    }
    if age > 150 {
        return errors.New("age too large")
    }
    return nil
}
\`\`\`
Напишите **табличный тест** \`TestValidateAge\`, который покрывает классы эквивалентности
и граничные значения. Отметьте, какие случаи вы включили и почему.`,
    starter: `func TestValidateAge(t *testing.T) {
    // ваш табличный тест
}`,
    solution: `func TestValidateAge(t *testing.T) {
    tests := []struct {
        name    string
        age     int
        wantErr bool
    }{
        // валидный класс и его границы
        {"lower boundary 0", 0, false},
        {"typical valid", 30, false},
        {"upper boundary 150", 150, false},
        // невалидные — за нижней границей
        {"just below zero", -1, true},
        {"far negative", -100, true},
        // невалидные — за верхней границей
        {"just above max", 151, true},
        {"far too large", 10000, true},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := ValidateAge(tt.age)
            if tt.wantErr && err == nil {
                t.Errorf("ValidateAge(%d) = nil, want error", tt.age)
            }
            if !tt.wantErr && err != nil {
                t.Errorf("ValidateAge(%d) = %v, want nil", tt.age, err)
            }
        })
    }
}`,
    discussion: `**Что показывает senior:**
- **Границы, а не только середина**: 0 и 150 (валидные крайние) плюс −1 и 151 (первые невалидные
  по обе стороны) — классические boundary values (M2). Именно на границах прячутся off-by-one:
  если бы в коде было \`age > 149\`, тест на 150 поймал бы это.
- **Классы эквивалентности**: один типичный валидный (30), один «далеко невалидный» с каждой
  стороны.
- \`t.Run\` с именами — при падении видно, какой именно случай.
- Проверяется факт наличия/отсутствия ошибки, а не текст сообщения (текст хрупок; если важен
  конкретный тип — сравнивать через \`errors.Is\`).

**Типичная ошибка:** проверить только 30 и −5 — «работает», но off-by-one на границе 150
не пойман.`,
    criteria: [
      'Тест табличный (срез случаев + цикл), а не по функции на случай',
      'Покрыты граничные значения 0 и 150 (валидные крайние)',
      'Покрыты первые невалидные по обе стороны (-1 и 151)',
      'Есть типичный валидный и «далеко невалидный» случаи',
      'Используется t.Run с осмысленными именами',
      'Проверяется наличие/отсутствие ошибки корректно',
    ],
    mistake: `Middle пишет пару отдельных тестов на середину диапазона и не проверяет границы,
пропуская off-by-one — самый частый дефект таких проверок.`,
  });

  /* 2 */
  code({
    id: 'm15-p2', topicId: 'm15-t2', title: 'Найти дефекты в Go-тесте',
    statement: `Разработчик прислал тест. Найдите проблемы как ревьюер и предложите исправленную
версию.
\`\`\`go
func Divide(a, b int) (int, error) {
    if b == 0 {
        return 0, errors.New("division by zero")
    }
    return a / b, nil
}

func TestDivide(t *testing.T) {
    result, _ := Divide(10, 2)
    if result >= 0 {
        t.Log("ok")
    }

    Divide(1, 0) // проверяем деление на ноль
}
\`\`\``,
    starter: `// перечислите проблемы и напишите исправленный тест`,
    solution: `// Проблемы:
// 1. Ассерт "result >= 0" почти всегда истинен и не проверяет само значение (5).
//    Тест зелёный даже если Divide вернёт 999. Нужно точное ожидаемое число.
// 2. t.Log не проваливает тест — это просто вывод. Проверок фактически нет.
// 3. Ошибка (err) игнорируется через "_": деление на ноль "проверяется" вызовом
//    Divide(1,0), но результат и ошибка не проверяются вообще. Это не тест.
// 4. Нет проверки, что при b==0 возвращается именно ошибка.

func TestDivide(t *testing.T) {
    tests := []struct {
        name    string
        a, b    int
        want    int
        wantErr bool
    }{
        {"simple", 10, 2, 5, false},
        {"negative result", -10, 2, -5, false},
        {"truncation", 7, 2, 3, false}, // целочисленное деление
        {"division by zero", 1, 0, 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := Divide(tt.a, tt.b)
            if tt.wantErr {
                if err == nil {
                    t.Fatalf("Divide(%d,%d): want error, got nil", tt.a, tt.b)
                }
                return
            }
            if err != nil {
                t.Fatalf("Divide(%d,%d): unexpected error %v", tt.a, tt.b, err)
            }
            if got != tt.want {
                t.Errorf("Divide(%d,%d) = %d, want %d", tt.a, tt.b, got, tt.want)
            }
        })
    }
}`,
    discussion: `**Диагноз — ложное покрытие (перекликается с M13):** тест выглядит как проверка,
но не упадёт почти ни при каком баге.

Ключевые дефекты:
- **Слабый ассерт** \`result >= 0\` — истинен для множества неверных значений.
- **t.Log вместо t.Error/t.Fatal** — не проваливает тест.
- **Проглоченная ошибка** \`_\` и вызов \`Divide(1,0)\` без единой проверки — деление на ноль
  фактически не тестируется.

Исправление: точные ожидаемые значения, проверка ошибки через \`wantErr\`, отдельный кейс
на целочисленное усечение (7/2=3) — тонкий момент, который часто забывают.

Проверка senior: «упадёт ли этот тест, если внести баг в Divide?» Для исходного — нет, для
исправленного — да.`,
    criteria: [
      'Отмечен слабый ассерт result >= 0 (не проверяет значение)',
      'Отмечено, что t.Log не проваливает тест',
      'Отмечена проглоченная ошибка и отсутствие проверки деления на ноль',
      'Исправленный тест использует точные ожидаемые значения',
      'Проверяется возврат ошибки при b == 0',
      'Есть случай целочисленного усечения (7/2=3)',
    ],
    mistake: `Middle видит «тест есть, зелёный» и одобряет. Не распознаёт, что t.Log и слабый ассерт
не ловят ничего, а деление на ноль не проверяется вовсе.`,
  });

  /* 3 */
  code({
    id: 'm15-p3', topicId: 'm15-t3', title: 'Проверка REST API на net/http',
    statement: `Напишите функцию \`CheckUserAPI(baseURL string) error\`, которая проверяет endpoint
\`GET {baseURL}/users/1\`: ожидается статус 200 и JSON-тело с непустым полем \`"name"\`.
Функция возвращает ошибку с понятным описанием, если что-то не так. Используйте только стандартную
библиотеку.`,
    starter: `func CheckUserAPI(baseURL string) error {
    // ваш код
}`,
    solution: `func CheckUserAPI(baseURL string) error {
    client := &http.Client{Timeout: 5 * time.Second}

    resp, err := client.Get(baseURL + "/users/1")
    if err != nil {
        return fmt.Errorf("request failed: %w", err)
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("unexpected status: got %d, want 200", resp.StatusCode)
    }

    body, err := io.ReadAll(resp.Body)
    if err != nil {
        return fmt.Errorf("cannot read body: %w", err)
    }

    var user struct {
        Name string \`json:"name"\`
    }
    if err := json.Unmarshal(body, &user); err != nil {
        return fmt.Errorf("invalid JSON: %w (body: %s)", err, truncate(body))
    }
    if user.Name == "" {
        return fmt.Errorf("field \\"name\\" is empty or missing")
    }
    return nil
}

func truncate(b []byte) string {
    const max = 200
    if len(b) > max {
        return string(b[:max]) + "..."
    }
    return string(b)
}`,
    discussion: `**Что делает эту проверку хорошей (senior):**
- **Таймаут на клиенте** (\`http.Client{Timeout}\`): без него зависший сервер повесит тест
  навсегда — частая причина «висящих» прогонов.
- \`defer resp.Body.Close()\` — иначе утечка соединений (типовой дефект в Go-коде, который QA должен
  замечать и в ревью).
- **Понятные ошибки** через \`%w\` — при падении видно, что именно не так (статус? JSON? поле?),
  а не просто «тест упал».
- **Проверка по существу**: не только статус, но и структура тела и непустота поля — 200 с пустым
  \`name\` это тоже дефект.
- В сообщение об ошибке JSON включён обрезанный body — ускоряет разбор.

**Дальше для полноты** (упомянуть): негативные кейсы — несуществующий пользователь (404),
невалидный JSON, таймаут; их удобно проверять через httptest (см. m15-p5).`,
    criteria: [
      'Задан таймаут на HTTP-клиенте',
      'resp.Body.Close() через defer',
      'Проверяется статус-код с понятной ошибкой',
      'Тело декодируется и проверяется поле name на непустоту',
      'Ошибки оборачиваются через %w с контекстом',
      'Только стандартная библиотека',
    ],
    mistake: `Middle делает http.Get без таймаута и без Close, проверяет только статус и не смотрит
тело — пропуская 200 с пустым/битым телом и рискуя зависанием на молчащем сервере.`,
  });

  /* 4 */
  code({
    id: 'm15-p4', topicId: 'm15-t3', title: 'Тест HTTP-хендлера через httptest.NewRecorder',
    statement: `Есть обработчик:
\`\`\`go
func HealthHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodGet {
        w.WriteHeader(http.StatusMethodNotAllowed)
        return
    }
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    w.Write([]byte(\`{"status":"ok"}\`))
}
\`\`\`
Напишите тест, проверяющий его **без поднятия реального сервера** (через httptest.NewRecorder),
включая негативный кейс с неверным методом.`,
    starter: `func TestHealthHandler(t *testing.T) {
    // используйте httptest.NewRecorder и httptest.NewRequest
}`,
    solution: `func TestHealthHandler(t *testing.T) {
    t.Run("GET returns 200 and ok body", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodGet, "/health", nil)
        rec := httptest.NewRecorder()

        HealthHandler(rec, req)

        res := rec.Result()
        defer res.Body.Close()

        if res.StatusCode != http.StatusOK {
            t.Fatalf("status = %d, want 200", res.StatusCode)
        }
        if ct := res.Header.Get("Content-Type"); ct != "application/json" {
            t.Errorf("Content-Type = %q, want application/json", ct)
        }
        body, _ := io.ReadAll(res.Body)
        if strings.TrimSpace(string(body)) != \`{"status":"ok"}\` {
            t.Errorf("body = %s, want {\\"status\\":\\"ok\\"}", body)
        }
    })

    t.Run("POST returns 405", func(t *testing.T) {
        req := httptest.NewRequest(http.MethodPost, "/health", nil)
        rec := httptest.NewRecorder()

        HealthHandler(rec, req)

        if rec.Result().StatusCode != http.StatusMethodNotAllowed {
            t.Errorf("status = %d, want 405", rec.Result().StatusCode)
        }
    })
}`,
    discussion: `**Ключевая идея:** \`httptest.NewRecorder\` + прямой вызов хендлера тестируют HTTP-логику
**без сети** — быстро, детерминированно, без выбора свободного порта. Это правильный уровень
для проверки обработчиков (в отличие от e2e через реальный сервер).

Senior здесь:
- Проверяет **и позитив, и негатив** (405 на неверный метод) — а не только happy path.
- Проверяет не только статус, но и **Content-Type** и **тело** — контракт целиком.
- \`t.Run\` разделяет случаи.

**Разница инструментов:** NewRecorder — для *своего* хендлера; NewServer (m15-p5) — когда нужно
эмулировать *чужой* сервис для теста клиента.`,
    criteria: [
      'Используется httptest.NewRecorder и httptest.NewRequest, без реального сервера',
      'Хендлер вызывается напрямую',
      'Проверяются статус, Content-Type и тело ответа',
      'Есть негативный кейс (неверный метод → 405)',
      'Случаи разделены через t.Run',
    ],
    mistake: `Middle либо поднимает реальный сервер там, где достаточно NewRecorder, либо проверяет
только статус 200 на GET, забывая про Content-Type, тело и негативный кейс с методом.`,
  });

  /* 5 */
  code({
    id: 'm15-p5', topicId: 'm15-t3', title: 'Мок внешнего сервиса через httptest.NewServer',
    statement: `Функция \`FetchPrice(url string) (int, error)\` ходит в внешний сервис за ценой.
Нужно протестировать, что клиент **корректно обрабатывает ошибку сервиса** (например, 500)
и не падает. Напишите тест, который поднимает фейковый сервис через httptest.NewServer
и проверяет поведение клиента при 500 и при валидном 200.

Считайте, что \`FetchPrice\` при не-200 возвращает ошибку, при 200 — число из тела.`,
    starter: `func TestFetchPrice(t *testing.T) {
    // httptest.NewServer с управляемым ответом
}`,
    solution: `func TestFetchPrice(t *testing.T) {
    t.Run("valid 200 returns price", func(t *testing.T) {
        srv := httptest.NewServer(http.HandlerFunc(
            func(w http.ResponseWriter, r *http.Request) {
                w.WriteHeader(http.StatusOK)
                w.Write([]byte("42"))
            }))
        defer srv.Close()

        price, err := FetchPrice(srv.URL)
        if err != nil {
            t.Fatalf("unexpected error: %v", err)
        }
        if price != 42 {
            t.Errorf("price = %d, want 42", price)
        }
    })

    t.Run("server 500 returns error, no panic", func(t *testing.T) {
        srv := httptest.NewServer(http.HandlerFunc(
            func(w http.ResponseWriter, r *http.Request) {
                w.WriteHeader(http.StatusInternalServerError)
            }))
        defer srv.Close()

        _, err := FetchPrice(srv.URL)
        if err == nil {
            t.Fatal("want error on 500, got nil")
        }
    })

    t.Run("garbage body returns error", func(t *testing.T) {
        srv := httptest.NewServer(http.HandlerFunc(
            func(w http.ResponseWriter, r *http.Request) {
                w.Write([]byte("not-a-number"))
            }))
        defer srv.Close()

        if _, err := FetchPrice(srv.URL); err == nil {
            t.Error("want error on invalid body, got nil")
        }
    })
}`,
    discussion: `**Зачем httptest.NewServer:** он поднимает *настоящий* HTTP-сервер на localhost
со своим обработчиком и даёт \`srv.URL\`. Это позволяет **детерминированно сэмулировать поведение
внешнего сервиса** — ошибки, мусорное тело, (через time.Sleep) медленный ответ — чего нельзя
надёжно добиться от реального стороннего сервиса.

Что делает senior:
- Тестирует **не happy path**, а именно обработку отказов (500) и мусорного тела — там живут
  дефекты клиента (паника, проглоченная ошибка, зависание).
- \`defer srv.Close()\` — освобождает ресурсы.
- Не зависит от сети/внешнего сервиса → тест стабилен, не flaky.

**Развитие:** добавить кейс таймаута (обработчик со \`time.Sleep\` дольше клиентского таймаута) —
проверить, что клиент не виснет.`,
    criteria: [
      'Используется httptest.NewServer для эмуляции внешнего сервиса',
      'Проверяется happy path (200 → корректная цена)',
      'Проверяется обработка ошибки сервиса (500 → ошибка, без паники)',
      'Проверяется мусорное/невалидное тело',
      'defer srv.Close() для освобождения ресурсов',
      'Тест не зависит от реальной сети (не flaky)',
    ],
    mistake: `Middle тестирует FetchPrice против реального сервиса (flaky, зависит от сети)
и проверяет только успешный ответ, не эмулируя 500 и битое тело — где и прячутся дефекты клиента.`,
  });

  /* 6 */
  code({
    id: 'm15-p6', topicId: 'm15-t2', title: 'Поймать гонку данных (-race)',
    statement: `Код параллельно инкрементирует счётчик:
\`\`\`go
func CountParallel(n int) int {
    counter := 0
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            counter++ // общая переменная из многих горутин
        }()
    }
    wg.Wait()
    return counter
}
\`\`\`
Здесь дефект. Объясните его, покажите, как его обнаружить инструментом, и приведите корректную
версию.`,
    starter: `// объяснение + как обнаружить + исправление`,
    solution: `// Дефект: гонка данных (data race). counter++ не атомарен (чтение-инкремент-запись),
// и множество горутин делают это одновременно без синхронизации. Результат недетерминирован:
// CountParallel(1000) может вернуть меньше 1000. Это классический concurrency-баг (см. M4).

// Как обнаружить: детектор гонок Go.
//   go test -race
// Он поймает конкурентный доступ к counter и укажет строки. Без -race тест может "проходить"
// на удачном прогоне — гонки часто не воспроизводятся стабильно, поэтому -race обязателен
// для конкурентного кода.

// Исправление 1 — atomic:
func CountParallel(n int) int {
    var counter int64
    var wg sync.WaitGroup
    for i := 0; i < n; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            atomic.AddInt64(&counter, 1)
        }()
    }
    wg.Wait()
    return int(counter)
}

// Исправление 2 — mutex (когда защищаемого состояния больше):
//   var mu sync.Mutex
//   ... mu.Lock(); counter++; mu.Unlock()

// Тест, который стоит гонять с -race:
func TestCountParallel(t *testing.T) {
    if got := CountParallel(1000); got != 1000 {
        t.Errorf("got %d, want 1000", got)
    }
}`,
    discussion: `**Почему это важно для QA/SDET:**
- Гонки — **недетерминированные** дефекты: тест на равенство может случайно проходить, поэтому
  «зелёный» ничего не гарантирует. Инструмент \`-race\` — то, что реально их ловит.
- Senior знает, что для любого конкурентного кода прогон \`go test -race\` — не опция, а норма,
  и что «иногда падает, иногда нет» — это симптом гонки, а не флейки теста.
- Понимание atomic vs mutex: atomic для простого счётчика, mutex когда под защитой несколько
  связанных полей.

Связь с M4 (гонки, инварианты) и M11 (недетерминированные дефекты, которые ловятся не повторным
запуском, а инструментом/анализом).`,
    criteria: [
      'Верно определена гонка данных (counter++ не атомарен)',
      'Объяснена недетерминированность результата',
      'Указан go test -race как способ обнаружения',
      'Отмечено, что без -race тест может ложно проходить',
      'Приведено корректное исправление (atomic или mutex)',
      'Понимание, когда atomic, а когда mutex',
    ],
    mistake: `Middle «чинит» проблему повторным запуском теста или добавлением time.Sleep, не понимая
природы гонки, и не знает про -race — поэтому недетерминированный дефект остаётся в коде.`,
  });

  /* 7 */
  code({
    id: 'm15-p7', topicId: 'm15-t1', title: 'Генератор тестовых данных',
    statement: `Для нагрузочного/интеграционного теста нужен генератор: функция
\`GenerateUsers(n int) []User\`, возвращающая n пользователей с уникальными email и разнообразными,
в том числе **граничными**, данными (пустые/предельные значения), чтобы прогонять их через систему.
\`User\` = {ID int, Email string, Age int, Name string}.

Напишите генератор и объясните, чем он ценнее «просто n одинаковых записей».`,
    starter: `type User struct {
    ID    int
    Email string
    Age   int
    Name  string
}

func GenerateUsers(n int) []User {
    // ваш код
}`,
    solution: `func GenerateUsers(n int) []User {
    // Набор "интересных" значений, включая граничные и потенциально проблемные.
    names := []string{
        "Alice", "Иван", "O'Brien", "李雷",       // юникод, апостроф
        "", strings.Repeat("A", 256),             // пустое и очень длинное
        "Bobby<script>", "  trailing  ",          // потенциально опасное, пробелы
    }
    ages := []int{0, 1, 18, 65, 150} // границы допустимого диапазона

    users := make([]User, 0, n)
    for i := 0; i < n; i++ {
        users = append(users, User{
            ID:    i + 1,
            Email: fmt.Sprintf("user%d@example.com", i+1), // уникальность гарантирована
            Age:   ages[i%len(ages)],
            Name:  names[i%len(names)],
        })
    }
    return users
}`,
    discussion: `**Чем это ценнее «n одинаковых записей»:**
- **Разнообразие вскрывает дефекты**, которых не видно на однородных данных: юникод и апострофы
  (кодировки, экранирование, SQL), пустые и очень длинные строки (валидация, переполнение полей),
  потенциально опасные значения (\`<script>\`, пробелы по краям — XSS/тримминг).
- **Граничные возрасты** (0, 150) прогоняются через систему массово — то, что в ручном тесте
  проверяется точечно, здесь идёт потоком.
- **Уникальный email** через индекс — иначе тест упрётся в ограничение уникальности и «сломается»
  не по делу.

**Senior-мышление:** тестовые данные — это тоже тест-дизайн (M2). Генератор, встраивающий классы
эквивалентности и границы, находит больше, чем случайный шум или копипаста одной записи.
Для воспроизводимости при рандоме — фиксировать seed.

**Замечание по безопасности:** генерируем синтетические данные, реальные персональные данные
в тесты не тащим.`,
    criteria: [
      'Email уникален (через индекс), не ломает ограничение уникальности',
      'Данные разнообразны: юникод, апостроф, пустое, очень длинное',
      'Включены граничные возрасты (0, 150)',
      'Включены потенциально проблемные значения (script, пробелы)',
      'Объяснено, чем разнообразие ценнее однородных данных',
      'Упомянута воспроизводимость (seed) или синтетичность данных',
    ],
    mistake: `Middle генерирует n одинаковых или чисто случайных записей без границ и «злых» значений —
такие данные не находят дефектов валидации, кодировок и экранирования, ради которых генератор
и нужен.`,
  });

  /* 8 */
  code({
    id: 'm15-p8', topicId: 'm15-t3', title: 'Ретрай с таймаутом через context',
    statement: `Нужна функция \`FetchWithRetry(ctx context.Context, url string, attempts int) (string, error)\`:
делает GET, при ошибке повторяет до \`attempts\` раз, но **прекращает попытки, если истёк context**
(таймаут/отмена). Возвращает тело при успехе. Напишите её и опишите, как бы вы её тестировали.`,
    starter: `func FetchWithRetry(ctx context.Context, url string, attempts int) (string, error) {
    // ваш код
}`,
    solution: `func FetchWithRetry(ctx context.Context, url string, attempts int) (string, error) {
    var lastErr error
    for i := 0; i < attempts; i++ {
        // Прекращаем, если context отменён/истёк, не начиная новую попытку.
        if err := ctx.Err(); err != nil {
            return "", fmt.Errorf("context done after %d attempts: %w", i, err)
        }

        req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
        if err != nil {
            return "", err
        }
        resp, err := http.DefaultClient.Do(req)
        if err != nil {
            lastErr = err
            continue // сетевая ошибка — повторяем
        }
        body, readErr := io.ReadAll(resp.Body)
        resp.Body.Close()
        if readErr != nil {
            lastErr = readErr
            continue
        }
        if resp.StatusCode == http.StatusOK {
            return string(body), nil
        }
        lastErr = fmt.Errorf("status %d", resp.StatusCode)
        // здесь при желании — backoff: time.Sleep с учётом ctx
    }
    return "", fmt.Errorf("all %d attempts failed: %w", attempts, lastErr)
}`,
    discussion: `**Ключевые моменты (senior):**
- **context проверяется в цикле** и передаётся в запрос через \`http.NewRequestWithContext\` —
  так отмена/таймаут реально прерывают и текущий запрос, и цикл. Ретрай, игнорирующий context, —
  частый дефект: он «висит» до конца всех попыток даже после отмены.
- **Тело закрывается** на каждой итерации (иначе утечка).
- Ошибки различаются: сетевые/не-200 → повтор; ошибка формирования запроса → сразу выход.
- Последняя ошибка оборачивается — понятно, почему всё упало.

**Как тестировать (QA-мышление):**
- \`httptest.NewServer\`, отдающий 500 первые k раз и 200 потом → проверить, что ретрай доходит
  до успеха.
- Сервер, всегда отдающий 500 → проверить, что после \`attempts\` возвращается ошибка (не паника,
  не бесконечный цикл).
- \`context.WithTimeout\` с сервером, который \`time.Sleep\`-ит → проверить, что функция выходит
  по таймауту, а не крутит все попытки.
- \`context.WithCancel\` + отмена во время работы → корректный ранний выход.
- Всё это детерминированно и без флейки благодаря httptest.`,
    criteria: [
      'context проверяется в цикле и передаётся в запрос (NewRequestWithContext)',
      'Ретрай прекращается при истечении/отмене context',
      'Тело ответа закрывается на каждой итерации',
      'Различаются повторяемые и фатальные ошибки',
      'После исчерпания попыток — понятная ошибка, без паники/бесконечного цикла',
      'Описан тест таймаута/отмены и «k раз 500, потом 200» через httptest',
    ],
    mistake: `Middle пишет ретрай без context (висит после отмены), не закрывает тело и тестирует
только успех — не проверяя ни исчерпание попыток, ни выход по таймауту.`,
  });

  /* 9 */
  code({
    id: 'm15-p9', topicId: 'm15-t3', title: 'Ревью: проглоченные ошибки',
    statement: `Найдите проблемы обработки ошибок в коде и предложите исправление.
\`\`\`go
func SaveReport(path string, data []byte) {
    f, _ := os.Create(path)
    f.Write(data)
    f.Close()
}

func LoadConfig(path string) Config {
    b, _ := os.ReadFile(path)
    var c Config
    json.Unmarshal(b, &c)
    return c
}
\`\`\``,
    starter: `// перечислите проблемы и перепишите функции`,
    solution: `// Проблемы: ВСЕ ошибки проглочены через "_". Последствия:
// - os.Create упал (нет прав/каталога) -> f == nil -> f.Write паникует (nil pointer).
// - f.Write вернул ошибку (диск полон) -> данные записаны частично, никто не узнал.
// - os.ReadFile упал -> b == nil -> Unmarshal в пустую структуру -> "тихо" дефолтный Config.
// - json.Unmarshal упал (битый файл) -> возвращается пустой Config без сигнала.
// Это классический источник "тихих" дефектов: программа продолжает с неверными данными.

func SaveReport(path string, data []byte) (err error) {
    f, err := os.Create(path)
    if err != nil {
        return fmt.Errorf("create %s: %w", path, err)
    }
    // Close ровно один раз — в defer, но ошибку Close не теряем: для файла на ЗАПИСЬ
    // flush может упасть (диск полон), поэтому фиксируем её, если основной ошибки ещё нет.
    defer func() {
        if cerr := f.Close(); cerr != nil && err == nil {
            err = fmt.Errorf("close %s: %w", path, cerr)
        }
    }()

    if _, werr := f.Write(data); werr != nil {
        return fmt.Errorf("write %s: %w", path, werr)
    }
    return nil
}

func LoadConfig(path string) (Config, error) {
    var c Config
    b, err := os.ReadFile(path)
    if err != nil {
        return c, fmt.Errorf("read %s: %w", path, err)
    }
    if err := json.Unmarshal(b, &c); err != nil {
        return c, fmt.Errorf("parse %s: %w", path, err)
    }
    return c, nil
}`,
    discussion: `**Почему это важно именно QA:** в Go ошибки — значения, и проглоченный \`error\`
(\`_ =\` или отсутствие проверки) — целый класс дефектов, который не виден в happy path и всплывает
в проде: частичная запись, работа с дефолтными данными, паника на nil. Senior QA замечает это
и в ревью кода, и проектирует тесты на **отказные пути**.

Что делает senior:
- Возвращает ошибку наверх (\`error\` в сигнатуре), а не глотает.
- Оборачивает с контекстом (\`%w\`) — видно, где и что упало.
- Знает нюанс: **ошибку \`Close\` для файла на запись надо проверять** (буфер может не сброситься).
  Идиома — закрыть один раз в \`defer\` и через именованный возврат (\`err error\`) поднять ошибку
  \`Close\`, если основной ошибки нет; для файла на чтение достаточно простого \`defer f.Close()\`.

Тесты для этого: несуществующий путь/нет прав (Create/ReadFile падает), битый JSON (Unmarshal
падает), проверить, что возвращается ошибка, а не тихий дефолт.`,
    criteria: [
      'Отмечено, что все ошибки проглочены через _',
      'Названы последствия: паника на nil, частичная запись, тихий дефолтный Config',
      'Исправление возвращает error наверх',
      'Ошибки оборачиваются с контекстом (%w)',
      'Отмечена проверка ошибки Close при записи',
      'Описаны тесты на отказные пути (нет файла, битый JSON)',
    ],
    mistake: `Middle не видит проблемы — «код работает» на happy path. Проглоченные ошибки дают тихие
дефекты в проде, и middle не проектирует тесты на отказные пути.`,
  });

  /* 10 */
  code({
    id: 'm15-p10', topicId: 'm15-t2', title: 'Тест парсера с границами и фаззингом',
    statement: `Функция \`ParsePort(s string) (int, error)\` парсит строку в номер TCP-порта
(допустимо 1..65535). Напишите табличный тест с границами и негативными случаями, а также
короткий **fuzz-тест** (Go 1.18+), проверяющий, что функция никогда не паникует на произвольном
вводе.`,
    starter: `func TestParsePort(t *testing.T) {
    // табличный тест
}

func FuzzParsePort(f *testing.F) {
    // fuzz
}`,
    solution: `func TestParsePort(t *testing.T) {
    tests := []struct {
        name    string
        in      string
        want    int
        wantErr bool
    }{
        {"min valid", "1", 1, false},
        {"max valid", "65535", 65535, false},
        {"typical", "8080", 8080, false},
        {"zero not allowed", "0", 0, true},
        {"above max", "65536", 0, true},
        {"negative", "-1", 0, true},
        {"empty", "", 0, true},
        {"not a number", "abc", 0, true},
        {"trailing space", "80 ", 0, true},
        {"huge overflow", "99999999999999999999", 0, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            got, err := ParsePort(tt.in)
            if (err != nil) != tt.wantErr {
                t.Fatalf("ParsePort(%q) err = %v, wantErr %v", tt.in, err, tt.wantErr)
            }
            if !tt.wantErr && got != tt.want {
                t.Errorf("ParsePort(%q) = %d, want %d", tt.in, got, tt.want)
            }
        })
    }
}

func FuzzParsePort(f *testing.F) {
    // seed-примеры
    for _, s := range []string{"80", "0", "-1", "", "abc", "65535"} {
        f.Add(s)
    }
    f.Fuzz(func(t *testing.T, s string) {
        // Контракт: на любой ввод функция либо валидный порт+nil, либо ошибка,
        // но НИКОГДА не паникует и не возвращает порт вне диапазона.
        port, err := ParsePort(s)
        if err == nil {
            if port < 1 || port > 65535 {
                t.Errorf("ParsePort(%q) = %d, out of range with nil error", s, port)
            }
        }
    })
}`,
    discussion: `**Табличная часть — классический boundary/negative дизайн (M2):**
границы диапазона (1, 65535) и первые невалидные за ними (0, 65536), плюс негатив: пусто,
не число, пробел, переполнение int (\`99999999999999999999\`) — последнее часто роняет наивную
реализацию через \`strconv.Atoi\` без проверки диапазона.

**Fuzz-тест (\`go test -fuzz=FuzzParsePort\`):** проверяет **свойство/инвариант**, а не конкретный
ответ — «на любом вводе не паникует и не возвращает порт вне диапазона при nil-ошибке». Фаззинг
сам ищет вход, ломающий инвариант (спецсимволы, гигантские числа, кривой юникод), и добавляет
находки в корпус. Это senior-уровень: property-based мышление вместо перечисления примеров.

**Связь:** boundary values и классы эквивалентности (M2), «упадёт ли при реальном баге» (M16),
устойчивость к злому вводу (M9).`,
    criteria: [
      'Табличный тест покрывает границы 1 и 65535',
      'Покрыты первые невалидные за границами (0, 65536)',
      'Негативные: пусто, не число, пробел, переполнение',
      'Fuzz-тест использует f.Add (seed) и f.Fuzz',
      'Fuzz проверяет инвариант (не паникует, порт в диапазоне при nil err), а не точный ответ',
      'Понимание property-based подхода vs перечисление примеров',
    ],
    mistake: `Middle пишет несколько примеров без границ и переполнения и не знает про встроенный
фаззинг Go — а именно fuzz находит вход, ломающий инвариант, который не придумаешь вручную.`,
  });
})();
