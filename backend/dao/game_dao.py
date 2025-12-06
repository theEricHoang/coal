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
        """Get all games with pagination (only studio-published games)"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE studio_id IS NOT NULL
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def search_by_title(self, title: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Search games by title (case-insensitive partial match, only studio-published games)"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE title ILIKE %s AND studio_id IS NOT NULL
            ORDER BY title
            LIMIT %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{title}%', limit))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_genre(self, genre: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get games by genre (only studio-published games)"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE genre ILIKE %s AND studio_id IS NOT NULL
            ORDER BY title
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{genre}%', limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_platform(self, platform: str, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get games by platform (only studio-published games)"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, thumbnail, studio_id, created_at, updated_at
            FROM games
            WHERE platform ILIKE %s AND studio_id IS NOT NULL
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
        """Get total count of studio-published games"""
        query = "SELECT COUNT(*) as count FROM games WHERE studio_id IS NOT NULL"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            result = cursor.fetchone()
            return result['count'] if result else 0

    def get_recommendations(self, user_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """Get game recommendations based on user's library tags"""
        query = """
            WITH user_tags AS (
                -- Get all tags from user's owned games
                SELECT unnest(g.tags) as tag
                FROM user_games ug
                JOIN games g ON ug.game_id = g.game_id
                WHERE ug.user_id = %s AND g.tags IS NOT NULL
            ),
            tag_counts AS (
                -- Count frequency of each tag
                SELECT tag, COUNT(*) as count
                FROM user_tags
                GROUP BY tag
                ORDER BY count DESC
                LIMIT 10
            ),
            user_owned_games AS (
                -- Get games user already owns
                SELECT game_id FROM user_games WHERE user_id = %s
            )
            -- Find games with matching tags that user doesn't own
            SELECT DISTINCT g.game_id, g.title, g.genre, g.developer, g.release_date, 
                   g.platform, g.tags, g.description, g.price, g.thumbnail, 
                   g.studio_id, g.created_at, g.updated_at,
                   (SELECT COUNT(*) 
                    FROM unnest(g.tags) t 
                    WHERE t IN (SELECT tag FROM tag_counts)) as matching_tags
            FROM games g
            WHERE g.game_id NOT IN (SELECT game_id FROM user_owned_games)
              AND g.studio_id IS NOT NULL
              AND g.tags IS NOT NULL
              AND EXISTS (
                SELECT 1 FROM unnest(g.tags) t 
                WHERE t IN (SELECT tag FROM tag_counts)
              )
            ORDER BY matching_tags DESC, g.created_at DESC
            LIMIT %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, user_id, limit))
            return [dict(row) for row in cursor.fetchall()]
