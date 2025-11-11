"""
Library API Handlers
Endpoints for managing user's game library (purchases, ownership, playtime)
"""
from typing import Optional, Dict, Any
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from datetime import datetime
import psycopg2
from dao import UserGameDAO, GameDAO, UserDAO
from database import get_db

router = APIRouter(prefix="/library", tags=["library"])


# Pydantic models
class LibraryGameAdd(BaseModel):
    user_id: int
    game_id: int
    type: str  # "digital", "physical", "subscription"
    options: Optional[Dict[str, Any]] = None
    game_studio_id: Optional[int] = None


class LibraryGameUpdate(BaseModel):
    status: Optional[str] = None  # "owned", "playing", "completed", "wishlist"
    hours_played: Optional[float] = None
    loaned_to: Optional[int] = None
    loan_duration: Optional[int] = None


class PlaytimeUpdate(BaseModel):
    hours: float


@router.post("/", status_code=status.HTTP_201_CREATED)
def add_game_to_library(library_game: LibraryGameAdd, db=Depends(get_db)):
    """Add a game to user's library (purchase/claim)"""
    user_dao = UserDAO(db)
    game_dao = GameDAO(db)
    user_game_dao = UserGameDAO(db)
    
    # Verify user exists
    if not user_dao.get_by_id(library_game.user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Verify game exists
    game = game_dao.get_by_id(library_game.game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Check if user already owns the game
    existing = user_game_dao.get_by_user_and_game(library_game.user_id, library_game.game_id)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Game already in library"
        )
    
    try:
        ownership = user_game_dao.create(
            user_id=library_game.user_id,
            game_id=library_game.game_id,
            type=library_game.type,
            options=library_game.options,
            game_studio_id=library_game.game_studio_id
        )
        return ownership
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add game to library"
        )


@router.get("/{user_id}")
def get_user_library(
    user_id: int,
    status_filter: Optional[str] = Query(None, description="Filter by status"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get user's game library with optional filtering"""
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
    
    total_games = user_game_dao.count_by_user(user_id)
    
    return {
        "user_id": user_id,
        "total_games": total_games,
        "games": games
    }


@router.get("/{user_id}/loaned")
def get_loaned_games(user_id: int, db=Depends(get_db)):
    """Get games that user has loaned to others"""
    user_dao = UserDAO(db)
    user_game_dao = UserGameDAO(db)
    
    if not user_dao.get_by_id(user_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    loaned_games = user_game_dao.get_loaned_games(user_id)
    return {
        "user_id": user_id,
        "loaned_games": loaned_games
    }


@router.patch("/{ownership_id}")
def update_library_game(
    ownership_id: int,
    update: LibraryGameUpdate,
    db=Depends(get_db)
):
    """Update library game details (status, loan info, etc.)"""
    user_game_dao = UserGameDAO(db)
    
    # Verify ownership exists
    if not user_game_dao.get_by_id(ownership_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library entry not found"
        )
    
    update_data = update.model_dump(exclude_unset=True)
    
    try:
        updated = user_game_dao.update(ownership_id, **update_data)
        return updated
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update library entry"
        )


@router.post("/{ownership_id}/playtime")
def update_playtime(
    ownership_id: int,
    playtime: PlaytimeUpdate,
    db=Depends(get_db)
):
    """Update hours played for a game (incremental)"""
    user_game_dao = UserGameDAO(db)
    
    # Verify ownership exists
    if not user_game_dao.get_by_id(ownership_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library entry not found"
        )
    
    if playtime.hours < 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Hours must be positive"
        )
    
    try:
        updated = user_game_dao.update_hours_played(ownership_id, playtime.hours)
        return updated
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update playtime"
        )


@router.delete("/{ownership_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_from_library(ownership_id: int, db=Depends(get_db)):
    """Remove a game from user's library"""
    user_game_dao = UserGameDAO(db)
    
    if not user_game_dao.get_by_id(ownership_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Library entry not found"
        )
    
    try:
        user_game_dao.delete(ownership_id)
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove from library"
        )
