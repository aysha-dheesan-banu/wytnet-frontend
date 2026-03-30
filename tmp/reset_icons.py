import asyncio
import sys
import os

# Set up backend paths
sys.path.append(os.path.abspath('c:/github/wytnet-api'))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, update
from model import Object as ObjectModel

# Use correct DB settings
DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/wytnet"

async def reset_icons():
    engine = create_async_engine(DATABASE_URL, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    async with async_session() as session:
        # Update all objects where icon is invalid (empty, period, space, or path that doesn't exist)
        # For simplicity, we'll reset anything that isn't a clear upload URL or a known valid icon
        # Actually, let's just reset Lapton and Textbook or everything for now as the user said "nothing has icon"
        result = await session.execute(
            update(ObjectModel)
            .values(icon='category')
            .where(
                (ObjectModel.icon == "") | 
                (ObjectModel.icon == ".") | 
                (ObjectModel.icon == "./") |
                (ObjectModel.icon.is_(None))
            )
        )
        print(f"Updated {result.rowcount} objects to use 'category' icon.")
        await session.commit()
            
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(reset_icons())
