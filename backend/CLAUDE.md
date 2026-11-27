# Backend — FastAPI (`mps-aj-social-insights-api`)

Read the root `CLAUDE.md` first. This file adds backend-specific rules.

## Stack
- Python 3.13, managed with **uv** (`uv sync`, `uv run …`, `uv add …`)
- **FastAPI**, **Pydantic v2**, **pydantic-settings**
- **SQLAlchemy 2.x (async)** + **asyncpg**, **Alembic** for migrations
- **Typer** for CLI jobs (seed, ingest, tag, analyze)
- **Anthropic Python SDK** behind the `LLMClient` interface
- Quality: **ruff** (lint + format), **mypy --strict**, **pytest** + **pytest-asyncio** + **httpx**

## Folder structure

```
backend/
├── CLAUDE.md
├── pyproject.toml            # deps + ruff/mypy/pytest config
├── uv.lock
├── Dockerfile
├── alembic.ini
├── alembic/
│   ├── env.py
│   └── versions/
├── app/
│   ├── main.py               # create_app(): app factory, routers, exception handlers
│   ├── cli.py                # Typer: seed | ingest | tag | analyze
│   ├── api/
│   │   ├── router.py         # mounts every module router under /api/v1
│   │   └── deps.py           # shared Depends aliases: SessionDep, SettingsDep
│   ├── core/
│   │   ├── config.py         # Settings (pydantic-settings), get_settings()
│   │   ├── database.py       # async engine, session factory, Base + naming convention
│   │   ├── exceptions.py     # AppError hierarchy + FastAPI handlers
│   │   └── logging.py        # structured logging setup
│   ├── shared/
│   │   ├── models.py         # mixins: UUIDPrimaryKey, Timestamps
│   │   ├── repository.py     # generic BaseRepository[ModelT]
│   │   ├── schemas.py        # BaseSchema, Page[T], PaginationParams
│   │   └── enums.py          # Platform, MediaType, Language, StoryType, HookStyle…
│   ├── integrations/
│   │   └── llm/
│   │       ├── base.py       # LLMClient Protocol
│   │       └── anthropic.py  # AnthropicLLMClient
│   ├── modules/
│   │   ├── accounts/         # our + competitor social accounts
│   │   ├── posts/            # posts + metric snapshots
│   │   ├── tagging/          # AI labels per post (+ prompts.py)
│   │   ├── analytics/        # metrics.py (pure formulas), patterns, comparisons
│   │   ├── recommendations/  # evidence-backed suggestions (+ prompts.py)
│   │   └── ingestion/
│   │       ├── sources/
│   │       │   ├── base.py   # DataSource Protocol
│   │       │   ├── seed.py   # SeedDataSource (POC)
│   │       │   └── meta.py   # MetaDataSource (later)
│   │       └── service.py    # pulls from a DataSource, upserts via other modules' services
│   └── seed/
│       ├── generator.py      # deterministic sample data (fixed random seed)
│       ├── answer_key.py     # planted patterns, as typed constants
│       └── captions.py       # caption templates per topic/style/language
└── tests/
    ├── conftest.py           # app, db session, async client fixtures
    ├── factories.py          # test data builders
    ├── unit/                 # pure logic: metrics, services with fakes
    └── integration/          # API + DB, incl. test_answer_key.py
```

### Standard module layout
Every module in `app/modules/` uses the same files (omit the ones it does not need):

```
<module>/
├── models.py       # SQLAlchemy ORM models
├── schemas.py      # Pydantic: <X>Create, <X>Update, <X>Read, filters
├── repository.py   # DB access only (extends BaseRepository)
├── service.py      # business logic
├── router.py       # HTTP endpoints only
└── prompts.py      # only in modules that call the LLM
```

## Layer rules (strict)

| Layer      | Does                                        | Must not                                   |
|------------|---------------------------------------------|--------------------------------------------|
| router     | Parse request, call service, return schema  | Contain business logic or touch the DB     |
| service    | Business logic, orchestration, transactions | Import FastAPI, raise `HTTPException`      |
| repository | Queries via the session                     | Contain business rules or commit           |
| models     | Table definitions                           | Contain logic beyond simple properties     |

- **Modules talk to each other through services only.** Never import another module's
  repository or models into your service to query them directly.
- Services raise domain errors from `core/exceptions.py` (`NotFoundError`, `ValidationError`,
  `ConflictError`, `ExternalServiceError`). The handlers in `main.py` map them to HTTP codes.
- The **service owns the transaction** (`commit`). Repositories only `add`/`flush`/query.
- Pure calculations (formulas, stats) live in plain functions with no DB or I/O —
  e.g. `analytics/metrics.py` — so they are trivial to unit test.

## Shared building blocks (use these, don't re-invent)

```python
# app/shared/repository.py
class BaseRepository(Generic[ModelT]):
    model: type[ModelT]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id: UUID) -> ModelT | None: ...
    async def get_or_raise(self, id: UUID) -> ModelT: ...  # raises NotFoundError
    async def list(self, *, offset: int, limit: int) -> Sequence[ModelT]: ...
    async def add(self, obj: ModelT) -> ModelT: ...  # add + flush
```

