"""Fixtures backed by the real `postgres-test` database.

The schema is built once per run through Alembic (so migrations are exercised too); each
test runs inside a transaction that is rolled back, even when services call `commit()`.
"""

from argparse import Namespace
from collections.abc import AsyncIterator
from pathlib import Path

import pytest
from alembic.config import Config
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, create_async_engine
from sqlalchemy.pool import NullPool

from alembic import command
from app.core.config import get_settings
from app.core.database import get_session

BACKEND_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture(scope="session")
def test_database_url() -> str:
    url = get_settings().test_database_url
    config = Config(str(BACKEND_ROOT / "alembic.ini"))
    config.cmd_opts = Namespace(x=[f"db_url={url}"])
    command.downgrade(config, "base")
    command.upgrade(config, "head")
    return url


@pytest.fixture(scope="session")
async def db_engine(test_database_url: str) -> AsyncIterator[AsyncEngine]:
    engine = create_async_engine(test_database_url, poolclass=NullPool)
    yield engine
    await engine.dispose()


@pytest.fixture
async def db_session(db_engine: AsyncEngine) -> AsyncIterator[AsyncSession]:
    async with db_engine.connect() as connection:
        transaction = await connection.begin()
        session = AsyncSession(
            bind=connection, join_transaction_mode="create_savepoint", expire_on_commit=False
        )
        try:
            yield session
        finally:
            await session.close()
            await transaction.rollback()


@pytest.fixture
async def db_client(app: FastAPI, db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def _session_override() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_session] = _session_override
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client
    app.dependency_overrides.clear()
