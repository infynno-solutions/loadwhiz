import asyncio
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException

from src.models.user import User
from src.services.auth_service import AuthService


def test_change_password_rejects_wrong_current_password():
    user = User(
        name="Test User",
        email="test@example.com",
        password="$argon2id$v=19$m=65536,t=3,p=4$fake$fake",
    )
    auth_repository = MagicMock()
    session_repository = AsyncMock()
    verification_token_repository = MagicMock()
    email_service = MagicMock()

    service = AuthService(
        auth_repository=auth_repository,
        session_repository=session_repository,
        verification_token_repository=verification_token_repository,
        email_service=email_service,
    )

    async def run():
        with patch("src.services.auth_service.verify_password", return_value=False):
            with pytest.raises(HTTPException) as exc_info:
                await service.change_password(user, "wrong-password", "newpassword1")

            assert exc_info.value.status_code == 400
            assert "incorrect" in exc_info.value.detail.lower()
            auth_repository.update_user.assert_not_called()
            session_repository.revoke_all_user_sessions.assert_not_called()

    asyncio.run(run())
