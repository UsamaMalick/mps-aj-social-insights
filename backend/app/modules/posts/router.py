from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query

from app.api.deps import PaginationDep, SessionDep
from app.modules.posts.listing import PostListingService
from app.modules.posts.schemas import PostDetail, PostFilters, PostListItem
from app.shared.schemas import Page

router = APIRouter(prefix="/posts", tags=["posts"])


def get_post_listing_service(session: SessionDep) -> PostListingService:
    return PostListingService(session)


PostListingServiceDep = Annotated[PostListingService, Depends(get_post_listing_service)]


@router.get("", response_model=Page[PostListItem], summary="List posts (filterable, paginated)")
async def list_posts(
    service: PostListingServiceDep,
    pagination: PaginationDep,
    filters: Annotated[PostFilters, Query()],
) -> Page[PostListItem]:
    return await service.list_posts(filters, pagination)


@router.get("/{post_id}", response_model=PostDetail, summary="One post with all snapshots")
async def get_post(post_id: UUID, service: PostListingServiceDep) -> PostDetail:
    return await service.get_post(post_id)
