from datetime import datetime
from uuid import UUID

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import Language, MediaType, Platform, SnapshotAge
from app.shared.models import Timestamps, UUIDPrimaryKey, str_enum

EXTERNAL_ID_MAX_LENGTH = 100
URL_MAX_LENGTH = 500

_VALID_AGES = ", ".join(str(age.value) for age in SnapshotAge)


class Post(UUIDPrimaryKey, Timestamps, Base):
    __tablename__ = "posts"
    __table_args__ = (UniqueConstraint("platform", "external_id"),)

    account_id: Mapped[UUID] = mapped_column(
        ForeignKey("accounts.id", ondelete="CASCADE"), index=True
    )
    platform: Mapped[Platform] = mapped_column(str_enum(Platform))
    external_id: Mapped[str] = mapped_column(String(EXTERNAL_ID_MAX_LENGTH))
    media_type: Mapped[MediaType] = mapped_column(str_enum(MediaType))
    caption: Mapped[str] = mapped_column(Text)
    language: Mapped[Language] = mapped_column(str_enum(Language))
    posted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    url: Mapped[str] = mapped_column(String(URL_MAX_LENGTH))


class MetricSnapshot(UUIDPrimaryKey, Timestamps, Base):
    """Metrics for a post at a fixed age. `saves`, `reach`, `clicks` are own accounts only."""

    __tablename__ = "metric_snapshots"
    __table_args__ = (
        UniqueConstraint("post_id", "hours_since_post"),
        CheckConstraint(f"hours_since_post IN ({_VALID_AGES})", name="hours_since_post_valid"),
    )

    # Indexed through the (post_id, hours_since_post) unique constraint.
    post_id: Mapped[UUID] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    hours_since_post: Mapped[int]
    likes: Mapped[int]
    comments: Mapped[int]
    shares: Mapped[int]
    views: Mapped[int]
    saves: Mapped[int | None]
    reach: Mapped[int | None]
    clicks: Mapped[int | None]
