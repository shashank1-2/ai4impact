"""
Jobs API Routes — Job analysis, worker selection, status updates.
"""
from fastapi import APIRouter, HTTPException, Depends
from app.models.job import JobAnalyzeRequest, SelectWorkerRequest, JobStatusUpdate
from app.services.auth_service import get_current_user, get_optional_user
from app.services import job_service

router = APIRouter(prefix="/jobs", tags=["Jobs"])


def _format_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}


@router.post("/analyze")
async def analyze_job(request: JobAnalyzeRequest, current_user=Depends(get_optional_user)):
    """
    THE CORE ENDPOINT — Runs the full AI pipeline.
    Does NOT require auth (anonymous allowed for demo).
    """
    try:
        result = await job_service.analyze_job(
            raw_description=request.raw_description,
            location=request.location.model_dump(),
        )

        # If user is authenticated, update the job with customer_id
        if current_user:
            from app.database import get_db
            from bson import ObjectId
            db = get_db()
            await db.jobs.update_one(
                {"_id": ObjectId(result["job_id"])},
                {"$set": {"customer_id": current_user["id"]}}
            )

        return _format_response(True, result, "Job analyzed successfully with AI pipeline")

    except Exception as e:
        print(f"[Jobs API] Error in analyze_job: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/{job_id}/select-worker")
async def select_worker(
    job_id: str,
    request: SelectWorkerRequest,
    current_user=Depends(get_optional_user)
):
    """Select a worker from the matched list. Creates a booking."""
    customer_id = current_user["id"] if current_user else None

    booking = await job_service.select_worker(
        job_id=job_id,
        worker_id=request.worker_id,
        customer_id=customer_id,
    )

    if not booking:
        raise HTTPException(status_code=404, detail="Job not found")

    return _format_response(True, booking, "Worker selected and booking created")


@router.patch("/{job_id}/status")
async def update_status(
    job_id: str,
    request: JobStatusUpdate,
    current_user=Depends(get_current_user)
):
    """Update job status. Worker: accepted→in_progress→completed. Customer: any→cancelled."""
    updated = await job_service.update_job_status(
        job_id=job_id,
        new_status=request.status,
        user_id=current_user["id"],
    )

    if not updated:
        raise HTTPException(status_code=404, detail="Job not found")

    # Clean ObjectId
    updated.pop("_id", None)
    return _format_response(True, updated, f"Job status updated to {request.status}")


@router.get("/my/history")
async def get_my_jobs(current_user=Depends(get_current_user)):
    """Get all jobs for the authenticated user (works for both roles)."""
    jobs = await job_service.get_user_jobs(
        user_id=current_user["id"],
        role=current_user["role"],
    )
    return _format_response(True, jobs, f"Found {len(jobs)} jobs")


@router.get("/{job_id}")
async def get_job(job_id: str):
    """Get full job details including booking info."""
    job = await job_service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.pop("_id", None)
    return _format_response(True, job, "Job details retrieved")
