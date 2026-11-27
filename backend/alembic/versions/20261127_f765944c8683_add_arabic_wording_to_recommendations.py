"""add arabic wording to recommendations

Revision ID: f765944c8683
Revises: 5d365e9da01e
Create Date: 2026-11-27 20:10:26.169029
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op


revision: str = "f765944c8683"
down_revision: str | None = "5d365e9da01e"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("recommendations", sa.Column("title_ar", sa.String(length=200), nullable=True))
    op.add_column("recommendations", sa.Column("suggestion_ar", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("recommendations", "suggestion_ar")
    op.drop_column("recommendations", "title_ar")
