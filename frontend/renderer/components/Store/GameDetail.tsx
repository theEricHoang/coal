import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { gamesAPI, authAPI, libraryAPI, reviewsAPI } from '../../services/api';
import './GameDetail.css';

interface GameDetailData {
  game_id: number;
  title: string;
  genre: string | null;
  developer: string | null;
  release_date: string | null;
  platform: string | null;
  tags: string[] | null;
  description: string | null;
  price: number | null;
  thumbnail: string | null;
  studio_id: number | null;
  average_rating: number | null;
  total_reviews: number;
  total_owners: number;
  created_at: string;
}

interface Review {
  review_id: number;
  user_id: number;
  username: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  updated_at: string;
}

const GameDetail: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const [game, setGame] = useState<GameDetailData | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [isOwned, setIsOwned] = useState(false);
  const [userLibrary, setUserLibrary] = useState<number[]>([]);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    loadGameData();
    loadUserLibrary();
  }, [gameId]);

  const loadGameData = async () => {
    if (!gameId) return;
    
    setLoading(true);
    setError('');
    
    try {
      const gameData = await gamesAPI.getGameDetails(parseInt(gameId));
      setGame(gameData);
      
      // Load reviews
      const reviewsData = await reviewsAPI.getGameReviews(parseInt(gameId));
      setReviews(reviewsData.reviews || []);
    } catch (err) {
      console.error('Failed to load game:', err);
      setError('Failed to load game details');
    } finally {
      setLoading(false);
    }
  };

  const loadUserLibrary = async () => {
    try {
      const userId = authAPI.getCurrentUserId();
      if (!userId) return;
      
      const libraryData = await libraryAPI.getUserLibrary(userId);
      const ownedGameIds = libraryData.map((item: any) => item.game_id);
      setUserLibrary(ownedGameIds);
      
      if (gameId) {
        setIsOwned(ownedGameIds.includes(parseInt(gameId)));
      }
    } catch (err) {
      console.error('Failed to load library:', err);
    }
  };

  const handleBuyGame = async () => {
    if (!game) return;
    
    const userId = authAPI.getCurrentUserId();
    if (!userId) {
      navigate('/signin');
      return;
    }

    try {
      await libraryAPI.addGameToLibrary({
        user_id: userId,
        game_id: game.game_id,
        type: 'digital',
        game_studio_id: game.studio_id,
      });
      
      setIsOwned(true);
      alert('Game added to your library!');
      loadUserLibrary();
    } catch (err: any) {
      console.error('Failed to add game:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to add game to library';
      alert(errorMsg);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!game) return;
    
    const userId = authAPI.getCurrentUserId();
    if (!userId) {
      navigate('/signin');
      return;
    }

    setSubmittingReview(true);
    
    try {
      await reviewsAPI.createReview({
        game_id: game.game_id,
        user_id: userId,
        rating,
        review_text: reviewText || null,
        game_studio_id: game.studio_id,
      });
      
      setShowReviewForm(false);
      setReviewText('');
      setRating(5);
      alert('Review submitted!');
      loadGameData(); // Reload to show new review
    } catch (err: any) {
      console.error('Failed to submit review:', err);
      const errorMsg = err.response?.data?.detail || 'Failed to submit review';
      alert(errorMsg);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="game-detail-page">
        <div className="game-detail-loading">loading...</div>
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="game-detail-page">
        <div className="game-detail-error">{error || 'Game not found'}</div>
      </div>
    );
  }

  return (
    <div className="game-detail-page">
      <div className="game-detail-container">
        {/* Header Section */}
        <div className="game-detail-header">
          <div className="game-detail-thumbnail">
            {game.thumbnail ? (
              <img src={game.thumbnail} alt={game.title} />
            ) : (
              <div className="game-detail-thumbnail-placeholder">
                <span>{game.title}</span>
              </div>
            )}
          </div>
          
          <div className="game-detail-info">
            <h1 className="game-detail-title">{game.title}</h1>
            
            {game.developer && (
              <div className="game-detail-meta">
                <span className="game-detail-label">developer</span>
                <span className="game-detail-value">{game.developer}</span>
              </div>
            )}
            
            <div className="game-detail-meta-grid">
              {game.genre && (
                <div className="game-detail-meta">
                  <span className="game-detail-label">genre</span>
                  <span className="game-detail-value">{game.genre}</span>
                </div>
              )}
              
              {game.platform && (
                <div className="game-detail-meta">
                  <span className="game-detail-label">platform</span>
                  <span className="game-detail-value">{game.platform}</span>
                </div>
              )}
              
              {game.release_date && (
                <div className="game-detail-meta">
                  <span className="game-detail-label">release date</span>
                  <span className="game-detail-value">{new Date(game.release_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
            
            {game.tags && game.tags.length > 0 && (
              <div className="game-detail-tags">
                {game.tags.map((tag, index) => (
                  <span key={index} className="game-detail-tag">{tag}</span>
                ))}
              </div>
            )}
            
            <div className="game-detail-rating">
              {game.average_rating ? (
                <>
                  <span className="game-detail-rating-value">★ {game.average_rating.toFixed(1)}</span>
                  <span className="game-detail-rating-count">({game.total_reviews} reviews)</span>
                </>
              ) : (
                <span className="game-detail-rating-count">no reviews yet</span>
              )}
            </div>
            
            <div className="game-detail-actions">
              {isOwned ? (
                <>
                  <button className="game-detail-btn game-detail-btn-owned" disabled>
                    in library
                  </button>
                  <button 
                    className="game-detail-btn game-detail-btn-review"
                    onClick={() => setShowReviewForm(!showReviewForm)}
                  >
                    {showReviewForm ? 'cancel review' : 'write a review'}
                  </button>
                </>
              ) : (
                <button className="game-detail-btn game-detail-btn-buy" onClick={handleBuyGame}>
                  {game.price !== null ? `buy for $${game.price.toFixed(2)}` : 'add to library'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Description Section */}
        {game.description && (
          <div className="game-detail-section">
            <h2 className="game-detail-section-title">about</h2>
            <p className="game-detail-description">{game.description}</p>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && isOwned && (
          <div className="game-detail-section">
            <h2 className="game-detail-section-title">write your review</h2>
            <form className="game-detail-review-form" onSubmit={handleSubmitReview}>
              <div className="game-detail-form-group">
                <label className="game-detail-form-label">rating</label>
                <div className="game-detail-rating-input">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      className={`game-detail-star ${star <= rating ? 'active' : ''}`}
                      onClick={() => setRating(star)}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="game-detail-form-group">
                <label className="game-detail-form-label">review (optional)</label>
                <textarea
                  className="game-detail-form-textarea"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="share your thoughts about this game..."
                  rows={4}
                  disabled={submittingReview}
                />
              </div>
              
              <button 
                type="submit" 
                className="game-detail-btn game-detail-btn-submit"
                disabled={submittingReview}
              >
                {submittingReview ? 'submitting...' : 'submit review'}
              </button>
            </form>
          </div>
        )}

        {/* Reviews Section */}
        <div className="game-detail-section">
          <h2 className="game-detail-section-title">reviews ({game.total_reviews})</h2>
          
          {reviews.length > 0 ? (
            <div className="game-detail-reviews">
              {reviews.map((review) => (
                <div key={review.review_id} className="game-detail-review">
                  <div className="game-detail-review-header">
                    <span className="game-detail-review-username">{review.username}</span>
                    <span className="game-detail-review-rating">★ {review.rating}/5</span>
                  </div>
                  {review.review_text && (
                    <p className="game-detail-review-text">{review.review_text}</p>
                  )}
                  <span className="game-detail-review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="game-detail-no-reviews">no reviews yet. be the first to review!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameDetail;
