# mps-aj-social-insights — Social Media Content Insights (Al Jazeera POC)

A tool that compares Al Jazeera's social media posts with competitors' posts, finds which
content gets the most engagement, and suggests what kinds of posts to make.

This is a **POC**. It runs on **seeded (sample) data** first. Real platform data (Meta APIs)
comes later through the same interfaces, without rewriting the rest of the system.

Subfolder rules live in `backend/CLAUDE.md` and `frontend/CLAUDE.md`. Read the one for
the area you are working in before making changes.

## Naming

The project follows the organization's repo naming pattern `mps-<product>-<name>`
(e.g. `mps-aj-lisan`, `mps-aj-grid`, `mps-rota-api`, `mps-rota-portal`).

| Thing                              | Name                                   |
|------------------------------------|----------------------------------------|
| Repository                         | `mps-aj-social-insights`               |
| Backend package (`pyproject.toml`) | `mps-aj-social-insights-api`           |
| Frontend package (`package.json`)  | `mps-aj-social-insights-portal`        |
| Docker Compose project             | `mps-aj-social-insights`               |
| Docker images                      | `mps-aj-social-insights-api`, `mps-aj-social-insights-portal` |
| Databases                          | `social_insights`, `social_insights_test` |
| App title shown in the UI          | `AJ Social Insights`                   |

Use these names everywhere. Do not invent other names for the project.

---

## Domain rules (always apply)

1. **Own vs competitor metrics.** Own accounts have full metrics (likes, comments, shares,
   views, saves, reach, clicks). Competitor accounts have **public metrics only** (likes,
   comments, shares, views). Never compute or display clicks/reach/saves for competitors.
   Any cross-account comparison uses public metrics only.
2. **Engagement score** = `(likes + comments + shares) / followers_at_post`.
   **Lift** = a post's engagement score ÷ the median engagement score of its own account.
   These formulas live in exactly one place: `backend/app/modules/analytics/metrics.py`.
3. **Compare at the same post age.** Metrics are stored as snapshots at fixed ages
   (24h, 72h). Comparisons default to the 72h snapshot. Never compare posts of different ages.
4. **Recommendations suggest *how* to tell stories** (format, style, hook, timing, language),
   never *which* news to cover. Every recommendation must carry its evidence (the numbers
   and sample size behind it). An editor always makes the final decision.
5. **Sample data must be visible as sample data.** When `DATA_SOURCE=seed`, the UI shows
   a "Sample data" banner on every page.
6. **Arabic and English.** Captions can be in either language. UI text that shows
   captions must render right-to-left correctly (`dir="auto"`).

---

## Architecture

**Modular monolith**: one FastAPI backend split into domain modules, one Next.js frontend,
one PostgreSQL database. No microservices, queues, or caches in the POC — add them only
when a measured need appears.

```
Next.js (UI, server-side rendering)
   │  REST /api/v1  (typed client generated from OpenAPI)
   ▼
FastAPI  ── router → service → repository ──►  PostgreSQL
   │
   ├── ingestion  → DataSource interface → SeedDataSource (now) / MetaDataSource (later)
   └── tagging / recommendations → LLMClient interface → Anthropic API
```

Key decisions:

- **Feature modules, layered inside.** Each backend module (`accounts`, `posts`, `tagging`,
  `analytics`, `recommendations`, `ingestion`) owns its models, schemas, repository,
  service and router. Code is grouped by feature, not by technical type.
- **Swappable edges.** External things (data sources, the LLM) sit behind small interfaces
  (`typing.Protocol`). Swapping seed data for Meta APIs, or one LLM for another, touches
  one file plus config.
- **One source of truth for API types.** Backend Pydantic schemas → OpenAPI → generated
  TypeScript types in the frontend. API types are never written by hand.
- **Batch jobs via CLI**, not background workers: `seed`, `ingest`, `tag`, `analyze`
  are Typer commands run by `make` targets.
- **Frontend talks to the backend server-side only.** The browser never calls FastAPI
  directly, so there is no CORS setup and no API URL exposed to the client.

---

## Repository map

```
.
├── CLAUDE.md                 # this file
├── README.md
├── Makefile                  # all common commands (see below)
├── docker-compose.yml        # postgres, postgres-test, backend, frontend
├── .env.example              # every env var, documented
├── .editorconfig
├── .pre-commit-config.yaml   # ruff, prettier, eslint, trailing whitespace
├── .github/workflows/ci.yml  # lint, typecheck, test for both apps
├── docs/
│   ├── architecture.md       # longer-form decisions (ADR-style)
│   └── poc-overview.pdf
├── backend/                  # FastAPI app   → see backend/CLAUDE.md
└── frontend/                 # Next.js app   → see frontend/CLAUDE.md
```

---

## Commands

Run everything through `make` so commands stay the same for everyone (and for Claude).

