from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

from src.core.host_validation import HostValidationError, parse_host_input
from src.models.host import Host, HostStatus
from src.models.load_test import LoadTestType


def normalize_test_type(value: str) -> LoadTestType:
    aliases = {
        "non-cycling": LoadTestType.per_test,
        "cycling": LoadTestType.maintain_load,
    }
    if value in aliases:
        return aliases[value]
    try:
        return LoadTestType(value)
    except ValueError as exc:
        raise ValueError(
            f"Invalid test_type '{value}'; allowed: per-second, per-test, maintain-load"
        ) from exc


def url_hostname(url: str) -> str:
    parsed = urlparse(url)
    if not parsed.scheme or not parsed.hostname:
        raise ValueError(f"Invalid URL: {url}")
    return parsed.hostname.lower()


def validate_host_verified(host: Host) -> None:
    if host.status != HostStatus.verified:
        raise ValueError("Target host must be verified")


def validate_urls_for_host(urls: list[dict[str, Any]], host: Host) -> None:
    target = host.hostname.lower()
    for index, item in enumerate(urls):
        url = item.get("url")
        if not url:
            raise ValueError(f"urls[{index}].url is required")
        try:
            parse_host_input(url)
        except HostValidationError as exc:
            raise ValueError(f"urls[{index}].url: {exc}") from exc
        hostname = url_hostname(url)
        if hostname != target:
            raise ValueError(
                f"urls[{index}].url host '{hostname}' does not match "
                f"target host '{host.hostname}'"
            )
        validate_url_auth_config(index, item)


def validate_test_type_constraints(
    test_type: LoadTestType,
    initial: int,
    total: int,
) -> None:
    if test_type == LoadTestType.maintain_load and initial > total:
        raise ValueError("initial cannot exceed total for maintain-load tests")


def parse_scheduled_at(value: datetime | str | None) -> datetime | None:
    if value is None:
        return None
    if isinstance(value, datetime):
        scheduled = value
        if scheduled.tzinfo is None:
            scheduled = scheduled.replace(tzinfo=UTC)
    else:
        text = value.strip()
        for fmt in ("%Y-%m-%d %H:%M", "%Y-%m-%dT%H:%M:%S", "%Y-%m-%dT%H:%M:%S%z"):
            try:
                scheduled = datetime.strptime(text, fmt)
                if scheduled.tzinfo is None:
                    scheduled = scheduled.replace(tzinfo=UTC)
                break
            except ValueError:
                continue
        else:
            scheduled = datetime.fromisoformat(text.replace("Z", "+00:00"))
    if scheduled <= datetime.now(UTC):
        raise ValueError("scheduled_at must be in the future")
    return scheduled


def validate_url_auth_config(index: int, item: dict[str, Any]) -> None:
    credentials = item.get("credentials")
    bearer = item.get("bearer")
    cookies = item.get("cookies")

    if credentials is not None:
        if not isinstance(credentials, dict):
            raise ValueError(f"urls[{index}].credentials must be an object")
        if not credentials.get("login") or not credentials.get("password"):
            raise ValueError(
                f"urls[{index}].credentials requires both login and password"
            )

    if bearer is not None:
        if not isinstance(bearer, dict):
            raise ValueError(f"urls[{index}].bearer must be an object")
        token = bearer.get("token")
        if not token or not str(token).strip():
            raise ValueError(f"urls[{index}].bearer.token is required")

    if cookies is not None:
        if not isinstance(cookies, dict):
            raise ValueError(f"urls[{index}].cookies must be an object")
        if not cookies:
            raise ValueError(f"urls[{index}].cookies must not be empty when set")
        for key, value in cookies.items():
            if not key or not str(key).strip():
                raise ValueError(f"urls[{index}].cookies keys must be non-empty")
            if value is None or not str(value).strip():
                raise ValueError(
                    f"urls[{index}].cookies['{key}'] must be a non-empty string"
                )


def serialize_http_request_configs(urls: list[Any]) -> list[dict[str, Any]]:
    serialized: list[dict[str, Any]] = []
    for index, item in enumerate(urls):
        if hasattr(item, "model_dump"):
            data = item.model_dump(mode="json", exclude_none=False)
        elif isinstance(item, dict):
            data = dict(item)
        else:
            raise ValueError("Invalid URL configuration entry")
        validate_url_auth_config(index, data)
        for key in ("credentials", "bearer", "cookies"):
            if data.get(key) is None:
                data[key] = None
        serialized.append(data)
    return serialized
