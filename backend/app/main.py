"""FastAPI app factory."""

from fastapi import FastAPI
from fastapi.routing import APIRoute

from app.api.router import api_router
from app.core.config import APP_TITLE, get_settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging


def _operation_id(route: APIRoute) -> str:
    # Stable, readable operation ids for the generated TypeScript client.
    return route.name


def create_app() -> FastAPI:
    settings = get_settings()
    configure_logging(settings.log_level)
    app = FastAPI(title=APP_TITLE, version="0.1.0", generate_unique_id_function=_operation_id)
    register_exception_handlers(app)
    app.include_router(api_router)
    return app
