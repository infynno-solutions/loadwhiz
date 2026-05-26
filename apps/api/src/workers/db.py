from contextlib import contextmanager

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from src.core.config import settings

_sync_url = settings.database_url.replace("postgresql+asyncpg://", "postgresql+psycopg2://")

_engine = create_engine(_sync_url, pool_pre_ping=True)
_SessionLocal = sessionmaker(bind=_engine, expire_on_commit=False)


@contextmanager
def get_sync_db() -> Session:
    db = _SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
