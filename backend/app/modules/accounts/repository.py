from collections.abc import Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.dialects.postgresql import insert

from app.modules.accounts.models import Account
from app.modules.accounts.schemas import AccountCreate, AccountFilters
from app.shared.repository import BaseRepository


class AccountRepository(BaseRepository[Account]):
    model = Account

    async def upsert(self, data: AccountCreate) -> Account:
        """Insert or update by the natural key (platform, handle)."""
        values = data.model_dump()
        stmt = (
            insert(Account)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[Account.platform, Account.handle],
                set_={
                    "display_name": values["display_name"],
                    "is_own": values["is_own"],
                    "followers_count": values["followers_count"],
                    "updated_at": func.now(),
                },
            )
            .returning(Account)
            .execution_options(populate_existing=True)
        )
        return (await self.session.scalars(stmt)).one()

    async def list_filtered(
        self, filters: AccountFilters, *, offset: int, limit: int
    ) -> tuple[Sequence[Account], int]:
        stmt = self._filtered(filters)
        total = await self.session.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        rows = await self.session.scalars(
            stmt.order_by(Account.is_own.desc(), Account.display_name, Account.platform)
            .offset(offset)
            .limit(limit)
        )
        return rows.all(), total

    async def list_all(self) -> Sequence[Account]:
        rows = await self.session.scalars(
            select(Account).order_by(Account.is_own.desc(), Account.display_name, Account.platform)
        )
        return rows.all()

    @staticmethod
    def _filtered(filters: AccountFilters) -> Select[Account]:
        stmt = select(Account)
        if filters.platform is not None:
            stmt = stmt.where(Account.platform == filters.platform)
        if filters.is_own is not None:
            stmt = stmt.where(Account.is_own == filters.is_own)
        return stmt
