from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class BookingResponse(BaseModel):
    id: str
    job_id: str
    customer_id: str
    worker_id: str
    status: str
    scheduled_time: Optional[datetime] = None
    actual_start: Optional[datetime] = None
    actual_end: Optional[datetime] = None
    price_agreed: Optional[float] = None
    created_at: Optional[datetime] = None
