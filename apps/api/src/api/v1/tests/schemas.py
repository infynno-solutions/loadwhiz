import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Literal, TypeAlias

from pydantic import BaseModel, ConfigDict, EmailStr, Field, HttpUrl, field_validator, model_validator


class LoadTestTypeEnum(str, Enum):
    """How virtual clients are scheduled during a test run."""

    per_second = "per-second"
    per_test = "per-test"
    maintain_load = "maintain-load"


class LoadTestStatusEnum(str, Enum):
    """Lifecycle state of a load test configuration."""

    draft = "draft"
    pending = "pending"
    running = "running"
    complete = "complete"


class LoadTestResultStatusEnum(str, Enum):
    """Status of a single load test run."""

    not_ready = "not_ready"
    ready = "ready"
    running = "running"
    failed = "failed"
    cancelled = "cancelled"


class LoadTestUrlSourceEnum(str, Enum):
    """How the request list was created."""

    manual = "manual"
    openapi = "openapi"


class HttpBasicAuth(BaseModel):
    """Credentials for HTTP Basic Authentication."""

    model_config = ConfigDict(title="HTTP Basic Authentication")

    login: str = Field(description="Username.")
    password: str = Field(description="Password.")


HttpCredentials: TypeAlias = HttpBasicAuth


class HttpBearerAuth(BaseModel):
    """Credentials for HTTP Bearer Authentication."""

    model_config = ConfigDict(title="HTTP Bearer Authentication")

    token: str = Field(description="Token value, without the scheme prefix.")
    prefix: str = Field(
        default="Bearer",
        description='Authorization scheme prefix (for example, `Bearer`).',
    )
    header_name: str = Field(
        default="Authorization",
        description="HTTP header that carries the token.",
    )


class RequestVariable(BaseModel):
    """Value captured from a response header for use in a later request."""

    model_config = ConfigDict(title="Response Variable")

    name: str = Field(description="Variable identifier.")
    property: str = Field(
        description="Response header name to read.",
        serialization_alias="property",
    )
    source: Literal["header"] = Field(
        default="header",
        description="Extraction source. Currently only `header` is supported.",
    )


class HttpRequestConfig(BaseModel):
    """A single HTTP request executed by each virtual client in sequence."""

    model_config = ConfigDict(title="HTTP Request Step")

    url: str = Field(description="Absolute request URL.")
    request_type: Literal["GET", "POST", "PUT", "PATCH", "DELETE"] = Field(
        default="GET",
        description="HTTP method.",
    )
    credentials: HttpBasicAuth | None = Field(
        default=None,
        description="HTTP Basic Authentication credentials.",
    )
    bearer: HttpBearerAuth | None = Field(
        default=None,
        description="HTTP Bearer Authentication credentials.",
    )
    cookies: dict[str, str] | None = Field(
        default=None,
        description="Cookies to send with the request, as name-value pairs.",
    )
    headers: dict[str, str] = Field(
        default_factory=dict,
        description="Additional HTTP request headers.",
    )
    request_params: dict[str, str] = Field(
        default_factory=dict,
        description="Query string parameters.",
    )
    raw_post_body: str | None = Field(
        default=None,
        description="Request body content for methods that send a body.",
    )
    payload_file_url: str | None = Field(
        default=None,
        description="URL of an external payload file for per-client request data.",
    )
    variables: list[RequestVariable] = Field(
        default_factory=list,
        description="Variables extracted from prior responses in the sequence.",
    )
    auth_hint: str | None = Field(
        default=None,
        description=(
            "Authentication required for this endpoint when importing from OpenAPI "
            "and credentials were not present in the specification. "
            "Configure `credentials`, `bearer`, or `cookies` before execution."
        ),
    )


class LoadTestConfigFields(BaseModel):
    test_type: LoadTestTypeEnum = Field(
        default=LoadTestTypeEnum.per_test,
        description=(
            "Client scheduling mode. "
            "`per-test`: distribute clients evenly across the duration. "
            "`per-second`: start the client count every second. "
            "`maintain-load`: repeat the request sequence for the full duration."
        ),
    )
    duration: int = Field(gt=0, description="Test duration, in seconds.")
    total: int = Field(
        ge=15,
        description="Total number of virtual clients. Minimum is 15.",
    )
    initial: int = Field(
        default=0,
        ge=0,
        description="Clients active at start. Applies only when `test_type` is `maintain-load`.",
    )
    timeout: int = Field(
        default=10000,
        gt=0,
        description="Per-request timeout, in milliseconds.",
    )
    error_threshold: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Maximum acceptable error rate, as a percentage (0–100).",
    )
    name: str | None = Field(default=None, description="Display name for the load test.")
    notes: str | None = Field(default=None, description="Optional notes.")
    callback: HttpUrl | str | None = Field(
        default=None,
        description="Webhook invoked when a test run completes.",
    )
    callback_email: EmailStr | None = Field(
        default=None,
        description="Email address notified when a test run completes.",
    )
    scheduled_at: datetime | str | None = Field(
        default=None,
        description="Scheduled start time (ISO-8601 or `YYYY-MM-DD HH:MM` in UTC).",
    )

    @field_validator("test_type", mode="before")
    @classmethod
    def normalize_test_type(cls, value: object) -> object:
        if isinstance(value, str):
            aliases = {
                "non-cycling": LoadTestTypeEnum.per_test,
                "cycling": LoadTestTypeEnum.maintain_load,
            }
            if value in aliases:
                return aliases[value]
        return value


