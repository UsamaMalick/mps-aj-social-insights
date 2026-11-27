"""Generic repository with the queries every table needs."""

from collections.abc import Sequence
from typing import Any, ClassVar
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import Base
from app.core.exceptions import NotFoundError


class BaseRepository[ModelT: Base]:
    model: ClassVar[type[Any]]

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, id: UUID) -> ModelT | None:
        result: ModelT | None = await self.session.get(self.model, id)
        return result

    async def get_or_raise(self, id: UUID) -> ModelT:
        obj = await self.get(id)
        if obj is None:
            raise NotFoundError(f"{self.model.__name__} {id} not found")
        return obj

    async def list(self, *, offset: int, limit: int) -> Sequence[ModelT]:
        result = await self.session.scalars(
            select(self.model).order_by(self.model.created_at.desc()).offset(offset).limit(limit)
        )
        return result.all()

    async def count(self) -> int:
        return await self.session.scalar(select(func.count()).select_from(self.model)) or 0

    async def add(self, obj: ModelT) -> ModelT:
        self.session.add(obj)
        await self.session.flush()
        return obj
