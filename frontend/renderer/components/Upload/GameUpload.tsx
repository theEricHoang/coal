import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI } from '../../services/api';

const GameUpload: React.FC = () => {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    developer: '',
    publisher: '',
    genre: '',
    platform: '',
    price: '',
    releaseDate: '',
  });
  const [gameFile, setGameFile] = useState<File | null>(null);
  const [coverImage, setCoverImage] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      if (e.target.name === 'gameFile') {
        setGameFile(files[0]);
      } else if (e.target.name === 'coverImage') {
        setCoverImage(files[0]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      const uploadData = new FormData();
      uploadData.append('title', formData.title);
      uploadData.append('description', formData.description);
      uploadData.append('developer', formData.developer);
      uploadData.append('publisher', formData.publisher);
      uploadData.append('genre', formData.genre);
      uploadData.append('platform', formData.platform);
      uploadData.append('price', formData.price);
      uploadData.append('release_date', formData.releaseDate);
      
      if (gameFile) {
        uploadData.append('game_file', gameFile);
      }
      if (coverImage) {
        uploadData.append('cover_image', coverImage);
      }

      await gamesAPI.uploadGame(uploadData);
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/library');
      }, 2000);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.detail || 'Failed to upload game. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      padding: '2rem'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <button
            onClick={() => navigate('/library')}
            style={{
              backgroundColor: 'transparent',
              color: '#94a3b8',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.95rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            ← Back to Library
          </button>
          <h1 style={{ color: 'white', fontSize: '2.5rem', fontWeight: 'bold' }}>
            Upload Game
          </h1>
          <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
            Add a new game to your library
          </p>
        </div>

        {/* Form */}
        <div style={{
          backgroundColor: '#1e293b',
          padding: '2rem',
          borderRadius: '12px',
          border: '1px solid #334155'
        }}>
          {error && (
            <div style={{
              backgroundColor: '#fee2e2',
              border: '1px solid #ef4444',
              color: '#991b1b',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              backgroundColor: '#d1fae5',
              border: '1px solid #10b981',
              color: '#065f46',
              padding: '0.75rem',
              borderRadius: '6px',
              marginBottom: '1.5rem',
              fontSize: '0.875rem'
            }}>
              Game uploaded successfully! Redirecting to library...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Game Title */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                color: '#e2e8f0',
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Game Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter game title"
                required
                disabled={uploading || success}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Description */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                color: '#e2e8f0',
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your game"
                required
                disabled={uploading || success}
                rows={4}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Developer and Publisher */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Developer *
                </label>
                <input
                  type="text"
                  name="developer"
                  value={formData.developer}
                  onChange={handleChange}
                  placeholder="Developer name"
                  required
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Publisher *
                </label>
                <input
                  type="text"
                  name="publisher"
                  value={formData.publisher}
                  onChange={handleChange}
                  placeholder="Publisher name"
                  required
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Genre and Platform */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="e.g., Action, RPG"
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Platform
                </label>
                <input
                  type="text"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  placeholder="e.g., PC, Mac"
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* Price and Release Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Price ($)
                </label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <label style={{
                  color: '#e2e8f0',
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600'
                }}>
                  Release Date
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  disabled={uploading || success}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #334155',
                    backgroundColor: '#0f172a',
                    color: 'white',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>

            {/* File Uploads */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                color: '#e2e8f0',
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Game File
              </label>
              <input
                type="file"
                name="gameFile"
                onChange={handleFileChange}
                disabled={uploading || success}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
              {gameFile && (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Selected: {gameFile.name}
                </p>
              )}
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                color: '#e2e8f0',
                display: 'block',
                marginBottom: '0.5rem',
                fontSize: '0.875rem',
                fontWeight: '600'
              }}>
                Cover Image
              </label>
              <input
                type="file"
                name="coverImage"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading || success}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: '6px',
                  border: '1px solid #334155',
                  backgroundColor: '#0f172a',
                  color: 'white',
                  fontSize: '0.95rem',
                  boxSizing: 'border-box'
                }}
              />
              {coverImage && (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                  Selected: {coverImage.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || success}
              style={{
                width: '100%',
                padding: '1rem',
                backgroundColor: (uploading || success) ? '#1e40af' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: (uploading || success) ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600',
                transition: 'background-color 0.2s',
                opacity: (uploading || success) ? 0.7 : 1
              }}
              onMouseOver={(e) => {
                if (!uploading && !success) e.currentTarget.style.backgroundColor = '#2563eb';
              }}
              onMouseOut={(e) => {
                if (!uploading && !success) e.currentTarget.style.backgroundColor = '#3b82f6';
              }}
            >
              {uploading ? 'Uploading...' : success ? 'Success!' : 'Upload Game'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default GameUpload;