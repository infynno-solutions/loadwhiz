from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urljoin, urlparse

import yaml
from openapi_spec_validator import validate
from openapi_spec_validator.validation.exceptions import OpenAPIValidationError

SUPPORTED_METHODS = frozenset({"get", "post", "put", "patch", "delete"})
HTTP_METHOD_UPPER = {
    "get": "GET",
    "post": "POST",
    "put": "PUT",
    "patch": "PATCH",
    "delete": "DELETE",
}


class OpenApiImportError(ValueError):
    pass


@dataclass
class ParsedOperation:
    operation_id: str
    method: str
    path: str
    url: str
    request_type: str
    headers: dict[str, str] = field(default_factory=dict)
    request_params: dict[str, str] = field(default_factory=dict)
    raw_post_body: str | None = None
    credentials: dict[str, str] | None = None
    bearer: dict[str, str] | None = None
    cookies: dict[str, str] | None = None
    auth_hint: str | None = None


@dataclass
class SkippedOperation:
    operation_id: str
    method: str
    path: str
    reason: str


@dataclass
class OpenApiParseResult:
    operations: list[ParsedOperation]
    skipped: list[SkippedOperation]
    spec_snapshot: dict[str, Any]
    import_summary: dict[str, Any]
    spec_info: dict[str, Any]


def parse_spec_bytes(content: bytes, filename: str | None = None) -> dict[str, Any]:
    from src.core.postman_import import normalize_import_document

    text = content.decode("utf-8-sig")
    if filename and filename.lower().endswith((".yaml", ".yml")):
        data = yaml.safe_load(text)
    else:
        try:
            data = json.loads(text)
        except json.JSONDecodeError:
            data = yaml.safe_load(text)
    if not isinstance(data, dict):
        raise OpenApiImportError("OpenAPI document must be a JSON or YAML object")
    return normalize_import_document(data)


def validate_openapi_document(document: dict[str, Any]) -> None:
    version = str(document.get("openapi", ""))
    if version.startswith("3."):
        try:
            validate(document)
        except OpenAPIValidationError as exc:
            raise OpenApiImportError(f"Invalid OpenAPI document: {exc}") from exc
        return
    if document.get("swagger") == "2.0":
        raise OpenApiImportError(
            "Swagger 2.0 is not supported. In Postman use "
            "Collection → … → Generate specification (OpenAPI 3.0 or 3.1), "
            "not Export collection."
        )
    raise OpenApiImportError(
        "Unsupported document format. Upload OpenAPI 3.0/3.1 (JSON or YAML), "
        "or a Postman Collection v2 export (Collection → Export)."
    )


def _resolve_refs(node: Any, root: dict[str, Any], seen: set[str] | None = None) -> Any:
    if seen is None:
        seen = set()
    if isinstance(node, dict):
        if "$ref" in node:
            ref = node["$ref"]
            if not ref.startswith("#/"):
                return node
            if ref in seen:
                return node
            seen = seen | {ref}
            parts = ref.lstrip("#/").split("/")
            target: Any = root
            for part in parts:
                part_key = part.replace("~1", "/").replace("~0", "~")
                if not isinstance(target, dict) or part_key not in target:
                    return node
                target = target[part_key]
            return _resolve_refs(target, root, seen)
        return {k: _resolve_refs(v, root, seen) for k, v in node.items()}
    if isinstance(node, list):
        return [_resolve_refs(item, root, seen) for item in node]
    return node


def _apply_server_variables(url: str, variables: dict[str, Any]) -> str:
    for var_name, var_def in variables.items():
        if isinstance(var_def, dict):
            default = var_def.get("default", "")
        else:
            default = ""
        url = url.replace(f"{{{var_name}}}", str(default))
    return url


