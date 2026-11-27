"""Batch jobs: `python -m app.cli <command>`."""

import json
from pathlib import Path

import typer

from app.main import create_app

cli = typer.Typer(no_args_is_help=True, help="AJ Social Insights batch jobs")


@cli.callback()
def main() -> None:
    """AJ Social Insights batch jobs."""


@cli.command("export-openapi")
def export_openapi(output: Path) -> None:
    """Write the OpenAPI schema to OUTPUT (used by `make gen-api`)."""
    output.write_text(json.dumps(create_app().openapi(), indent=2, ensure_ascii=False))


if __name__ == "__main__":
    cli()
