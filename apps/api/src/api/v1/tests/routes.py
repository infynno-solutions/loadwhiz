import json
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.tests.schemas import (
    CreateLoadTestRequest,
    LoadTestResponse,
    LoadTestResultDashboardResponse,
    LoadTestResultSummary,
    LoadTestTypeEnum,
    LoadTestUrlSourceEnum,
    MessageResponse,
    OpenApiImportPreview,
    RunLoadTestResponse,
    StopLoadTestResponse,
    UpdateLoadTestRequest,
)
from src.core.dependencies import get_current_user
from src.core.org_dependencies import get_org_member, require_org_roles
from src.db.session import get_db
from src.models.organization_member import MemberRole, OrganizationMember
from src.models.user import User
from src.repositories.host_repository import HostRepository
from src.repositories.load_test_repository import LoadTestRepository
from src.repositories.load_test_result_repository import LoadTestResultRepository
from src.services.load_test_run_service import LoadTestRunService
from src.services.load_test_service import LoadTestService

router = APIRouter(tags=["load-tests"])


def get_load_test_service(db: AsyncSession = Depends(get_db)) -> LoadTestService:
    return LoadTestService(
        load_test_repository=LoadTestRepository(db),
        host_repository=HostRepository(db),
        result_repository=LoadTestResultRepository(db),
    )


def get_load_test_run_service(db: AsyncSession = Depends(get_db)) -> LoadTestRunService:
    return LoadTestRunService(
        load_test_repository=LoadTestRepository(db),
        result_repository=LoadTestResultRepository(db),
        host_repository=HostRepository(db),
    )


