"""The contract every data source (seed now, Meta later) fulfils."""

from collections.abc import Sequence
from datetime import datetime
from typing import Protocol

from pydantic import Field

from app.modules.accounts.schemas import AccountCreate
from app.modules.posts.schemas import OwnOnlyMetrics, PublicMetrics
from app.shared.enums import Language, MediaType, Platform, SnapshotAge
from app.shared.schemas import BaseSchema


class SourceSnapshot(PublicMetrics, OwnOnlyMetrics):
    hours_since_post: SnapshotAge


class SourcePost(BaseSchema):
    platform: Platform
    account_handle: str
    external_id: str
    media_type: MediaType
    caption: str
    language: Language
    posted_at: datetime
    url: str
    snapshots: list[SourceSnapshot] = Field(default_factory=list)


class DataSource(Protocol):
    async def fetch_accounts(self) -> Sequence[AccountCreate]: ...

    async def fetch_posts(self, since: datetime | None = None) -> Sequence[SourcePost]: ...
