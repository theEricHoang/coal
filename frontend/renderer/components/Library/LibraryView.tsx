import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../../services/api';
import { UserLibraryItem } from '../../types';
import AddGameModal from './AddGameModal';
import LoanModal from './LoanModal';
import './LibraryView.css';

const LibraryView: React.FC = () => {
  const navigate = useNavigate();
  const [games, setGames] = useState<UserLibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoanModalOpen, setIsLoanModalOpen] = useState(false);
  const [selectedGame, setSelectedGame] = useState<UserLibraryItem | null>(null);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const hoverCard = card.querySelector('.library-hover-card') as HTMLElement;
    if (!hoverCard) return;

    const rect = card.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const isRightHalf = rect.left > viewportWidth / 2;

    if (isRightHalf) {
      hoverCard.classList.add('library-hover-card-left');
    } else {
      hoverCard.classList.remove('library-hover-card-left');
    }
  };

  const handleLoanClick = (game: UserLibraryItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedGame(game);
    setIsLoanModalOpen(true);
  };

  const handleReturnLoan = async (ownershipId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to return this game?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/library/return-loan/${ownershipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to return loan');
      }

      alert('Game returned successfully');
      loadLibrary();
    } catch (err: any) {
      console.error('Failed to return loan:', err);
      alert(err.message || 'Failed to return loan');
    }
  };

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
          <div key={game.ownership_id} className={`library-item ${game.loaned_to && !game.is_borrowed ? 'library-item-loaned' : ''}`} onMouseEnter={handleMouseEnter}>
            <div className="library-thumbnail">
              {game.thumbnail ? (
                <img src={game.thumbnail} alt={game.title} className="library-thumbnail-image" />
              ) : (
                <div className="library-thumbnail-placeholder">
                  <span className="library-thumbnail-title">{game.title}</span>
                </div>
              )}
              {game.loaned_to && !game.is_borrowed && (
                <div className="library-loaned-overlay">
                  <span className="library-loaned-text">loaned to {game.loaned_to_username || 'user'}</span>
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
                
                {game.is_borrowed && (
                  <div className="library-borrowed-badge">
                    borrowed from {game.owner_username}
                  </div>
                )}
                
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
                  
                  {game.is_borrowed && game.days_remaining !== undefined && (
                    <div className="library-hover-detail">
                      <span className="library-hover-label">time remaining</span>
                      <span className="library-hover-value">
                        {Math.max(0, Math.ceil(game.days_remaining))} days
                      </span>
                    </div>
                  )}
                  
                  {!game.is_borrowed && (
                    <>
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
                    </>
                  )}
                  
                  {game.tags && game.tags.length > 0 && (
                    <div className="library-hover-tags">
                      {game.tags.map((tag, index) => (
                        <span key={index} className="library-hover-tag">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
                
                {game.is_borrowed ? (
                  <button 
                    className="library-loan-btn library-return-btn"
                    onClick={(e) => handleReturnLoan(game.ownership_id, e)}
                  >
                    return loan
                  </button>
                ) : !game.loaned_to && (
                  <button 
                    className="library-loan-btn"
                    onClick={(e) => handleLoanClick(game, e)}
                  >
                    loan game
                  </button>
                )}
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
      
      {selectedGame && (
        <LoanModal 
          isOpen={isLoanModalOpen}
          onClose={() => {
            setIsLoanModalOpen(false);
            setSelectedGame(null);
          }}
          gameTitle={selectedGame.title}
          gameId={selectedGame.game_id}
          ownershipId={selectedGame.ownership_id}
          onLoanCreated={loadLibrary}
        />
      )}
    </div>
  );
};

export default LibraryView;