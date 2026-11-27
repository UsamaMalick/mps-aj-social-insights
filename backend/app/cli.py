"""Batch jobs: `python -m app.cli <command>`."""

import asyncio
import json
from pathlib import Path

import typer

from app.core.config import get_settings
from app.core.database import get_engine, get_sessionmaker
from app.core.logging import configure_logging
from app.main import create_app
from app.modules.ingestion.service import IngestionService
from app.modules.ingestion.sources.factory import get_data_source
from app.modules.ingestion.sources.seed import SeedDataSource

cli = typer.Typer(no_args_is_help=True, help="AJ Social Insights batch jobs")


@cli.callback()
def main() -> None:
    """AJ Social Insights batch jobs."""


@cli.command("export-openapi")
def export_openapi(output: Path) -> None:
    """Write the OpenAPI schema to OUTPUT (used by `make gen-api`)."""
    output.write_text(json.dumps(create_app().openapi(), indent=2, ensure_ascii=False))


async def _ingest(*, use_seed: bool) -> None:
    settings = get_settings()
    source = SeedDataSource() if use_seed else get_data_source(settings)
    try:
        async with get_sessionmaker()() as session:
            result = await IngestionService(session, source).run()
    finally:
        await get_engine().dispose()
    typer.echo(
        f"Ingested {result.accounts} accounts, {result.posts} posts, {result.snapshots} snapshots."
    )


@cli.command()
def seed() -> None:
    """Load the deterministic sample dataset (idempotent)."""
    configure_logging(get_settings().log_level)
    asyncio.run(_ingest(use_seed=True))


@cli.command()
def ingest() -> None:
    """Pull data from the configured DATA_SOURCE."""
    configure_logging(get_settings().log_level)
    asyncio.run(_ingest(use_seed=False))


if __name__ == "__main__":
    cli()
