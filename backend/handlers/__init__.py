"""
API Handlers package
FastAPI route handlers for the Steam-like application
"""
from .user_handlers import router as user_router
from .game_handlers import router as game_router
from .studio_handlers import router as studio_router
from .library_handlers import router as library_router
from .review_handlers import router as review_router

__all__ = [
    'user_router',
    'game_router',
    'studio_router',
    'library_router',
    'review_router'
]
