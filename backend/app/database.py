from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_db():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    print(f"[DB] Connected to MongoDB: {settings.DATABASE_NAME}")
    return db


async def close_db():
    global client
    if client:
        client.close()
        print("[DB] MongoDB connection closed")


def get_db():
    return db


async def create_indexes():
    """Create MongoDB indexes for performance."""
    _db = get_db()
    if _db is None:
        return

    # Jobs indexes
    await _db.jobs.create_index("customer_id")
    await _db.jobs.create_index("status")
    await _db.jobs.create_index([("customer_id", 1), ("status", 1)])

    # Worker profiles indexes
    await _db.worker_profiles.create_index("user_id", unique=True)
    await _db.worker_profiles.create_index("availability_status")
    await _db.worker_profiles.create_index([("user_id", 1), ("availability_status", 1)])

    # Ratings indexes
    await _db.ratings.create_index("worker_id")
    await _db.ratings.create_index("booking_id")

    # Users indexes
    await _db.users.create_index("email", unique=True)

    # Bookings indexes
    await _db.bookings.create_index("job_id")
    await _db.bookings.create_index("worker_id")
    await _db.bookings.create_index("customer_id")

    print("[DB] Indexes created successfully")
