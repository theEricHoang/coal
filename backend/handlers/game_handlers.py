"""
Game API Handlers
Endpoints for game catalog, search, and game-specific operations
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File
from pydantic import BaseModel
from datetime import date, datetime
import psycopg2
import os
import uuid
from dao import GameDAO, ReviewDAO, UserGameDAO
from database import get_db

router = APIRouter(prefix="/games", tags=["games"])


# Pydantic models
class GameCreate(BaseModel):
    title: str
    genre: Optional[str] = None
    developer: Optional[str] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    price: Optional[float] = None
    studio_id: Optional[int] = None


class GameUpdate(BaseModel):
    title: Optional[str] = None
    genre: Optional[str] = None
    developer: Optional[str] = None
    release_date: Optional[date] = None
    platform: Optional[str] = None
    tags: Optional[List[str]] = None
    description: Optional[str] = None
    price: Optional[float] = None
    studio_id: Optional[int] = None


class GameResponse(BaseModel):
    game_id: int
    title: str
    genre: Optional[str]
    developer: Optional[str]
    release_date: Optional[date]
    platform: Optional[str]
    tags: Optional[List[str]]
    description: Optional[str]
    price: Optional[float]
    thumbnail: Optional[str]
    studio_id: Optional[int]
    created_at: datetime
    updated_at: datetime


class GameDetail(BaseModel):
    game_id: int
    title: str
    genre: Optional[str]
    developer: Optional[str]
    release_date: Optional[date]
    platform: Optional[str]
    tags: Optional[List[str]]
    description: Optional[str]
    price: Optional[float]
    thumbnail: Optional[str]
    studio_id: Optional[int]
    average_rating: Optional[float]
    total_reviews: int
    total_owners: int
    created_at: datetime


class GameSearchResult(BaseModel):
    games: List[GameResponse]
    total: int
    page: int
    page_size: int


@router.post("/", response_model=GameResponse, status_code=status.HTTP_201_CREATED)
def create_game(game: GameCreate, db=Depends(get_db)):
    """Create a new game in the catalog"""
    game_dao = GameDAO(db)
    
    # Check if game already exists
    existing = game_dao.get_by_title(game.title)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Game with this title already exists"
        )
    
    try:
        created_game = game_dao.create(
            title=game.title,
            genre=game.genre,
            developer=game.developer,
            release_date=game.release_date,
            platform=game.platform,
            tags=game.tags,
            description=game.description,
            price=game.price,
            studio_id=game.studio_id
        )
        return created_game
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create game"
        )


@router.get("/search", response_model=GameSearchResult)
def search_games(
    q: Optional[str] = Query(None, description="Search query"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    platform: Optional[str] = Query(None, description="Filter by platform"),
    studio_id: Optional[int] = Query(None, description="Filter by studio"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    db=Depends(get_db)
):
    """Search and filter games in the catalog"""
    game_dao = GameDAO(db)
    offset = (page - 1) * page_size
    
    # Apply filters based on query parameters
    if q:
        games = game_dao.search_by_title(q, limit=page_size)
    elif genre:
        games = game_dao.get_by_genre(genre, limit=page_size, offset=offset)
    elif platform:
        games = game_dao.get_by_platform(platform, limit=page_size, offset=offset)
    elif studio_id:
        games = game_dao.get_by_studio(studio_id, limit=page_size, offset=offset)
    else:
        games = game_dao.get_all(limit=page_size, offset=offset)
    
    # Convert thumbnail paths to full URLs
    for game in games:
        if game.get('thumbnail'):
            game['thumbnail'] = f"http://localhost:8000/static/{game['thumbnail']}"
    
    total = game_dao.count()
    
    return {
        "games": games,
        "total": total,
        "page": page,
        "page_size": page_size
    }


@router.get("/{game_id}", response_model=GameDetail)
def get_game(game_id: int, db=Depends(get_db)):
    """Get detailed information about a specific game"""
    game_dao = GameDAO(db)
    review_dao = ReviewDAO(db)
    user_game_dao = UserGameDAO(db)
    
    game = game_dao.get_by_id(game_id)
    if not game:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    # Convert thumbnail path to full URL
    if game.get('thumbnail'):
        game['thumbnail'] = f"http://localhost:8000/static/{game['thumbnail']}"
    
    # Get additional stats
    average_rating = review_dao.get_average_rating(game_id)
    total_reviews = review_dao.count_by_game(game_id)
    # Note: This would need a count method in UserGameDAO
    # For now, we'll use a placeholder
    total_owners = 0  # user_game_dao.count_owners_by_game(game_id)
    
    return {
        **game,
        "average_rating": average_rating,
        "total_reviews": total_reviews,
        "total_owners": total_owners
    }


@router.get("/{game_id}/reviews")
def get_game_reviews(
    game_id: int,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """Get all reviews for a game"""
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


@router.get("/", response_model=List[GameResponse])
def list_games(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db=Depends(get_db)
):
    """List all games with pagination"""
    game_dao = GameDAO(db)
    games = game_dao.get_all(limit=limit, offset=offset)
    return games


@router.patch("/{game_id}", response_model=GameResponse)
def update_game(game_id: int, game_update: GameUpdate, db=Depends(get_db)):
    """Update game information"""
    game_dao = GameDAO(db)
    
    # Verify game exists
    if not game_dao.get_by_id(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    update_data = game_update.model_dump(exclude_unset=True)
    
    # Check for title conflict if title is being updated
    if "title" in update_data:
        existing = game_dao.get_by_title(update_data["title"])
        if existing and existing["game_id"] != game_id:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Game with this title already exists"
            )
    
    try:
        updated_game = game_dao.update(game_id, **update_data)
        return updated_game
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update game"
        )


@router.post("/{game_id}/upload-thumbnail")
async def upload_game_thumbnail(game_id: int, file: UploadFile = File(...), db=Depends(get_db)):
    """Upload thumbnail image for game"""
    game_dao = GameDAO(db)
    
    if not game_dao.get_by_id(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
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
        
        # Update game record with image path
        db_path = f"images/{unique_filename}"
        game_dao.update(game_id, thumbnail=db_path)
        
        return {
            "message": "Thumbnail uploaded successfully",
            "thumbnail": f"http://localhost:8000/static/{db_path}"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload thumbnail"
        )


@router.delete("/{game_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_game(game_id: int, db=Depends(get_db)):
    """Remove a game from the catalog"""
    game_dao = GameDAO(db)
    
    if not game_dao.get_by_id(game_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Game not found"
        )
    
    try:
        game_dao.delete(game_id)
    except psycopg2.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete game"
        )
