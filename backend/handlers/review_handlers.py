"""
Review API Handlers
Endpoints for game reviews and ratings
"""
from typing import Optional
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel, Field
from datetime import datetime
import psycopg2
from dao import ReviewDAO, GameDAO, UserDAO
from database import get_db

router = APIRouter(prefix="/reviews", tags=["reviews"])


# Pydantic models
class ReviewCreate(BaseModel):
    game_id: int
    user_id: int
    rating: int = Field(..., ge=1, le=5, description="Rating between 1 and 5")
    review_text: Optional[str] = None
    game_studio_id: Optional[int] = None


class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5)
    review_text: Optional[str] = None


class ReviewResponse(BaseModel):
    review_id: int
    game_id: int
    user_id: int
    username: str
    game_title: str
    rating: int
    review_text: Optional[str]
    created_at: datetime
    updated_at: datetime


@router.post("/", response_model=ReviewResponse, status_code=status.HTTP_201_CREATED)
def create_review(review: ReviewCreate, db=Depends(get_db)):
    """Submit a review for a game"""
    user_dao = UserDAO(db)
    game_dao = GameDAO(db)
    review_dao = ReviewDAO(db)
    
    # Verify user exists
    if not user_dao.get_by_id(review.user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify game exists
    if not game_dao.get_by_id(review.game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Check if user already reviewed this game
    existing = review_dao.get_by_user_and_game(review.user_id, review.game_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already reviewed this game. Use PATCH to update."
        )
    
    try:
        created_review = review_dao.create(
            game_id=review.game_id,
            user_id=review.user_id,
            rating=review.rating,
            review_text=review.review_text,
            game_studio_id=review.game_studio_id
        )
        
        # Fetch full details for response
        full_review = review_dao.get_by_id(created_review['review_id'])
        return full_review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review"
        )


@router.get("/{review_id}", response_model=ReviewResponse)
def get_review(review_id: int, db=Depends(get_db)):
    """Get a specific review by ID"""
    review_dao = ReviewDAO(db)
    
    review = review_dao.get_by_id(review_id)
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    return review


@router.get("/game/{game_id}")
def get_game_reviews(
    game_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get all reviews for a specific game"""
    game_dao = GameDAO(db)
    review_dao = ReviewDAO(db)
    
    # Verify game exists
    if not game_dao.get_by_id(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    reviews = review_dao.get_by_game(game_id, limit, offset)
    average_rating = review_dao.get_average_rating(game_id)
    total_reviews = review_dao.count_by_game(game_id)
    
    return {
        "game_id": game_id,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
        "reviews": reviews
    }


@router.get("/user/{user_id}")
def get_user_reviews(
    user_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get all reviews by a specific user"""
    user_dao = UserDAO(db)
    review_dao = ReviewDAO(db)
    
    # Verify user exists
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    reviews = review_dao.get_by_user(user_id, limit, offset)
    total_reviews = review_dao.count_by_user(user_id)
    
    return {
        "user_id": user_id,
        "total_reviews": total_reviews,
        "reviews": reviews
    }


@router.patch("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: int,
    review_update: ReviewUpdate,
    db=Depends(get_db)
):
    """Update an existing review"""
    review_dao = ReviewDAO(db)
    
    # Verify review exists
    existing = review_dao.get_by_id(review_id)
    if not existing:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    try:
        updated = review_dao.update(
            review_id,
            rating=review_update.rating,
            review_text=review_update.review_text
        )
        
        # Fetch full details for response
        full_review = review_dao.get_by_id(review_id)
        return full_review
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update review"
        )


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(review_id: int, db=Depends(get_db)):
    """Delete a review"""
    review_dao = ReviewDAO(db)
    
    if not review_dao.get_by_id(review_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found"
        )
    
    try:
        review_dao.delete(review_id)
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review"
        )
