-- Migration: 001_create_tables.sql
-- Description: Initial database schema for game management system
-- Date: 2025-11-10

-- Create Users table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Studios table
CREATE TABLE IF NOT EXISTS studios (
    studio_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo VARCHAR(500),
    contact_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Games table
CREATE TABLE IF NOT EXISTS games (
    game_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    genre VARCHAR(100),
    developer VARCHAR(255),
    release_date DATE,
    platform VARCHAR(100),
    tags TEXT[],
    description TEXT,
    price DECIMAL(10, 2),
    studio_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (studio_id) REFERENCES studios(studio_id) ON DELETE SET NULL
);

-- Create UserGames table
CREATE TABLE IF NOT EXISTS user_games (
    ownership_id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    options JSONB,
    date_purchased TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    hours_played DECIMAL(10, 2) DEFAULT 0.0,
    status VARCHAR(50) DEFAULT 'owned',
    loaned_to INTEGER,
    loan_duration INTEGER,
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    game_studio_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (game_studio_id) REFERENCES studios(studio_id) ON DELETE SET NULL,
    FOREIGN KEY (loaned_to) REFERENCES users(user_id) ON DELETE SET NULL
);

-- Create UserHasGames table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS user_has_games (
    user_id INTEGER NOT NULL,
    game_id INTEGER NOT NULL,
    PRIMARY KEY (user_id, game_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE
);

-- Create Reviews table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    game_id INTEGER NOT NULL,
    game_studio_id INTEGER,
    user_id INTEGER NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (game_id) REFERENCES games(game_id) ON DELETE CASCADE,
    FOREIGN KEY (game_studio_id) REFERENCES studios(studio_id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE (game_id, user_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_games_title ON games(title);
CREATE INDEX IF NOT EXISTS idx_games_studio ON games(studio_id);
CREATE INDEX IF NOT EXISTS idx_usergames_user ON user_games(user_id);
CREATE INDEX IF NOT EXISTS idx_usergames_game ON user_games(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_game ON reviews(game_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON reviews(user_id);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_studios_updated_at ON studios;
CREATE TRIGGER update_studios_updated_at BEFORE UPDATE ON studios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_usergames_updated_at ON user_games;
CREATE TRIGGER update_usergames_updated_at BEFORE UPDATE ON user_games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reviews_updated_at ON reviews;
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
