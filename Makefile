# AJ Social Insights — common commands. Run `make help` for the list.
SHELL := /bin/bash
export PATH := $(HOME)/.local/bin:$(PATH)
export COREPACK_ENABLE_DOWNLOAD_PROMPT := 0

COMPOSE := docker compose
API := cd backend &&
WEB := cd frontend &&

# Batch jobs run inside the backend container by default (only Docker needed).
# Use `make seed LOCAL=1` to run them on the host with uv instead.
ifdef LOCAL
JOB := $(API) uv run
else
JOB := $(COMPOSE) exec backend
endif

.DEFAULT_GOAL := help
.PHONY: help install up down logs dev-api dev-web db test-db migrate migration seed ingest \
        tag analyze gen-api lint typecheck test test-api test-web check format

help: ## Show this help
	@grep -E '^[a-z-]+:.*?## ' $(MAKEFILE_LIST) | awk -F':.*?## ' '{printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install backend and frontend dependencies on the host
	$(API) uv sync
	$(WEB) pnpm install --frozen-lockfile

up: ## Start postgres, backend, frontend with docker compose
	$(COMPOSE) up -d --build --wait postgres backend frontend

down: ## Stop all services
	$(COMPOSE) down

logs: ## Follow service logs
	$(COMPOSE) logs -f

dev-api: db ## Run backend locally with reload
	$(API) uv run uvicorn app.main:create_app --factory --reload --port $${API_PORT:-8000}

dev-web: ## Run frontend locally
	$(WEB) pnpm dev

db: ## Start only the development database
	$(COMPOSE) up -d --wait postgres

test-db: ## Start only the test database
	$(COMPOSE) up -d --wait postgres-test

migrate: ## Apply Alembic migrations
	$(JOB) alembic upgrade head

migration: db ## Autogenerate a migration: make migration m="message" (review it!)
	@test -n "$(m)" || (echo 'usage: make migration m="message"' && exit 1)
	$(API) uv run alembic revision --autogenerate -m "$(m)"

seed: ## Generate deterministic sample data into the database
	$(JOB) python -m app.cli seed

ingest: ## Pull posts from the configured DATA_SOURCE (seed now, meta later)
	$(JOB) python -m app.cli ingest

tag: ## Run AI tagging on untagged posts
	$(JOB) python -m app.cli tag

analyze: ## Recompute engagement scores and patterns
	$(JOB) python -m app.cli analyze

gen-api: ## Regenerate frontend API types from backend OpenAPI
	$(API) uv run python -m app.cli export-openapi ../frontend/openapi.json
	$(WEB) pnpm gen-api

lint: ## Lint + format check, both apps
	$(API) uv run ruff check . && uv run ruff format --check .
	$(WEB) pnpm lint

format: ## Auto-format both apps
	$(API) uv run ruff format . && uv run ruff check --fix .
	$(WEB) pnpm format

typecheck: ## mypy (backend) + tsc (frontend)
	$(API) uv run mypy .
	$(WEB) pnpm typecheck

test: test-api test-web ## All tests, both apps

test-api: test-db
	$(API) uv run pytest

test-web:
	$(WEB) pnpm test

check: lint typecheck test ## lint + typecheck + test
