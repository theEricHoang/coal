import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userAPI, authAPI } from '../../services/api';
import { UserLibraryItem } from '../../types';

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
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', paddingTop: '1rem' }}>
      {/* Header Section */}
      <div style={{
        backgroundColor: '#1e293b',
        padding: '2rem',
        marginBottom: '2rem',
        borderBottom: '1px solid #334155'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h1 style={{ color: 'white', fontSize: '2.5rem', marginBottom: '0.5rem', fontWeight: 'bold' }}>
                My Library
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '1rem' }}>
                {games.length} {games.length === 1 ? 'game' : 'games'} • {totalHoursPlayed.toFixed(1)} hours played
              </p>
            </div>
            <button
              onClick={() => navigate('/upload')}
              style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
            >
              <span style={{ fontSize: '1.2rem' }}>+</span>
              Upload Game
            </button>
          </div>

          {/* Search and Filter */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search your library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                fontSize: '0.95rem'
              }}
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                fontSize: '0.95rem',
                cursor: 'pointer'
              }}
            >
              <option value="title">Sort by Title</option>
              <option value="hours">Sort by Hours Played</option>
              <option value="recent">Sort by Recently Added</option>
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem 2rem' }}>
        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '400px',
            color: '#94a3b8',
            fontSize: '1.2rem'
          }}>
            Loading your library...
          </div>
        ) : error ? (
          <div style={{
            backgroundColor: '#fee2e2',
            border: '1px solid #ef4444',
            color: '#991b1b',
            padding: '1rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
            <button
              onClick={loadLibrary}
              style={{
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : filteredAndSortedGames.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: '#94a3b8'
          }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📚</div>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'white' }}>
              {searchQuery ? 'No games found' : 'Your library is empty'}
            </h2>
            <p style={{ marginBottom: '1.5rem' }}>
              {searchQuery ? 'Try a different search term' : 'Start building your collection!'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/upload')}
                style={{
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '600'
                }}
              >
                Upload Your First Game
              </button>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem'
          }}>
            {filteredAndSortedGames.map((game) => (
              <div
                key={game.ownership_id}
                style={{
                  backgroundColor: '#1e293b',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid #334155',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.5)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {/* Game Cover Placeholder */}
                <div style={{
                  height: '180px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative'
                }}>
                  <span style={{ fontSize: '3rem' }}>🎮</span>
                  <div style={{
                    position: 'absolute',
                    bottom: '0.5rem',
                    right: '0.5rem',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.75rem'
                  }}>
                    {game.hours_played}h
                  </div>
                </div>

                {/* Game Info */}
                <div style={{ padding: '1rem' }}>
                  <h3 style={{
                    color: 'white',
                    fontSize: '1.1rem',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {game.title}
                  </h3>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {game.genre && (
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        🎯 {game.genre}
                      </div>
                    )}
                    {game.platform && (
                      <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                        💻 {game.platform}
                      </div>
                    )}
                    <div style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                      📅 Added {new Date(game.date_purchased).toLocaleDateString()}
                    </div>
                    {game.price && (
                      <div style={{
                        color: '#10b981',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        marginTop: '0.25rem'
                      }}>
                        ${game.price.toFixed(2)}
                      </div>
                    )}
                  </div>

                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.5rem',
                    backgroundColor: game.status === 'installed' ? '#065f46' : '#1e40af',
                    color: 'white',
                    borderRadius: '6px',
                    textAlign: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    textTransform: 'capitalize'
                  }}>
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