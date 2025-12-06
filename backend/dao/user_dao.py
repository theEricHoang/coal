"""
Data Access Object for Users table
"""
from typing import Optional, List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


class UserDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(self, username: str, email: str, password: str, role: str = 'user') -> Optional[Dict[str, Any]]:
        """Create a new user"""
        query = """
            INSERT INTO users (username, email, password, role)
            VALUES (%s, %s, %s, %s)
            RETURNING user_id, username, email, role, created_at, updated_at
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (username, email, password, role))
                self.connection.commit()
                return dict(cursor.fetchone())
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        """Get a user by ID"""
        query = """
            SELECT user_id, username, email, role, profile_picture, created_at, updated_at
            FROM users
            WHERE user_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get a user by email"""
        query = """
            SELECT user_id, username, email, password, role, created_at, updated_at
            FROM users
            WHERE email = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (email,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        """Get a user by username"""
        query = """
            SELECT user_id, username, email, role, created_at, updated_at
            FROM users
            WHERE username = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (username,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all users with pagination"""
        query = """
            SELECT user_id, username, email, role, created_at, updated_at
            FROM users
            ORDER BY created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def update(self, user_id: int, **kwargs) -> Optional[Dict[str, Any]]:
        """Update a user by ID"""
        allowed_fields = ['username', 'email', 'password', 'role']
        updates = {k: v for k, v in kwargs.items() if k in allowed_fields and v is not None}
        
        if not updates:
            return self.get_by_id(user_id)
        
        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
        query = f"""
            UPDATE users
            SET {set_clause}
            WHERE user_id = %s
            RETURNING user_id, username, email, role, created_at, updated_at
        """
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (*updates.values(), user_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete(self, user_id: int) -> bool:
        """Delete a user by ID"""
        query = "DELETE FROM users WHERE user_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def count(self) -> int:
        """Get total count of users"""
        query = "SELECT COUNT(*) as count FROM users"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query)
            result = cursor.fetchone()
            return result['count'] if result else 0

    def search_by_username(self, username: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search users by username (case-insensitive partial match)"""
        query = """
            SELECT user_id, username, email, role, profile_picture, created_at, updated_at
            FROM users
            WHERE username ILIKE %s
            ORDER BY username
            LIMIT %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (f'%{username}%', limit))
            return [dict(row) for row in cursor.fetchall()]
