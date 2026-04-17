"""
Job Service — Orchestrates the full AI pipeline for job analysis and lifecycle management.
"""
import math
import random
import logging
from datetime import datetime
from typing import Optional, List
from bson import ObjectId
from app.database import get_db
from app.ai import llm_parser, semantic_matcher, ranker, pricer, recommender

logger = logging.getLogger("skillbridge.job_service")


def _haversine_distance(lat1, lng1, lat2, lng2) -> float:
    """Calculate distance in km between two lat/lng points."""
    if any(v is None for v in [lat1, lng1, lat2, lng2]):
        return random.uniform(2, 15)  # Return random distance for demo

    R = 6371  # Earth's radius in km
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def _get_time_of_day() -> str:
    """Get current time of day category."""
    hour = datetime.now().hour
    if 6 <= hour < 12:
        return "morning"
    elif 12 <= hour < 17:
        return "afternoon"
    elif 17 <= hour < 21:
        return "evening"
    else:
        return "night"


async def analyze_job(raw_description: str, location: dict) -> dict:
    """
    THE CORE FUNCTION — Runs the full AI pipeline:
    1. LLM Parser → structured job info
    2. Fetch matching workers
    3. Semantic matching
    4. Dynamic pricing
    5. Material recommendations
    6. Worker ranking
    """
    db = get_db()

    # 1. Parse the problem description
    parsed_job = await llm_parser.parse_problem(raw_description)

    # 2. Fetch workers from matching city
    city = location.get("city", "")
    worker_query = {}
    print(f"[Job Debug] City from request: '{city}'")

    if city:
        # Find users in this city
        user_cursor = db.users.find({
            "role": "worker",
            "location.city": {"$regex": city, "$options": "i"}
        })
        local_users = await user_cursor.to_list(length=200)
        local_user_ids = [str(u["_id"]) for u in local_users]
        print(f"[Job Debug] Users found in '{city}': {len(local_user_ids)}")

        if local_user_ids:
            worker_query = {"user_id": {"$in": local_user_ids}}
        else:
            # No users in this city — skip filter, fetch all workers
            print(f"[Job Debug] No workers in city '{city}', will fetch ALL workers")

    print(f"[Job Debug] worker_query: {worker_query}")
    cursor = db.worker_profiles.find(worker_query)
    workers = await cursor.to_list(length=100)
    print(f"[Job Debug] Worker profiles from query: {len(workers)}")

    if len(workers) == 0:
        # Fallback: get all workers (should only fire if DB is empty)
        print("[Job Debug] FALLBACK: fetching all profiles")
        cursor = db.worker_profiles.find({})
        workers = await cursor.to_list(length=100)
        print(f"[Job Debug] Workers after fallback: {len(workers)}")

    print(f"[Job Debug] Total workers for matching: {len(workers)}")

    # Build enriched job description for matching
    job_text = f"{raw_description}. Category: {parsed_job.get('job_category', '')}. " \
               f"Urgency: {parsed_job.get('urgency', '')}. " \
               f"Possible causes: {', '.join(parsed_job.get('likely_causes', []))}"

    # 3. Semantic matching
    similarity_scores = await semantic_matcher.match_workers(job_text, workers, db)
    print(f"[Job Debug] Semantic scores returned: {len(similarity_scores)}")

    # Create a lookup map — keyed by whatever semantic_matcher returns as worker_id
    score_map = {s["worker_id"]: s["similarity_score"] for s in similarity_scores}

    # Debug: log key formats to catch mismatches
    if similarity_scores and workers:
        sample_score_key = next(iter(score_map))
        sample_profile_id = str(workers[0]["_id"])
        sample_user_id = workers[0].get("user_id", "")
        print(
            f"[Job Debug] score_map key sample: '{sample_score_key}' | "
            f"profile _id sample: '{sample_profile_id}' | "
            f"user_id sample: '{sample_user_id}'"
        )

    # 4. Dynamic pricing
    time_of_day = _get_time_of_day()
    avg_experience = sum(w.get("experience_years", 5) for w in workers) / max(len(workers), 1)
    estimated_price = pricer.predict_price(
        job_type=parsed_job.get("job_category", "general"),
        complexity=parsed_job.get("complexity", "medium"),
        time_of_day=time_of_day,
        worker_experience=int(avg_experience),
        distance_km=8.0,  # Average estimate
    )

    # 5. Material recommendations
    materials = recommender.recommend_materials(
        job_category=parsed_job.get("job_category", "general"),
        existing_materials=None,
    )

    # 6. Enrich workers and rank
    enriched_workers = []
    for w in workers:
        profile_id = str(w["_id"])
        user_id = w.get("user_id", "")

        # Get user info for name
        try:
            user = await db.users.find_one({"_id": ObjectId(user_id)})
            user_name = user.get("name", "Worker") if user else "Worker"
            user_location = user.get("location", {}) if user else {}
        except Exception:
            user_name = "Worker"
            user_location = {}

        # Calculate distance
        distance = _haversine_distance(
            location.get("lat"), location.get("lng"),
            user_location.get("lat"), user_location.get("lng")
        )

        # Lookup similarity score — try profile _id first, then user_id as fallback
        sim_score = score_map.get(profile_id, score_map.get(user_id, 0.0))

        enriched_workers.append({
            "worker_id": user_id,
            "profile_id": profile_id,
            "name": user_name,
            "skills": w.get("skills", []),
            "specialty_description": w.get("specialty_description", ""),
            "experience_years": w.get("experience_years", 0),
            "avg_rating": w.get("avg_rating", 0.0),
            "rating_count": w.get("rating_count", 0),
            "availability_status": w.get("availability_status", "available"),
            "hourly_rate": w.get("hourly_rate", 0),
            "similarity_score": sim_score,
            "distance_km": round(distance, 1),
        })

    print(f"[Job Debug] Enriched workers: {len(enriched_workers)}")

    # Rank workers
    ranked_workers = ranker.rank_workers(
        enriched_workers,
        job_urgency=parsed_job.get("urgency", "medium"),
        job_complexity=parsed_job.get("complexity", "medium"),
    )
    print(f"[Job Debug] Ranked workers: {len(ranked_workers)}")

    # Take top 5
    top_workers = ranked_workers[:5]
    print(f"[Job Debug] Top workers returned: {len(top_workers)}")

    # Save job to database
    job_doc = {
        "customer_id": None,  # Will be set if user is authenticated
        "raw_description": raw_description,
        "parsed_job": parsed_job,
        "matched_workers": [
            {
                "worker_id": w["worker_id"],
                "name": w["name"],
                "similarity_score": w["similarity_score"],
                "final_score": w["final_score"],
            }
            for w in top_workers
        ],
        "selected_worker_id": None,
        "status": "pending",
        "estimated_price": estimated_price,
        "final_price": None,
        "materials_recommended": materials,
        "location": location,
        "time_of_day": time_of_day,
        "created_at": datetime.utcnow(),
        "completed_at": None,
    }

    result = await db.jobs.insert_one(job_doc)
    job_id = str(result.inserted_id)

    return {
        "job_id": job_id,
        "parsed_job": parsed_job,
        "estimated_price": estimated_price,
        "materials_recommended": materials,
        "matched_workers": [
            {
                "worker_id": w["worker_id"],
                "name": w["name"],
                "skills": w["skills"],
                "specialty_description": w["specialty_description"],
                "experience_years": w["experience_years"],
                "avg_rating": w["avg_rating"],
                "rating_count": w["rating_count"],
                "availability_status": w["availability_status"],
                "hourly_rate": w["hourly_rate"],
                "similarity_score": w["similarity_score"],
                "final_score": w["final_score"],
            }
            for w in top_workers
        ],
    }


