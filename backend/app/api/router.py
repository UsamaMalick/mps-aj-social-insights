"""Mounts every module router under /api/v1."""

from typing import Any

from fastapi import APIRouter

from app.core.config import API_PREFIX
from app.modules.accounts.router import router as accounts_router
from app.modules.analytics.router import router as analytics_router
from app.modules.posts.router import router as posts_router
from app.modules.recommendations.router import router as recommendations_router
from app.modules.system.router import router as system_router
from app.shared.schemas import ErrorResponse

ERROR_RESPONSES: dict[int | str, dict[str, Any]] = {
    status: {"model": ErrorResponse} for status in (404, 422, 500)
}

api_router = APIRouter(prefix=API_PREFIX, responses=ERROR_RESPONSES)
for router in (
    system_router,
    accounts_router,
    posts_router,
    analytics_router,
    recommendations_router,
):
    api_router.include_router(router)
