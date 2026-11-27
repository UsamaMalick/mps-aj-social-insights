from collections.abc import Sequence
from datetime import datetime

from app.core.exceptions import ExternalServiceError
from app.modules.accounts.schemas import AccountCreate
from app.modules.ingestion.sources.base import SourcePost

NOT_BUILT = "The Meta data source is not built yet; set DATA_SOURCE=seed."


class MetaDataSource:
    """Placeholder for the Meta Graph API source (Instagram + Facebook).

    When built it maps Graph API responses to `AccountCreate` / `SourcePost`, and must leave
    `saves`, `reach` and `clicks` empty for competitor accounts.
    """

    async def fetch_accounts(self) -> Sequence[AccountCreate]:
        raise ExternalServiceError(NOT_BUILT)

    async def fetch_posts(self, since: datetime | None = None) -> Sequence[SourcePost]:
        raise ExternalServiceError(NOT_BUILT)
