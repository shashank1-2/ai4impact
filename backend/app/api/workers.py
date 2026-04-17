"""
Workers API Routes — Worker profile CRUD, availability, earnings.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.worker import WorkerProfileCreate
from app.services.auth_service import get_current_user
from app.services import worker_service

router = APIRouter(prefix="/workers", tags=["Workers"])


def _format_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}


def _clean_profile(profile: dict) -> dict:
    """Remove internal fields from profile response."""
    if profile is None:
        return None
    cleaned = {k: v for k, v in profile.items() if k not in ["_id", "specialty_embedding"]}
    return cleaned


@router.post("/profile")
async def create_or_update_profile(
    profile_data: WorkerProfileCreate,
    current_user=Depends(get_current_user)
):
    """Create or update worker profile (requires worker role)."""
    if current_user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can create profiles")

    profile = await worker_service.create_or_update_profile(
        user_id=current_user["id"],
        data=profile_data.model_dump()
    )

    return _format_response(True, _clean_profile(profile), "Worker profile saved")


@router.get("/profile/me")
async def get_my_profile(current_user=Depends(get_current_user)):
    """Get own worker profile."""
    if current_user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers have profiles")

    profile = await worker_service.get_profile_by_user_id(current_user["id"])
    if not profile:
        raise HTTPException(status_code=404, detail="Worker profile not found. Create one first.")

    return _format_response(True, _clean_profile(profile), "Profile retrieved")


@router.patch("/availability")
async def toggle_availability(current_user=Depends(get_current_user)):
    """Toggle availability status between available and busy."""
    if current_user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can toggle availability")

    new_status = await worker_service.toggle_availability(current_user["id"])
    if not new_status:
        raise HTTPException(status_code=404, detail="Worker profile not found")

    return _format_response(True, {"availability_status": new_status}, f"Status changed to {new_status}")


@router.get("/me/jobs")
async def get_my_jobs(current_user=Depends(get_current_user)):
    """Get all jobs where this worker is selected."""
    if current_user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can view their jobs")

    jobs = await worker_service.get_worker_jobs(current_user["id"])
    return _format_response(True, jobs, f"Found {len(jobs)} jobs")


@router.get("/me/earnings")
async def get_my_earnings(current_user=Depends(get_current_user)):
    """Get worker earnings breakdown."""
    if current_user["role"] != "worker":
        raise HTTPException(status_code=403, detail="Only workers can view earnings")

    earnings = await worker_service.get_worker_earnings(current_user["id"])
    return _format_response(True, earnings, "Earnings retrieved")


@router.get("/{worker_id}")
async def get_worker_profile(worker_id: str):
    """Get any worker's public profile with their average rating."""
    profile = await worker_service.get_worker_public_profile(worker_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Worker not found")

    return _format_response(True, _clean_profile(profile), "Worker profile retrieved")
