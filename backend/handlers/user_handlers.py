"""
User API Handlers
Endpoints for user management, authentication, and user-specific operations
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File
from pydantic import BaseModel, EmailStr
from datetime import datetime
import psycopg2
import os
import uuid
from dao import UserDAO, UserGameDAO, ReviewDAO
from database import get_db
from auth import hash_password, verify_password

router = APIRouter(prefix="/users", tags=["users"])


# Pydantic models for request/response
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: str = "user"


class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    profile_picture: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserLibraryItem(BaseModel):
    ownership_id: int
    game_id: int
    title: str
    genre: Optional[str]
    platform: Optional[str]
    price: Optional[float]
    hours_played: float
    status: str
    date_purchased: datetime


class UserProfile(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    total_games: int
    total_reviews: int
    created_at: datetime


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    profile_picture: Optional[str] = None
    message: str


@router.post("/login", response_model=LoginResponse)
def login_user(credentials: UserLogin, db=Depends(get_db)):
    """Login user with email and password"""
    user_dao = UserDAO(db)
    
    # Get user by email
    user = user_dao.get_by_email(credentials.email)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(credentials.password, user['password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Return user info (without password)
    profile_pic = user.get('profile_picture')
    profile_url = f"http://localhost:8000/static/{profile_pic}" if profile_pic else None
    
    return {
        "user_id": user['user_id'],
        "username": user['username'],
        "email": user['email'],
        "role": user['role'],
        "profile_picture": profile_url,
        "message": "Login successful"
    }


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db=Depends(get_db)):
    """Register a new user account"""
    user_dao = UserDAO(db)
    
    # Check if username or email already exists
    if user_dao.get_by_username(user.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken"
        )
    
    if user_dao.get_by_email(user.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    try:
        # Hash password before storing
        hashed_password = hash_password(user.password)
        created_user = user_dao.create(
            username=user.username,
            email=user.email,
            password=hashed_password,
            role=user.role
        )
        return created_user
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create user"
        )


@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: int, db=Depends(get_db)):
    """Get user profile by ID"""
    user_dao = UserDAO(db)
    user = user_dao.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


@router.get("/{user_id}/profile", response_model=UserProfile)
def get_user_profile(user_id: int, db=Depends(get_db)):
    """Get detailed user profile with stats"""
    user_dao = UserDAO(db)
    user_game_dao = UserGameDAO(db)
    review_dao = ReviewDAO(db)
    
    user = user_dao.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    total_games = user_game_dao.count_by_user(user_id)
    total_reviews = review_dao.count_by_user(user_id)
    
    return {
        **user,
        "total_games": total_games,
        "total_reviews": total_reviews
    }


@router.get("/{user_id}/library", response_model=list[UserLibraryItem])
def get_user_library(
    user_id: int,
    status_filter: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    db=Depends(get_db)
):
    """Get user's game library with optional status filter"""
    user_dao = UserDAO(db)
    user_game_dao = UserGameDAO(db)
    
    # Verify user exists
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if status_filter:
        games = user_game_dao.get_by_status(user_id, status_filter)
    else:
        games = user_game_dao.get_by_user(user_id, limit, offset)
    
    return games


@router.get("/{user_id}/reviews")
def get_user_reviews(
    user_id: int,
    limit: int = 20,
    offset: int = 0,
    db=Depends(get_db)
):
    """Get all reviews written by a user"""
    user_dao = UserDAO(db)
    review_dao = ReviewDAO(db)
    
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    reviews = review_dao.get_by_user(user_id, limit, offset)
    return reviews


@router.patch("/{user_id}", response_model=UserResponse)
def update_user(user_id: int, user_update: UserUpdate, db=Depends(get_db)):
    """Update user information"""
    user_dao = UserDAO(db)
    
    # Verify user exists
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check for username/email conflicts
    update_data = user_update.model_dump(exclude_unset=True)
    
    if "username" in update_data:
        existing = user_dao.get_by_username(update_data["username"])
        if existing and existing["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already taken"
            )
    
    if "email" in update_data:
        existing = user_dao.get_by_email(update_data["email"])
        if existing and existing["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered"
            )
    
    try:
        # Hash password if being updated
        if "password" in update_data:
            update_data["password"] = hash_password(update_data["password"])
        
        updated_user = user_dao.update(user_id, **update_data)
        return updated_user
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user"
        )


@router.post("/{user_id}/upload-profile-picture")
async def upload_profile_picture(user_id: int, file: UploadFile = File(...), db=Depends(get_db)):
    """Upload profile picture for user"""
    user_dao = UserDAO(db)
    
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Generate unique filename
    file_ext = os.path.splitext(file.filename or 'image.jpg')[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = f"static/images/{unique_filename}"
    
    # Save file
    try:
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        # Update user record with image path
        db_path = f"images/{unique_filename}"
        user_dao.update(user_id, profile_picture=db_path)
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture": f"http://localhost:8000/static/{db_path}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload profile picture"
        )


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, db=Depends(get_db)):
    """Delete a user account"""
    user_dao = UserDAO(db)
    
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    try:
        user_dao.delete(user_id)
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete user"
        )
