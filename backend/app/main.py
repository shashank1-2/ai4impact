"""
SkillBridge — AI-Powered Local Services Platform
Main FastAPI application with lifespan management.
"""
import os
import json
import asyncio
import logging
from contextlib import asynccontextmanager
from datetime import datetime
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging so all logger.info/warning/error calls are visible
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

from app.config import settings
from app.database import connect_db, close_db, create_indexes, get_db
from app.ai import semantic_matcher, pricer, ranker, recommender, forecaster

# Import routers
from app.api.auth import router as auth_router
from app.api.workers import router as workers_router
from app.api.jobs import router as jobs_router
from app.api.ratings import router as ratings_router
from app.api.ai import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle."""
    print("=" * 60)
    print("  SkillBridge — AI-Powered Local Services Platform")
    print("=" * 60)

    # 1. Connect to MongoDB
    await connect_db()
    db = get_db()

    # 2. Load the sentence-transformers model
    print("\n[Startup] Loading sentence-transformers model...")
    semantic_matcher.load_model()

    # 3. Ensure ml_models directory exists
    os.makedirs(settings.ML_MODELS_DIR, exist_ok=True)
    print(f"[Startup] ML models directory: {settings.ML_MODELS_DIR}")

    # 4. Seed historical data and train pricer if needed
    print("\n[Startup] Checking pricer model...")
    if not pricer.load_pricer_model():
        print("[Startup] Pricer model not found. Generating synthetic data and training...")
        await pricer.seed_historical_data(db)
        # Load data and train
        cursor = db.historical_jobs.find({})
        records = await cursor.to_list(length=10000)
        if records:
            import pandas as pd
            df = pd.DataFrame(records)
            pricer.train_pricer_model(df)

    # 5. Train ranker if needed
    print("\n[Startup] Checking ranker model...")
    if not ranker.load_ranker_model():
        print("[Startup] Ranker model not found. Training from historical data...")
        result = await ranker.train_ranker(db)
        print(f"[Startup] Ranker training result: {result}")

    # 6. Seed material transactions
    print("\n[Startup] Checking material transactions...")
    await recommender.seed_material_transactions(db)
    await recommender.build_association_rules(db)

    # 7. Create MongoDB indexes
    print("\n[Startup] Creating indexes...")
    await create_indexes()

    # 8. Run demand forecaster synchronously
    print("\n[Startup] Starting demand forecaster (synchronous)...")
    forecaster.fit_all_models()

    print("\n" + "=" * 60)
    print("  SkillBridge is READY! 🚀")
    print("=" * 60)

    # Verify worker count at startup
    worker_count = await db.worker_profiles.count_documents({})
    user_count = await db.users.count_documents({"role": "worker"})
    print(f"  Workers in DB: {worker_count} profiles, {user_count} user accounts")
    print("=" * 60 + "\n")

    yield

    # Shutdown
    await close_db()
    print("[Shutdown] SkillBridge stopped.")




# Create FastAPI app
app = FastAPI(
    title="SkillBridge API",
    description="AI-Powered Local Services Platform connecting customers with skilled workers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware — allow all origins for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(workers_router)
app.include_router(jobs_router)
app.include_router(ratings_router)
app.include_router(ai_router)


# ─────────────────────────── Health Check ───────────────────────────

@app.get("/health", tags=["Health"])
async def health_check():
    """Returns model loading status, DB connection, and counts."""
    db = get_db()
    db_connected = db is not None

    worker_count = 0
    job_count = 0
    user_count = 0

    if db_connected:
        try:
            worker_count = await db.worker_profiles.count_documents({})
            job_count = await db.jobs.count_documents({})
            user_count = await db.users.count_documents({})
        except Exception:
            db_connected = False

    return {
        "success": True,
        "data": {
            "status": "healthy" if db_connected else "degraded",
            "database": "connected" if db_connected else "disconnected",
            "models": {
                "sentence_transformer": semantic_matcher.get_model() is not None,
                "pricer": os.path.exists(settings.PRICER_MODEL_PATH),
                "ranker": os.path.exists(settings.RANKER_MODEL_PATH),
                "forecaster": forecaster.is_ready(),
            },
            "counts": {
                "workers": worker_count,
                "jobs": job_count,
                "users": user_count,
            },
            "timestamp": datetime.utcnow().isoformat(),
        },
        "message": "SkillBridge API is running",
    }


# ─────────────────────────── Admin Seed ───────────────────────────

@app.post("/admin/seed", tags=["Admin"])
async def seed_database():
    """Seed the database with 25 realistic worker profiles."""
    db = get_db()

    # Check if already seeded
    existing_workers = await db.worker_profiles.count_documents({})
    if existing_workers >= 25:
        return {
            "success": False,
            "data": {"existing_workers": existing_workers},
            "message": "Database already seeded. Clear the database first to re-seed.",
        }

    # Load seed data
    seed_file = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "seed_workers.json")
    if not os.path.exists(seed_file):
        return {"success": False, "data": None, "message": "Seed file not found"}

    with open(seed_file, "r") as f:
        workers_data = json.load(f)

    from app.services.auth_service import hash_password

    seeded_users = 0
    seeded_profiles = 0

    for worker in workers_data:
        # Check if user already exists
        existing = await db.users.find_one({"email": worker["email"]})
        if existing:
            continue

        # Create user document
        user_doc = {
            "name": worker["name"],
            "email": worker["email"],
            "password_hashed": hash_password("demo123"),
            "phone": worker["phone"],
            "role": "worker",
            "location": worker["location"],
            "created_at": datetime.utcnow(),
        }

        result = await db.users.insert_one(user_doc)
        user_id = str(result.inserted_id)
        seeded_users += 1

        # Compute specialty embedding
        try:
            embedding = semantic_matcher.encode_text(worker["specialty_description"])
        except Exception:
            embedding = []

        # Create worker profile
        profile_doc = {
            "user_id": user_id,
            "skills": worker["skills"],
            "specialty_description": worker["specialty_description"],
            "experience_years": worker["experience_years"],
            "total_jobs_completed": worker.get("total_jobs_completed", 0),
            "avg_rating": worker.get("avg_rating", 0.0),
            "rating_count": worker.get("rating_count", 0),
            "availability_status": worker.get("availability_status", "available"),
            "service_radius_km": worker.get("service_radius_km", 10),
            "hourly_rate": worker.get("hourly_rate", 0),
            "specialty_embedding": embedding,
            "created_at": datetime.utcnow(),
        }

        await db.worker_profiles.insert_one(profile_doc)
        seeded_profiles += 1

    # Also create a demo customer
    demo_customer = await db.users.find_one({"email": "customer@demo.com"})
    if not demo_customer:
        await db.users.insert_one({
            "name": "Demo Customer",
            "email": "customer@demo.com",
            "password_hashed": hash_password("demo123"),
            "phone": "9876500000",
            "role": "customer",
            "location": {"city": "Bangalore", "pincode": "560001", "lat": 12.9716, "lng": 77.5946},
            "created_at": datetime.utcnow(),
        })
        seeded_users += 1

    return {
        "success": True,
        "data": {
            "users_created": seeded_users,
            "worker_profiles_created": seeded_profiles,
            "demo_customer_email": "customer@demo.com",
            "demo_password": "demo123",
        },
        "message": f"Database seeded with {seeded_profiles} workers and 1 demo customer",
    }


# ─────────────────────────── Root ───────────────────────────

@app.get("/", tags=["Root"])
async def root():
    return {
        "success": True,
        "data": {
            "app": "SkillBridge API",
            "version": "1.0.0",
            "docs": "/docs",
        },
        "message": "Welcome to SkillBridge — AI-Powered Local Services Platform",
    }
