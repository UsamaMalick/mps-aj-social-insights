"""create core tables

Revision ID: 5d365e9da01e
Revises:
Create Date: 2026-11-27 11:38:16.190599
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "5d365e9da01e"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "accounts",
        sa.Column(
            "platform",
            sa.Enum("instagram", "facebook", name="platform", native_enum=False),
            nullable=False,
        ),
        sa.Column("handle", sa.String(length=100), nullable=False),
        sa.Column("display_name", sa.String(length=200), nullable=False),
        sa.Column("is_own", sa.Boolean(), nullable=False),
        sa.Column("followers_count", sa.Integer(), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_accounts")),
        sa.UniqueConstraint("platform", "handle", name=op.f("uq_accounts_platform_handle")),
    )
    op.create_table(
        "recommendations",
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("suggestion", sa.Text(), nullable=False),
        sa.Column(
            "category",
            sa.Enum(
                "format",
                "style",
                "hook",
                "timing",
                "language",
                name="recommendationcategory",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column("evidence", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "status",
            sa.Enum("new", "accepted", "dismissed", name="recommendationstatus", native_enum=False),
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.Enum("llm", "template", name="recommendationsource", native_enum=False),
            nullable=False,
        ),
        sa.Column("prompt_version", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_recommendations")),
    )
    op.create_table(
        "posts",
        sa.Column("account_id", sa.Uuid(), nullable=False),
        sa.Column(
            "platform",
            sa.Enum("instagram", "facebook", name="platform", native_enum=False),
            nullable=False,
        ),
        sa.Column("external_id", sa.String(length=100), nullable=False),
        sa.Column(
            "media_type",
            sa.Enum("image", "video", "reel", "carousel", name="mediatype", native_enum=False),
            nullable=False,
        ),
        sa.Column("caption", sa.Text(), nullable=False),
        sa.Column(
            "language", sa.Enum("ar", "en", name="language", native_enum=False), nullable=False
        ),
        sa.Column("posted_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("url", sa.String(length=500), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["account_id"],
            ["accounts.id"],
            name=op.f("fk_posts_account_id_accounts"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_posts")),
        sa.UniqueConstraint("platform", "external_id", name=op.f("uq_posts_platform_external_id")),
    )
    op.create_index(op.f("ix_posts_account_id"), "posts", ["account_id"], unique=False)
    op.create_index(op.f("ix_posts_posted_at"), "posts", ["posted_at"], unique=False)
    op.create_table(
        "metric_snapshots",
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column("hours_since_post", sa.Integer(), nullable=False),
        sa.Column("likes", sa.Integer(), nullable=False),
        sa.Column("comments", sa.Integer(), nullable=False),
        sa.Column("shares", sa.Integer(), nullable=False),
        sa.Column("views", sa.Integer(), nullable=False),
        sa.Column("saves", sa.Integer(), nullable=True),
        sa.Column("reach", sa.Integer(), nullable=True),
        sa.Column("clicks", sa.Integer(), nullable=True),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.CheckConstraint(
            "hours_since_post IN (24, 72)", name=op.f("ck_metric_snapshots_hours_since_post_valid")
        ),
        sa.ForeignKeyConstraint(
            ["post_id"],
            ["posts.id"],
            name=op.f("fk_metric_snapshots_post_id_posts"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_metric_snapshots")),
        sa.UniqueConstraint(
            "post_id", "hours_since_post", name=op.f("uq_metric_snapshots_post_id_hours_since_post")
        ),
    )
    op.create_table(
        "post_tags",
        sa.Column("post_id", sa.Uuid(), nullable=False),
        sa.Column(
            "topic",
            sa.Enum(
                "politics",
                "conflict",
                "economy",
                "climate",
                "health",
                "technology",
                "sports",
                "culture",
                name="topic",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "region",
            sa.Enum(
                "middle_east",
                "africa",
                "europe",
                "asia",
                "americas",
                "global",
                name="region",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "story_type",
            sa.Enum(
                "breaking",
                "explainer",
                "human_interest",
                "analysis",
                "live_update",
                name="storytype",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "hook_style",
            sa.Enum(
                "question",
                "statistic",
                "quote",
                "bold_claim",
                "straight_news",
                name="hookstyle",
                native_enum=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "tone",
            sa.Enum(
                "neutral", "urgent", "emotional", "informative", name="tone", native_enum=False
            ),
            nullable=False,
        ),
        sa.Column(
            "source", sa.Enum("llm", "rules", name="tagsource", native_enum=False), nullable=False
        ),
        sa.Column("prompt_version", sa.String(length=50), nullable=False),
        sa.Column("model", sa.String(length=100), nullable=False),
        sa.Column("id", sa.Uuid(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["post_id"], ["posts.id"], name=op.f("fk_post_tags_post_id_posts"), ondelete="CASCADE"
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("pk_post_tags")),
        sa.UniqueConstraint("post_id", name=op.f("uq_post_tags_post_id")),
    )


def downgrade() -> None:
    op.drop_table("post_tags")
    op.drop_table("metric_snapshots")
    op.drop_index(op.f("ix_posts_posted_at"), table_name="posts")
    op.drop_index(op.f("ix_posts_account_id"), table_name="posts")
    op.drop_table("posts")
    op.drop_table("recommendations")
    op.drop_table("accounts")
