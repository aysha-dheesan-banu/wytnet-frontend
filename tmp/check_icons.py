import asyncio
import uuid
import sys
import os

# Add api directory to path to import db
sys.path.append(os.path.abspath('c:/github/wytnet-api'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from model import Object as ObjectModel

DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5143/wytnet"

async def check_icons():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(select(ObjectModel))
        objects = result.scalars().all()
        print("\n--- Object Icons ---")
        for obj in objects:
            print(f"Name: {obj.name:15} | Icon: '{obj.icon}'")
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check_icons())