@router.post(
    "/import/preview",
    operation_id="load_tests.import.preview",
    response_model=OpenApiImportPreview,
    summary="Preview OpenAPI import",
    description=(
        "Parse an OpenAPI 3.0 or 3.1 specification and return HTTP operations that match "
        "the target host. No load test is created."
    ),
)
async def preview_openapi_import(
    org_id: uuid.UUID,
    host_id: uuid.UUID = Form(..., description="Verified target host ID."),
    spec_file: UploadFile = File(..., description="OpenAPI specification (JSON or YAML)."),
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> OpenApiImportPreview:
    return await service.preview_openapi_import(org_id, host_id, spec_file)


@router.post(
    "",
    operation_id="load_tests.create",
    status_code=status.HTTP_201_CREATED,
    response_model=LoadTestResponse,
    summary="Create load test",
    description=(
        "Create a load test configuration in `draft` status.\n\n"
        "- Set `url_source` to `manual` and provide `urls` to define requests directly.\n"
        "- Set `url_source` to `openapi` and provide `openapi_document` to import from an inline specification.\n"
        "- To upload a specification file, use `POST /from-openapi` instead."
    ),
    responses={
        404: {"description": "Organization or host not found."},
        422: {"description": "Request validation failed."},
    },
)
async def create_test(
    org_id: uuid.UUID,
    body: CreateLoadTestRequest,
    service: LoadTestService = Depends(get_load_test_service),
    current_user: User = Depends(get_current_user),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> LoadTestResponse:
    return await service.create_test(org_id, current_user.id, body)


@router.post(
    "/from-openapi",
    operation_id="load_tests.create.from_openapi",
    status_code=status.HTTP_201_CREATED,
    response_model=LoadTestResponse,
    summary="Create load test from specification file",
    description=(
        "Create a load test by uploading an OpenAPI 3.0 or 3.1 specification file. "
        "Request URLs are generated from operations whose host matches the verified target host."
    ),
    responses={
        404: {"description": "Organization or host not found."},
        422: {"description": "Request validation failed."},
    },
)
async def create_test_from_openapi(
    org_id: uuid.UUID,
    host_id: uuid.UUID = Form(..., description="Verified target host ID."),
    duration: int = Form(..., gt=0, description="Test duration, in seconds."),
    total: int = Form(..., ge=15, description="Total virtual clients (minimum 15)."),
    spec_file: UploadFile = File(..., description="OpenAPI specification (JSON or YAML)."),
    test_type: LoadTestTypeEnum = Form(
        default=LoadTestTypeEnum.per_test,
        description="Client scheduling mode.",
    ),
    initial: int = Form(
        default=0,
        ge=0,
        description="Initial clients (`maintain-load` only).",
    ),
    timeout: int = Form(
        default=10000,
        gt=0,
        description="Per-request timeout, in milliseconds.",
    ),
    error_threshold: int = Form(
        default=50,
        ge=0,
        le=100,
        description="Maximum error rate, as a percentage.",
    ),
    name: str | None = Form(default=None, description="Display name."),
    notes: str | None = Form(default=None, description="Optional notes."),
    callback: str | None = Form(default=None, description="Completion webhook URL."),
    callback_email: str | None = Form(default=None, description="Completion notification email."),
    scheduled_at: str | None = Form(
        default=None,
        description="Scheduled start time (ISO-8601 or `YYYY-MM-DD HH:MM` UTC).",
    ),
    include_operations: str | None = Form(
        default=None,
        description='JSON array allowlist, for example `["GET /v1/health"]`.',
    ),
    exclude_operations: str | None = Form(
        default=None,
        description="JSON array denylist of operations.",
    ),
    service: LoadTestService = Depends(get_load_test_service),
    current_user: User = Depends(get_current_user),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> LoadTestResponse:
    try:
        include_list = json.loads(include_operations) if include_operations else None
        exclude_list = json.loads(exclude_operations) if exclude_operations else None
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="include_operations and exclude_operations must be valid JSON arrays",
        ) from exc

    create_body = CreateLoadTestRequest.model_construct(
        url_source=LoadTestUrlSourceEnum.openapi,
        host_id=host_id,
        duration=duration,
        total=total,
        test_type=test_type,
        initial=initial,
        timeout=timeout,
        error_threshold=error_threshold,
        name=name,
        notes=notes,
        callback=callback,
        callback_email=callback_email,
        scheduled_at=scheduled_at,
        include_operations=include_list,
        exclude_operations=exclude_list,
        urls=None,
        openapi_document=None,
    )
    return await service.create_test(
        org_id, current_user.id, create_body, spec_file=spec_file
    )


@router.get(
    "",
    operation_id="load_tests.list",
    response_model=list[LoadTestResponse],
    summary="List load tests",
    description="Returns load tests for the organization. Optionally filter by target host.",
)
async def list_tests(
    org_id: uuid.UUID,
    host_id: uuid.UUID | None = None,
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> list[LoadTestResponse]:
    return await service.list_tests(org_id, host_id)


@router.get(
    "/{test_id}",
    operation_id="load_tests.get",
    response_model=LoadTestResponse,
    summary="Get load test",
    description="Retrieve a load test configuration by identifier.",
    responses={
        401: {"description": "Authentication required."},
        403: {"description": "Not a member of this organization."},
        404: {"description": "Load test not found."},
    },
)
async def get_test(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> LoadTestResponse:
    return await service.get_test(org_id, test_id)


@router.patch(
    "/{test_id}",
    operation_id="load_tests.update",
    response_model=LoadTestResponse,
    summary="Update load test",
    description="Update a load test while it is in `draft` status.",
    responses={
        404: {"description": "Load test not found."},
        409: {"description": "Load test is not in draft status."},
        422: {"description": "Request validation failed."},
    },
)
async def update_test(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    body: UpdateLoadTestRequest,
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> LoadTestResponse:
    return await service.update_test(org_id, test_id, body)


@router.patch(
    "/{test_id}/from-openapi",
    operation_id="load_tests.update.from_openapi",
    response_model=LoadTestResponse,
    summary="Update load test from specification file",
    description=(
        "Replace request URLs by re-importing an OpenAPI specification file. "
        "Available only while the load test is in `draft` status."
    ),
    responses={
        404: {"description": "Load test not found."},
        409: {"description": "Load test is not in draft status."},
        422: {"description": "Request validation failed."},
    },
)
async def update_test_from_openapi(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    spec_file: UploadFile = File(..., description="OpenAPI specification (JSON or YAML)."),
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> LoadTestResponse:
    return await service.update_test(
        org_id, test_id, UpdateLoadTestRequest(), spec_file=spec_file
    )


@router.delete(
    "/{test_id}",
    operation_id="load_tests.delete",
    response_model=MessageResponse,
    summary="Delete load test",
    description="Delete a load test. Not allowed while a test is `pending` or `running`.",
    responses={
        404: {"description": "Load test not found."},
        409: {"description": "Load test cannot be deleted in its current status."},
    },
)
async def delete_test(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    service: LoadTestService = Depends(get_load_test_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> MessageResponse:
    return await service.delete_test(org_id, test_id)


@router.post(
    "/{test_id}/run",
    operation_id="load_tests.run",
    response_model=RunLoadTestResponse,
    summary="Run load test",
    description=(
        "Start a load test run using Grafana k6 in Docker. "
        "The test must be in `draft` or `complete` status. "
        "If `scheduled_at` is in the future, execution is deferred until that time."
    ),
    responses={
        401: {"description": "Authentication required."},
        404: {"description": "Load test or host not found."},
        409: {"description": "Test cannot be run in its current status."},
        422: {"description": "Validation failed (host, URLs, or auth)."},
        429: {"description": "Organization concurrent run limit reached."},
    },
)
async def run_test(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    service: LoadTestRunService = Depends(get_load_test_run_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> RunLoadTestResponse:
    result = await service.run_test(org_id, test_id)
    return RunLoadTestResponse(**result)


@router.post(
    "/{test_id}/stop",
    operation_id="load_tests.stop",
    response_model=StopLoadTestResponse,
    summary="Stop load test",
    description="Stop a pending or running load test by terminating the k6 container.",
    responses={
        401: {"description": "Authentication required."},
        404: {"description": "Load test not found."},
        409: {"description": "Test is not pending or running."},
    },
)
async def stop_test(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    service: LoadTestRunService = Depends(get_load_test_run_service),
    _membership: OrganizationMember = Depends(
        require_org_roles(MemberRole.owner, MemberRole.admin)
    ),
) -> StopLoadTestResponse:
    result = await service.stop_test(org_id, test_id)
    return StopLoadTestResponse(**result)


@router.get(
    "/{test_id}/results",
    operation_id="load_tests.results.list",
    response_model=list[LoadTestResultSummary],
    summary="List load test results",
    description="Returns execution history for a load test, newest first.",
    responses={
        401: {"description": "Authentication required."},
        404: {"description": "Load test not found."},
    },
)
async def list_test_results(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    service: LoadTestRunService = Depends(get_load_test_run_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> list[LoadTestResultSummary]:
    results = await service.list_results(org_id, test_id)
    return [LoadTestResultSummary(**r) for r in results]


@router.get(
    "/{test_id}/results/{result_id}",
    operation_id="load_tests.results.get",
    response_model=LoadTestResultSummary,
    summary="Get load test result",
    description="Retrieve a single run result by identifier.",
    responses={
        401: {"description": "Authentication required."},
        404: {"description": "Load test or result not found."},
    },
)
async def get_test_result(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    result_id: uuid.UUID,
    service: LoadTestRunService = Depends(get_load_test_run_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> LoadTestResultSummary:
    result = await service.get_result(org_id, test_id, result_id)
    return LoadTestResultSummary(**result)


@router.get(
    "/{test_id}/results/{result_id}/dashboard",
    operation_id="load_tests.results.dashboard",
    response_model=LoadTestResultDashboardResponse,
    summary="Get load test result dashboard",
    description=(
        "Returns chart-ready metrics for the results dashboard: overview, aggregates, "
        "time series, per-URL breakdown, and latency distribution. Raw k6 summary is "
        "not included."
    ),
    responses={
        401: {"description": "Authentication required."},
        404: {"description": "Load test, result, or dashboard data not found."},
        409: {"description": "Run is still in progress; dashboard not ready."},
    },
)
async def get_test_result_dashboard(
    org_id: uuid.UUID,
    test_id: uuid.UUID,
    result_id: uuid.UUID,
    service: LoadTestRunService = Depends(get_load_test_run_service),
    _membership: OrganizationMember = Depends(get_org_member),
) -> LoadTestResultDashboardResponse:
    dashboard = await service.get_result_dashboard(org_id, test_id, result_id)
    return LoadTestResultDashboardResponse(**dashboard)
