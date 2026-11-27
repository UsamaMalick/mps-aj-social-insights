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
make tag               # label posts (AI if an LLM provider is set, rule-based without)
```

Then open <http://localhost:3000>. API docs are at <http://localhost:8000/docs>.

## What's in the app

| Page | What it shows |
|---|---|
| **Briefing** | A one-sentence summary written from the data (who is ahead, what works best), headline figures, all accounts ranked by engagement, "what's working" by format, story type, opening, timing and language, the content gap, and standout posts. |
| **Posts** | Every post with live search (debounced), filters for account, platform, format, story type and language, sorting and numbered pages. Click a row to open a side panel with the full caption, 24h vs 72h metrics and labels. Its URL (`?post=…`) can be shared. |
| **Competitors** | A leaderboard of all accounts by median engagement, per platform, using **public metrics only**. |
| **Recommendations** | Evidence-backed suggestions on *how* to tell stories. Click *Generate recommendations*, then accept or dismiss each one (with Undo). |

Filtering, search, sorting, ranking and pagination all run on the backend; the portal only
displays results. Light and dark themes follow the system setting, with a toggle in the
header.

**Design.** An editorial "Newsroom Paper" system: cream paper and ink do almost all the
work, and burnt orange is reserved for the single primary action, the active-section
marker and focus rings. Instrument Serif for headlines and figures, Schibsted Grotesk for
the interface, IBM Plex Sans Arabic for Arabic. Arabic captions render right-to-left. The
rules are in `frontend/CLAUDE.md`, and pages are checked with the
[impeccable](https://github.com/pbakaus/impeccable) detector
(`npx impeccable detect http://localhost:3000/posts`).

### AI features (optional)

Configure **Anthropic**, **Azure OpenAI**, or both in `.env`, then restart (`make up`):

| Provider | Settings |
|---|---|
| Anthropic | `ANTHROPIC_API_KEY`, `LLM_MODEL` (default `claude-opus-5`) |
| Azure OpenAI | `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`, `AZURE_OPENAI_REASONING` (false for gpt-4o) |

With both configured, `LLM_PROVIDER` (default `anthropic`) is tried first and the other
takes over automatically if a request fails (spending limit, outage, bad key). A failed
provider is skipped for 10 minutes so a long tagging run doesn't keep hitting it. Each tag
and recommendation stores the model that actually produced it.

What the AI does:

- **Tagging** (`make tag`): labels each caption's topic, region, story type, hook style and
  tone. It sends 25 captions per request, so ≈160 requests for the full sample. Use
  `docker compose exec backend python -m app.cli tag --limit 200` to try it on a subset.
- **Recommendation wording**: writes each recommendation's title and text. The category,
  numbers and sample sizes always come from analytics, never from the model.

Output is requested as strict JSON, validated against a schema, retried once, and
otherwise skipped. Unvalidated output is never stored. Claude requests also opt into
Anthropic's server-side fallback, so a policy refusal is retried on a substitute model.

Without any provider everything still works: tags come from the seed generator's ground
truth and recommendations use templates.

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
                                     tagging, recommendations ── LLMClient ─┘  Anthropic ⇄ Azure OpenAI (fallback)
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
- **The backend does the work.** Filtering, search, sorting (including by engagement, using
  the same formula in SQL), ranking and pagination run in the database and services; the
  portal never filters or sorts data itself.

## Switching to real data later

1. Implement `MetaDataSource` in `backend/app/modules/ingestion/sources/meta.py` using the
   Meta Graph API (Instagram Graph API and Pages API). Map responses to `AccountCreate` and
   `SourcePost`, with metric snapshots captured at 24h and 72h after posting. A scheduled job
   (e.g. cron running `make ingest`) has to poll posts at those ages.
2. Fill `saves`, `reach` and `clicks` **only** for Al Jazeera's own accounts (they come from
   page insights). Competitor data from public endpoints has public counts only, and
   ingestion rejects own-only metrics for competitors.
3. Set `DATA_SOURCE=meta`. The sample-data banner disappears automatically.
4. Configure an LLM provider (Anthropic and/or Azure OpenAI), because the rule-based
   tagging fallback only knows the seed posts.
5. Consider storing follower counts over time. Engagement score currently uses the
   account's current follower count, which is fine for 90 days of sample data but drifts
   over longer periods.

Nothing outside the ingestion module needs to change.

## Repository layout

```
backend/    FastAPI app, Alembic migrations, seed generator, tests   (see backend/CLAUDE.md)
frontend/   Next.js 16 portal, design system and UI rules            (see frontend/CLAUDE.md)
docs/       architecture decisions
CLAUDE.md   project rules, commands and conventions
BUILD_PLAN.md  how the POC was built, phase by phase
```
