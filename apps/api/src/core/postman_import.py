"""Convert Postman Collection v2.x exports into OpenAPI 3.0 for load-test import."""

from __future__ import annotations

import json
import re
from typing import Any
from urllib.parse import parse_qsl, urlparse

from src.core.openapi_import import OpenApiImportError

_POSTMAN_COLLECTION_SCHEMA = re.compile(
    r"postman\.com/json/collection/v2\.[01]\.\d+/collection\.json",
    re.IGNORECASE,
)

_SUPPORTED_METHODS = frozenset({"get", "post", "put", "patch", "delete", "head", "options"})


def is_postman_collection(document: dict[str, Any]) -> bool:
    info = document.get("info")
    if isinstance(info, dict):
        schema = str(info.get("schema", ""))
        if _POSTMAN_COLLECTION_SCHEMA.search(schema):
            return True
    return (
        isinstance(document.get("item"), list)
        and "paths" not in document
        and "openapi" not in document
        and "swagger" not in document
    )


def unwrap_import_document(document: dict[str, Any]) -> dict[str, Any]:
    """Unwrap common export envelopes (Postman API, nested collection)."""
    if is_postman_collection(document) or "openapi" in document or "swagger" in document:
        return document

    collection = document.get("collection")
    if isinstance(collection, dict):
        return unwrap_import_document(collection)

    output = document.get("output")
    if isinstance(output, str):
        try:
            parsed = json.loads(output)
        except json.JSONDecodeError as exc:
            raise OpenApiImportError(
                "Could not parse Postman API output as JSON"
            ) from exc
        if isinstance(parsed, dict):
            return unwrap_import_document(parsed)
    if isinstance(output, dict):
        return unwrap_import_document(output)

    return document


def normalize_import_document(document: dict[str, Any]) -> dict[str, Any]:
    """Return an OpenAPI 3.x document, converting Postman collections when needed."""
    document = unwrap_import_document(document)
    if is_postman_collection(document):
        return postman_collection_to_openapi(document)
    return document


def postman_collection_to_openapi(collection: dict[str, Any]) -> dict[str, Any]:
    info = collection.get("info") if isinstance(collection.get("info"), dict) else {}
    title = str(info.get("name") or "Imported from Postman")
    description = info.get("description")
    if isinstance(description, str):
        desc_text = description
    elif isinstance(description, dict):
        desc_text = description.get("content") or description.get("text") or ""
    else:
        desc_text = ""

    paths: dict[str, Any] = {}
    server_urls: set[str] = set()
    items = collection.get("item")
    if not isinstance(items, list):
        raise OpenApiImportError("Postman collection is missing an item list")

    _walk_postman_items(items, paths, server_urls)

    if not paths:
        raise OpenApiImportError(
            "No HTTP requests found in the Postman collection. "
            "Ensure the collection contains requests with URLs."
        )

    servers = [{"url": url} for url in sorted(server_urls)]
    if not servers:
        servers = [{"url": "/"}]

    doc: dict[str, Any] = {
        "openapi": "3.0.3",
        "info": {
            "title": title,
            "version": str(info.get("version") or "1.0.0"),
        },
        "servers": servers,
        "paths": paths,
    }
    if desc_text:
        doc["info"]["description"] = str(desc_text)
    return doc


def _walk_postman_items(
    items: list[Any],
    paths: dict[str, Any],
    server_urls: set[str],
) -> None:
    for entry in items:
        if not isinstance(entry, dict):
            continue
        nested = entry.get("item")
        if isinstance(nested, list):
            _walk_postman_items(nested, paths, server_urls)
            continue
        request = entry.get("request")
        if not isinstance(request, dict):
            continue
        _add_postman_request(entry, request, paths, server_urls)


