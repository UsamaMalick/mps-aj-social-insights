# Architecture decisions

Short ADR-style notes. The rules themselves live in the root `CLAUDE.md`.

## ADR-001 — Modular monolith
One FastAPI app split into feature modules, one Next.js app, one Postgres. A POC with one
team does not need service boundaries, queues or caches; module boundaries (services only
talk to services) keep the option of splitting later.

## ADR-002 — Swappable edges behind Protocols
Data sources (`DataSource`) and the LLM (`LLMClient`) are `typing.Protocol`s. Anthropic and
Azure OpenAI both implement `LLMClient`; with both configured they form a fallback chain. Moving from
seed data to Meta's APIs means adding `MetaDataSource` and setting `DATA_SOURCE=meta`;
nothing else changes.

## ADR-003 — Snapshots at fixed post ages
Engagement grows over time, so comparing a 2-hour-old post with a 3-day-old one is
meaningless. Metrics are stored per post at fixed ages (24h, 72h) and all comparisons use
the same age (72h by default).

## ADR-004 — Public metrics for cross-account comparisons
Competitor accounts only expose public counts (likes, comments, shares, views). Any
comparison across accounts therefore uses only those, and own-only metrics are NULL for
competitors at the database level.

## ADR-005 — Generated API types
Backend Pydantic schemas → OpenAPI → `frontend/src/lib/api/schema.d.ts`. The frontend never
hand-writes response types, so the two apps cannot drift silently.

## ADR-006 — Server-side data access only
Next.js Server Components and Server Actions call the API; the browser never does. No CORS,
no public API URL, and the backend can stay on a private network.

## ADR-007 — Deterministic seed data with an answer key
The generator plants known patterns (`backend/app/seed/answer_key.py`). An integration test
asserts the analytics module rediscovers every one, which tests the whole pipeline end to end.
