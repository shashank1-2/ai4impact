from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class RatingCreate(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    review_text: Optional[str] = ""


class RatingResponse(BaseModel):
    id: str
    booking_id: str
    job_id: str
    customer_id: str
    worker_id: str
    rating: int
    review_text: Optional[str] = ""
    created_at: Optional[datetime] = None
