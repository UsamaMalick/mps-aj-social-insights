"""Mounts every module router under /api/v1."""

from fastapi import APIRouter

from app.core.config import API_PREFIX
from app.modules.system.router import router as system_router

api_router = APIRouter(prefix=API_PREFIX)
api_router.include_router(system_router)
