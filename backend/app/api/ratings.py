"""
Ratings API Routes — Submit and retrieve ratings.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.rating import RatingCreate
from app.services.auth_service import get_current_user
from app.services import booking_service

router = APIRouter(prefix="/ratings", tags=["Ratings"])


def _format_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}


@router.post("")
async def submit_rating(
    rating_data: RatingCreate,
    current_user=Depends(get_current_user)
):
    """Submit a rating after job completion."""
    if current_user["role"] != "customer":
        raise HTTPException(status_code=403, detail="Only customers can submit ratings")

    result = await booking_service.submit_rating(
        booking_id=rating_data.booking_id,
        customer_id=current_user["id"],
        rating=rating_data.rating,
        review_text=rating_data.review_text or "",
    )

    if result and "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    if not result:
        raise HTTPException(status_code=500, detail="Failed to submit rating")

    result.pop("_id", None)
    return _format_response(True, result, "Rating submitted successfully")


@router.get("/worker/{worker_id}")
async def get_worker_ratings(worker_id: str):
    """Get all ratings for a worker with review text."""
    ratings = await booking_service.get_worker_ratings(worker_id)
    return _format_response(True, ratings, f"Found {len(ratings)} ratings")
