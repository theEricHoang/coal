"""
Data Access Object for UserGames table
"""
from typing import Optional, List, Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor, Json


class UserGameDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(
        self,
        user_id: int,
        game_id: int,
        type: str,
        options: Optional[Dict[str, Any]] = None,
        date_purchased: Optional[datetime] = None,
        hours_played: float = 0.0,
        status: str = 'owned',
        loaned_to: Optional[int] = None,
        loan_duration: Optional[int] = None,
        game_studio_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new user game ownership record"""
        query = """
            INSERT INTO user_games (user_id, game_id, type, options, date_purchased, hours_played, 
                                   status, loaned_to, loan_duration, game_studio_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING ownership_id, user_id, game_id, type, options, date_purchased, hours_played, 
                     status, loaned_to, loan_duration, game_studio_id, created_at, updated_at
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (user_id, game_id, type, Json(options) if options else None, 
                                     date_purchased, hours_played, status, loaned_to, loan_duration, game_studio_id))
                self.connection.commit()
                return dict(cursor.fetchone())
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_by_id(self, ownership_id: int) -> Optional[Dict[str, Any]]:
        """Get a user game ownership record by ID"""
        query = """
            SELECT ownership_id, user_id, game_id, type, options, date_purchased, hours_played, 
                   status, loaned_to, loan_duration, game_studio_id, created_at, updated_at
            FROM user_games
            WHERE ownership_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (ownership_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_user_and_game(self, user_id: int, game_id: int) -> Optional[Dict[str, Any]]:
        """Get a user game ownership record by user ID and game ID"""
        query = """
            SELECT ownership_id, user_id, game_id, type, options, date_purchased, hours_played, 
                   status, loaned_to, loan_duration, game_studio_id, created_at, updated_at
            FROM user_games
            WHERE user_id = %s AND game_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, game_id))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_user(self, user_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all games owned by a user"""
        query = """
            SELECT ug.ownership_id, ug.user_id, ug.game_id, ug.type, ug.options, ug.date_purchased, 
                   ug.hours_played, ug.status, ug.loaned_to, ug.loan_duration, ug.game_studio_id, 
                   ug.created_at, ug.updated_at,
                   g.title, g.genre, g.platform, g.price
            FROM user_games ug
            JOIN games g ON ug.game_id = g.game_id
            WHERE ug.user_id = %s
            ORDER BY ug.date_purchased DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_status(self, user_id: int, status: str) -> List[Dict[str, Any]]:
        """Get all games by user and status"""
        query = """
            SELECT ug.ownership_id, ug.user_id, ug.game_id, ug.type, ug.options, ug.date_purchased, 
                   ug.hours_played, ug.status, ug.loaned_to, ug.loan_duration, ug.game_studio_id, 
                   ug.created_at, ug.updated_at,
                   g.title, g.genre, g.platform, g.price
            FROM user_games ug
            JOIN games g ON ug.game_id = g.game_id
            WHERE ug.user_id = %s AND ug.status = %s
            ORDER BY ug.date_purchased DESC
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, status))
            return [dict(row) for row in cursor.fetchall()]

    def get_loaned_games(self, user_id: int) -> List[Dict[str, Any]]:
        """Get all games loaned by a user"""
        query = """
            SELECT ug.ownership_id, ug.user_id, ug.game_id, ug.type, ug.options, ug.date_purchased, 
                   ug.hours_played, ug.status, ug.loaned_to, ug.loan_duration, ug.game_studio_id, 
                   ug.created_at, ug.updated_at,
                   g.title, u.username as loaned_to_username
            FROM user_games ug
            JOIN games g ON ug.game_id = g.game_id
            LEFT JOIN users u ON ug.loaned_to = u.user_id
            WHERE ug.user_id = %s AND ug.loaned_to IS NOT NULL
            ORDER BY ug.date_purchased DESC
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id,))
            return [dict(row) for row in cursor.fetchall()]

    def update(self, ownership_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """Update a user game ownership record"""
        allowed_fields = ['type', 'options', 'date_purchased', 'hours_played', 'status', 'loaned_to', 'loan_duration', 'game_studio_id']
        updates = {}
        
        for k, v in kwargs.items():
            if k in allowed_fields and v is not None:
                if k == 'options' and isinstance(v, dict):
                    updates[k] = Json(v)
                else:
                    updates[k] = v
        
        if not updates:
            return self.get_by_id(ownership_id)
        
        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
        query = f"""
            UPDATE user_games
            SET {set_clause}
            WHERE ownership_id = %s
            RETURNING ownership_id, user_id, game_id, type, options, date_purchased, hours_played, 
                     status, loaned_to, loan_duration, game_studio_id, created_at, updated_at
        """
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (*updates.values(), ownership_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def update_hours_played(self, ownership_id: int, hours: float) -> Optional[Dict[str, Any]]:
        """Update hours played for a game"""
        query = """
            UPDATE user_games
            SET hours_played = hours_played + %s
            WHERE ownership_id = %s
            RETURNING ownership_id, user_id, game_id, hours_played
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (hours, ownership_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete(self, ownership_id: int) -> bool:
        """Delete a user game ownership record"""
        query = "DELETE FROM user_games WHERE ownership_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (ownership_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def count_by_user(self, user_id: int) -> int:
        """Get total count of games owned by a user"""
        query = "SELECT COUNT(*) as count FROM user_games WHERE user_id = %s"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            return result['count'] if result else 0
