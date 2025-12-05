import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../../services/api';
import { UserLibraryItem } from '../../types';
import AddGameModal from './AddGameModal';
import './LibraryView.css';

const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<UserLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  if (loading) {
    return (
      <div className="library-page">
        <div className="library-loading">loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-page">
        <div className="library-error">{error}</div>
      </div>
    );
  }

  if (games.length === 0) {
    return (
      <div className="library-page">
        <div className="library-empty">no games added</div>
        <button className="library-fab" onClick={() => setIsModalOpen(true)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
        <AddGameModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onGameAdded={loadLibrary}
        />
      </div>
    );
  }

  return (
    <div className="library-page">
      <div className="library-grid">
        {games.map((game) => (
          <div key={game.ownership_id} className="library-item">
            <div className="library-thumbnail">
              {game.thumbnail ? (
                <img src={game.thumbnail} alt={game.title} className="library-thumbnail-image" />
              ) : (
                <div className="library-thumbnail-placeholder">
                  <span className="library-thumbnail-title">{game.title}</span>
                </div>
              )}
            </div>
            
            <div className="library-hover-card">
              <div className="library-hover-thumbnail">
                {game.thumbnail ? (
                  <img src={game.thumbnail} alt={game.title} className="library-thumbnail-image" />
                ) : (
                  <div className="library-thumbnail-placeholder">
                    <span className="library-thumbnail-title">{game.title}</span>
                  </div>
                )}
              </div>
              
              <div className="library-hover-info">
                <h3 className="library-hover-title">{game.title}</h3>
                
                <div className="library-hover-details">
                  {game.genre && (
                    <div className="library-hover-detail">
                      <span className="library-hover-label">genre</span>
                      <span className="library-hover-value">{game.genre}</span>
                    </div>
                  )}
                  
                  {game.platform && (
                    <div className="library-hover-detail">
                      <span className="library-hover-label">platform</span>
                      <span className="library-hover-value">{game.platform}</span>
                    </div>
                  )}
                  
                  <div className="library-hover-detail">
                    <span className="library-hover-label">hours played</span>
                    <span className="library-hover-value">{game.hours_played.toFixed(1)}h</span>
                  </div>
                  
                  {game.price !== null && game.price !== undefined && (
                    <div className="library-hover-detail">
                      <span className="library-hover-label">price</span>
                      <span className="library-hover-value">${game.price.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="library-hover-detail">
                    <span className="library-hover-label">added</span>
                    <span className="library-hover-value">{new Date(game.date_purchased).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="library-hover-detail">
                    <span className="library-hover-label">status</span>
                    <span className="library-hover-value">{game.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <button className="library-fab" onClick={() => setIsModalOpen(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      
      <AddGameModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onGameAdded={loadLibrary}
      />
    </div>
  );
};

export default LibraryView;