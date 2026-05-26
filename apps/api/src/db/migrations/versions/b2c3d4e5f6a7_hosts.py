"""hosts

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-05-22 21:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, Sequence[str], None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

verificationmethod = postgresql.ENUM(
    "dns",
    "http",
    name="verificationmethod",
    create_type=False,
)
hoststatus = postgresql.ENUM(
    "pending",
    "verified",
    "failed",
    name="hoststatus",
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    verificationmethod.create(op.get_bind(), checkfirst=True)
    hoststatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "hosts",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("hostname", sa.String(length=255), nullable=False),
        sa.Column("original_input", sa.String(length=2048), nullable=False),
        sa.Column("verification_method", verificationmethod, nullable=False),
        sa.Column("status", hoststatus, nullable=False),
        sa.Column("verification_token", sa.String(length=64), nullable=False),
        sa.Column("verification_started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("verification_deadline", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_checked_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_check_error", sa.String(length=512), nullable=True),
        sa.Column("check_count", sa.Integer(), nullable=False),
        sa.Column("verified_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("failed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "hostname", name="uq_host_org_hostname"),
    )
    op.create_index(
        op.f("ix_hosts_organization_id"),
        "hosts",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_hosts_status"),
        "hosts",
        ["status"],
        unique=False,
    )
    op.create_index(
        "ix_hosts_status_deadline",
        "hosts",
        ["status", "verification_deadline"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index("ix_hosts_status_deadline", table_name="hosts")
    op.drop_index(op.f("ix_hosts_status"), table_name="hosts")
    op.drop_index(op.f("ix_hosts_organization_id"), table_name="hosts")
    op.drop_table("hosts")

    hoststatus.drop(op.get_bind(), checkfirst=True)
    verificationmethod.drop(op.get_bind(), checkfirst=True)
