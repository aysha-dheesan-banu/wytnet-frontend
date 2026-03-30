import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import text

# Hardcoded Supabase URL
DATABASE_URL = "postgresql+asyncpg://postgres.yakezsctztfamfalbcfm:Wytnet#123456Admin@aws-1-ap-northeast-1.pooler.supabase.com:5432/postgres"

async def promote_to_admin():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Find user afi_user
        result = await session.execute(text("SELECT id, username, role FROM users WHERE username = 'afi_user'"))
        user = result.fetchone()
        
        if user:
            print(f"Found user: {user.username} (ID: {user.id}) with current role: {user.role}")
            # Update role to admin
            await session.execute(text("UPDATE users SET role = 'admin' WHERE username = 'afi_user'"))
            await session.commit()
            print("Successfully updated role to 'admin'!")
            
            # Verify update
            result = await session.execute(text("SELECT id, username, role FROM users WHERE username = 'afi_user'"))
            updated_user = result.fetchone()
            print(f"Verified role: {updated_user.role}")
        else:
            print("User 'afi_user' not found in database.")

if __name__ == "__main__":
    asyncio.run(promote_to_admin())