| Command            | What it does                                              |
|--------------------|-----------------------------------------------------------|
| `make up`          | Start postgres, backend, frontend with docker compose     |
| `make dev-api`     | Run backend locally with reload                           |
| `make dev-web`     | Run frontend locally                                      |
| `make migrate`     | Apply Alembic migrations                                  |
| `make migration m="msg"` | Autogenerate a new migration (review it before committing) |
| `make seed`        | Generate deterministic sample data into the database      |
| `make tag`         | Run AI tagging on untagged posts                          |
| `make analyze`     | Recompute engagement scores and patterns                  |
| `make gen-api`     | Regenerate frontend API types from backend OpenAPI        |
| `make lint`        | Lint + format check, both apps                            |
| `make typecheck`   | mypy (backend) + tsc (frontend)                           |
| `make test`        | All tests, both apps                                      |
| `make check`       | lint + typecheck + test (run before declaring work done)  |

---

## Global coding rules

### DRY — with judgment
- Every rule, formula, constant and type has **one home**. If you need it elsewhere,
  import it; do not copy it.
- Apply the **rule of three**: extract a shared abstraction when the same logic appears
  the third time, not before. Two similar-looking pieces of code that change for
  different reasons are not duplication.
- Prefer a small, obvious helper over a clever generic framework.

### Single sources of truth

| Thing                              | Lives in                                         |
|------------------------------------|--------------------------------------------------|
| Engagement score, lift formulas    | `backend/app/modules/analytics/metrics.py`       |
| Enums (Platform, MediaType, …)     | `backend/app/shared/enums.py` (flow to TS via OpenAPI) |
| Config / env vars                  | `backend/app/core/config.py`, `frontend/src/lib/env.ts` |
| API request/response types         | Backend Pydantic schemas → `frontend/src/lib/api/schema.d.ts` (generated) |
| LLM prompts                        | `prompts.py` inside the module that uses them    |
| Seed "answer key" (planted patterns) | `backend/app/seed/answer_key.py`               |
| Number/date formatting in UI       | `frontend/src/lib/format.ts`                     |

### General
- Clear names over comments. Comments explain **why**, not what.
- Small functions with one job. Return early instead of nesting.
- Fully typed code: strict mypy in Python, `strict` TypeScript. No `Any` / `any`
  without a comment explaining why.
- No magic numbers or strings — use named constants or enums.
- Never commit secrets. All config comes from env vars; `.env.example` documents each one.
- No dead code, commented-out code, or unused imports.
- Errors are never silently swallowed. Log with context or re-raise.

---

## How Claude should work in this repo

1. Read the relevant subfolder `CLAUDE.md` before editing.
2. For changes touching more than ~3 files, write a short plan first and confirm it
   (except in build mode, where `BUILD_PLAN.md` is the approved plan).
3. Follow existing patterns in neighbouring modules before inventing new ones.
4. Write or update tests in the same change as the code.
5. Run `make check` before saying work is done. If something fails, fix it or say so clearly.
6. Do **not** add new dependencies without asking first (except those named in these
   CLAUDE.md files during build mode). Explain why the dependency is needed.
7. Do **not** edit an Alembic migration that may already be applied. Create a new one.
8. After changing any backend schema or endpoint, run `make gen-api` and fix frontend type errors.
9. Keep changes scoped to the task. Note unrelated problems instead of fixing them silently.

## Build mode — when the user says "start" or "continue"

The project is built from `BUILD_PLAN.md`. When the user says **start** or **continue**:

1. Read this file, `backend/CLAUDE.md`, `frontend/CLAUDE.md` and `BUILD_PLAN.md` fully.
   (Subfolder CLAUDE.md files are not auto-loaded until you touch those folders, so
   read them explicitly.)
2. Find the first phase not marked `[x]` and build it completely.
3. Run `make check`. Fix every failure before moving on. Do not skip or weaken tests
   to make them pass.
4. Mark the phase `[x]` in `BUILD_PLAN.md` with a one-line note, then `git commit`
   with a Conventional Commit message for that phase.
5. Go straight to the next phase. Do not stop to ask for confirmation between phases.
6. Stop only when all phases are done, or when truly blocked (e.g. a tool is not
   installed). If blocked, explain exactly what the user must do in one or two
   plain sentences.
7. Within build mode, adding the dependencies named in these CLAUDE.md files is
   pre-approved. Ask only before adding anything not named here.
8. If `ANTHROPIC_API_KEY` is missing, use the documented fallbacks and keep going.

At the end, give a short plain-English summary of what was built and how to open it.

## Definition of done
- Code follows the rules in this file and the subfolder `CLAUDE.md`.
- `make check` passes.
- New behaviour has tests; the seed answer-key test still passes.
- Any new env var is in `.env.example`; any new command is in the `Makefile` and this file.

## Git conventions
- Branches: `feat/…`, `fix/…`, `chore/…`, `docs/…`
- Commits: Conventional Commits, e.g. `feat(analytics): add lift by media type`
- One logical change per commit. PRs describe what changed and how it was tested.
