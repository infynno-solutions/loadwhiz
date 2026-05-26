import datetime
import enum
import uuid

from sqlalchemy import DateTime, Enum, ForeignKey, Index, Integer, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


class VerificationMethod(str, enum.Enum):
    dns = "dns"
    http = "http"


class HostStatus(str, enum.Enum):
    pending = "pending"
    verified = "verified"
    failed = "failed"


class Host(Base):
    __tablename__ = "hosts"
    __table_args__ = (
        UniqueConstraint("organization_id", "hostname", name="uq_host_org_hostname"),
        Index("ix_hosts_status_deadline", "status", "verification_deadline"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    organization_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    hostname: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    original_input: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
    )

    verification_method: Mapped[VerificationMethod] = mapped_column(
        Enum(VerificationMethod, name="verificationmethod"),
        nullable=False,
    )

    status: Mapped[HostStatus] = mapped_column(
        Enum(HostStatus, name="hoststatus"),
        nullable=False,
        default=HostStatus.pending,
        index=True,
    )

    verification_token: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
    )

    verification_started_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    verification_deadline: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    last_checked_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    last_check_error: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )

    check_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    verified_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    failed_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.datetime.now,
    )

    updated_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.datetime.now,
        onupdate=datetime.datetime.now,
    )
