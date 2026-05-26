"""OpenAPI metadata and schema post-processing for the public API reference."""

from __future__ import annotations

from typing import Any

API_TITLE = "LoadWhiz API"

API_DESCRIPTION = """
# LoadWhiz API

REST API for managing organizations, verified load-test targets, and load test configurations.

## Authentication

Most endpoints require a JWT access token:

```
Authorization: Bearer <access_token>
```

Obtain tokens via `POST /api/v1/auth/login` or `POST /api/v1/auth/register`.

## Organization scope

Resources under `/api/v1/organizations/{org_id}/…` require membership in that organization.
Write operations typically require the **owner** or **admin** role unless noted otherwise.

## Rate limits

Rate limits may apply in production. Contact support for quota details.
""".strip()

OPENAPI_TAGS: list[dict[str, str]] = [
    {
        "name": "auth",
        "description": "Account registration, login, token refresh, and password recovery.",
    },
    {
        "name": "users",
        "description": "Authenticated user profile and workspace preferences.",
    },
    {
        "name": "onboarding",
        "description": "Initial organization setup after registration.",
    },
    {
        "name": "organizations",
        "description": "Organization lifecycle, membership, and invitations.",
    },
    {
        "name": "invites",
        "description": "Accept or decline organization invitations.",
    },
    {
        "name": "hosts",
        "description": "Register and verify domains used as load test targets.",
    },
    {
        "name": "load-tests",
        "description": "Create and manage load test configurations for verified hosts.",
    },
    {
        "name": "health",
        "description": "Service health and availability.",
    },
]

_PATH_PARAM_DESCRIPTIONS: dict[str, str] = {
    "org_id": "Organization identifier.",
    "host_id": "Target host identifier.",
    "test_id": "Load test identifier.",
    "user_id": "Member user identifier.",
    "invite_id": "Invitation identifier.",
}

# Schemas that should not appear as separate components (aliases / duplicates).
_SCHEMAS_TO_REMOVE = frozenset({"HttpCredentials"})

_SCHEMA_TITLES: dict[str, str] = {
    "CreateLoadTestRequest": "Create Load Test",
    "UpdateLoadTestRequest": "Update Load Test",
    "LoadTestResponse": "Load Test",
    "HttpRequestConfig": "HTTP Request Step",
    "HttpBasicAuth": "HTTP Basic Authentication",
    "HttpBearerAuth": "HTTP Bearer Authentication",
    "RequestVariable": "Response Variable",
    "OpenApiImportPreview": "OpenAPI Import Preview",
    "ImportedOperation": "Imported Operation",
    "CreateHostRequest": "Create Host",
    "HostResponse": "Host",
    "RegisterRequest": "Register Account",
    "LoginRequest": "Login",
    "TokenResponse": "Authentication Tokens",
    "UserBootstrap": "Authenticated User",
    "OrganizationResponse": "Organization",
    "OrganizationWithRoleResponse": "Organization Membership",
    "UserMeResponse": "Current User",
    "UserBootstrapResponse": "User Session",
    "CompleteOnboardingRequest": "Complete Onboarding",
    "CompleteOnboardingResponse": "Onboarding Result",
    "InviteTokenRequest": "Invite Token",
    "AcceptInviteResponse": "Accept Invite Result",
    "UpdateMemberRoleResponse": "Member Role Update",
    "LoadTestTypeEnum": "Load Test Type",
    "LoadTestStatusEnum": "Load Test Status",
    "LoadTestUrlSourceEnum": "URL Source",
    "MemberRoleEnum": "Member Role",
    "VerificationMethodEnum": "Verification Method",
    "MemberResponse": "Organization Member",
    "InviteResponse": "Organization Invite",
    "RefreshRequest": "Refresh Token",
    "VerifyEmailRequest": "Verify Email",
    "ForgotPasswordRequest": "Forgot Password",
    "ResetPasswordRequest": "Reset Password",
    "MessageResponse": "Message",
    "SpecInfo": "OpenAPI Spec Info",
    "SkippedOperation": "Skipped Operation",
    "ImportSummary": "Import Summary",
    "LoadTestResultSummary": "Load Test Result",
    "RunLoadTestResponse": "Run Load Test",
    "LoadTestResultStatusEnum": "Load Test Result Status",
    "LoadTestResultMetrics": "Load Test Metrics",
}


def customize_openapi_schema(schema: dict[str, Any]) -> dict[str, Any]:
    schema["info"]["title"] = API_TITLE
    schema["info"]["description"] = API_DESCRIPTION

    components = schema.setdefault("components", {})
    schemas = components.get("schemas", {})

    for name in _SCHEMAS_TO_REMOVE:
        schemas.pop(name, None)

    _apply_schema_titles(schemas)
    _apply_path_param_metadata(schema)

    return schema


def _apply_schema_titles(schemas: dict[str, Any]) -> None:
    for schema_name, title in _SCHEMA_TITLES.items():
        if schema_name in schemas and isinstance(schemas[schema_name], dict):
            schemas[schema_name]["title"] = title


def _apply_path_param_metadata(schema: dict[str, Any]) -> None:
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            for param in operation.get("parameters", []):
                if not isinstance(param, dict):
                    continue
                name = param.get("name")
                if name in _PATH_PARAM_DESCRIPTIONS:
                    param["description"] = _PATH_PARAM_DESCRIPTIONS[name]
                if param.get("in") == "path" and isinstance(param.get("schema"), dict):
                    param["schema"].pop("title", None)
