from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


class LocationModel(BaseModel):
    city: str
    pincode: str
    lat: Optional[float] = None
    lng: Optional[float] = None


class UserRegister(BaseModel):
    name: str
    email: str
    password: str
    phone: str
    role: str = Field(..., pattern="^(customer|worker)$")
    location: LocationModel


class UserLogin(BaseModel):
    email: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    email: str
    phone: str
    role: str
    location: LocationModel
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
