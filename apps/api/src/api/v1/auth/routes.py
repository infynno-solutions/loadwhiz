from fastapi import APIRouter, Depends, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.v1.auth.schemas import (
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RefreshRequest,
    RegisterRequest,
    ResetPasswordRequest,
    TokenResponse,
    VerifyEmailRequest,
)
from src.core.dependencies import get_current_user
from src.db.session import get_db
from src.models.user import User
from src.repositories.auth_repository import AuthRepository
from src.repositories.session_repository import SessionRepository
from src.repositories.verification_token_repository import VerificationTokenRepository
from src.services.auth_service import AuthService
from src.services.email_service import EmailService

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


def get_auth_service(db: AsyncSession = Depends(get_db)) -> AuthService:
    return AuthService(
        auth_repository=AuthRepository(db),
        session_repository=SessionRepository(db),
        verification_token_repository=VerificationTokenRepository(db),
        email_service=EmailService(),
    )


@router.post(
    "/register",
    operation_id="auth.register",
    status_code=status.HTTP_201_CREATED,
    response_model=TokenResponse,
    summary="Register account",
    description="Create a new user account and return authentication tokens.",
    responses={409: {"description": "Email address is already registered."}},
)
async def register(
    body: RegisterRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.register(body.name, body.email, body.password, request)


@router.post(
    "/login",
    operation_id="auth.login",
    response_model=TokenResponse,
    summary="Sign in",
    description="Authenticate with email and password.",
    responses={
        401: {"description": "Invalid email or password."},
        403: {"description": "Account is disabled."},
    },
)
async def login(
    body: LoginRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.login(
        email=body.email,
        password=body.password,
        request=request,
    )


@router.post(
    "/refresh",
    operation_id="auth.refresh",
    response_model=TokenResponse,
    summary="Refresh access token",
    description="Exchange a valid refresh token for a new access token.",
    responses={401: {"description": "Refresh token is invalid or expired."}},
)
async def refresh(
    body: RefreshRequest,
    request: Request,
    service: AuthService = Depends(get_auth_service),
) -> TokenResponse:
    return await service.refresh(body.refresh_token, request)


@router.post(
    "/logout",
    operation_id="auth.logout",
    response_model=MessageResponse,
    summary="Sign out",
    description="Revoke the current refresh token and end the session.",
    responses={
        400: {"description": "Refresh token is invalid."},
        401: {"description": "Authentication required."},
    },
)
async def logout(
    body: RefreshRequest,
    service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    return await service.logout(body.refresh_token, current_user)


@router.post(
    "/verify-email",
    operation_id="auth.verify_email",
    response_model=MessageResponse,
    summary="Verify email address",
    description="Confirm email ownership using the verification token.",
    responses={400: {"description": "Verification token is invalid or expired."}},
)
async def verify_email(
    body: VerifyEmailRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    return await service.verify_email(body.token)


@router.post(
    "/resend-verification",
    operation_id="auth.resend_verification",
    response_model=MessageResponse,
    summary="Resend verification email",
    description="Send a new email verification message to the authenticated user.",
    responses={
        400: {"description": "Email is already verified."},
        401: {"description": "Authentication required."},
    },
)
async def resend_verification(
    service: AuthService = Depends(get_auth_service),
    current_user: User = Depends(get_current_user),
) -> MessageResponse:
    return await service.resend_verification(current_user)


@router.post(
    "/forgot-password",
    operation_id="auth.forgot_password",
    response_model=MessageResponse,
    summary="Request password reset",
    description="Initiate a password reset for the given email address.",
)
async def forgot_password(
    body: ForgotPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    return await service.forgot_password(body.email)


@router.post(
    "/reset-password",
    operation_id="auth.reset_password",
    response_model=MessageResponse,
    summary="Reset password",
    description="Set a new password using a password reset token.",
    responses={400: {"description": "Reset token is invalid or expired."}},
)
async def reset_password(
    body: ResetPasswordRequest,
    service: AuthService = Depends(get_auth_service),
) -> MessageResponse:
    return await service.reset_password(body.token, body.new_password)
