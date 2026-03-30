import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

# Hardcoded Supabase URL
DATABASE_URL = "postgresql+asyncpg://postgres.yakezsctztfamfalbcfm:Wytnet#123456Admin@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

async def check_objects():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT id, name, category, is_active FROM objects"))
        objs = result.fetchall()
        print("\n--- Current Objects in Database ---")
        if not objs:
            print("No objects found!")
        for o in objs:
            print(f"ID: {o.id} | Name: {o.name} | Category: {o.category} | Active: {o.is_active}")
        print("---------------------------------\n")

if __name__ == "__main__":
    asyncio.run(check_objects())
