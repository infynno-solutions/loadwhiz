from __future__ import annotations

import uuid
from datetime import UTC, datetime
from typing import Any

from fastapi import HTTPException, UploadFile, status

from src.api.v1.tests.schemas import (
    CreateLoadTestRequest,
    HttpRequestConfig,
    ImportedOperation,
    LoadTestUrlSourceEnum,
    OpenApiImportPreview,
    SkippedOperation,
    SpecInfo,
    ImportSummary,
    UpdateLoadTestRequest,
)
from src.core.config import settings
from src.core.load_test_validation import (
    parse_scheduled_at,
    serialize_http_request_configs,
    validate_host_verified,
    validate_test_type_constraints,
    validate_urls_for_host,
)
from src.core.openapi_import import (
    OpenApiImportError,
    OpenApiParseResult,
    operations_to_url_dicts,
    parse_openapi_for_host,
    parse_spec_bytes,
)
from src.models.host import Host
from src.models.load_test import (
    LoadTest,
    LoadTestStatus,
    LoadTestType,
    LoadTestUrlSource,
)
from src.repositories.host_repository import HostRepository
from src.repositories.load_test_repository import LoadTestRepository
from src.repositories.load_test_result_repository import LoadTestResultRepository


class LoadTestService:
    def __init__(
        self,
        load_test_repository: LoadTestRepository,
        host_repository: HostRepository,
        result_repository: LoadTestResultRepository | None = None,
    ):
        self.load_test_repository = load_test_repository
        self.host_repository = host_repository
        self.result_repository = result_repository

    async def preview_openapi_import(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
        spec_file: UploadFile,
    ) -> OpenApiImportPreview:
        host = await self._get_verified_host(organization_id, host_id)
        document = await self._read_spec_file(spec_file)
        try:
            result = parse_openapi_for_host(
                document,
                host.hostname,
                max_operations=settings.load_test_max_urls,
            )
        except OpenApiImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        return self._to_preview(host, result)

    async def create_test(
        self,
        organization_id: uuid.UUID,
        created_by_user_id: uuid.UUID,
        body: CreateLoadTestRequest,
        spec_file: UploadFile | None = None,
    ) -> dict:
        host = await self._get_verified_host(organization_id, body.host_id)

        if body.url_source == LoadTestUrlSourceEnum.manual:
            urls = serialize_http_request_configs(body.urls or [])
            openapi_snapshot = None
            openapi_filename = None
            import_summary = None
            url_source = LoadTestUrlSource.manual
        else:
            if spec_file is not None:
                document = await self._read_spec_file(spec_file)
                filename = spec_file.filename
            elif body.openapi_document is not None:
                document = body.openapi_document
                filename = None
            else:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="spec_file or openapi_document is required for openapi import",
                )
            try:
                result = parse_openapi_for_host(
                    document,
                    host.hostname,
                    include_operations=body.include_operations,
                    exclude_operations=body.exclude_operations,
                    max_operations=settings.load_test_max_urls,
                )
            except OpenApiImportError as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(exc),
                ) from exc
            if not result.operations:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No operations match the verified host",
                )
            urls = operations_to_url_dicts(result.operations)
            openapi_snapshot = result.spec_snapshot
            openapi_filename = filename
            import_summary = result.import_summary
            url_source = LoadTestUrlSource.openapi

        self._validate_config(host, urls, body.test_type.value, body.initial, body.total)
        scheduled_at = self._parse_scheduled(body.scheduled_at)

        now = datetime.now(UTC)
        load_test = LoadTest(
            organization_id=organization_id,
            host_id=host.id,
            created_by_user_id=created_by_user_id,
            url_source=url_source,
            test_type=LoadTestType(body.test_type.value),
            duration_seconds=body.duration,
            initial_clients=body.initial,
            total_clients=body.total,
            timeout_ms=body.timeout,
            error_threshold_percent=body.error_threshold,
            name=body.name,
            notes=body.notes,
            callback_url=str(body.callback) if body.callback else None,
            callback_email=str(body.callback_email) if body.callback_email else None,
            scheduled_at=scheduled_at,
            status=LoadTestStatus.draft,
            urls=urls,
            openapi_spec_snapshot=openapi_snapshot,
            openapi_spec_filename=openapi_filename,
            import_summary=import_summary,
            created_at=now,
            updated_at=now,
        )
        load_test = await self.load_test_repository.create(load_test)
        return await self._to_dict(load_test)

    async def list_tests(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID | None = None,
    ) -> list[dict]:
        tests = await self.load_test_repository.list_by_organization(
            organization_id, host_id
        )
        result = []
        for test in tests:
            result.append(await self._to_dict(test))
        return result

    async def get_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)
        return await self._to_dict(load_test)

    async def update_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
        body: UpdateLoadTestRequest,
        spec_file: UploadFile | None = None,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)
        if load_test.status != LoadTestStatus.draft:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Only draft tests can be updated",
            )

        host = await self.host_repository.get_by_id(load_test.host_id)
        if not host or host.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Host not found",
            )

        if spec_file is not None:
            document = await self._read_spec_file(spec_file)
            try:
                result = parse_openapi_for_host(
                    document,
                    host.hostname,
                    max_operations=settings.load_test_max_urls,
                )
            except OpenApiImportError as exc:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail=str(exc),
                ) from exc
            if not result.operations:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="No operations match the verified host",
                )
            load_test.urls = operations_to_url_dicts(result.operations)
            load_test.url_source = LoadTestUrlSource.openapi
            load_test.openapi_spec_snapshot = result.spec_snapshot
            load_test.openapi_spec_filename = spec_file.filename
            load_test.import_summary = result.import_summary

        if body.url_source == LoadTestUrlSourceEnum.manual and body.urls is not None:
            load_test.url_source = LoadTestUrlSource.manual
            load_test.urls = serialize_http_request_configs(body.urls)
            load_test.openapi_spec_snapshot = None
            load_test.openapi_spec_filename = None
            load_test.import_summary = None
        elif body.urls is not None:
            load_test.urls = serialize_http_request_configs(body.urls)

        if body.test_type is not None:
            load_test.test_type = LoadTestType(body.test_type.value)
        if body.duration is not None:
            load_test.duration_seconds = body.duration
        if body.total is not None:
            load_test.total_clients = body.total
        if body.initial is not None:
            load_test.initial_clients = body.initial
        if body.timeout is not None:
            load_test.timeout_ms = body.timeout
        if body.error_threshold is not None:
            load_test.error_threshold_percent = body.error_threshold
        if body.name is not None:
            load_test.name = body.name
        if body.notes is not None:
            load_test.notes = body.notes
        if body.callback is not None:
            load_test.callback_url = str(body.callback) if body.callback else None
        if body.callback_email is not None:
            load_test.callback_email = (
                str(body.callback_email) if body.callback_email else None
            )
        if body.scheduled_at is not None:
            load_test.scheduled_at = self._parse_scheduled(body.scheduled_at)

        self._validate_config(
            host,
            load_test.urls,
            load_test.test_type.value,
            load_test.initial_clients,
            load_test.total_clients,
        )

        load_test.updated_at = datetime.now(UTC)
        load_test = await self.load_test_repository.update(load_test)
        return await self._to_dict(load_test)

    async def delete_test(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> dict:
        load_test = await self._get_or_404(organization_id, test_id)
        if load_test.status in (LoadTestStatus.pending, LoadTestStatus.running):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Cannot delete a test that is pending or running",
            )
        await self.load_test_repository.delete(load_test)
        return {"message": "Test deleted"}

    async def _get_verified_host(
        self,
        organization_id: uuid.UUID,
        host_id: uuid.UUID,
    ) -> Host:
        host = await self.host_repository.get_by_id(host_id)
        if not host or host.organization_id != organization_id:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Host not found",
            )
        try:
            validate_host_verified(host)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc
        return host

    async def _get_or_404(
        self,
        organization_id: uuid.UUID,
        test_id: uuid.UUID,
    ) -> LoadTest:
        load_test = await self.load_test_repository.get_by_org_and_id(
            organization_id, test_id
        )
        if not load_test:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test not found",
            )
        return load_test

    async def _read_spec_file(self, spec_file: UploadFile) -> dict[str, Any]:
        content = await spec_file.read()
        if len(content) > settings.openapi_spec_max_bytes:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Spec file exceeds maximum size of {settings.openapi_spec_max_bytes} bytes",
            )
        filename = spec_file.filename or ""
        if filename and not filename.lower().endswith((".json", ".yaml", ".yml")):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Spec file must be .json, .yaml, or .yml",
            )
        try:
            return parse_spec_bytes(content, filename)
        except OpenApiImportError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

    def _validate_config(
        self,
        host: Host,
        urls: list[dict[str, Any]],
        test_type: str,
        initial: int,
        total: int,
    ) -> None:
        if not urls:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="At least one URL is required",
            )
        if len(urls) > settings.load_test_max_urls:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Maximum {settings.load_test_max_urls} URLs per test",
            )
        try:
            validate_urls_for_host(urls, host)
            validate_test_type_constraints(LoadTestType(test_type), initial, total)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

    def _parse_scheduled(self, value: datetime | str | None) -> datetime | None:
        if value is None:
            return None
        try:
            return parse_scheduled_at(value)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=str(exc),
            ) from exc

    def _to_preview(self, host: Host, result: OpenApiParseResult) -> OpenApiImportPreview:
        return OpenApiImportPreview(
            host_id=host.id,
            hostname=host.hostname,
            spec_info=SpecInfo(**result.spec_info),
            operations=[
                ImportedOperation(
                    operation_id=op.operation_id,
                    method=op.method,
                    path=op.path,
                    url=op.url,
                    request_type=op.request_type,
                    headers=op.headers,
                    request_params=op.request_params,
                    raw_post_body=op.raw_post_body,
                    credentials=op.credentials,
                    bearer=op.bearer,
                    cookies=op.cookies,
                    auth_hint=op.auth_hint,
                )
                for op in result.operations
            ],
            skipped=[
                SkippedOperation(
                    operation_id=s.operation_id,
                    method=s.method,
                    path=s.path,
                    reason=s.reason,
                )
                for s in result.skipped
            ],
            summary=ImportSummary(
                total_operations=result.import_summary["total_operations"],
                matched=result.import_summary["imported"],
                skipped=result.import_summary["skipped"],
            ),
        )

    async def _to_dict(self, load_test: LoadTest) -> dict:
        urls = [HttpRequestConfig.model_validate(u) for u in load_test.urls]
        latest_result = None
        if self.result_repository:
            results = await self.result_repository.list_by_load_test(load_test.id)
            if results:
                latest = results[0]
                latest_result = {
                    "result_id": latest.id,
                    "test_id": load_test.id,
                    "status": latest.status.value,
                    "started_at": latest.started_at,
                    "finished_at": latest.finished_at,
                    "passed": latest.passed,
                    "metrics": latest.metrics,
                    "exit_code": latest.exit_code,
                    "error_message": latest.error_message,
                    "created_at": latest.created_at,
                }
        return {
            "test_id": load_test.id,
            "status": load_test.status.value,
            "url_source": load_test.url_source.value,
            "host_id": load_test.host_id,
            "test_type": load_test.test_type.value,
            "duration": load_test.duration_seconds,
            "total": load_test.total_clients,
            "initial": load_test.initial_clients,
            "timeout": load_test.timeout_ms,
            "error_threshold": load_test.error_threshold_percent,
            "urls": urls,
            "name": load_test.name,
            "notes": load_test.notes,
            "callback": load_test.callback_url,
            "callback_email": load_test.callback_email,
            "scheduled_at": load_test.scheduled_at,
            "openapi_spec_filename": load_test.openapi_spec_filename,
            "import_summary": load_test.import_summary,
            "created_at": load_test.created_at,
            "updated_at": load_test.updated_at,
            "latest_result": latest_result,
        }