```python
# app/api/deps.py
SessionDep = Annotated[AsyncSession, Depends(get_session)]
SettingsDep = Annotated[Settings, Depends(get_settings)]
```

```python
# A router stays this thin
@router.get("/{post_id}", response_model=PostRead)
async def get_post(post_id: UUID, service: PostServiceDep) -> PostRead:
    return await service.get_post(post_id)
```

## API conventions
- All routes under `/api/v1`. Resources are plural nouns: `/posts`, `/accounts`,
  `/analytics/patterns`, `/recommendations`.
- Every endpoint declares `response_model`, a `summary`, and `tags`.
- Lists are paginated with `PaginationParams` and return `Page[T]`.
- Filters are query params validated by a Pydantic filter schema.
- Never return ORM objects directly; always a `<X>Read` schema (`from_attributes=True`).
- Error body shape is always `{"error": {"code": str, "message": str, "details": any}}`.

## Database conventions
- Tables: snake_case, plural (`posts`, `metric_snapshots`, `post_tags`).
- Primary keys: UUID (`gen_random_uuid()`), via the `UUIDPrimaryKey` mixin.
- `created_at` / `updated_at` via the `Timestamps` mixin; always timezone-aware UTC.
- Constraint naming convention is set on `Base.metadata` — do not name constraints by hand.
- Enums are stored as strings (native PG enums make migrations painful).
- Natural uniqueness is enforced in the DB, e.g. `posts(platform, external_id)`,
  `metric_snapshots(post_id, hours_since_post)`.
- Own-only metrics (`clicks`, `reach`, `saves`) are nullable and must be NULL for competitors.
- Migrations: `make migration m="…"`, then **read and fix** the generated file before
  committing. Never edit a migration that may already be applied.

## Core data model (POC)

| Table              | Key columns                                                            |
|--------------------|------------------------------------------------------------------------|
| `accounts`         | platform, handle, display_name, is_own, followers_count                |
| `posts`            | account_id, platform, external_id, media_type, caption, language, posted_at, url |
| `metric_snapshots` | post_id, hours_since_post, likes, comments, shares, views, saves*, reach*, clicks* |
| `post_tags`        | post_id, topic, region, story_type, hook_style, tone, prompt_version, model |
| `recommendations`  | title, suggestion, category (format/style/hook/timing/language), evidence (JSONB), status, source, prompt_version, model, created_at |

`*` own accounts only.

## External integrations

### Data sources
- `DataSource` is a `Protocol` with `fetch_accounts()` and `fetch_posts(since)`.
- `DATA_SOURCE=seed|meta` in settings picks the implementation in one factory function.
- Ingestion code depends on the Protocol, never on a concrete source.

### LLM
- All LLM calls go through `LLMClient` (`integrations/llm/`). No module imports the
  Anthropic SDK directly.
- Model name comes from settings (`LLM_MODEL`), never hard-coded.
- Ask for structured output and **validate it with a Pydantic schema**. Invalid output is
  retried once, then logged and skipped — never stored unvalidated.
- Every prompt has a `PROMPT_VERSION` constant. Store `prompt_version` and `model` with
  every tag/recommendation so results are traceable.
- Tests use a `FakeLLMClient`; tests never call the real API.

## Seed data
- `generator.py` is **deterministic** (fixed `random.Random(SEED)`): same input → same data.
- Engagement is skewed like real social media (log-normal), scaled by follower count, and
  grows over time (most engagement within 24h).
- Planted patterns are defined once in `answer_key.py` and used by both the generator and
  `tests/integration/test_answer_key.py`, which asserts the analytics module finds each one.
  If you change analytics, this test must still pass.

## Code style
- `ruff format` + `ruff check` (config in `pyproject.toml`). No manual formatting debates.
- Type hints on every function, including return types. `mypy --strict` must pass.
- `async` all the way for I/O. No sync DB calls, no `time.sleep`, no blocking HTTP clients.
- Use `logging.getLogger(__name__)`; never `print`. Log IDs and counts, not full captions.
- Docstrings on public service methods: one line on what, plus anything non-obvious.
- Settings are read only via `get_settings()`; never `os.environ` elsewhere.

## Testing
- **Unit** (`tests/unit/`): pure functions and services with fake repositories/clients.
- **Integration** (`tests/integration/`): real Postgres test DB (from docker compose),
  each test in a transaction that is rolled back.
- Build test data with `tests/factories.py`, not hand-written dicts repeated across tests.
- Name tests by behaviour: `test_lift_is_relative_to_account_median`.
- Every bug fix starts with a failing test.

## Commands (from repo root)
`make dev-api` · `make migrate` · `make migration m="…"` · `make seed` · `make tag` ·
`make analyze` · `make lint` · `make typecheck` · `make test`
