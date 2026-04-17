"""
Auth API Routes — Registration, Login, and current user profile.
"""
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.user import UserRegister, UserLogin, UserResponse, TokenResponse
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, get_current_user
)
from app.database import get_db

router = APIRouter(prefix="/auth", tags=["Auth"])


def _format_response(success: bool, data=None, message: str = ""):
    return {"success": success, "data": data, "message": message}


@router.post("/register")
async def register(user_data: UserRegister):
    """Register a new user (customer or worker)."""
    db = get_db()

    # Check if email exists
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create user document
    user_doc = {
        "name": user_data.name,
        "email": user_data.email,
        "password_hashed": hash_password(user_data.password),
        "phone": user_data.phone,
        "role": user_data.role,
        "location": user_data.location.model_dump(),
        "created_at": datetime.utcnow(),
    }

    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Generate token
    token = create_access_token({"user_id": user_id, "role": user_data.role})

    user_response = {
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email,
        "phone": user_data.phone,
        "role": user_data.role,
        "location": user_data.location.model_dump(),
        "created_at": user_doc["created_at"].isoformat(),
    }

    return _format_response(True, {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response,
    }, "Registration successful")


@router.post("/login")
async def login(credentials: UserLogin):
    """Login with email and password."""
    db = get_db()

    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not verify_password(credentials.password, user["password_hashed"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    user_id = str(user["_id"])
    token = create_access_token({"user_id": user_id, "role": user["role"]})

    user_response = {
        "id": user_id,
        "name": user["name"],
        "email": user["email"],
        "phone": user["phone"],
        "role": user["role"],
        "location": user.get("location", {}),
        "created_at": user["created_at"].isoformat() if user.get("created_at") else None,
    }

    return _format_response(True, {
        "access_token": token,
        "token_type": "bearer",
        "user": user_response,
    }, "Login successful")


@router.get("/me")
async def get_me(current_user=Depends(get_current_user)):
    """Get current user profile from JWT."""
    user_response = {
        "id": current_user["id"],
        "name": current_user["name"],
        "email": current_user["email"],
        "phone": current_user.get("phone", ""),
        "role": current_user["role"],
        "location": current_user.get("location", {}),
        "created_at": current_user["created_at"].isoformat() if current_user.get("created_at") else None,
    }
    return _format_response(True, user_response, "User profile retrieved")
