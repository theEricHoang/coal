"""
Database connection pool management
"""
import os
from contextlib import contextmanager
import psycopg2
from psycopg2 import pool


class DatabasePool:
    """Singleton database connection pool"""
    _instance = None
    _pool = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabasePool, cls).__new__(cls)
        return cls._instance
    
    def initialize(
        self,
        minconn=1,
        maxconn=10,
        host=None,
        database=None,
        user=None,
        password=None,
        port=5432
    ):
        """Initialize the connection pool"""
        if self._pool is None:
            try:
                self._pool = psycopg2.pool.ThreadedConnectionPool(
                    minconn,
                    maxconn,
                    host=host or os.getenv('POSTGRES_HOST', 'db'),
                    database=database or os.getenv('POSTGRES_DB', 'coal_db'),
                    user=user or os.getenv('POSTGRES_USER', 'postgres'),
                    password=password or os.getenv('POSTGRES_PASSWORD', 'postgres'),
                    port=port
                )
                print(f"Database connection pool initialized (min={minconn}, max={maxconn})")
            except psycopg2.Error as e:
                print(f"Error initializing database pool: {e}")
                raise
    
    def get_connection(self):
        """Get a connection from the pool"""
        if self._pool is None:
            raise Exception("Connection pool not initialized. Call initialize() first.")
        return self._pool.getconn()
    
    def return_connection(self, connection):
        """Return a connection to the pool"""
        if self._pool is not None:
            self._pool.putconn(connection)
    
    def close_all(self):
        """Close all connections in the pool"""
        if self._pool is not None:
            self._pool.closeall()
            print("All database connections closed")


# Global pool instance
db_pool = DatabasePool()


@contextmanager
def get_db_connection():
    """
    Context manager for getting a database connection from the pool.
    Automatically returns the connection to the pool when done.
    
    Usage:
        with get_db_connection() as conn:
            # use connection
            pass
    """
    connection = db_pool.get_connection()
    try:
        yield connection
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        db_pool.return_connection(connection)


def get_db():
    """
    FastAPI dependency for database connections.
    Yields a connection and ensures it's returned to the pool.
    
    Usage:
        @app.get("/endpoint")
        def endpoint(db = Depends(get_db)):
            # use db connection
            pass
    """
    connection = db_pool.get_connection()
    try:
        yield connection
    finally:
        db_pool.return_connection(connection)
