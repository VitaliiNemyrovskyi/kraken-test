# Kraken Intake — Task 1 demo

Прийом SEO-задач з двох джерел: **Google Sheets** (OAuth 2.0 + polling) та **веб-форма**. Єдина SQLite-черга + status simulator, що демонструє pipeline `queued → scraping → generating → reviewing → publishing → published`. Для sheet-tasks статус автоматично пишеться назад у Sheet.

Це інтерактивна демонстрація intake-шару з [Task 1](../wiki/synthesis/task-1-answer.md) — щоб показати архітектурні рішення працюючими, не лише на папері.

---

## Стек

| Шар | Технологія |
|---|---|
| Runtime | Node.js 20+ |
| Language | TypeScript 5+ strict |
| HTTP | Fastify 4 |
| DB | SQLite (`better-sqlite3`) |
| Google API | `googleapis` v144 (OAuth 2.0) |
| Validation | `zod` |
| UI | Vanilla HTML/CSS/JS (без build step) |

---

## Як запустити

### 1. Встановити залежності

```bash
cd intake
npm install
```

### 2. (Опціонально) Налаштувати Google OAuth

Якщо хочете живий Sheets pull, створіть OAuth Client ID:

1. **GCP Console → APIs & Services → Credentials** → Create Credentials → OAuth client ID
2. Application type: **Web application**
3. Authorized redirect URIs: `http://localhost:3001/auth/google/callback`
4. Скопіюйте Client ID + Secret
5. Увімкніть **Google Sheets API** у Library

Створіть `.env`:
```bash
cp .env.example .env
# відредагуйте:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

> Без credentials Web-форма все одно працюватиме — лише Sheet-секція буде вимкнена.

### 3. Запустити

```bash
npm run dev
# http://localhost:3001
```

---

## Структура Google Sheet

Перший рядок — headers (порядок важливий, а ось sheet name/range — конфігурується):

| id | keyword | geo | language | brand | content_type | status | output_url |
|---|---|---|---|---|---|---|---|
| t-001 | best online casino netherlands | nl | nl | StarCasino | review | queued |  |
| t-002 | starcasino bonus 2026 | nl | nl | StarCasino | guide | queued |  |

- `id` — стабільний унікальний ідентифікатор рядка (LLM/людина задає при створенні)
- `status` — `queued` для нових; `published`/`failed` — кінцеві
- `output_url` — заповнюється intake-сервісом при `published`

Sheet ID береться з URL: `https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit`.

---

## Demo flow

### Варіант A — повний (з реальним Google Sheet)

1. Запустіть сервер: `npm run dev` → відкрийте http://localhost:3001
2. Натисніть **"Підключити Google акаунт"** → проходьте OAuth consent
3. Вставте Sheet ID, натисніть **"Зберегти Sheet"**
4. Створіть тестовий рядок у Sheet (status=`queued`) → почекайте до 60 сек або натисніть **"Sync зараз"**
5. У таблиці черги з'явиться задача з джерелом `sheet` 🟢
6. Натисніть **→ next** — задача рухається по pipeline, на `published` отримує fake output URL
7. Перевірте Google Sheet — колонки `status` і `output_url` оновились

### Варіант B — без Google (тільки веб-форма)

1. `npm run dev`
2. Заповніть форму "Веб-форма" → **Створити задачу**
3. У таблиці з'явиться задача з джерелом `web` 🔵
4. **→ next** проводить її через всі статуси до `published`

---

## API endpoints

| Method | Path | Опис |
|---|---|---|
| GET | `/` | Web UI |
| GET | `/api/status` | OAuth/sheet config status |
| GET | `/auth/google` | Start OAuth flow |
| GET | `/auth/google/callback` | OAuth callback |
| POST | `/auth/logout` | Clear stored tokens |
| POST | `/api/sheets/config` | Save sheet_id + range |
| POST | `/api/sheets/sync` | Manual poll trigger |
| GET | `/api/tasks` | List all tasks |
| POST | `/api/tasks` | Create task from web |
| POST | `/api/tasks/:id/advance` | Advance status by 1 step |
| POST | `/api/tasks/:id/fail` | Mark as failed |

Polling worker крутиться у фоні (`POLL_INTERVAL_SECONDS=60` за замовчуванням). Якщо OAuth/sheet не налаштовано — поллер тихо чекає.

---

## Архітектурні рішення

| Рішення | Чому |
|---|---|
| **OAuth 2.0, не Service Account** | Production-like UX: user явно авторизує доступ; refresh token у БД переживає рестарт |
| **SQLite + UNIQUE(source, sheet_row_id)** | Idempotency: повторний poll не дублює задачі |
| **Polling, не webhook** | Простіше за Apps Script webhook + ngrok для demo. В production: Apps Script `onEdit` → push до webhook endpoint (concept page `concepts/google-sheets-intake.md`) |
| **Status simulator (manual advance)** | Demo intake-шару не вимагає реального SERP/LLM пайплайну; reviewer бачить state-машину явно |
| **Sheet writeback тільки при `source='sheet'`** | Не пишемо в Sheet задачі, які прийшли через веб-форму |
| **TypeScript strict + zod runtime validation** | Both compile-time + runtime safety на API boundary |

---

## Дизайн-нотатки (Karpathy principles applied)

Цей сервіс дотримується [karpathy-coder](../CLAUDE.md#karpathy-coder-principles-for-prototype) принципів:

- **Simplicity First** — 1 база (SQLite), 1 сервер (Fastify), без frontend build step
- **Surgical Changes** — кожен файл має одну відповідальність (`oauth.ts`, `poller.ts`, `simulator.ts`)
- **Goal-Driven Execution** — успіх = demo flow A і B пройшли руками (див. "Demo flow")

Що **навмисно НЕ зроблено** (не входить у скоуп intake-шару):
- Реальний SERP/scraping/LLM pipeline — це Phase 2 системи з Task 1
- Multi-user — single-user demo (`oauth_tokens` має `CHECK(id=1)`)
- Webhook receiver — polling достатньо для demo
- Tests — manual smoke test покриває критичні шляхи (див. README); unit tests — наступний крок

---

## Файлова структура

```
intake/
├── package.json, tsconfig.json, .env.example
├── data/                              # SQLite файли (gitignored)
└── src/
    ├── index.ts                       # Fastify entry + start poller
    ├── config.ts                      # env loader (zod)
    ├── types.ts                       # Task, TaskStatus, OAuthTokens
    ├── storage/
    │   ├── schema.sql                 # tasks, oauth_tokens, sheet_config
    │   └── db.ts                      # taskRepo, oauthRepo, sheetConfigRepo
    ├── sheets/
    │   ├── oauth.ts                   # getAuthUrl, exchangeCodeForTokens, getAuthedClient
    │   ├── client.ts                  # readSheetRows, writeStatusBack
    │   └── poller.ts                  # pollOnce, startPoller (60s interval)
    ├── status/
    │   └── simulator.ts               # advanceTask, failTask, syncBackToSheet
    └── web/
        ├── routes.ts                  # всі Fastify routes
        └── public/
            ├── index.html             # форма + таблиця
            ├── app.js                 # fetch + render
            └── styles.css             # dark theme
```

---

## Звідси далі

- **Real SERP/LLM pipeline:** [[../wiki/concepts/content-generation-pipeline]] (Phase 2 системи)
- **Production-grade intake:** [[../wiki/concepts/google-sheets-intake]] (Apps Script webhook замість polling)
- **Як це взаємодіє з рештою архітектури:** [[../wiki/synthesis/architecture-overview]]
