from __future__ import annotations

from typing import Any


def has_actionable_auth(step: dict[str, Any]) -> bool:
    credentials = step.get("credentials")
    bearer = step.get("bearer")
    cookies = step.get("cookies")
    if credentials and credentials.get("login") and credentials.get("password"):
        return True
    if bearer and bearer.get("token"):
        return True
    if cookies and isinstance(cookies, dict) and len(cookies) > 0:
        return True
    return False


def validate_runnable_urls(urls: list[dict[str, Any]]) -> None:
    for index, step in enumerate(urls):
        auth_hint = step.get("auth_hint")
        if auth_hint and not has_actionable_auth(step):
            raise ValueError(
                f"urls[{index}] requires authentication ({auth_hint}); "
                "configure credentials, bearer, or cookies before running"
            )
