import React, { useState } from 'react';
import { authAPI } from '../../services/api';
import './AddGameModal.css';

interface AddGameModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGameAdded: () => void;
}

const AddGameModal: React.FC<AddGameModalProps> = ({ isOpen, onClose, onGameAdded }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    developer: '',
    genre: '',
    platform: '',
    price: '',
    releaseDate: '',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    if (error) setError('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setThumbnailFile(files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    const userId = authAPI.getCurrentUserId();
    if (!userId) {
      setError('Not logged in');
      setUploading(false);
      return;
    }

    try {
      // Step 1: Create the game in the catalog
      const gamePayload = {
        title: formData.title,
        description: formData.description || null,
        developer: formData.developer || null,
        genre: formData.genre || null,
        platform: formData.platform || null,
        price: formData.price ? parseFloat(formData.price) : null,
        release_date: formData.releaseDate || null,
      };

      const gameResponse = await fetch('http://localhost:8000/games/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gamePayload),
      });

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.detail || 'Failed to create game');
      }

      const game = await gameResponse.json();

      // Step 2: Upload thumbnail if provided
      if (thumbnailFile) {
        const thumbnailFormData = new FormData();
        thumbnailFormData.append('file', thumbnailFile);

        const thumbnailResponse = await fetch(`http://localhost:8000/games/${game.game_id}/upload-thumbnail`, {
          method: 'POST',
          body: thumbnailFormData,
        });

        if (!thumbnailResponse.ok) {
          console.error('Thumbnail upload failed:', await thumbnailResponse.text());
        }
      }

      // Step 3: Add game to user's library
      const libraryResponse = await fetch('http://localhost:8000/library/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          game_id: game.game_id,
          type: 'digital',
        }),
      });

      if (!libraryResponse.ok) {
        const errorData = await libraryResponse.json();
        throw new Error(errorData.detail || 'Failed to add to library');
      }

      onGameAdded();
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        developer: '',
        genre: '',
        platform: '',
        price: '',
        releaseDate: '',
      });
      setThumbnailFile(null);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to add game. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">add game to library</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {error && <div className="modal-error">{error}</div>}

          <div className="modal-form-grid">
            <div className="form-group">
              <label className="form-label">title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={uploading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">developer</label>
              <input
                type="text"
                name="developer"
                value={formData.developer}
                onChange={handleChange}
                disabled={uploading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">genre</label>
              <input
                type="text"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                disabled={uploading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">platform</label>
              <input
                type="text"
                name="platform"
                value={formData.platform}
                onChange={handleChange}
                disabled={uploading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">price</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                step="0.01"
                min="0"
                disabled={uploading}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">release date</label>
              <input
                type="date"
                name="releaseDate"
                value={formData.releaseDate}
                onChange={handleChange}
                disabled={uploading}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={uploading}
              rows={3}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading}
              className="form-file-input"
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="modal-button modal-button-secondary"
            >
              cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className="modal-button modal-button-primary"
            >
              {uploading ? 'adding...' : 'add game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGameModal;
