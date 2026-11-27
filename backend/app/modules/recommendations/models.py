from typing import Any

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.shared.enums import RecommendationCategory, RecommendationSource, RecommendationStatus
from app.shared.models import Timestamps, UUIDPrimaryKey, str_enum

TITLE_MAX_LENGTH = 200
PROMPT_VERSION_MAX_LENGTH = 50
MODEL_NAME_MAX_LENGTH = 100


class Recommendation(UUIDPrimaryKey, Timestamps, Base):
    """A suggestion on *how* to tell stories, stored with the evidence behind it."""

    __tablename__ = "recommendations"

    title: Mapped[str] = mapped_column(String(TITLE_MAX_LENGTH))
    suggestion: Mapped[str] = mapped_column(Text)
    category: Mapped[RecommendationCategory] = mapped_column(str_enum(RecommendationCategory))
    evidence: Mapped[dict[str, Any]] = mapped_column(JSONB)
    status: Mapped[RecommendationStatus] = mapped_column(
        str_enum(RecommendationStatus), default=RecommendationStatus.NEW
    )
    source: Mapped[RecommendationSource] = mapped_column(str_enum(RecommendationSource))
    prompt_version: Mapped[str] = mapped_column(String(PROMPT_VERSION_MAX_LENGTH))
    model: Mapped[str] = mapped_column(String(MODEL_NAME_MAX_LENGTH))
