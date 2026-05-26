from datetime import UTC, datetime

from fastapi import HTTPException, Request, status
from pydantic import EmailStr

from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    generate_token_id,
    get_password_reset_token_expiry,
    get_verification_token_expiry,
    hash_password,
    verify_password,
)
from src.models.user import User
from src.models.verification_token import TokenType
from src.repositories.auth_repository import AuthRepository
from src.repositories.session_repository import SessionRepository
from src.repositories.verification_token_repository import VerificationTokenRepository
from src.services.email_service import EmailService
from src.services.user_bootstrap import build_user_bootstrap


class AuthService:
    def __init__(
        self,
        auth_repository: AuthRepository,
        session_repository: SessionRepository,
        verification_token_repository: VerificationTokenRepository,
        email_service: EmailService,
    ):
        self.auth_repository = auth_repository
        self.session_repository = session_repository
        self.verification_token_repository = verification_token_repository
        self.email_service = email_service

    def _build_token_response(
        self,
        user: User,
        access_token: str,
        refresh_token: str,
    ) -> dict:
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "Bearer",
            "user": build_user_bootstrap(user),
        }

    async def register(
        self,
        name: str,
        email: EmailStr,
        password: str,
        request: Request,
    ) -> dict:
        existing_user = await self.auth_repository.get_user_by_email(email)

        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User already exists",
            )

        hashed_password = hash_password(password)

        user = await self.auth_repository.create_user(
            User(
                name=name,
                email=email,
                password=hashed_password,
            )
        )

        email_token = generate_token_id()
        await self.verification_token_repository.create_token(
            user_id=user.id,
            token=email_token,
            token_type=TokenType.email_verification,
            expires_at=get_verification_token_expiry(),
        )

        await self.email_service.send_verification_email(
            to_email=user.email,
            name=user.name,
            token=email_token,
        )

        access_token = create_access_token(user.id)
        refresh_token, jti, expires_at = create_refresh_token(user.id)

        await self.session_repository.create_session(
            user_id=user.id,
            refresh_token=jti,
            expires_at=expires_at,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )

        return self._build_token_response(user, access_token, refresh_token)

    async def login(
        self,
        email: EmailStr,
        password: str,
        request: Request,
    ) -> dict:
        user = await self.auth_repository.get_user_by_email(email)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not verify_password(password, user.password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid credentials",
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Account is disabled",
            )

        access_token = create_access_token(user.id)
        refresh_token, jti, expires_at = create_refresh_token(user.id)

        await self.session_repository.create_session(
            user_id=user.id,
            refresh_token=jti,
            expires_at=expires_at,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )

        return self._build_token_response(user, access_token, refresh_token)

    async def refresh(self, refresh_token: str, request: Request) -> dict:
        # Verify JWT signature and type before any DB lookup.
        user_id, jti = decode_refresh_token(refresh_token)

        session = await self.session_repository.get_session_by_refresh_token(jti)

        if not session or session.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or revoked refresh token",
            )

        await self.session_repository.revoke_session(session)

        user = await self.auth_repository.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )

        new_access_token = create_access_token(user_id)
        new_refresh_token, new_jti, expires_at = create_refresh_token(user_id)

        await self.session_repository.create_session(
            user_id=user_id,
            refresh_token=new_jti,
            expires_at=expires_at,
            user_agent=request.headers.get("user-agent"),
            ip_address=request.client.host if request.client else None,
        )

        return self._build_token_response(user, new_access_token, new_refresh_token)

    async def logout(self, refresh_token: str, current_user: User) -> dict:
        # Verify JWT signature and type before any DB lookup.
        user_id, jti = decode_refresh_token(refresh_token)

        if user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid refresh token",
            )

        session = await self.session_repository.get_session_by_refresh_token(jti)

        if not session:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Session not found or already revoked",
            )

        await self.session_repository.revoke_session(session)

        return {"message": "Logged out successfully"}

    async def verify_email(self, token: str) -> dict:
        verification_token = await self.verification_token_repository.get_token(
            token=token,
            token_type=TokenType.email_verification,
        )

        if not verification_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used verification token",
            )

        if verification_token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Verification token has expired",
            )

        user = await self.auth_repository.get_user_by_id(verification_token.user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        if user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified",
            )

        user.is_email_verified = True
        await self.auth_repository.update_user(user)
        await self.verification_token_repository.mark_used(verification_token)

        return {"message": "Email verified successfully"}

    async def resend_verification(self, current_user: User) -> dict:
        if current_user.is_email_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified",
            )

        email_token = generate_token_id()
        await self.verification_token_repository.create_token(
            user_id=current_user.id,
            token=email_token,
            token_type=TokenType.email_verification,
            expires_at=get_verification_token_expiry(),
        )

        await self.email_service.send_verification_email(
            to_email=current_user.email,
            name=current_user.name,
            token=email_token,
        )

        return {"message": "Verification email sent"}

    async def forgot_password(self, email: str) -> dict:
        user = await self.auth_repository.get_user_by_email(email)

        if user and user.is_active:
            reset_token = generate_token_id()
            await self.verification_token_repository.create_token(
                user_id=user.id,
                token=reset_token,
                token_type=TokenType.password_reset,
                expires_at=get_password_reset_token_expiry(),
            )
            await self.email_service.send_password_reset_email(
                to_email=user.email,
                name=user.name,
                token=reset_token,
            )

        return {"message": "If that email exists, a reset link has been sent"}

    async def reset_password(self, token: str, new_password: str) -> dict:
        verification_token = await self.verification_token_repository.get_token(
            token=token,
            token_type=TokenType.password_reset,
        )

        if not verification_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or already used reset token",
            )

        if verification_token.expires_at.replace(tzinfo=UTC) < datetime.now(UTC):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Reset token has expired",
            )

        user = await self.auth_repository.get_user_by_id(verification_token.user_id)

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )

        user.password = hash_password(new_password)
        await self.auth_repository.update_user(user)
        await self.verification_token_repository.mark_used(verification_token)
        await self.session_repository.revoke_all_user_sessions(user.id)

        return {"message": "Password reset successfully. Please log in again."}

    async def change_password(
        self,
        user: User,
        current_password: str,
        new_password: str,
    ) -> dict:
        if not verify_password(current_password, user.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect",
            )

        user.password = hash_password(new_password)
        await self.auth_repository.update_user(user)
        await self.session_repository.revoke_all_user_sessions(user.id)

        return {
            "message": "Password changed successfully. Please sign in again.",
        }