def _host_server_bases(hostname: str, relative_paths: list[str]) -> list[str]:
    """Build absolute base URLs from a verified host and optional relative server paths."""
    paths = relative_paths or [""]
    bases: list[str] = []
    for scheme in ("https", "http"):
        for rel in paths:
            root = f"{scheme}://{hostname}"
            rel = rel.strip()
            if not rel or rel == "/":
                bases.append(root)
                continue
            full = urljoin(root + "/", rel.lstrip("/"))
            bases.append(full.rstrip("/") or root)
    seen: set[str] = set()
    ordered: list[str] = []
    for base in bases:
        if base not in seen:
            seen.add(base)
            ordered.append(base)
    return ordered


def _resolve_server_urls(
    document: dict[str, Any],
    *,
    target_hostname: str | None = None,
) -> list[str]:
    servers = document.get("servers") or []
    absolute: list[str] = []
    relative: list[str] = []

    for server in servers:
        if not isinstance(server, dict):
            continue
        url = server.get("url")
        if not url or not isinstance(url, str):
            continue
        url = _apply_server_variables(url, server.get("variables") or {})
        if url.startswith("http://") or url.startswith("https://"):
            absolute.append(url.rstrip("/"))
        else:
            relative.append(url)

    if absolute:
        return absolute

    if target_hostname:
        return _host_server_bases(target_hostname, relative)

    return []


def _has_unresolved_path_params(path: str, operation: dict[str, Any]) -> bool:
    if "{" not in path:
        return False
    param_names = set(re.findall(r"\{([^}]+)\}", path))
    if not param_names:
        return False
    params = operation.get("parameters") or []
    path_params = {
        p.get("name"): p
        for p in params
        if isinstance(p, dict) and p.get("in") == "path" and p.get("name")
    }
    for name in param_names:
        param = path_params.get(name)
        if param is None:
            return True
        if not (
            param.get("example") is not None
            or param.get("schema", {}).get("example") is not None
            or param.get("schema", {}).get("default") is not None
        ):
            return True
    return False


def _extract_param_values(operation: dict[str, Any]) -> tuple[dict[str, str], dict[str, str]]:
    headers: dict[str, str] = {}
    query: dict[str, str] = {}
    for param in operation.get("parameters") or []:
        if not isinstance(param, dict):
            continue
        location = param.get("in")
        name = param.get("name")
        if not name:
            continue
        value = param.get("example")
        if value is None and isinstance(param.get("schema"), dict):
            value = param["schema"].get("example") or param["schema"].get("default")
        if value is None:
            continue
        if location == "header":
            headers[str(name)] = str(value)
        elif location == "query":
            query[str(name)] = str(value)
    return headers, query


def _extract_json_body(operation: dict[str, Any]) -> str | None:
    body = operation.get("requestBody")
    if not isinstance(body, dict):
        return None
    content = body.get("content") or {}
    for media_type in ("application/json", "application/*+json"):
        if media_type not in content:
            continue
        media = content[media_type]
        if not isinstance(media, dict):
            continue
        if "example" in media:
            return json.dumps(media["example"])
        examples = media.get("examples")
        if isinstance(examples, dict) and examples:
            first = next(iter(examples.values()))
            if isinstance(first, dict) and "value" in first:
                return json.dumps(first["value"])
    return None


def _substitute_path_params(path: str, operation: dict[str, Any]) -> str | None:
    result = path
    for match in re.finditer(r"\{([^}]+)\}", path):
        param_name = match.group(1)
        value = None
        for param in operation.get("parameters") or []:
            if (
                isinstance(param, dict)
                and param.get("in") == "path"
                and param.get("name") == param_name
            ):
                value = param.get("example")
                if value is None and isinstance(param.get("schema"), dict):
                    value = param["schema"].get("example") or param["schema"].get(
                        "default"
                    )
                break
        if value is None:
            return None
        result = result.replace(f"{{{param_name}}}", str(value))
    return result


