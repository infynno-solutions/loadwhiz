import uuid

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class RegisterRequest(BaseModel):
    """Create a new user account."""

    model_config = ConfigDict(title="Register Account")

    name: str = Field(..., min_length=1, max_length=255, description="Full name.")
    email: EmailStr = Field(description="Email address.")
    password: str = Field(..., min_length=8, description="Account password.")


class LoginRequest(BaseModel):
    """Authenticate with email and password."""

    model_config = ConfigDict(title="Login")

    email: EmailStr
    password: str = Field(description="Account password.")


class UserBootstrap(BaseModel):
    model_config = ConfigDict(title="Authenticated User")

    id: uuid.UUID = Field(description="User identifier.")
    name: str
    email: EmailStr
    is_email_verified: bool = Field(description="Whether the email address is verified.")
    onboarding_completed: bool = Field(description="Whether onboarding is complete.")
    active_organization_id: uuid.UUID | None = Field(
        default=None,
        description="Currently selected organization.",
    )


class TokenResponse(BaseModel):
    """Access and refresh tokens issued after authentication."""

    model_config = ConfigDict(title="Authentication Tokens")

    access_token: str = Field(description="JWT access token.")
    refresh_token: str = Field(description="Refresh token.")
    token_type: str = Field(default="Bearer", description="Token type.")
    user: UserBootstrap


class RefreshRequest(BaseModel):
    refresh_token: str = Field(description="Refresh token from login or registration.")


class VerifyEmailRequest(BaseModel):
    token: str = Field(description="Email verification token.")


class ForgotPasswordRequest(BaseModel):
    email: EmailStr = Field(description="Account email address.")


class ResetPasswordRequest(BaseModel):
    token: str = Field(description="Password reset token.")
    new_password: str = Field(..., min_length=8, description="New account password.")


class MessageResponse(BaseModel):
    message: str = Field(description="Human-readable result message.")
