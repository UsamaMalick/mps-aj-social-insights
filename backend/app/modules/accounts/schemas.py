from uuid import UUID

from pydantic import Field

from app.shared.enums import Platform
from app.shared.schemas import BaseSchema


class AccountCreate(BaseSchema):
    platform: Platform
    handle: str = Field(min_length=1, max_length=100)
    display_name: str = Field(min_length=1, max_length=200)
    is_own: bool
    followers_count: int = Field(ge=0)


class AccountRead(AccountCreate):
    id: UUID


class AccountFilters(BaseSchema):
    platform: Platform | None = None
    is_own: bool | None = None
