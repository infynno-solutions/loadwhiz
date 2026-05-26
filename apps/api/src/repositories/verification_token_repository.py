import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.verification_token import TokenType, VerificationToken


class VerificationTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_token(
        self,
        user_id: uuid.UUID,
        token: str,
        token_type: TokenType,
        expires_at: datetime,
    ) -> VerificationToken:
        verification_token = VerificationToken(
            user_id=user_id,
            token=token,
            type=token_type,
            expires_at=expires_at,
        )
        self.db.add(verification_token)

        await self.db.commit()
        await self.db.refresh(verification_token)

        return verification_token

    async def get_token(
        self,
        token: str,
        token_type: TokenType,
    ) -> VerificationToken | None:
        result = await self.db.execute(
            select(VerificationToken).where(
                VerificationToken.token == token,
                VerificationToken.type == token_type,
                VerificationToken.is_used.is_(False),
            )
        )

        return result.scalar_one_or_none()

    async def mark_used(self, verification_token: VerificationToken) -> None:
        verification_token.is_used = True
        await self.db.commit()
