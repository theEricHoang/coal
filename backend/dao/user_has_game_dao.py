"""
Data Access Object for UserHasGames table (many-to-many relationship)
"""
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


class UserHasGameDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(self, user_id: int, game_id: int) -> bool:
        """Create a user-game relationship"""
        query = """
            INSERT INTO user_has_games (user_id, game_id)
            VALUES (%s, %s)
            ON CONFLICT (user_id, game_id) DO NOTHING
        """
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id, game_id))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def exists(self, user_id: int, game_id: int) -> bool:
        """Check if a user-game relationship exists"""
        query = """
            SELECT 1 FROM user_has_games
            WHERE user_id = %s AND game_id = %s
        """
        with self.connection.cursor() as cursor:
            cursor.execute(query, (user_id, game_id))
            return cursor.fetchone() is not None

    def get_games_by_user(self, user_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all games associated with a user"""
        query = """
            SELECT g.game_id, g.title, g.genre, g.developer, g.release_date, 
                   g.platform, g.tags, g.description, g.price, g.studio_id
            FROM user_has_games uhg
            JOIN games g ON uhg.game_id = g.game_id
            WHERE uhg.user_id = %s
            ORDER BY g.title
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_users_by_game(self, game_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all users associated with a game"""
        query = """
            SELECT u.user_id, u.username, u.email, u.role, u.created_at
            FROM user_has_games uhg
            JOIN users u ON uhg.user_id = u.user_id
            WHERE uhg.game_id = %s
            ORDER BY u.username
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def delete(self, user_id: int, game_id: int) -> bool:
        """Delete a user-game relationship"""
        query = "DELETE FROM user_has_games WHERE user_id = %s AND game_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id, game_id))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete_all_by_user(self, user_id: int) -> int:
        """Delete all game associations for a user"""
        query = "DELETE FROM user_has_games WHERE user_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (user_id,))
                self.connection.commit()
                return cursor.rowcount
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete_all_by_game(self, game_id: int) -> int:
        """Delete all user associations for a game"""
        query = "DELETE FROM user_has_games WHERE game_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (game_id,))
                self.connection.commit()
                return cursor.rowcount
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def count_games_by_user(self, user_id: int) -> int:
        """Get total count of games for a user"""
        query = "SELECT COUNT(*) as count FROM user_has_games WHERE user_id = %s"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            return result['count'] if result else 0

    def count_users_by_game(self, game_id: int) -> int:
        """Get total count of users for a game"""
        query = "SELECT COUNT(*) as count FROM user_has_games WHERE game_id = %s"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id,))
            result = cursor.fetchone()
            return result['count'] if result else 0
