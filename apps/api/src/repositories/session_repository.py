import uuid
from datetime import datetime

from sqlalchemy import not_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.session import Session


class SessionRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_session(
        self,
        user_id: uuid.UUID,
        refresh_token: str,
        expires_at: datetime,
        user_agent: str | None = None,
        ip_address: str | None = None,
    ) -> Session:
        session = Session(
            user_id=user_id,
            refresh_token=refresh_token,
            expires_at=expires_at,
            user_agent=user_agent,
            ip_address=ip_address,
        )
        self.db.add(session)

        await self.db.commit()
        await self.db.refresh(session)

        return session

    async def get_session_by_refresh_token(
        self,
        refresh_token: str,
    ) -> Session | None:
        result = await self.db.execute(
            select(Session).where(
                Session.refresh_token == refresh_token,
                not_(Session.is_revoked),
            )
        )

        return result.scalar_one_or_none()

    async def revoke_session(self, session: Session) -> None:
        session.is_revoked = True
        await self.db.commit()

    async def revoke_all_user_sessions(self, user_id: uuid.UUID) -> None:
        await self.db.execute(
            update(Session)
            .where(Session.user_id == user_id, not_(Session.is_revoked))
            .values(is_revoked=True)
        )
        await self.db.commit()
