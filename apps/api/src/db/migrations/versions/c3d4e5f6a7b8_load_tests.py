"""load_tests

Revision ID: c3d4e5f6a7b8
Revises: b2c3d4e5f6a7
Create Date: 2026-05-25 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "c3d4e5f6a7b8"
down_revision: Union[str, Sequence[str], None] = "b2c3d4e5f6a7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

loadtesttype = postgresql.ENUM(
    "per-second",
    "per-test",
    "maintain-load",
    name="loadtesttype",
    create_type=False,
)
loadteststatus = postgresql.ENUM(
    "draft",
    "pending",
    "running",
    "complete",
    name="loadteststatus",
    create_type=False,
)
loadtesturlsource = postgresql.ENUM(
    "manual",
    "openapi",
    name="loadtesturlsource",
    create_type=False,
)
loadtestresultstatus = postgresql.ENUM(
    "not_ready",
    "ready",
    name="loadtestresultstatus",
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    loadtesttype.create(op.get_bind(), checkfirst=True)
    loadteststatus.create(op.get_bind(), checkfirst=True)
    loadtesturlsource.create(op.get_bind(), checkfirst=True)
    loadtestresultstatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "load_tests",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("host_id", sa.UUID(), nullable=False),
        sa.Column("created_by_user_id", sa.UUID(), nullable=False),
        sa.Column("url_source", loadtesturlsource, nullable=False),
        sa.Column("test_type", loadtesttype, nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=False),
        sa.Column("initial_clients", sa.Integer(), nullable=False),
        sa.Column("total_clients", sa.Integer(), nullable=False),
        sa.Column("timeout_ms", sa.Integer(), nullable=False),
        sa.Column("error_threshold_percent", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("callback_url", sa.Text(), nullable=True),
        sa.Column("callback_email", sa.String(length=320), nullable=True),
        sa.Column("scheduled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", loadteststatus, nullable=False),
        sa.Column("urls", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "openapi_spec_snapshot",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
        sa.Column("openapi_spec_filename", sa.String(length=255), nullable=True),
        sa.Column("import_summary", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
        ),
        sa.ForeignKeyConstraint(
            ["host_id"],
            ["hosts.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_load_tests_organization_id"),
        "load_tests",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_load_tests_host_id"),
        "load_tests",
        ["host_id"],
        unique=False,
    )
    op.create_index(
        "ix_load_tests_org_status",
        "load_tests",
        ["organization_id", "status"],
        unique=False,
    )

    op.create_table(
        "load_test_results",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("load_test_id", sa.UUID(), nullable=False),
        sa.Column("status", loadtestresultstatus, nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["load_test_id"],
            ["load_tests.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_load_test_results_load_test_id"),
        "load_test_results",
        ["load_test_id"],
        unique=False,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_load_test_results_load_test_id"), table_name="load_test_results")
    op.drop_table("load_test_results")

    op.drop_index("ix_load_tests_org_status", table_name="load_tests")
    op.drop_index(op.f("ix_load_tests_host_id"), table_name="load_tests")
    op.drop_index(op.f("ix_load_tests_organization_id"), table_name="load_tests")
    op.drop_table("load_tests")

    loadtestresultstatus.drop(op.get_bind(), checkfirst=True)
    loadtesturlsource.drop(op.get_bind(), checkfirst=True)
    loadteststatus.drop(op.get_bind(), checkfirst=True)
    loadtesttype.drop(op.get_bind(), checkfirst=True)
