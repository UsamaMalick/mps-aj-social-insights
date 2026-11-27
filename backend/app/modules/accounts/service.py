from collections.abc import Sequence
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.accounts.repository import AccountRepository
from app.modules.accounts.schemas import AccountCreate, AccountFilters, AccountGroup, AccountRead
from app.shared.enums import AccountGroupKey, Platform
from app.shared.schemas import Page, PaginationParams


class AccountService:
    def __init__(self, session: AsyncSession) -> None:
        self.repository = AccountRepository(session)

    async def upsert_accounts(
        self, accounts: Sequence[AccountCreate]
    ) -> dict[tuple[Platform, str], AccountRead]:
        """Insert or update accounts. Does not commit; returns them keyed by (platform, handle)."""
        result: dict[tuple[Platform, str], AccountRead] = {}
        for data in accounts:
            account = AccountRead.model_validate(await self.repository.upsert(data))
            result[(account.platform, account.handle)] = account
        return result

    async def get_account(self, account_id: UUID) -> AccountRead:
        return AccountRead.model_validate(await self.repository.get_or_raise(account_id))

    async def list_accounts(
        self, filters: AccountFilters, pagination: PaginationParams
    ) -> Page[AccountRead]:
        rows, total = await self.repository.list_filtered(
            filters, offset=pagination.offset, limit=pagination.limit
        )
        return Page[AccountRead](
            items=[AccountRead.model_validate(row) for row in rows],
            total=total,
            offset=pagination.offset,
            limit=pagination.limit,
        )

    async def list_all(self) -> list[AccountRead]:
        return [AccountRead.model_validate(row) for row in await self.repository.list_all()]

    async def grouped_accounts(self) -> list[AccountGroup]:
        """Own accounts, then competitors, each sorted by name and platform."""
        accounts = await self.list_all()
        return [
            AccountGroup(key=AccountGroupKey.OWN, accounts=[a for a in accounts if a.is_own]),
            AccountGroup(
                key=AccountGroupKey.COMPETITORS, accounts=[a for a in accounts if not a.is_own]
            ),
        ]
