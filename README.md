# Atlas — Study Tracker

A study tracker built as a small monorepo: an offline-first mobile/web app and a REST API.
Organize study **topics**, break them into **items** (goals, theory, practice) with weighted
progress, plan them on a **calendar**, track **courses** with cost per currency, and set
**reminders**.

| Part | Path | Stack |
|------|------|-------|
| App | [`estudos-app/`](estudos-app) | Expo SDK 56 · Expo Router · React Native 0.85 · TypeScript · expo-sqlite |
| API | [`estudos-api/`](estudos-api) | Spring Boot 3.3 · Java 21 · Spring Data JPA · H2 / PostgreSQL |

---

## Architecture

The app works **offline-first**. All data lives in a local SQLite database; the API is an
optional sync target.

```
┌──────────────────┐        sync (drain queue → pull)        ┌──────────────────┐
│   Expo app       │  ───────────────────────────────────▶  │   Spring Boot    │
│  (SQLite local)  │  ◀───────────────────────────────────  │   API (JPA)      │
└──────────────────┘                                         └──────────────────┘
```

- Every change is written to local SQLite first, then queued in a `pending_ops` table.
- `sync()` first **drains** the queue (POST/PATCH/DELETE) and then **pulls** the server state,
  so local edits reach the server before the pull overwrites them. The pull also reconciles
  deletions (synced rows missing from the server are removed locally).
- **Auth is local-only / single-user.** The login screen validates against an on-device
  credential (salted SHA-256 hash in `expo-secure-store`, with an AsyncStorage fallback on web).
  The API itself is single-tenant and has no authentication — it is meant for local/personal use.

---

## Running the API

Requires **JDK 21** and **Maven**.

Quick start (in-memory H2):

```bash
cd estudos-api
mvn spring-boot:run
```

Serves at `http://localhost:8080`.

With PostgreSQL:

```bash
docker compose up -d            # from the repo root
cd estudos-api
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

DB credentials for the `postgres` profile are read from `DB_URL`, `DB_USERNAME`, and
`DB_PASSWORD` (sensible local defaults are provided).

### Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/topicos`             | List topics with progress % and counts |
| GET    | `/api/topicos/{id}`        | Topic detail: progress, items, courses |
| POST   | `/api/topicos`             | Create a topic |
| PATCH  | `/api/topicos/{id}`        | Update a topic (e.g. color) |
| DELETE | `/api/topicos/{id}`        | Delete a topic (cascades to items/courses) |
| POST   | `/api/topicos/{id}/itens`  | Add an item |
| POST   | `/api/topicos/{id}/cursos` | Add a course |
| PATCH  | `/api/itens/{id}/status`   | Change item status (pending/doing/done) |
| PATCH  | `/api/itens/{id}`          | Update an item's planned date |
| DELETE | `/api/itens/{id}`          | Delete an item |
| PUT    | `/api/cursos/{id}`         | Update a course (status, progress, months…) |
| DELETE | `/api/cursos/{id}`         | Delete a course |
| POST   | `/api/import`              | Import the unified CSV (multipart `file`) |

Responses are camelCase (`dataPrevista`, `mesesAtivos`); request DTOs also accept the app's
snake_case (`data_prevista`, `meses_ativos`) via `@JsonAlias`.

### CSV import

The `tipo` column decides how a row is mapped:
`meta` / `teoria` / `pratica` → an **Item**; `curso` → a **Course** (its `onde` column is the
platform). The topic is created once per name (case-insensitive) and everything hangs off it.

```bash
curl -F "file=@estudo.csv" http://localhost:8080/api/import
```

---

## Running the app

Requires **Node.js** and the Expo CLI (via `npx`).

```bash
cd estudos-app
npm install
npx expo start          # press i / a for iOS / Android, or w for web
```

Point the app at the API by setting the base URL in the **You** tab (defaults to
`http://localhost:8080`).

> **Web note:** `expo-sqlite` runs on WebAssembly and needs `SharedArrayBuffer`, which requires
> cross-origin isolation. The dev server already sends the required COOP/COEP headers via
> `metro.config.js`.

### App structure

```
app/                     Expo Router screens
  (tabs)/                Topics, Calendar, Courses, Reminders, You
  auth/                  login + register (local)
  topico/[id].tsx        topic detail
  onboarding.tsx
src/
  components/            UI components (ProgressRing, TopicCard, ItemRow…)
  services/              db, repositories, api client, sync, notifications, csv
  logic/                 pure functions (progress, CSV parsing) — unit tested
  hooks/                 useUser (local auth), useLanguage (EN/PT)
  constants/             design tokens, i18n strings
```

### Progress model

- **Per topic / period:** sum of completed item weights ÷ sum of all weights. Goals carry a
  higher weight, so they count for more.
- **Investment:** grouped by currency (BRL is never summed with USD). One-off course = `valor`;
  subscription = `valor × mesesAtivos`. "Monthly active" sums in-progress subscriptions.

---

## Development

```bash
# App
cd estudos-app
npx tsc --noEmit        # type check
npx jest --no-coverage  # unit tests (progress + CSV parsing)

# API
cd estudos-api
mvn compile
```
