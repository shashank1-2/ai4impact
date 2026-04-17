from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime


class WorkerProfileCreate(BaseModel):
    skills: List[str]
    specialty_description: str
    experience_years: int = Field(ge=0)
    service_radius_km: float = Field(ge=1, default=10.0)
    hourly_rate: float = Field(ge=0)


class WorkerProfileResponse(BaseModel):
    id: str
    user_id: str
    skills: List[str]
    specialty_description: str
    experience_years: int
    total_jobs_completed: int = 0
    avg_rating: float = 0.0
    rating_count: int = 0
    availability_status: str = "available"
    service_radius_km: float = 10.0
    hourly_rate: float = 0.0
    created_at: Optional[datetime] = None


class WorkerPublicProfile(BaseModel):
    id: str
    user_id: str
    name: str
    skills: List[str]
    specialty_description: str
    experience_years: int
    total_jobs_completed: int
    avg_rating: float
    rating_count: int
    availability_status: str
    service_radius_km: float
    hourly_rate: float
    location: Optional[dict] = None


class WorkerEarnings(BaseModel):
    total_earnings: float
    total_jobs_completed: int
    average_rating: float
    weekly_breakdown: List[dict] = []
    monthly_breakdown: List[dict] = []
