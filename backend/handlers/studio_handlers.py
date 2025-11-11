"""
Studio API Handlers
Endpoints for game studio information and their published games
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query
from pydantic import BaseModel
from datetime import datetime
import psycopg2
from dao import StudioDAO, GameDAO
from database import get_db

router = APIRouter(prefix="/studios", tags=["studios"])


# Pydantic models
class StudioCreate(BaseModel):
    name: str
    logo: Optional[str] = None
    contact_info: Optional[str] = None


class StudioUpdate(BaseModel):
    name: Optional[str] = None
    logo: Optional[str] = None
    contact_info: Optional[str] = None


class StudioResponse(BaseModel):
    studio_id: int
    name: str
    logo: Optional[str]
    contact_info: Optional[str]
    created_at: datetime
    updated_at: datetime


class StudioDetail(BaseModel):
    studio_id: int
    name: str
    logo: Optional[str]
    contact_info: Optional[str]
    total_games: int
    created_at: datetime
    updated_at: datetime


class GameBasic(BaseModel):
    game_id: int
    title: str
    genre: Optional[str]
    platform: Optional[str]
    price: Optional[float]
    release_date: Optional[str]


@router.post("/", response_model=StudioResponse, status_code=status.HTTP_201_CREATED)
def create_studio(studio: StudioCreate, db=Depends(get_db)):
    """Register a new game studio"""
    studio_dao = StudioDAO(db)
    
    # Check if studio name already exists
    existing = studio_dao.get_by_name(studio.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Studio with this name already exists"
        )
    
    try:
        created_studio = studio_dao.create(
            name=studio.name,
            logo=studio.logo,
            contact_info=studio.contact_info
        )
        return created_studio
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create studio"
        )


@router.get("/", response_model=List[StudioResponse])
def list_studios(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """List all game studios"""
    studio_dao = StudioDAO(db)
    studios = studio_dao.get_all(limit=limit, offset=offset)
    return studios


@router.get("/{studio_id}", response_model=StudioDetail)
def get_studio(studio_id: int, db=Depends(get_db)):
    """Get detailed information about a studio"""
    studio_dao = StudioDAO(db)
    
    studio = studio_dao.get_by_id(studio_id)
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    # Get game count
    games = studio_dao.get_games(studio_id)
    
    return {
        **studio,
        "total_games": len(games)
    }


@router.get("/{studio_id}/games", response_model=List[GameBasic])
def get_studio_games(
    studio_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get all games published by a studio"""
    studio_dao = StudioDAO(db)
    game_dao = GameDAO(db)
    
    # Verify studio exists
    studio = studio_dao.get_by_id(studio_id)
    if not studio:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    games = game_dao.get_by_studio(studio_id, limit=limit, offset=offset)
    return games


@router.patch("/{studio_id}", response_model=StudioResponse)
def update_studio(studio_id: int, studio_update: StudioUpdate, db=Depends(get_db)):
    """Update studio information"""
    studio_dao = StudioDAO(db)
    
    # Verify studio exists
    if not studio_dao.get_by_id(studio_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    update_data = studio_update.model_dump(exclude_unset=True)
    
    # Check for name conflict if name is being updated
    if "name" in update_data:
        existing = studio_dao.get_by_name(update_data["name"])
        if existing and existing["studio_id"] != studio_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Studio with this name already exists"
            )
    
    try:
        updated_studio = studio_dao.update(studio_id, **update_data)
        return updated_studio
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update studio"
        )


@router.delete("/{studio_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_studio(studio_id: int, db=Depends(get_db)):
    """Delete a studio (games will have studio_id set to NULL)"""
    studio_dao = StudioDAO(db)
    
    if not studio_dao.get_by_id(studio_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studio not found"
        )
    
    try:
        studio_dao.delete(studio_id)
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete studio"
        )
