import datetime
import enum
import uuid

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from src.db.base import Base


def _enum_values(enum_cls: type[enum.Enum]) -> list[str]:
    return [member.value for member in enum_cls]


class LoadTestType(str, enum.Enum):
    per_second = "per-second"
    per_test = "per-test"
    maintain_load = "maintain-load"


class LoadTestStatus(str, enum.Enum):
    draft = "draft"
    pending = "pending"
    running = "running"
    complete = "complete"


class LoadTestUrlSource(str, enum.Enum):
    manual = "manual"
    openapi = "openapi"


class LoadTestResultStatus(str, enum.Enum):
    not_ready = "not_ready"
    ready = "ready"
    running = "running"
    failed = "failed"
    cancelled = "cancelled"


class LoadTest(Base):
    __tablename__ = "load_tests"
    __table_args__ = (
        Index("ix_load_tests_org_status", "organization_id", "status"),
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

    host_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("hosts.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
    )

    url_source: Mapped[LoadTestUrlSource] = mapped_column(
        Enum(
            LoadTestUrlSource,
            name="loadtesturlsource",
            values_callable=_enum_values,
        ),
        nullable=False,
    )

    test_type: Mapped[LoadTestType] = mapped_column(
        Enum(
            LoadTestType,
            name="loadtesttype",
            values_callable=_enum_values,
        ),
        nullable=False,
        default=LoadTestType.per_test,
    )

    duration_seconds: Mapped[int] = mapped_column(Integer, nullable=False)
    initial_clients: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total_clients: Mapped[int] = mapped_column(Integer, nullable=False)
    timeout_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=10000)
    error_threshold_percent: Mapped[int] = mapped_column(
        Integer, nullable=False, default=50
    )

    name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    callback_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    callback_email: Mapped[str | None] = mapped_column(String(320), nullable=True)
    scheduled_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[LoadTestStatus] = mapped_column(
        Enum(
            LoadTestStatus,
            name="loadteststatus",
            values_callable=_enum_values,
        ),
        nullable=False,
        default=LoadTestStatus.draft,
    )

    urls: Mapped[list] = mapped_column(JSONB, nullable=False)

    openapi_spec_snapshot: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    openapi_spec_filename: Mapped[str | None] = mapped_column(String(255), nullable=True)
    import_summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    last_run_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    active_result_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("load_test_results.id", ondelete="SET NULL"),
        nullable=True,
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


class LoadTestResult(Base):
    __tablename__ = "load_test_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    load_test_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("load_tests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    status: Mapped[LoadTestResultStatus] = mapped_column(
        Enum(
            LoadTestResultStatus,
            name="loadtestresultstatus",
            values_callable=_enum_values,
        ),
        nullable=False,
    )

    started_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    finished_at: Mapped[datetime.datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    container_id: Mapped[str | None] = mapped_column(String(128), nullable=True)

    exit_code: Mapped[int | None] = mapped_column(Integer, nullable=True)

    summary: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    dashboard: Mapped[dict | None] = mapped_column(JSONB, nullable=True)

    passed: Mapped[bool | None] = mapped_column(Boolean, nullable=True)

    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    created_at: Mapped[datetime.datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=datetime.datetime.now,
    )
