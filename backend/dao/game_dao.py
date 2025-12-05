"""
Data Access Object for Games table
"""
from typing import Optional, List, Dict, Any
from datetime import date
import psycopg2
from psycopg2.extras import RealDictCursor


class GameDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(
        self,
        title: str,
        genre: Optional[str] = None,
        developer: Optional[str] = None,
        release_date: Optional[date] = None,
        platform: Optional[str] = None,
        tags: Optional[List[str]] = None,
        description: Optional[str] = None,
        price: Optional[float] = None,
        studio_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new game"""
        query = """
            INSERT INTO games (title, genre, developer, release_date, platform, tags, description, price, studio_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING game_id, title, genre, developer, release_date, platform, tags, description, price, thumbnail, studio_id, created_at, updated_at
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (title, genre, developer, release_date, platform, tags, description, price, studio_id))
                self.connection.commit()
                return dict(cursor.fetchone())
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_by_id(self, game_id: int) -> Optional[Dict[str, Any]]:
        """Get a game by ID"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE game_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_title(self, title: str) -> Optional[Dict[str, Any]]:
        """Get a game by title"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE title = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (title,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all games with pagination"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def search_by_title(self, title: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Search games by title (case-insensitive partial match)"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE title ILIKE %s
            ORDER BY title
            LIMIT %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{title}%', limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_genre(self, genre: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get games by genre"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE genre ILIKE %s
            ORDER BY title
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{genre}%', limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_platform(self, platform: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get games by platform"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE platform ILIKE %s
            ORDER BY title
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{platform}%', limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_studio(self, studio_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get games by studio ID"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE studio_id = %s
            ORDER BY release_date DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (studio_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def update(self, game_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """Update a game by ID"""
        allowed_fields = ['title', 'genre', 'developer', 'release_date', 'platform', 'tags', 'description', 'price', 'thumbnail', 'studio_id']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        
        if not updates:
            return self.get_by_id(game_id)
        
        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
        query = f"""
            UPDATE games
            SET {set_clause}
            WHERE game_id = %s
            RETURNING game_id, title, genre, developer, release_date, platform, tags, description, price, thumbnail, studio_id, created_at, updated_at
        """
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (*updates.values(), game_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete(self, game_id: int) -> bool:
        """Delete a game by ID"""
        query = "DELETE FROM games WHERE game_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (game_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def count(self) -> int:
        """Get total count of games"""
        query = "SELECT COUNT(*) as count FROM games"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            result = cursor.fetchone()
            return result['count'] if result else 0
