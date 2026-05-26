import uuid
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import HTTPException, status
from passlib.context import CryptContext

from src.core.config import settings

pwd_context = CryptContext(
    schemes=["argon2"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    return pwd_context.verify(password, hashed_password)


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(UTC) + timedelta(minutes=settings.access_token_expire_minutes)

    payload = {"sub": str(user_id), "exp": expire, "type": "access"}

    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_access_token(token: str) -> uuid.UUID:
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return uuid.UUID(user_id)


def create_refresh_token(user_id: uuid.UUID) -> tuple[str, str, datetime]:
    """
    Returns (jwt_token, jti, expires_at).

    The JWT is issued to the client. Only the jti (a UUID) is stored in the
    DB so the session row stays small and revocation is a simple lookup.
    """
    jti = str(uuid.uuid4())
    expires_at = datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)

    payload = {
        "sub": str(user_id),
        "exp": expires_at,
        "type": "refresh",
        "jti": jti,
    }

    token = jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)
    return token, jti, expires_at


def decode_refresh_token(token: str) -> tuple[uuid.UUID, str]:
    """
    Decodes and validates a refresh JWT.
    Returns (user_id, jti) on success; raises 401 on any failure.
    """
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret,
            algorithms=[settings.jwt_algorithm],
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has expired",
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
        )

    if payload.get("type") != "refresh":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type",
        )

    user_id = payload.get("sub")
    jti = payload.get("jti")

    if not user_id or not jti:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return uuid.UUID(user_id), jti


def generate_token_id() -> str:
    """Generates a random UUID string for one-time-use tokens (email verification, password reset)."""
    return str(uuid.uuid4())


def get_verification_token_expiry(hours: int = 24) -> datetime:
    return datetime.now(UTC) + timedelta(hours=hours)


def get_password_reset_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(hours=1)


def get_invite_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.invite_token_expire_days)
