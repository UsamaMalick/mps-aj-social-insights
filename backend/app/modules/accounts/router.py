from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import PaginationDep, SessionDep
from app.modules.accounts.schemas import AccountFilters, AccountGroup, AccountRead
from app.modules.accounts.service import AccountService
from app.shared.schemas import Page

router = APIRouter(prefix="/accounts", tags=["accounts"])


def get_account_service(session: SessionDep) -> AccountService:
    return AccountService(session)


AccountServiceDep = Annotated[AccountService, Depends(get_account_service)]


@router.get("", response_model=Page[AccountRead], summary="List own and competitor accounts")
async def list_accounts(
    service: AccountServiceDep,
    pagination: PaginationDep,
    filters: Annotated[AccountFilters, Query()],
) -> Page[AccountRead]:
    return await service.list_accounts(filters, pagination)


@router.get(
    "/groups",
    response_model=list[AccountGroup],
    summary="Accounts grouped into own and competitors (for filter menus)",
)
async def list_account_groups(service: AccountServiceDep) -> list[AccountGroup]:
    return await service.grouped_accounts()


# Registered after /groups so that "groups" is never parsed as an account id.
@router.get("/{account_id}", response_model=AccountRead, summary="One account")
async def get_account(account_id: UUID, service: AccountServiceDep) -> AccountRead:
    return await service.get_account(account_id)
