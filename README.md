# AJ Social Insights (`mps-aj-social-insights`)

Proof of concept for Al Jazeera's social media team. It compares Al Jazeera's Instagram and
Facebook posts with five competitors' posts, finds which kinds of content earn the most
engagement, and suggests **how** to tell stories (format, style, hook, timing, language). It
never suggests *which* news to cover. Editors make the final decision.

> The POC runs on **generated sample data**. Every page shows a "Sample data" banner while
> `DATA_SOURCE=seed`. Competitor names (Gulf News Network, Levant Today, …) are made up.

## Quick start

You need **Docker** and **make**. That's enough to run the app.

```bash
cp .env.example .env   # optional: the defaults work as they are
make up                # postgres :5440, API :8000, portal :3000
make migrate           # create the tables
make seed              # load 90 days of sample data (≈4,000 posts)
make tag               # label posts (AI with ANTHROPIC_API_KEY, rule-based without)
```

Then open <http://localhost:3000>. API docs are at <http://localhost:8000/docs>.

On the **Recommendations** page, click *Generate recommendations* to turn the current
patterns into suggestions, then accept or dismiss each one.

### AI features (optional)

Set `ANTHROPIC_API_KEY` in `.env` and restart (`make up`) to enable:

- **Tagging** (`make tag`): Claude labels each caption's topic, region, story type, hook
  style and tone. It sends 25 captions per request, so ≈160 requests for the full sample.
  Use `docker compose exec backend python -m app.cli tag --limit 200`
  to try it on a subset first.
- **Recommendation wording**: Claude writes each recommendation's title and text. The
  category, numbers and sample sizes always come from analytics, never from the model.

The model is set by `LLM_MODEL` (default `claude-opus-5`). Requests opt into Anthropic's
server-side fallback, so a policy refusal is retried on a substitute model. Model output is
validated against a schema, retried once, and otherwise skipped. Unvalidated output is never
stored.

Without a key everything still works: tags come from the seed generator's ground truth and
recommendations use templates.

## Commands

Run `make help` for the full list. The main ones:

| Command | What it does |
|---|---|
| `make up` / `make down` | Start / stop all services |
| `make migrate` | Apply database migrations |
| `make seed` | Load deterministic sample data (safe to re-run; identical results) |
| `make tag` | Tag untagged posts |
| `make analyze` | Print the strongest engagement patterns in the terminal |
| `make gen-api` | Regenerate the portal's API types from the backend's OpenAPI |
| `make check` | Lint, typecheck and test both apps |

`migrate`, `seed`, `ingest`, `tag` and `analyze` run inside the backend container. For
local development without Docker for the apps, run `make install`, then `make dev-api` and
`make dev-web`, and add `LOCAL=1` to job targets. Local development needs
[uv](https://docs.astral.sh/uv/) and pnpm; the tests also need the `postgres-test`
container, which `make test` starts.

## How it works

```
Next.js portal (server-rendered)  ──REST /api/v1 (typed from OpenAPI)──►  FastAPI  ──►  PostgreSQL
                                                                         │
                                            ingestion ── DataSource ─────┤  SeedDataSource now, MetaDataSource later
                                     tagging, recommendations ── LLMClient ─┘  Anthropic
```

- **Modular monolith.** One FastAPI app split into feature modules (`accounts`, `posts`,
  `tagging`, `analytics`, `recommendations`, `ingestion`), each with its own router → service
  → repository layers. One Next.js app. One Postgres. See `docs/architecture.md`.
- **Engagement score** = (likes + comments + shares) ÷ followers. **Lift** = a post's score ÷
  its account's median score. Both formulas live in `backend/app/modules/analytics/metrics.py`.
- **Fair comparisons.** Metrics are snapshotted at 24h and 72h after posting, and
  comparisons use the 72h snapshot. Competitor accounts only have public metrics (likes,
  comments, shares, views); clicks, reach and saves are NULL for them and never shown.
- **Patterns compare within each account.** "Reels vs other posts" is measured inside every
  account, then combined. That way a high-engagement account that happens to post many
  reels can't fake a reel effect.
- **An answer key keeps the analytics honest.** The seed generator plants five patterns
  (reels 1.8×, human-interest 1.7×, explainers 1.45×, 16:00–20:00 UTC posts 1.4×, Arabic
  captions 1.35×) plus a content gap (competitors post explainers 22% of the time, Al Jazeera
  3%). `backend/tests/integration/test_answer_key.py` checks that analytics finds every one.
- **The browser never calls the API.** Server Components and Server Actions do, so the API
  needs no CORS and can stay private.

## Switching to real data later

1. Implement `MetaDataSource` in `backend/app/modules/ingestion/sources/meta.py` using the
   Meta Graph API (Instagram Graph API and Pages API). Map responses to `AccountCreate` and
   `SourcePost`, with metric snapshots captured at 24h and 72h after posting. A scheduled job
   (e.g. cron running `make ingest`) has to poll posts at those ages.
2. Fill `saves`, `reach` and `clicks` **only** for Al Jazeera's own accounts (they come from
   page insights). Competitor data from public endpoints has public counts only, and
   ingestion rejects own-only metrics for competitors.
3. Set `DATA_SOURCE=meta`. The sample-data banner disappears automatically.
4. Set `ANTHROPIC_API_KEY`, because the rule-based tagging fallback only knows the seed
   posts.
5. Consider storing follower counts over time. Engagement score currently uses the
   account's current follower count, which is fine for 90 days of sample data but drifts
   over longer periods.

Nothing outside the ingestion module needs to change.

## Repository layout

```
backend/    FastAPI app, Alembic migrations, seed generator, tests   (see backend/CLAUDE.md)
frontend/   Next.js 16 portal                                        (see frontend/CLAUDE.md)
docs/       architecture decisions
CLAUDE.md   project rules, commands and conventions
BUILD_PLAN.md  how the POC was built, phase by phase
```
