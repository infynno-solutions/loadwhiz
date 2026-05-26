"""organizations

Revision ID: a1b2c3d4e5f6
Revises: ebf6e29e4c0c
Create Date: 2026-05-22 16:00:00.000000

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, Sequence[str], None] = "ebf6e29e4c0c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

memberrole = postgresql.ENUM(
    "owner",
    "admin",
    "member",
    name="memberrole",
    create_type=False,
)
invitestatus = postgresql.ENUM(
    "pending",
    "accepted",
    "declined",
    "expired",
    "revoked",
    name="invitestatus",
    create_type=False,
)


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "organizations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("slug", sa.String(length=255), nullable=False),
        sa.Column("stripe_customer_id", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_slug"), "organizations", ["slug"], unique=True)

    op.add_column(
        "users",
        sa.Column("onboarding_completed", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.add_column(
        "users",
        sa.Column("active_organization_id", sa.UUID(), nullable=True),
    )
    op.create_foreign_key(
        "fk_users_active_organization_id",
        "users",
        "organizations",
        ["active_organization_id"],
        ["id"],
        ondelete="SET NULL",
    )

    memberrole.create(op.get_bind(), checkfirst=True)
    invitestatus.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "organization_members",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("role", memberrole, nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "user_id", name="uq_org_member"),
    )
    op.create_index(
        op.f("ix_organization_members_organization_id"),
        "organization_members",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_members_user_id"),
        "organization_members",
        ["user_id"],
        unique=False,
    )

    op.create_table(
        "organization_invites",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("organization_id", sa.UUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("role", memberrole, nullable=False),
        sa.Column("token", sa.String(length=255), nullable=False),
        sa.Column("invited_by_user_id", sa.UUID(), nullable=False),
        sa.Column("status", invitestatus, nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(
            ["organization_id"],
            ["organizations.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["invited_by_user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_organization_invites_email"),
        "organization_invites",
        ["email"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_invites_organization_id"),
        "organization_invites",
        ["organization_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_organization_invites_token"),
        "organization_invites",
        ["token"],
        unique=True,
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_index(op.f("ix_organization_invites_token"), table_name="organization_invites")
    op.drop_index(
        op.f("ix_organization_invites_organization_id"),
        table_name="organization_invites",
    )
    op.drop_index(op.f("ix_organization_invites_email"), table_name="organization_invites")
    op.drop_table("organization_invites")

    op.drop_index(op.f("ix_organization_members_user_id"), table_name="organization_members")
    op.drop_index(
        op.f("ix_organization_members_organization_id"),
        table_name="organization_members",
    )
    op.drop_table("organization_members")

    op.drop_constraint("fk_users_active_organization_id", "users", type_="foreignkey")
    op.drop_column("users", "active_organization_id")
    op.drop_column("users", "onboarding_completed")

    op.drop_index(op.f("ix_organizations_slug"), table_name="organizations")
    op.drop_table("organizations")

    invitestatus.drop(op.get_bind(), checkfirst=True)
    memberrole.drop(op.get_bind(), checkfirst=True)
