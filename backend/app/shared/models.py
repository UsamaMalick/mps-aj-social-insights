"""ORM mixins shared by every table."""

from datetime import datetime
from enum import StrEnum
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func, text
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column


class UUIDPrimaryKey:
    id: Mapped[UUID] = mapped_column(
        primary_key=True, default=uuid4, server_default=text("gen_random_uuid()")
    )


class Timestamps:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


def str_enum[E: StrEnum](enum_cls: type[E]) -> SAEnum:
    """Store an enum as a plain string column (native PG enums make migrations painful)."""
    return SAEnum(
        enum_cls,
        native_enum=False,
        create_constraint=False,
        length=max(len(member.value) for member in enum_cls),
        values_callable=lambda members: [member.value for member in members],
    )
