import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI, authAPI } from '../../services/api';
import { GameResponse } from '../../types';
import './StoreView.css';

const StoreView: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<GameResponse[]>([]);
  const [recommendedGames, setRecommendedGames] = useState<GameResponse[]>([]);
  const [featuredGames, setFeaturedGames] = useState<GameResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDefaultGames();
  }, []);

  const loadDefaultGames = async () => {
    setLoading(true);
    try {
      const userId = authAPI.getCurrentUserId();
      
      // Load personalized recommendations
      if (userId) {
        const recommendations = await gamesAPI.getRecommendations(userId, 10);
        setRecommendedGames(Array.isArray(recommendations) ? recommendations : []);
      }
      
      // Load all games for featured section
      const allGamesResponse = await gamesAPI.getAllGames(50);
      const allGames = allGamesResponse.games || allGamesResponse || [];
      setFeaturedGames(Array.isArray(allGames) ? allGames : []);
    } catch (error) {
      console.error('Failed to load games:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await gamesAPI.searchGames(searchQuery);
      setSearchResults(response.games || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleGameClick = (gameId: number) => {
    navigate(`/game/${gameId}`);
  };

  const renderGameGrid = (games: GameResponse[]) => {
    if (games.length === 0) {
      return <div className="store-empty">no games found</div>;
    }

    return (
      <div className="store-game-grid">
        {games.map((game) => (
          <div 
            key={game.game_id} 
            className="store-game-item"
            onClick={() => handleGameClick(game.game_id)}
          >
            {game.thumbnail ? (
              <img src={game.thumbnail} alt={game.title} className="store-game-thumbnail" />
            ) : (
              <div className="store-game-thumbnail-placeholder">
                <span className="store-game-placeholder-title">{game.title}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="store-page">
      <div className="store-card">
        {/* Search Bar */}
        <div className="store-search-container">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            placeholder="search games..."
            className="store-search-input"
          />
          <button onClick={handleSearch} className="store-search-button">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="store-loading">loading...</div>
        ) : searchQuery.trim() ? (
          /* Search Results */
          <div className="store-search-results">
            {renderGameGrid(searchResults)}
          </div>
        ) : (
          /* Default Sections */
          <div className="store-sections">
            {/* Recommended Section */}
            <div className="store-section">
              <div className="store-section-header">
                <h2 className="store-section-title">recommended</h2>
                <a href="#" className="store-section-more">see more &gt;</a>
              </div>
              {renderGameGrid(recommendedGames)}
            </div>

            {/* Featured Section */}
            <div className="store-section">
              <div className="store-section-header">
                <h2 className="store-section-title">featured</h2>
                <a href="#" className="store-section-more">see more &gt;</a>
              </div>
              {renderGameGrid(featuredGames)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreView;
