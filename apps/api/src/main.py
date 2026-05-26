from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.responses import FileResponse
from scalar_fastapi import get_scalar_api_reference

from src.api.v1.auth.routes import router as auth_router
from src.api.v1.hosts.routes import router as hosts_router
from src.api.v1.invites.routes import router as invites_router
from src.api.v1.onboarding.routes import router as onboarding_router
from src.api.v1.organizations.routes import router as organizations_router
from src.api.v1.tests.routes import router as tests_router
from src.api.v1.users.routes import router as users_router
from src.core.config import settings
from src.core.openapi_docs import API_TITLE, OPENAPI_TAGS, customize_openapi_schema

_BEARER_SCHEME = "BearerAuth"
_LOADERIO_VERIFICATION_FILE = (
    Path(__file__).resolve().parent.parent
    / "public"
    / "verification"
    / "loaderio-aa51e95fe9eed25caafbe22e10014cfb.txt"
)

openapi_tags = OPENAPI_TAGS

app = FastAPI(
    title="LoadWhiz API",
    version="1.0.0",
    description="Enterprise API for load testing configuration and target host management.",
    openapi_tags=openapi_tags,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _build_openapi_schema() -> dict:
    if app.openapi_schema:
        return app.openapi_schema

    schema = get_openapi(
        title=API_TITLE,
        version="1.0.0",
        description=app.description,
        routes=app.routes,
        tags=openapi_tags,
    )

    # Replace auto-generated HTTPBearer scheme with a clean BearerAuth (JWT) definition.
    schema.setdefault("components", {})
    schema["components"]["securitySchemes"] = {
        _BEARER_SCHEME: {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT access token obtained from the Auth endpoints.",
        }
    }

    # Rewrite every HTTPBearer security reference to BearerAuth.
    for path_item in schema.get("paths", {}).values():
        for operation in path_item.values():
            if not isinstance(operation, dict):
                continue
            security = operation.get("security")
            if not security:
                continue
            operation["security"] = [
                {_BEARER_SCHEME: []} if "HTTPBearer" in entry else entry
                for entry in security
            ]

    app.openapi_schema = customize_openapi_schema(schema)
    return app.openapi_schema


app.openapi = _build_openapi_schema  # type: ignore[method-assign]


@app.get(
    "/",
    operation_id="health.check",
    tags=["health"],
    summary="Health check",
    description="Returns service availability status.",
)
def health_check() -> dict:
    return {"status": "ok"}


@app.get(
    "/loaderio-aa51e95fe9eed25caafbe22e10014cfb.txt",
    include_in_schema=False,
)
def loaderio_verification() -> FileResponse:
    """loader.io domain ownership verification for api.lw.onfynno.in."""
    return FileResponse(
        _LOADERIO_VERIFICATION_FILE,
        media_type="text/plain",
    )


_SCALAR_JS_URL = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.57.5"


@app.get("/reference", include_in_schema=False)
async def get_reference():
    return get_scalar_api_reference(
        content=app.openapi(),
        title=API_TITLE,
        persist_auth=True,
        authentication={"preferredSecurityScheme": _BEARER_SCHEME},
        scalar_js_url=_SCALAR_JS_URL,
    )


app.include_router(users_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(onboarding_router, prefix="/api/v1")
app.include_router(organizations_router, prefix="/api/v1")
app.include_router(invites_router, prefix="/api/v1")
app.include_router(hosts_router, prefix="/api/v1/organizations/{org_id}/hosts")
app.include_router(tests_router, prefix="/api/v1/organizations/{org_id}/tests")
