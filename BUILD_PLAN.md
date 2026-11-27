# Build Plan — mps-aj-social-insights

Claude Code builds the project phase by phase from this file. Rules for using it are in
the "Build mode" section of the root `CLAUDE.md`.

Mark a phase done by changing `[ ]` to `[x]` and adding one line of notes under it.

---

## [x] Phase 1 — Project skeleton
> Done: uv/FastAPI + Next 16 (Cache Components) skeleton, compose on ports 5440/5441/8000/3000, `make check` green.
- Use the names from the "Naming" section of root CLAUDE.md everywhere
- Root: `Makefile` (all targets listed in root CLAUDE.md), `docker-compose.yml`
  (postgres, postgres-test, backend, frontend), `.env.example`, `.gitignore`,
  `.editorconfig`, `.pre-commit-config.yaml`, `README.md`, `.github/workflows/ci.yml`
- Backend: uv project, `pyproject.toml` (ruff, mypy strict, pytest config), app factory,
  `core/` (config, database, exceptions, logging), `shared/` (model mixins,
  `BaseRepository`, `BaseSchema`, `Page[T]`, enums), `api/router.py`, `api/deps.py`,
  `GET /api/v1/health`, `GET /api/v1/meta` (returns `data_source`), Alembic setup,
  `Dockerfile`, pytest setup with health test
- Frontend: Next.js 16 + TypeScript strict, Tailwind v4, shadcn/ui, ESLint flat config,
  Prettier, Vitest, `lib/env.ts`, `lib/format.ts`, `lib/utils.ts`, root layout with
  sidebar, header and `SampleDataBanner`, empty pages for every route, `Dockerfile`
- **Done when:** `make check` passes and `make up` starts all services.

## [x] Phase 2 — Database
> Done: 5 tables, enums as strings, upsert-by-natural-key repos; recommendations use `category` (format/style/hook/timing/language) for the plan's "format" column.
- Models + schemas + repositories for `accounts`, `posts`, `metric_snapshots`, `post_tags`,
  `recommendations` (see data model in backend/CLAUDE.md)
- First Alembic migration, reviewed by hand
- **Done when:** `make migrate` works on a clean DB and repository tests pass.

## [ ] Phase 3 — Seed data
- `seed/answer_key.py` with 4–6 planted patterns (format, story type, posting time,
  language, an Al Jazeera content gap)
- `seed/captions.py` (Arabic + English templates by topic and style)
- `seed/generator.py`: deterministic; 1 own account + 5 competitors × Instagram + Facebook,
  90 days; log-normal engagement scaled by followers; 24h and 72h snapshots;
  own-only metrics NULL for competitors
- `SeedDataSource`, ingestion service, `make seed` CLI command
- **Done when:** `make seed` fills the DB twice with identical results.

## [ ] Phase 4 — Analytics
- `analytics/metrics.py` (engagement score, lift — pure functions, fully unit tested)
- Service + endpoints: summary per account, top posts, patterns by tag/format/time/language,
  own vs competitor gaps
- `tests/integration/test_answer_key.py`: analytics finds every planted pattern
- **Done when:** the answer-key test passes.

## [ ] Phase 5 — AI tagging
- `LLMClient` Protocol, `AnthropicLLMClient`, `FakeLLMClient`
- `tagging/prompts.py` with `PROMPT_VERSION`, Pydantic-validated output, `make tag`
- If `ANTHROPIC_API_KEY` is not set, `make tag` falls back to rule-based tags derived
  from the seed metadata so later phases still work
- **Done when:** all posts have tags and tests pass using `FakeLLMClient`.

## [ ] Phase 6 — API completion and types
- Paginated, filterable endpoints for accounts, posts (with latest snapshot and tags),
  analytics, recommendations
- `make gen-api` generates `frontend/src/lib/api/schema.d.ts`
- **Done when:** OpenAPI is complete and frontend type generation works.

## [ ] Phase 7 — Frontend dashboard
- Overview: key stats, own vs competitors chart, top posts
- Posts: filterable table (URL search params), caption with `dir="auto"`
- Competitors: per-competitor comparison using public metrics only
- Loading, empty and error states on every page
- **Done when:** every page works against seeded data and `make check` passes.

## [ ] Phase 8 — Recommendations
- Service builds evidence from analytics, asks the LLM for suggestions
  (format/style/hook/timing/language, never which news to cover), stores them with evidence
- Fallback to template-based suggestions when no API key is set
- `POST /api/v1/recommendations/generate` + Server Action + Recommendations page
  showing each suggestion with its evidence
- **Done when:** recommendations reflect the planted patterns and `make check` passes.

## [ ] Phase 9 — Final polish
- README: setup, commands, architecture summary, how to switch to real data later
- Remove dead code, fix all warnings, confirm `.env.example` is complete
- **Done when:** a fresh clone runs with `make up && make migrate && make seed && make tag`.
