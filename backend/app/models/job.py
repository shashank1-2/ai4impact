from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class JobLocation(BaseModel):
    city: str
    pincode: str


class ParsedJob(BaseModel):
    job_category: str
    urgency: str
    complexity: str
    likely_causes: List[str] = []
    job_summary: str = ""


class EstimatedPrice(BaseModel):
    min: float
    base: float
    max: float


class MatchedWorker(BaseModel):
    worker_id: str
    name: str
    skills: List[str]
    specialty_description: str
    experience_years: int
    avg_rating: float
    rating_count: int
    availability_status: str
    hourly_rate: float
    similarity_score: float
    final_score: float


class JobAnalyzeRequest(BaseModel):
    raw_description: str = Field(..., min_length=5)
    location: JobLocation


class JobAnalyzeResponse(BaseModel):
    job_id: str
    parsed_job: ParsedJob
    estimated_price: EstimatedPrice
    materials_recommended: List[dict]
    matched_workers: List[MatchedWorker]


class SelectWorkerRequest(BaseModel):
    worker_id: str


class JobStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(accepted|in_progress|completed|cancelled)$")


class JobResponse(BaseModel):
    id: str
    customer_id: Optional[str] = None
    raw_description: str
    parsed_job: Optional[ParsedJob] = None
    matched_workers: Optional[List[dict]] = None
    selected_worker_id: Optional[str] = None
    status: str
    estimated_price: Optional[EstimatedPrice] = None
    final_price: Optional[float] = None
    materials_recommended: Optional[List[dict]] = None
    location: Optional[JobLocation] = None
    created_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    booking: Optional[dict] = None
