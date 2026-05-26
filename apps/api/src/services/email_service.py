from pathlib import Path

import resend
from pybars import Compiler

from src.core.config import settings

_compiler = Compiler()
_templates_dir = Path(__file__).parent.parent / "templates" / "emails"


def _render(template_name: str, context: dict) -> str:
    source = (_templates_dir / template_name).read_text()
    template = _compiler.compile(source)
    return template(context)


class EmailService:
    def __init__(self) -> None:
        resend.api_key = settings.resend_api_key

    async def send_verification_email(
        self,
        to_email: str,
        name: str,
        token: str,
    ) -> None:
        verification_url = (
            f"{settings.frontend_url}/auth/verify-email?token={token}"
        )
        html = _render(
            "verify_email.hbs",
            {
                "app_name": settings.app_name,
                "name": name,
                "verification_url": verification_url,
            },
        )
        resend.Emails.send(
            {
                "from": settings.mail_from,
                "to": [to_email],
                "subject": "Verify your email address",
                "html": html,
            }
        )

    async def send_password_reset_email(
        self,
        to_email: str,
        name: str,
        token: str,
    ) -> None:
        reset_url = f"{settings.frontend_url}/auth/reset-password?token={token}"
        html = _render(
            "reset_password.hbs",
            {
                "app_name": settings.app_name,
                "name": name,
                "reset_url": reset_url,
                "expires_in": "1 hour",
            },
        )
        resend.Emails.send(
            {
                "from": settings.mail_from,
                "to": [to_email],
                "subject": "Reset your password",
                "html": html,
            }
        )

    async def send_org_invite_email(
        self,
        to_email: str,
        inviter_name: str,
        organization_name: str,
        token: str,
    ) -> None:
        invite_url = f"{settings.frontend_url}/invites/accept?token={token}"
        html = _render(
            "org_invite.hbs",
            {
                "app_name": settings.app_name,
                "inviter_name": inviter_name,
                "organization_name": organization_name,
                "invite_url": invite_url,
                "expires_in": f"{settings.invite_token_expire_days} days",
            },
        )
        resend.Emails.send(
            {
                "from": settings.mail_from,
                "to": [to_email],
                "subject": f"You've been invited to join {organization_name}",
                "html": html,
            }
        )

    async def send_load_test_complete_email(
        self,
        to_email: str,
        *,
        test_name: str,
        passed: bool | None,
        metrics: dict,
    ) -> None:
        status_label = "Passed" if passed else "Failed"
        status_class = "pass" if passed else "fail"
        html = _render(
            "load_test_complete.hbs",
            {
                "app_name": settings.app_name,
                "test_name": test_name,
                "status_label": status_label,
                "status_class": status_class,
                "total_requests": metrics.get("total_requests", 0),
                "error_rate_percent": metrics.get("error_rate_percent", "N/A"),
                "rps": metrics.get("rps", "N/A"),
                "p95_ms": metrics.get("p95_ms", "N/A"),
            },
        )
        resend.Emails.send(
            {
                "from": settings.mail_from,
                "to": [to_email],
                "subject": f"Load test {status_label.lower()}: {test_name}",
                "html": html,
            }
        )
