from sqlalchemy import String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import Platform
from app.shared.models import Timestamps, UUIDPrimaryKey, str_enum

HANDLE_MAX_LENGTH = 100
DISPLAY_NAME_MAX_LENGTH = 200


class Account(UUIDPrimaryKey, Timestamps, Base):
    """A social media account: one of ours (`is_own`) or a competitor's."""

    __tablename__ = "accounts"
    __table_args__ = (UniqueConstraint("platform", "handle"),)

    platform: Mapped[Platform] = mapped_column(str_enum(Platform))
    handle: Mapped[str] = mapped_column(String(HANDLE_MAX_LENGTH))
    display_name: Mapped[str] = mapped_column(String(DISPLAY_NAME_MAX_LENGTH))
    is_own: Mapped[bool]
    followers_count: Mapped[int]