class CreateLoadTestRequest(LoadTestConfigFields):
    """Request body for creating a load test with a JSON payload."""

    model_config = ConfigDict(
        title="Create Load Test",
        json_schema_extra={
            "examples": [
                {
                    "url_source": "manual",
                    "host_id": "b27aa17b-db7a-176c-56bb-ad1c-7bba14cf",
                    "name": "API health check",
                    "test_type": "per-test",
                    "duration": 60,
                    "total": 250,
                    "urls": [
                        {
                            "url": "https://api.example.com/health",
                            "request_type": "GET",
                            "bearer": {"token": "<access-token>"},
                        }
                    ],
                }
            ]
        },
    )

    url_source: LoadTestUrlSourceEnum = Field(
        description="`manual`: provide `urls`. `openapi`: provide `openapi_document`.",
    )
    host_id: uuid.UUID = Field(description="ID of a verified target host.")
    urls: list[HttpRequestConfig] | None = Field(
        default=None,
        description="Ordered HTTP requests. Required when `url_source` is `manual`.",
    )
    openapi_document: dict[str, Any] | None = Field(
        default=None,
        description="OpenAPI 3.0 or 3.1 document. Required when `url_source` is `openapi`.",
    )
    include_operations: list[str] | None = Field(
        default=None,
        description='Operation filter allowlist, for example `["GET /v1/health"]`.',
    )
    exclude_operations: list[str] | None = Field(
        default=None,
        description="Operation filter denylist.",
    )

    @model_validator(mode="after")
    def validate_url_source_input(self) -> "CreateLoadTestRequest":
        if self.url_source == LoadTestUrlSourceEnum.manual:
            if not self.urls or len(self.urls) < 1:
                raise ValueError("urls is required when url_source is manual")
            if self.openapi_document is not None:
                raise ValueError("openapi_document is not allowed when url_source is manual")
        elif self.url_source == LoadTestUrlSourceEnum.openapi:
            if self.urls is not None:
                raise ValueError("urls must not be set when url_source is openapi")
            if self.openapi_document is None:
                raise ValueError(
                    "openapi_document is required when url_source is openapi; "
                    "use POST /from-openapi to upload a specification file"
                )
        return self


class UpdateLoadTestRequest(BaseModel):
    """Request body for updating a load test in `draft` status."""

    model_config = ConfigDict(title="Update Load Test")

    test_type: LoadTestTypeEnum | None = None
    duration: int | None = Field(default=None, gt=0)
    total: int | None = Field(default=None, ge=15)
    initial: int | None = Field(default=None, ge=0)
    timeout: int | None = Field(default=None, gt=0)
    error_threshold: int | None = Field(default=None, ge=0, le=100)
    name: str | None = None
    notes: str | None = None
    callback: HttpUrl | str | None = None
    callback_email: EmailStr | None = None
    scheduled_at: datetime | str | None = None
    url_source: LoadTestUrlSourceEnum | None = None
    urls: list[HttpRequestConfig] | None = None

    @field_validator("test_type", mode="before")
    @classmethod
    def normalize_test_type(cls, value: object) -> object:
        if isinstance(value, str):
            aliases = {
                "non-cycling": LoadTestTypeEnum.per_test,
                "cycling": LoadTestTypeEnum.maintain_load,
            }
            if value in aliases:
                return aliases[value]
        return value


class LoadTestResponse(BaseModel):
    """Load test configuration."""

    model_config = ConfigDict(title="Load Test")

    test_id: uuid.UUID = Field(description="Unique load test identifier.")
    status: LoadTestStatusEnum = Field(description="Current lifecycle status.")
    url_source: LoadTestUrlSourceEnum = Field(
        description="Whether requests were defined manually or imported from OpenAPI.",
    )
    host_id: uuid.UUID = Field(description="Target host identifier.")
    test_type: LoadTestTypeEnum
    duration: int
    total: int
    initial: int
    timeout: int
    error_threshold: int
    urls: list[HttpRequestConfig]
    name: str | None = None
    notes: str | None = None
    callback: str | None = None
    callback_email: str | None = None
    scheduled_at: datetime | None = None
    openapi_spec_filename: str | None = Field(
        default=None,
        description="Source specification filename, when imported from a file upload.",
    )
    import_summary: dict[str, Any] | None = Field(
        default=None,
        description="Statistics from the most recent OpenAPI import, if applicable.",
    )
    created_at: datetime
    updated_at: datetime
    latest_result: "LoadTestResultSummary | None" = Field(
        default=None,
        description="Most recent run summary, when available.",
    )


class LoadTestResultMetrics(BaseModel):
    total_requests: int = 0
    error_rate_percent: float = 0.0
    rps: float = 0.0
    p95_ms: float | None = None
    avg_ms: float | None = None
    duration_seconds: float | None = None


