import asyncio
import sys
import os

sys.path.append(os.path.abspath('c:/github/wytnet-api'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from model import Object as ObjectModel

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/wytnet"

async def debug_data():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(ObjectModel))
        objects = result.scalars().all()
        for obj in objects:
            print(f"ID: {obj.id} | Name: {obj.name:15} | Icon: '{obj.icon}' (len: {len(obj.icon) if obj.icon else 0})")
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(debug_data())