async def select_worker(job_id: str, worker_id: str, customer_id: str = None) -> dict:
    """Select a worker for a job and create a booking."""
    db = get_db()

    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return None

    if not job:
        return None

    # Update job
    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": {
            "selected_worker_id": worker_id,
            "status": "accepted",
            "customer_id": customer_id,
        }}
    )

    # Create booking
    booking_doc = {
        "job_id": job_id,
        "customer_id": customer_id or str(job.get("customer_id", "")),
        "worker_id": worker_id,
        "status": "confirmed",
        "scheduled_time": None,
        "actual_start": None,
        "actual_end": None,
        "price_agreed": job.get("estimated_price", {}).get("base"),
        "created_at": datetime.utcnow(),
    }

    result = await db.bookings.insert_one(booking_doc)
    booking_doc["id"] = str(result.inserted_id)
    booking_doc.pop("_id", None)

    return booking_doc


async def update_job_status(job_id: str, new_status: str, user_id: str = None) -> Optional[dict]:
    """Update job status with validation."""
    db = get_db()

    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return None

    if not job:
        return None

    update_data = {"status": new_status}

    if new_status == "completed":
        update_data["completed_at"] = datetime.utcnow()

    # Also update booking status
    if new_status in ["in_progress", "completed", "cancelled"]:
        booking_status_map = {
            "in_progress": "in_progress",
            "completed": "completed",
            "cancelled": "cancelled",
        }
        booking_update = {"status": booking_status_map[new_status]}

        if new_status == "in_progress":
            booking_update["actual_start"] = datetime.utcnow()
        elif new_status == "completed":
            booking_update["actual_end"] = datetime.utcnow()

        await db.bookings.update_one(
            {"job_id": job_id},
            {"$set": booking_update}
        )

    await db.jobs.update_one(
        {"_id": ObjectId(job_id)},
        {"$set": update_data}
    )

    updated_job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    updated_job["id"] = str(updated_job["_id"])
    return updated_job


async def get_job(job_id: str) -> Optional[dict]:
    """Get full job details including booking info."""
    db = get_db()

    try:
        job = await db.jobs.find_one({"_id": ObjectId(job_id)})
    except Exception:
        return None

    if not job:
        return None

    job["id"] = str(job["_id"])

    # Get booking if exists
    booking = await db.bookings.find_one({"job_id": job_id})
    if booking:
        booking["id"] = str(booking["_id"])
        booking.pop("_id", None)
        job["booking"] = booking

    return job


async def get_user_jobs(user_id: str, role: str = "customer") -> list:
    """Get all jobs for a user (customer or worker)."""
    db = get_db()

    if role == "worker":
        cursor = db.jobs.find({"selected_worker_id": user_id})
    else:
        cursor = db.jobs.find({"customer_id": user_id})

    jobs = await cursor.to_list(length=100)
    for job in jobs:
        job["id"] = str(job["_id"])
        job.pop("_id", None)
    return jobs