class LoadTestResultSummary(BaseModel):
    model_config = ConfigDict(title="Load Test Result")

    result_id: uuid.UUID
    test_id: uuid.UUID
    status: LoadTestResultStatusEnum
    started_at: datetime | None = None
    finished_at: datetime | None = None
    passed: bool | None = None
    metrics: LoadTestResultMetrics | None = None
    exit_code: int | None = None
    error_message: str | None = None
    created_at: datetime


class DashboardMeta(BaseModel):
    test_name: str
    test_id: uuid.UUID
    result_id: uuid.UUID
    status: LoadTestResultStatusEnum
    passed: bool | None = None
    started_at: datetime | None = None
    finished_at: datetime | None = None
    load_description: str
    test_type: LoadTestTypeEnum
    duration_seconds: int
    total_clients: int
    error_threshold_percent: int
    can_abort: bool = False
    partial: bool = Field(
        default=False,
        description="True while the run is in progress and metrics may still update.",
    )


class DashboardOverview(BaseModel):
    avg_response_ms: float | None = None
    error_rate_percent: float = 0.0
    total_requests: int = 0
    rps: float = 0.0


class DashboardResponseTimes(BaseModel):
    avg_ms: float | None = None
    min_ms: float | None = None
    max_ms: float | None = None
    med_ms: float | None = None
    p90_ms: float | None = None
    p95_ms: float | None = None


class DashboardResponseCounts(BaseModel):
    total: int = 0
    success: int = 0
    timeout: int = 0
    error_4xx: int = 0
    error_5xx: int = 0
    network_errors: int = 0


class DashboardBandwidth(BaseModel):
    bytes_sent: int = 0
    bytes_received: int = 0


class DashboardRedirects(BaseModel):
    valid: int = 0
    invalid: int = 0


class DashboardAggregates(BaseModel):
    response_times: DashboardResponseTimes
    response_counts: DashboardResponseCounts
    bandwidth: DashboardBandwidth
    redirects: DashboardRedirects


class DashboardTimeseriesPoint(BaseModel):
    offset_sec: int
    active_clients: int = 0
    avg_response_ms: float | None = None
    requests: int = 0
    bytes_sent: int = 0
    bytes_received: int = 0
    error_count: int = 0


class DashboardByUrl(BaseModel):
    url: str
    method: str
    label: str
    requests: int = 0
    success: int = 0
    avg_ms: float | None = None
    min_ms: float | None = None
    max_ms: float | None = None
    error_rate_percent: float = 0.0


class DashboardDistributionBucket(BaseModel):
    bucket_start_ms: int
    bucket_end_ms: int
    count: int


class LoadTestResultDashboardResponse(BaseModel):
    model_config = ConfigDict(title="Load Test Result Dashboard")

    version: int = 1
    meta: DashboardMeta
    overview: DashboardOverview
    aggregates: DashboardAggregates
    timeseries: list[DashboardTimeseriesPoint] = Field(default_factory=list)
    by_url: list[DashboardByUrl] = Field(default_factory=list)
    distribution: list[DashboardDistributionBucket] = Field(default_factory=list)


class RunLoadTestResponse(LoadTestResultSummary):
    model_config = ConfigDict(title="Run Load Test")


class StopLoadTestResponse(BaseModel):
    message: str
    test_id: uuid.UUID
    result_id: uuid.UUID


class MessageResponse(BaseModel):
    message: str = Field(description="Human-readable result message.")


class SpecInfo(BaseModel):
    """Summary of an imported OpenAPI document."""

    title: str | None = Field(default=None, description="API title from the specification.")
    version: str | None = Field(default=None, description="API version from the specification.")
    servers: list[str] = Field(
        default_factory=list,
        description="Base URLs declared in the specification.",
    )


class ImportedOperation(BaseModel):
    """HTTP operation matched during OpenAPI import preview."""

    operation_id: str = Field(description="Operation identifier (`METHOD path`).")
    method: str
    path: str
    url: str = Field(description="Resolved absolute URL.")
    request_type: str
    headers: dict[str, str] = Field(default_factory=dict)
    request_params: dict[str, str] = Field(default_factory=dict)
    raw_post_body: str | None = None
    credentials: HttpBasicAuth | None = None
    bearer: HttpBearerAuth | None = None
    cookies: dict[str, str] | None = None
    auth_hint: str | None = None


class SkippedOperation(BaseModel):
    """Operation excluded during OpenAPI import preview."""

    operation_id: str
    method: str
    path: str
    reason: str = Field(description="Reason the operation was skipped.")


class ImportSummary(BaseModel):
    total_operations: int = Field(description="Operations discovered in the specification.")
    matched: int = Field(description="Operations matching the target host.")
    skipped: int = Field(description="Operations excluded from import.")


class OpenApiImportPreview(BaseModel):
    """Result of previewing an OpenAPI import without creating a load test."""

    model_config = ConfigDict(title="OpenAPI Import Preview")

    host_id: uuid.UUID
    hostname: str
    spec_info: SpecInfo
    operations: list[ImportedOperation]
    skipped: list[SkippedOperation]
    summary: ImportSummary