def _get_security_requirements(
    operation: dict[str, Any],
    path_item: dict[str, Any],
    document: dict[str, Any],
) -> list[dict[str, Any]]:
    requirements = operation.get("security")
    if requirements is None:
        requirements = path_item.get("security")
    if requirements is None:
        requirements = document.get("security")
    if not requirements:
        return []
    return [req for req in requirements if isinstance(req, dict)]


def _extract_auth_from_security(
    operation: dict[str, Any],
    path_item: dict[str, Any],
    document: dict[str, Any],
) -> tuple[dict[str, str] | None, dict[str, str] | None, dict[str, str] | None, str | None]:
    """Map OpenAPI security schemes to basic, bearer, or cookie auth config."""
    requirements = _get_security_requirements(operation, path_item, document)
    if not requirements:
        return None, None, None, None

    schemes = document.get("components", {}).get("securitySchemes") or {}
    credentials: dict[str, str] | None = None
    bearer: dict[str, str] | None = None
    cookies: dict[str, str] | None = None
    hints: list[str] = []

    for requirement in requirements:
        for scheme_name in requirement:
            raw_scheme = schemes.get(scheme_name) or {}
            scheme = _resolve_refs(raw_scheme, document) if raw_scheme else {}
            if not isinstance(scheme, dict):
                continue

            scheme_type = scheme.get("type")
            if scheme_type == "http":
                http_scheme = str(scheme.get("scheme", "")).lower()
                if http_scheme == "basic":
                    credentials = credentials or {
                        "login": "",
                        "password": "",
                    }
                    hints.append("basic")
                elif http_scheme == "bearer":
                    bearer = bearer or {
                        "token": "",
                        "prefix": "Bearer",
                        "header_name": "Authorization",
                    }
                    hints.append("bearer")
            elif scheme_type == "apiKey":
                location = scheme.get("in")
                name = scheme.get("name", "")
                if location == "cookie":
                    cookies = cookies or {}
                    hints.append("cookie")
                elif location == "header" and name.lower() == "authorization":
                    bearer = bearer or {
                        "token": "",
                        "prefix": "Bearer",
                        "header_name": name or "Authorization",
                    }
                    hints.append("bearer")
                elif location == "header":
                    hints.append(f"apiKey_header:{name}")
            elif scheme_type == "oauth2":
                hints.append("oauth2")
            elif scheme_type == "openIdConnect":
                hints.append("openid")

    auth_hint = ", ".join(dict.fromkeys(hints)) if hints else None

    # Drop placeholder auth objects with empty secrets so validation passes on import;
    # auth_hint tells the user what to configure.
    if credentials and (not credentials.get("login") or not credentials.get("password")):
        credentials = None
    if bearer and not str(bearer.get("token", "")).strip():
        bearer = None
    if cookies is not None and not cookies:
        cookies = None

    return credentials, bearer, cookies, auth_hint


def _hostname_matches(url: str, target_hostname: str) -> bool:
    parsed = urlparse(url)
    host = parsed.hostname or ""
    return host.lower() == target_hostname.lower()


