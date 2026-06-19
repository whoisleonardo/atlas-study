# estudos-api

Backend for the Atlas study app (topics, items, goals, weighted progress, courses with
investment tracking, and CSV import). Spring Boot 3 · Java 21 · JPA.

Part of the [Atlas monorepo](../README.md).

## Run (quick mode, in-memory H2)

```bash
mvn spring-boot:run
```

Serves at `http://localhost:8080`.

## Run with PostgreSQL

```bash
docker compose up -d            # from the repo root
mvn spring-boot:run -Dspring-boot.run.profiles=postgres
```

Credentials for the `postgres` profile are read from the `DB_URL`, `DB_USERNAME`, and
`DB_PASSWORD` environment variables (local defaults are provided).

## Structure

- `domain/` — entities (`Topico`, `Item`, `Curso`) and enums (`ItemTipo`, `Status`,
  `CursoStatus`, `Pagamento`).
- `repository/` — Spring Data JPA.
- `service/` — business rules: `ProgressoService` (weighted percentage + investment per
  currency), `CsvImportService` (unified CSV import), `TopicoService`, `ItemService`,
  `CursoService`.
- `controller/` — REST under `/api`.
- `dto/` — input and output records (entities are never serialized directly).
- `exception/` — `GlobalExceptionHandler` (validation → 400, integrity → 409, generic → 500
  without leaking internals).

## Main endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET    | `/api/topicos`             | List topics with progress % and counts |
| GET    | `/api/topicos/{id}`        | Detail: progress, items, courses |
| POST   | `/api/topicos`             | Create a topic |
| PATCH  | `/api/topicos/{id}`        | Update a topic (e.g. color) |
| DELETE | `/api/topicos/{id}`        | Delete a topic (cascades to items/courses) |
| POST   | `/api/topicos/{id}/itens`  | Add an item |
| POST   | `/api/topicos/{id}/cursos` | Add a course |
| PATCH  | `/api/itens/{id}/status`   | Change item status (pending/doing/done) |
| PATCH  | `/api/itens/{id}`          | Update an item's planned date |
| DELETE | `/api/itens/{id}`          | Delete an item |
| PUT    | `/api/cursos/{id}`         | Update a course (status, progress, mesesAtivos…) |
| DELETE | `/api/cursos/{id}`         | Delete a course |
| POST   | `/api/import`              | Import the unified CSV (multipart `file`) |

Responses are camelCase (`dataPrevista`, `mesesAtivos`). Input DTOs also accept the app's
snake_case (`data_prevista`, `meses_ativos`) via `@JsonAlias`.

## Import `estudo.csv`

```bash
curl -F "file=@estudo.csv" http://localhost:8080/api/import
```

Response:

```json
{ "itensCriados": 24, "cursosCriados": 1, "topicos": ["Guitarra"] }
```

## How the CSV becomes data

The `tipo` column discriminates each row:
- `meta` / `teoria` / `pratica` → becomes an **Item** of the topic.
- `curso` → becomes a **Course** (the `onde` field is read as the platform).

The topic is created once (looked up by name, case-insensitive) and everything is attached to it.

## Progress calculation

- **Per topic / period:** sum of completed item `peso` ÷ sum of all `peso`. Since goals carry a
  higher weight, they count for more in the percentage.
- **Investment:** grouped by currency (BRL is never mixed with USD). One-off course = `valor`;
  subscription = `valor × mesesAtivos`. "Monthly active" sums the in-progress subscriptions.

## Security notes

This API is **single-tenant and unauthenticated** — designed for local/personal use. Hardening
already in place:

- CORS restricted to `localhost` origins (native apps send no `Origin` and are unaffected).
- H2 console disabled.
- Bean validation on create endpoints (`@Valid`); errors return 400 with the offending fields.
- The exception handler never leaks internal messages to clients.

Multi-user accounts would be the natural next step if this were ever exposed beyond localhost.
