"""
Worker Service — CRUD operations for worker profiles.
"""
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.database import get_db
from app.ai.semantic_matcher import encode_text


async def create_or_update_profile(user_id: str, data: dict) -> dict:
    """Create or update a worker profile."""
    db = get_db()

    # Compute specialty embedding
    specialty = data.get("specialty_description", "")
    skills = data.get("skills", [])
    if not specialty and skills:
        specialty = ", ".join(skills)

    try:
        embedding = encode_text(specialty)
    except Exception as e:
        print(f"[Worker Service] Failed to encode specialty: {e}")
        embedding = []

    profile_data = {
        "user_id": user_id,
        "skills": data.get("skills", []),
        "specialty_description": data.get("specialty_description", ""),
        "experience_years": data.get("experience_years", 0),
        "service_radius_km": data.get("service_radius_km", 10.0),
        "hourly_rate": data.get("hourly_rate", 0.0),
        "specialty_embedding": embedding,
    }

    existing = await db.worker_profiles.find_one({"user_id": user_id})

    if existing:
        await db.worker_profiles.update_one(
            {"user_id": user_id},
            {"$set": profile_data}
        )
        profile = await db.worker_profiles.find_one({"user_id": user_id})
    else:
        profile_data.update({
            "total_jobs_completed": 0,
            "avg_rating": 0.0,
            "rating_count": 0,
            "availability_status": "available",
            "created_at": datetime.utcnow(),
        })
        result = await db.worker_profiles.insert_one(profile_data)
        profile = await db.worker_profiles.find_one({"_id": result.inserted_id})

    profile["id"] = str(profile["_id"])
    return profile


async def get_profile_by_user_id(user_id: str) -> Optional[dict]:
    """Get worker profile by user_id."""
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": user_id})
    if profile:
        profile["id"] = str(profile["_id"])
    return profile


async def get_profile_by_id(worker_profile_id: str) -> Optional[dict]:
    """Get worker profile by its own _id."""
    db = get_db()
    try:
        profile = await db.worker_profiles.find_one({"_id": ObjectId(worker_profile_id)})
        if profile:
            profile["id"] = str(profile["_id"])
        return profile
    except Exception:
        return None


async def toggle_availability(user_id: str) -> str:
    """Toggle worker availability between available and busy."""
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": user_id})
    if not profile:
        return None

    new_status = "busy" if profile.get("availability_status") == "available" else "available"
    await db.worker_profiles.update_one(
        {"user_id": user_id},
        {"$set": {"availability_status": new_status}}
    )
    return new_status


async def get_worker_public_profile(worker_user_id: str) -> Optional[dict]:
    """Get a worker's public profile with user info."""
    db = get_db()
    profile = await db.worker_profiles.find_one({"user_id": worker_user_id})
    if not profile:
        return None

    user = await db.users.find_one({"_id": ObjectId(worker_user_id)})
    if not user:
        return None

    profile["id"] = str(profile["_id"])
    profile["name"] = user.get("name", "Unknown")
    profile["location"] = user.get("location", {})
    return profile


async def get_worker_jobs(worker_user_id: str) -> list:
    """Get all jobs where this worker is selected."""
    db = get_db()
    cursor = db.jobs.find({"selected_worker_id": worker_user_id})
    jobs = await cursor.to_list(length=100)
    for job in jobs:
        job["id"] = str(job["_id"])
        job.pop("_id", None)
    return jobs


async def get_worker_earnings(worker_user_id: str) -> dict:
    """Calculate worker earnings from completed bookings."""
    db = get_db()

    # Get completed bookings
    cursor = db.bookings.find({
        "worker_id": worker_user_id,
        "status": "completed"
    })
    bookings = await cursor.to_list(length=1000)

    total_earnings = sum(b.get("price_agreed", 0) for b in bookings)
    total_jobs = len(bookings)

    # Get profile for rating
    profile = await db.worker_profiles.find_one({"user_id": worker_user_id})
    avg_rating = profile.get("avg_rating", 0.0) if profile else 0.0

    # Weekly/monthly breakdown
    from collections import defaultdict
    weekly = defaultdict(float)
    monthly = defaultdict(float)

    for b in bookings:
        created = b.get("created_at")
        if created:
            week_key = created.strftime("%Y-W%U")
            month_key = created.strftime("%Y-%m")
            weekly[week_key] += b.get("price_agreed", 0)
            monthly[month_key] += b.get("price_agreed", 0)

    return {
        "total_earnings": total_earnings,
        "total_jobs_completed": total_jobs,
        "average_rating": avg_rating,
        "weekly_breakdown": [{"week": k, "earnings": v} for k, v in sorted(weekly.items())],
        "monthly_breakdown": [{"month": k, "earnings": v} for k, v in sorted(monthly.items())],
    }
