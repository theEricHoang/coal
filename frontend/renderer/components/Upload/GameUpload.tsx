import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gamesAPI } from '../../services/api';
import './GameUpload.css';

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
    <div className="upload-page">
      <div className="upload-container">
        {/* Header */}
        <div className="upload-header">
          <button onClick={() => navigate('/library')} className="back-button">
            ← Back to Library
          </button>
          <h1 className="upload-title">
            Upload Game
          </h1>
          <p className="upload-subtitle">
            Add a new game to your library
          </p>
        </div>

        {/* Form */}
        <div className="upload-form-card">
          {error && (
            <div className="upload-error">
              {error}
            </div>
          )}

          {success && (
            <div className="upload-success">
              Game uploaded successfully! Redirecting to library...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Game Title */}
            <div className="form-group">
              <label className="form-label">
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
                className="form-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label className="form-label">
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
                className="form-textarea"
              />
            </div>

            {/* Developer and Publisher */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
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
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
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
                  className="form-input"
                />
              </div>
            </div>

            {/* Genre and Platform */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
                  Genre
                </label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="e.g., Action, RPG"
                  disabled={uploading || success}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Platform
                </label>
                <input
                  type="text"
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  placeholder="e.g., PC, Mac"
                  disabled={uploading || success}
                  className="form-input"
                />
              </div>
            </div>

            {/* Price and Release Date */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">
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
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">
                  Release Date
                </label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleChange}
                  disabled={uploading || success}
                  className="form-input"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="form-group">
              <label className="form-label">
                Game File
              </label>
              <input
                type="file"
                name="gameFile"
                onChange={handleFileChange}
                disabled={uploading || success}
                className="form-file-input"
              />
              {gameFile && (
                <p className="form-file-note">
                  Selected: {gameFile.name}
                </p>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">
                Cover Image
              </label>
              <input
                type="file"
                name="coverImage"
                accept="image/*"
                onChange={handleFileChange}
                disabled={uploading || success}
                className="form-file-input"
              />
              {coverImage && (
                <p className="form-file-note">
                  Selected: {coverImage.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading || success}
              className="upload-submit-button"
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