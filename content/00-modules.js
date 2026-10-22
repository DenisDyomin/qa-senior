/* Каталог модулей. Порядок здесь = порядок в боковом меню. */
QA.defineModule({ id: 'm1', code: 'M1', priority: 'P0', title: 'Тест-стратегия и риски',
  summary: 'Как перейти от «тестирую фичу» к «отвечаю за качество продукта»: стратегия, риск-ориентированный подход, приоритизация.' });

QA.defineModule({ id: 'm2', code: 'M2', priority: 'P0', title: 'Тест-дизайн senior-уровня',
  summary: 'Техники не списком, а как инструмент сокращения комбинаторики: классы, границы, pairwise, состояния, exploratory.' });

QA.defineModule({ id: 'm3', code: 'M3', priority: 'P1', title: 'Требования, документация, метрики',
  summary: 'Работа с требованиями до кода, тест-план vs стратегия, метрики качества и как ими не врать.' });

QA.defineModule({ id: 'm4', code: 'M4', priority: 'P0', title: 'Архитектура и тестируемость',
  summary: 'Микросервисы, очереди, кеши, идемпотентность, отказоустойчивость — и как это превращается в тест-кейсы.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm5', code: 'M5', priority: 'P0', title: 'API и интеграционное тестирование',
  summary: 'REST/GraphQL/gRPC, авторизация, контрактное тестирование, моки и виртуализация сервисов.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm6', code: 'M6', priority: 'P0', title: 'SQL и данные',
  summary: 'От JOIN до оконных функций, планов запросов и уровней изоляции. Задачи исполняются реальным движком SQLite.' });

QA.defineModule({ id: 'm7', code: 'M7', priority: 'P0', title: 'CI/CD и quality gates',
  summary: 'Пайплайн как продукт QA: стадии, гейты, тестовые данные, окружения, DORA-метрики.',
  intro: `
Git — рабочая основа CI/CD и повседневной работы QA. Команды можно отработать в
**[интерактивном тренажёре команд Git](public/git/index.html)** (открывается в новой вкладке):
92 ситуации от базовых команд до rebase, reflog, bisect и разрешения конфликтов, с фильтром по уровням.
`,
  tracks: ['sdet'] });

QA.defineModule({ id: 'm8', code: 'M8', priority: 'P0', title: 'Тестирование производительности',
  summary: 'Модель нагрузки из реальности, перцентили, SLO, поиск бутылочного горлышка, k6/JMeter/Gatling.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm9', code: 'M9', priority: 'P0', title: 'Тестирование безопасности',
  summary: 'Глубокий блок: OWASP Top 10 (2021 и 2025), API Security Top 10, WSTG/ASVS, инструменты, лаборатории, DevSecOps.' });

QA.defineModule({ id: 'm10', code: 'M10', priority: 'P1', title: 'Автоматизация: архитектура',
  summary: 'Фреймворк как система: слои, тестовые данные, flaky-тесты, стоимость владения, ROI.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm11', code: 'M11', priority: 'P1', title: 'Наблюдаемость и инциденты',
  summary: 'Логи, метрики, трейсы, алерты; тестирование на проде, постмортемы, RCA.' });

QA.defineModule({ id: 'm12', code: 'M12', priority: 'P2', title: 'Мобильное тестирование',
  summary: 'Фрагментация, прерывания, permissions, deep links, фермы устройств, adb и логи.' });

QA.defineModule({ id: 'm13', code: 'M13', priority: 'P2', title: 'AI в QA',
  summary: 'Генерация тестов и данных, self-healing локаторы, ревью AI-кода, риски ложного покрытия.' });

QA.defineModule({ id: 'm14', code: 'M14', priority: 'P1', title: 'Soft skills senior',
  summary: 'Влияние без полномочий, менторство, коммуникация рисков, найм, поведенческое интервью.' });

QA.defineModule({ id: 'm15', code: 'M15', priority: 'P2', title: 'Go для QA',
  summary: 'Отдельный трек: учебник по Go подключается как готовое приложение, здесь — QA-ориентированные задачи.',
  intro: `
Этот модуль — мост к отдельному проекту-учебнику по Go. Теорию языка с нуля до продвинутого уровня
даёт **[веб-учебник по Go](public/go/index.html)** (открывается в новой вкладке), а здесь собраны
**QA-ориентированные задачи на Go**: тесты, проверка API, обработка ошибок, конкурентность, фаззинг.

> **Как подключить учебник:** положите одностраничный HTML учебника в папку \`public/go/\`
> под именем \`index.html\` (по аналогии с \`vendor/\` для sql.js). Ссылка выше сразу заработает.
> Содержимое учебника этот тренажёр не дублирует и не переписывает — только ссылается на него.
`,
  tracks: ['sdet'] });

QA.defineModule({ id: 'm16', code: 'M16', priority: 'P1', title: 'Разработка для SDET',
  summary: 'Код, который переживёт вас: алгоритмы для лайвкодинга, SOLID на примере фреймворка, ревью, юнит-тесты тестов, мутационное покрытие.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm17', code: 'M17', priority: 'P1', title: 'Тестовая инфраструктура',
  summary: 'Docker, Compose, testcontainers, Selenoid, Kubernetes, эфемерные окружения, моки, генерация данных, отчётность как сервис.',
  tracks: ['sdet'] });

QA.defineModule({ id: 'm18', code: 'M18', priority: 'P1', title: 'Agile, Scrum и роль QA в процессе',
  summary: 'Agile-ценности, Scrum и Kanban, роль QA на церемониях, shift-left и shift-right, Definition of Done, оценка и работа с рисками в спринте.' });

QA.defineModule({ id: 'm19', code: 'M19', priority: 'P1', title: 'DevOps: культура, поток и доставка',
  summary: 'CALMS и поток ценности, SRE и error budget, модель ветвления, артефакты и реестры, непрерывная доставка, стратегии деплоя, конфиги и секреты, DevSecOps.',
  tracks: ['devops'] });

QA.defineModule({ id: 'm20', code: 'M20', priority: 'P1', title: 'DevOps: инфраструктура и эксплуатация',
  summary: 'Контейнеры и Kubernetes от основ до выката приложения, IaC на Terraform, Ansible, GitOps, мониторинг и трейсинг на практике, облако и платформенная инженерия.',
  tracks: ['devops'] });
