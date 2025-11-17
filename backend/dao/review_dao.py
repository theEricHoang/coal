"""
Data Access Object for Reviews table
"""
from typing import Optional, List, Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor


class ReviewDAO:
    def __init__(self, connection):
        self.connection = connection

    def create(
        self,
        game_id: int,
        user_id: int,
        rating: int,
        review_text: Optional[str] = None,
        game_studio_id: Optional[int] = None
    ) -> Optional[Dict[str, Any]]:
        """Create a new review"""
        if rating < 1 or rating > 5:
            raise ValueError("Rating must be between 1 and 5")
        
        query = """
            INSERT INTO reviews (game_id, user_id, rating, review_text, game_studio_id)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING review_id, game_id, user_id, rating, review_text, game_studio_id, created_at, updated_at
        """
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (game_id, user_id, rating, review_text, game_studio_id))
                self.connection.commit()
                return dict(cursor.fetchone())
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def get_by_id(self, review_id: int) -> Optional[Dict[str, Any]]:
        """Get a review by ID"""
        query = """
            SELECT r.review_id, r.game_id, r.user_id, r.rating, r.review_text, r.game_studio_id, 
                   r.created_at, r.updated_at,
                   u.username, g.title as game_title
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN games g ON r.game_id = g.game_id
            WHERE r.review_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (review_id,))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_game(self, game_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all reviews for a game"""
        query = """
            SELECT r.review_id, r.game_id, r.user_id, r.rating, r.review_text, r.game_studio_id, 
                   r.created_at, r.updated_at,
                   u.username
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            WHERE r.game_id = %s
            ORDER BY r.created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_user(self, user_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all reviews by a user"""
        query = """
            SELECT r.review_id, r.game_id, r.user_id, r.rating, r.review_text, r.game_studio_id, 
                   r.created_at, r.updated_at,
                   g.title as game_title
            FROM reviews r
            JOIN games g ON r.game_id = g.game_id
            WHERE r.user_id = %s
            ORDER BY r.created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_by_user_and_game(self, user_id: int, game_id: int) -> Optional[Dict[str, Any]]:
        """Get a specific user's review for a game"""
        query = """
            SELECT r.review_id, r.game_id, r.user_id, r.rating, r.review_text, r.game_studio_id, 
                   r.created_at, r.updated_at,
                   u.username, g.title as game_title
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN games g ON r.game_id = g.game_id
            WHERE r.user_id = %s AND r.game_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id, game_id))
            result = cursor.fetchone()
            return dict(result) if result else None

    def get_by_studio(self, game_studio_id: int, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """Get all reviews for games by a studio"""
        query = """
            SELECT r.review_id, r.game_id, r.user_id, r.rating, r.review_text, r.game_studio_id, 
                   r.created_at, r.updated_at,
                   u.username, g.title as game_title
            FROM reviews r
            JOIN users u ON r.user_id = u.user_id
            JOIN games g ON r.game_id = g.game_id
            WHERE r.game_studio_id = %s
            ORDER BY r.created_at DESC
            LIMIT %s OFFSET %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_studio_id, limit, offset))
            return [dict(row) for row in cursor.fetchall()]

    def get_average_rating(self, game_id: int) -> Optional[float]:
        """Get average rating for a game"""
        query = """
            SELECT AVG(rating)::NUMERIC(10,2) as avg_rating
            FROM reviews
            WHERE game_id = %s
        """
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id,))
            result = cursor.fetchone()
            return float(result['avg_rating']) if result and result['avg_rating'] else None

    def update(self, review_id: int, rating: Optional[int] = None, review_text: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """Update a review"""
        updates = {}
        if rating is not None:
            if rating < 1 or rating > 5:
                raise ValueError("Rating must be between 1 and 5")
            updates['rating'] = rating
        if review_text is not None:
            updates['review_text'] = review_text
        
        if not updates:
            return self.get_by_id(review_id)
        
        set_clause = ', '.join([f"{k} = %s" for k in updates.keys()])
        query = f"""
            UPDATE reviews
            SET {set_clause}
            WHERE review_id = %s
            RETURNING review_id, game_id, user_id, rating, review_text, game_studio_id, created_at, updated_at
        """
        
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, (*updates.values(), review_id))
                self.connection.commit()
                result = cursor.fetchone()
                return dict(result) if result else None
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def delete(self, review_id: int) -> bool:
        """Delete a review"""
        query = "DELETE FROM reviews WHERE review_id = %s"
        try:
            with self.connection.cursor() as cursor:
                cursor.execute(query, (review_id,))
                self.connection.commit()
                return cursor.rowcount > 0
        except psycopg2.Error as e:
            self.connection.rollback()
            raise e

    def count_by_game(self, game_id: int) -> int:
        """Get total count of reviews for a game"""
        query = "SELECT COUNT(*) as count FROM reviews WHERE game_id = %s"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (game_id,))
            result = cursor.fetchone()
            return result['count'] if result else 0

    def count_by_user(self, user_id: int) -> int:
        """Get total count of reviews by a user"""
        query = "SELECT COUNT(*) as count FROM reviews WHERE user_id = %s"
        with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            return result['count'] if result else 0
