import uuid

from fastapi import Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.security import decode_access_token
from src.db.session import get_db
from src.models.user import User
from src.repositories.auth_repository import AuthRepository

bearer_scheme = HTTPBearer()
optional_bearer_scheme = HTTPBearer(auto_error=False)


async def _user_from_token(token: str, db: AsyncSession) -> User:
    user_id: uuid.UUID = decode_access_token(token)
    repo = AuthRepository(db)
    user = await repo.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is disabled",
        )

    return user


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    return await _user_from_token(credentials.credentials, db)


async def get_current_user_optional_bearer(
    credentials: HTTPAuthorizationCredentials | None = Depends(
        optional_bearer_scheme
    ),
    access_token: str | None = Query(
        default=None,
        description="JWT access token for EventSource clients that cannot send headers.",
    ),
    db: AsyncSession = Depends(get_db),
) -> User:
    token = credentials.credentials if credentials else access_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return await _user_from_token(token, db)
