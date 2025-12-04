from contextlib import asynccontextmanager
from fastapi import FastAPI
from database import db_pool
from handlers import (
    user_router,
    game_router,
    studio_router,
    library_router,
    review_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup application resources"""
    # Startup: Initialize database connection pool
    print("Initializing database connection pool...")
    db_pool.initialize(minconn=2, maxconn=20)
    print("Application startup complete")
    
    yield
    
    # Shutdown: Close all database connections
    print("Closing database connections...")
    db_pool.close_all()
    print("Application shutdown complete")


app = FastAPI(
    title="COAL - Game Library API",
    description="A Steam-like game library management system",
    version="1.0.0",
    lifespan=lifespan
)

# Register routers
app.include_router(user_router)
app.include_router(game_router)
app.include_router(studio_router)
app.include_router(library_router)
app.include_router(review_router)


@app.get("/")
def read_root():
    """Health check endpoint"""
    return {
        "status": "ok",
        "message": "COAL API is running",
        "version": "1.0.0"
    }


@app.get("/health")
def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "database": "connected"
    }

from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # during development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)