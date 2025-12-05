"""
Data Access Object for Studios table
"""
from typing import Optional, List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


class StudioDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(self, name: str, logo: Optional[str] = None, contact_info: Optional[str] = None, user_id: Optional[int] = None) -> Optional[Dict[str, Any]]:
        """Create a new studio"""
        query = """
            INSERT INTO studios (name, logo, contact_info, user_id)
            VALUES (%s, %s, %s, %s)
            RETURNING studio_id, name, logo, contact_info, user_id, created_at, updated_at
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (name, logo, contact_info, user_id))
                self.connection.commit()
                return dict(cursor.fetchone())
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_by_id(self, studio_id: int) -> Optional[Dict[str, Any]]:
        """Get a studio by ID"""
        query = """
            SELECT studio_id, name, logo, contact_info, created_at, updated_at
            FROM studios
            WHERE studio_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (studio_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_name(self, name: str) -> Optional[Dict[str, Any]]:
        """Get a studio by name"""
        query = """
            SELECT studio_id, name, logo, contact_info, created_at, updated_at
            FROM studios
            WHERE name = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (name,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all studios with pagination"""
        query = """
            SELECT studio_id, name, logo, contact_info, created_at, updated_at
            FROM studios
            ORDER BY name
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def update(self, studio_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """Update a studio by ID"""
        allowed_fields = ['name', 'logo', 'contact_info']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        
        if not updates:
            return self.get_by_id(studio_id)
        
        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
        query = f"""
            UPDATE studios
            SET {set_clause}
            WHERE studio_id = %s
            RETURNING studio_id, name, logo, contact_info, created_at, updated_at
        """
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (*updates.values(), studio_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete(self, studio_id: int) -> bool:
        """Delete a studio by ID"""
        query = "DELETE FROM studios WHERE studio_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (studio_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_games(self, studio_id: int) -> List[Dict[str, Any]]:
        """Get all games by a studio"""
        query = """
            SELECT game_id, title, genre, developer, release_date, platform, 
                   tags, description, price, studio_id, created_at, updated_at
            FROM games
            WHERE studio_id = %s
            ORDER BY release_date DESC
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (studio_id,))
            return [dict(row) for row in cursor.fetchall()]

    def count(self) -> int:
        """Get total count of studios"""
        query = "SELECT COUNT(*) as count FROM studios"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            result = cursor.fetchone()
            return result['count'] if result else 0
