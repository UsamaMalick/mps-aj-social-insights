from fastapi import APIRouter

from app.api.deps import SettingsDep
from app.core.config import APP_TITLE
from app.modules.system.schemas import HealthRead, MetaRead

router = APIRouter(tags=["system"])

HEALTHY = "ok"


@router.get("/health", response_model=HealthRead, summary="Liveness check")
async def health() -> HealthRead:
    return HealthRead(status=HEALTHY)


@router.get("/meta", response_model=MetaRead, summary="App metadata, incl. active data source")
async def meta(settings: SettingsDep) -> MetaRead:
    return MetaRead(
        app_title=APP_TITLE, data_source=settings.data_source, llm_enabled=settings.llm_enabled
    )
