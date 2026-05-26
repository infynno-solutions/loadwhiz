"""load_test_results_run

Revision ID: d4e5f6a7b8c9
Revises: c3d4e5f6a7b8
Create Date: 2026-05-26 12:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "d4e5f6a7b8c9"
down_revision: Union[str, Sequence[str], None] = "c3d4e5f6a7b8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("ALTER TYPE loadtestresultstatus ADD VALUE IF NOT EXISTS 'running'")
    op.execute("ALTER TYPE loadtestresultstatus ADD VALUE IF NOT EXISTS 'failed'")
    op.execute("ALTER TYPE loadtestresultstatus ADD VALUE IF NOT EXISTS 'cancelled'")

    op.add_column(
        "load_test_results",
        sa.Column("finished_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "load_test_results",
        sa.Column("container_id", sa.String(length=128), nullable=True),
    )
    op.add_column(
        "load_test_results",
        sa.Column("exit_code", sa.Integer(), nullable=True),
    )
    op.add_column(
        "load_test_results",
        sa.Column(
            "summary",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "load_test_results",
        sa.Column(
            "metrics",
            postgresql.JSONB(astext_type=sa.Text()),
            nullable=True,
        ),
    )
    op.add_column(
        "load_test_results",
        sa.Column("passed", sa.Boolean(), nullable=True),
    )
    op.add_column(
        "load_test_results",
        sa.Column("error_message", sa.Text(), nullable=True),
    )

    op.add_column(
        "load_tests",
        sa.Column("last_run_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "load_tests",
        sa.Column("active_result_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_load_tests_active_result_id",
        "load_tests",
        "load_test_results",
        ["active_result_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_load_tests_active_result_id",
        "load_tests",
        type_="foreignkey",
    )
    op.drop_column("load_tests", "active_result_id")
    op.drop_column("load_tests", "last_run_at")

    op.drop_column("load_test_results", "error_message")
    op.drop_column("load_test_results", "passed")
    op.drop_column("load_test_results", "metrics")
    op.drop_column("load_test_results", "summary")
    op.drop_column("load_test_results", "exit_code")
    op.drop_column("load_test_results", "container_id")
    op.drop_column("load_test_results", "finished_at")
