import asyncio
import sys
import os

sys.path.append(os.path.abspath('c:/github/wytnet-api'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from model import ObjectType

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/wytnet"

async def list_types():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(ObjectType))
        types = result.scalars().all()
        for t in types:
            print(f"ID: {t.id} | Name: {t.name}")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(list_types())