def parse_openapi_for_host(
    document: dict[str, Any],
    target_hostname: str,
    *,
    include_operations: list[str] | None = None,
    exclude_operations: list[str] | None = None,
    max_operations: int = 500,
) -> OpenApiParseResult:
    validate_openapi_document(document)
    resolved = _resolve_refs(document, document)
    server_urls = _resolve_server_urls(resolved, target_hostname=target_hostname)
    if not server_urls:
        raise OpenApiImportError(
            "Could not resolve server URLs for this specification and host. "
            "Add an absolute server URL in the OpenAPI document, or verify the "
            "host matches a server entry."
        )

    include_set = set(include_operations or [])
    exclude_set = set(exclude_operations or [])
    filter_enabled = bool(include_set)

    operations: list[ParsedOperation] = []
    skipped: list[SkippedOperation] = []
    total_operations = 0

    paths = resolved.get("paths") or {}
    if not isinstance(paths, dict):
        raise OpenApiImportError("paths must be an object")

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            method_lower = method.lower()
            if method_lower not in SUPPORTED_METHODS:
                continue
            if not isinstance(operation, dict):
                continue

            total_operations += 1
            op_key = f"{HTTP_METHOD_UPPER[method_lower]} {path}"

            if filter_enabled and op_key not in include_set:
                skipped.append(
                    SkippedOperation(op_key, HTTP_METHOD_UPPER[method_lower], path, "not_selected")
                )
                continue
            if op_key in exclude_set:
                skipped.append(
                    SkippedOperation(op_key, HTTP_METHOD_UPPER[method_lower], path, "excluded")
                )
                continue

            if _has_unresolved_path_params(path, operation):
                skipped.append(
                    SkippedOperation(
                        op_key,
                        HTTP_METHOD_UPPER[method_lower],
                        path,
                        "path_params_without_example",
                    )
                )
                continue

            resolved_path = _substitute_path_params(path, operation)
            if resolved_path is None:
                skipped.append(
                    SkippedOperation(
                        op_key,
                        HTTP_METHOD_UPPER[method_lower],
                        path,
                        "path_params_without_example",
                    )
                )
                continue

            matched = False
            for base_url in server_urls:
                full_url = urljoin(base_url + "/", resolved_path.lstrip("/"))
                if _hostname_matches(full_url, target_hostname):
                    headers, query = _extract_param_values(operation)
                    credentials, bearer, cookies, auth_hint = _extract_auth_from_security(
                        operation, path_item, resolved
                    )
                    operations.append(
                        ParsedOperation(
                            operation_id=op_key,
                            method=HTTP_METHOD_UPPER[method_lower],
                            path=path,
                            url=full_url,
                            request_type=HTTP_METHOD_UPPER[method_lower],
                            headers=headers,
                            request_params=query,
                            raw_post_body=_extract_json_body(operation),
                            credentials=credentials,
                            bearer=bearer,
                            cookies=cookies,
                            auth_hint=auth_hint,
                        )
                    )
                    matched = True
                    break

            if not matched:
                skipped.append(
                    SkippedOperation(
                        op_key,
                        HTTP_METHOD_UPPER[method_lower],
                        path,
                        "host_mismatch",
                    )
                )

    if len(operations) > max_operations:
        raise OpenApiImportError(
            f"Too many operations ({len(operations)}); maximum is {max_operations}"
        )

    info = resolved.get("info") or {}
    spec_snapshot = {
        "openapi": resolved.get("openapi"),
        "info": {
            "title": info.get("title"),
            "version": info.get("version"),
        },
        "servers": server_urls,
        "imported_at": datetime.now(UTC).isoformat(),
    }

    import_summary = {
        "total_operations": total_operations,
        "imported": len(operations),
        "skipped": len(skipped),
        "skipped_reasons": [
            {
                "path": s.path,
                "method": s.method,
                "reason": s.reason,
            }
            for s in skipped
        ],
    }

    return OpenApiParseResult(
        operations=operations,
        skipped=skipped,
        spec_snapshot=spec_snapshot,
        import_summary=import_summary,
        spec_info={
            "title": info.get("title"),
            "version": info.get("version"),
            "servers": server_urls,
        },
    )


def operations_to_url_dicts(operations: list[ParsedOperation]) -> list[dict[str, Any]]:
    result: list[dict[str, Any]] = []
    for op in operations:
        item: dict[str, Any] = {
            "url": op.url,
            "request_type": op.request_type,
            "headers": op.headers,
            "request_params": op.request_params,
            "raw_post_body": op.raw_post_body,
            "payload_file_url": None,
            "variables": [],
            "credentials": op.credentials,
            "bearer": op.bearer,
            "cookies": op.cookies,
            "auth_hint": op.auth_hint,
        }
        result.append(item)
    return result
