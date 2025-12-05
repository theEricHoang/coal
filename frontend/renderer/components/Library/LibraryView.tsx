import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../../services/api';
import { UserLibraryItem } from '../../types';
import './LibraryView.css';

const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<UserLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'title' | 'hours' | 'recent'>('title');

  useEffect(() => {
    loadLibrary();
  }, []);

  const loadLibrary = async () => {
    setLoading(true);
    setError('');
    
    try {
      const userId = authAPI.getCurrentUserId();
      if (!userId) {
        navigate('/signin');
        return;
      }

      const libraryData = await userAPI.getLibrary(userId);
      setGames(libraryData);
    } catch (err) {
      console.error('Failed to load library:', err);
      setError('Failed to load your library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedGames = games
    .filter(game => 
      game.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (game.genre && game.genre.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    .sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'hours') return b.hours_played - a.hours_played;
      if (sortBy === 'recent') return new Date(b.date_purchased).getTime() - new Date(a.date_purchased).getTime();
      return 0;
    });

  const totalHoursPlayed = games.reduce((sum, game) => sum + game.hours_played, 0);

  return (
    <div className="library-page">
      {/* Header Section */}
      <div className="library-header">
        <div className="library-header-content">
          <div className="library-header-top">
            <div className="library-title-section">
              <h1>
                My Library
              </h1>
              <p>
                {games.length} {games.length === 1 ? 'game' : 'games'} • {totalHoursPlayed.toFixed(1)} hours played
              </p>
            </div>
            <button onClick={() => navigate('/upload')} className="upload-game-btn">
              <span className="upload-game-btn-icon">+</span>
              Upload Game
            </button>
          </div>

          {/* Search and Filter */}
          <div className="library-filters">
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="library-search"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="library-sort"
            >
              <option value="title">Sort by Title</option>
              <option value="hours">Sort by Hours Played</option>
              <option value="recent">Sort by Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="library-content">
        {loading ? (
          <div className="library-loading">
            Loading your library...
          </div>
        ) : error ? (
          <div className="library-error">
            {error}
            <button onClick={loadLibrary} className="library-retry-btn">
              Retry
            </button>
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          <div className="library-empty">
            <div className="library-empty-icon">📚</div>
            <h2>
              {searchQuery ? 'No games found' : 'Your library is empty'}
            </h2>
            <p>
              {searchQuery ? 'Try a different search term' : 'Start building your collection!'}
            </p>
            {!searchQuery && (
              <button onClick={() => navigate('/upload')} className="library-empty-btn">
                Upload Your First Game
              </button>
            )}
          </div>
        ) : (
          <div className="library-grid">
            {filteredAndSortedGames.map((game) => (
              <div key={game.ownership_id} className="game-card">
                {/* Game Cover Placeholder */}
                <div className="game-card-cover">
                  <span className="game-card-cover-icon">🎮</span>
                  <div className="game-card-hours">
                    {game.hours_played}h
                  </div>
                </div>

                {/* Game Info */}
                <div className="game-card-info">
                  <h3 className="game-card-title">
                    {game.title}
                  </h3>
                  
                  <div className="game-card-details">
                    {game.genre && (
                      <div className="game-card-detail">
                        🎯 {game.genre}
                      </div>
                    )}
                    {game.platform && (
                      <div className="game-card-detail">
                        💻 {game.platform}
                      </div>
                    )}
                    <div className="game-card-detail">
                      📅 Added {new Date(game.date_purchased).toLocaleDateString()}
                    </div>
                    {game.price && (
                      <div className="game-card-price">
                        ${game.price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div className={`game-card-status ${game.status === 'installed' ? 'installed' : 'not-installed'}`}>
                    {game.status}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;