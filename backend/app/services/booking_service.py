"""
Booking Service — Handles booking lifecycle and ratings.
"""
from datetime import datetime
from typing import Optional
from bson import ObjectId
from app.database import get_db


async def get_booking(booking_id: str) -> Optional[dict]:
    """Get a booking by ID."""
    db = get_db()
    try:
        booking = await db.bookings.find_one({"_id": ObjectId(booking_id)})
        if booking:
            booking["id"] = str(booking["_id"])
        return booking
    except Exception:
        return None


async def submit_rating(
    booking_id: str,
    customer_id: str,
    rating: int,
    review_text: str = ""
) -> Optional[dict]:
    """Submit a rating for a completed booking."""
    db = get_db()

    # Validate booking
    booking = await get_booking(booking_id)
    if not booking:
        return {"error": "Booking not found"}

    if booking.get("status") != "completed":
        return {"error": "Can only rate completed bookings"}

    if booking.get("customer_id") != customer_id:
        return {"error": "Only the customer can rate this booking"}

    # Check if already rated
    existing = await db.ratings.find_one({"booking_id": booking_id})
    if existing:
        return {"error": "Already rated this booking"}

    worker_id = booking.get("worker_id")
    job_id = booking.get("job_id")

    # Create rating
    rating_doc = {
        "booking_id": booking_id,
        "job_id": job_id,
        "customer_id": customer_id,
        "worker_id": worker_id,
        "rating": rating,
        "review_text": review_text,
        "created_at": datetime.utcnow(),
    }

    result = await db.ratings.insert_one(rating_doc)
    rating_doc["id"] = str(result.inserted_id)

    # Update worker's rolling average rating
    profile = await db.worker_profiles.find_one({"user_id": worker_id})
    if profile:
        old_avg = profile.get("avg_rating", 0.0)
        old_count = profile.get("rating_count", 0)

        new_count = old_count + 1
        new_avg = ((old_avg * old_count) + rating) / new_count

        await db.worker_profiles.update_one(
            {"user_id": worker_id},
            {"$set": {
                "avg_rating": round(new_avg, 2),
                "rating_count": new_count,
                "total_jobs_completed": profile.get("total_jobs_completed", 0) + 1,
            }}
        )

    return rating_doc


async def get_worker_ratings(worker_id: str) -> list:
    """Get all ratings for a worker."""
    db = get_db()
    cursor = db.ratings.find({"worker_id": worker_id}).sort("created_at", -1)
    ratings = await cursor.to_list(length=100)
    for r in ratings:
        r["id"] = str(r["_id"])
        r.pop("_id", None)
    return ratings
