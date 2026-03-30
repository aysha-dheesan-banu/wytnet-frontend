import asyncio
import os
import sys

# Try to import from relative path or add to path
sys.path.append(r'C:\github\wytnet-api')

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy.future import select
from sqlalchemy import text

# Hardcoded for Supabase
DATABASE_URL = "postgresql+asyncpg://postgres.yakezsctztfamfalbcfm:Wytnet#123456Admin@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

async def check_users():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        result = await session.execute(text("SELECT id, username, email, role FROM users"))
        users = result.fetchall()
        print("\n--- Current Users in Database ---")
        for u in users:
            print(f"ID: {u.id} | Username: {u.username} | Email: {u.email} | Role: {u.role}")
        print("---------------------------------\n")

if __name__ == "__main__":
    asyncio.run(check_users())
