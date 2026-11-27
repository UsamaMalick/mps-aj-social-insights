"""Base Pydantic schemas and pagination."""

from typing import Any

from pydantic import BaseModel, ConfigDict, Field

DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100


class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class PaginationParams(BaseSchema):
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=DEFAULT_PAGE_SIZE, ge=1, le=MAX_PAGE_SIZE)


class Page[T](BaseSchema):
    items: list[T]
    total: int
    offset: int
    limit: int


class ErrorDetail(BaseSchema):
    code: str
    message: str
    details: Any = None


class ErrorResponse(BaseSchema):
    """The body of every error response."""

    error: ErrorDetail