def _add_postman_request(
    entry: dict[str, Any],
    request: dict[str, Any],
    paths: dict[str, Any],
    server_urls: set[str],
) -> None:
    method = str(request.get("method") or "GET").lower()
    if method not in _SUPPORTED_METHODS:
        return
    if method in ("head", "options"):
        return

    absolute_url = _resolve_postman_url(request.get("url"))
    if not absolute_url:
        return

    parsed = urlparse(absolute_url)
    if not parsed.scheme or not parsed.netloc:
        return

    path = _postman_path_to_openapi(parsed.path or "/")
    if not path.startswith("/"):
        path = f"/{path}"

    base = f"{parsed.scheme}://{parsed.netloc}"
    server_urls.add(base.rstrip("/"))

    path_item = paths.setdefault(path, {})
    if method in path_item:
        return

    operation: dict[str, Any] = {
        "summary": entry.get("name"),
        "responses": {"200": {"description": "Successful response"}},
    }

    query_params = list(parse_qsl(parsed.query, keep_blank_values=True))
    url_obj = request.get("url")
    if isinstance(url_obj, dict):
        for param in url_obj.get("query") or []:
            if not isinstance(param, dict):
                continue
            key = param.get("key")
            if not key:
                continue
            value = param.get("value")
            if value is not None and not any(k == key for k, _ in query_params):
                query_params.append((str(key), str(value)))

    parameters: list[dict[str, Any]] = []
    for key, value in query_params:
        parameters.append(
            {
                "name": key,
                "in": "query",
                "schema": {"type": "string"},
                "example": value,
            }
        )

    for header in request.get("header") or []:
        if not isinstance(header, dict):
            continue
        key = header.get("key")
        if not key or str(key).lower() == "content-type":
            continue
        value = header.get("value")
        if value is None:
            continue
        parameters.append(
            {
                "name": str(key),
                "in": "header",
                "schema": {"type": "string"},
                "example": str(value),
            }
        )

    path_params = _path_parameters_from_path(path)
    if path_params:
        existing = {p["name"] for p in parameters if p.get("in") == "path"}
        for param in path_params:
            if param["name"] not in existing:
                parameters.append(param)

    if parameters:
        operation["parameters"] = parameters

    body = request.get("body")
    if isinstance(body, dict) and method in ("post", "put", "patch"):
        raw = body.get("raw")
        if raw is not None:
            mode = str(body.get("mode") or "raw").lower()
            if mode == "raw":
                operation["requestBody"] = {
                    "content": {
                        "application/json": {
                            "example": _try_parse_json_body(str(raw)),
                        }
                    }
                }

    path_item[method] = operation


def _resolve_postman_url(url: Any) -> str | None:
    if isinstance(url, str):
        text = url.strip()
        return text or None
    if not isinstance(url, dict):
        return None

    raw = url.get("raw")
    if raw:
        return str(raw).strip()

    protocol = str(url.get("protocol") or "https")
    host = url.get("host")
    path_part = url.get("path")
    if not host or not path_part:
        return None

    if isinstance(host, list):
        host_str = ".".join(str(part) for part in host if part)
    else:
        host_str = str(host)

    if isinstance(path_part, list):
        path_str = "/" + "/".join(str(part) for part in path_part if part != "")
    else:
        path_str = str(path_part)
        if not path_str.startswith("/"):
            path_str = f"/{path_str}"

    query_pairs: list[tuple[str, str]] = []
    for param in url.get("query") or []:
        if not isinstance(param, dict):
            continue
        key = param.get("key")
        if not key:
            continue
        value = param.get("value", "")
        query_pairs.append((str(key), str(value) if value is not None else ""))

    built = f"{protocol}://{host_str}{path_str}"
    if query_pairs:
        query = "&".join(f"{k}={v}" for k, v in query_pairs)
        built = f"{built}?{query}"
    return built


def _path_parameters_from_path(path: str) -> list[dict[str, Any]]:
    params: list[dict[str, Any]] = []
    for match in re.finditer(r"\{([^}]+)\}", path):
        name = match.group(1)
        if not name:
            continue
        params.append(
            {
                "name": name,
                "in": "path",
                "required": True,
                "schema": {"type": "string", "example": "example"},
                "example": "example",
            }
        )
    return params


def _postman_path_to_openapi(path: str) -> str:
    """Normalize Postman path segments (:id, {{var}}) toward OpenAPI {param} style."""
    segments = path.split("/")
    normalized: list[str] = []
    for segment in segments:
        if not segment:
            normalized.append(segment)
            continue
        if segment.startswith(":") and len(segment) > 1:
            normalized.append(f"{{{segment[1:]}}}")
            continue
        if segment.startswith("{{") and segment.endswith("}}"):
            name = segment[2:-2].strip()
            normalized.append(f"{{{name}}}" if name else segment)
            continue
        normalized.append(segment)
    return "/".join(normalized)


def _try_parse_json_body(raw: str) -> Any:
    text = raw.strip()
    if not text:
        return ""
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return raw
