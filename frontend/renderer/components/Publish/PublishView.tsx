import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './PublishView.css';

const PublishView: React.FC = () => {
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

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

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmedTag = tagInput.trim();
      if (trimmedTag && !tags.includes(trimmedTag)) {
        setTags([...tags, trimmedTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPublishing(true);

    const userId = authAPI.getCurrentUserId();
    if (!userId) {
      setError('Not logged in');
      setPublishing(false);
      return;
    }

    try {
      // Step 1: Get studio ID for the logged-in user
      const studiosResponse = await fetch('http://localhost:8000/studios/');
      if (!studiosResponse.ok) {
        throw new Error('Failed to fetch studios');
      }
      const studios = await studiosResponse.json();
      const userStudio = studios.find((studio: any) => studio.user_id === userId);

      if (!userStudio) {
        throw new Error('No studio found for this user');
      }

      // Step 2: Create the game in the catalog
      const gamePayload = {
        title: formData.title,
        description: formData.description || null,
        developer: formData.developer || null,
        genre: formData.genre || null,
        platform: formData.platform || null,
        price: formData.price ? parseFloat(formData.price) : null,
        release_date: formData.releaseDate || null,
        tags: tags.length > 0 ? tags : null,
        studio_id: userStudio.studio_id,
      };

      const gameResponse = await fetch('http://localhost:8000/games/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gamePayload),
      });

      if (!gameResponse.ok) {
        const errorData = await gameResponse.json();
        throw new Error(errorData.detail || 'Failed to publish game');
      }

      const game = await gameResponse.json();

      // Step 3: Upload thumbnail if provided
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

      setSuccess(true);
      
      // Reset form
      setTimeout(() => {
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
        setTags([]);
        setTagInput('');
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      console.error('Publish error:', err);
      setError(err.message || 'Failed to publish game. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="publish-page">
      <div className="publish-container">
        <div className="publish-header">
          <h1 className="publish-title">publish game</h1>
          <p className="publish-subtitle">add a new game to the store catalog</p>
        </div>

        <form onSubmit={handleSubmit} className="publish-form">
          {error && <div className="publish-error">{error}</div>}
          {success && <div className="publish-success">game published successfully!</div>}

          <div className="publish-form-grid">
            <div className="form-group">
              <label className="form-label">title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                disabled={publishing}
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">developer *</label>
              <input
                type="text"
                name="developer"
                value={formData.developer}
                onChange={handleChange}
                required
                disabled={publishing}
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
                disabled={publishing}
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
                disabled={publishing}
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
                disabled={publishing}
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
                disabled={publishing}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              disabled={publishing}
              rows={4}
              className="form-textarea"
            />
          </div>

          <div className="form-group">
            <label className="form-label">tags</label>
            <div className="tags-container">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="tag-remove"
                    disabled={publishing}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="type and press enter to add tags"
              disabled={publishing}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">thumbnail</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              disabled={publishing}
              className="form-file-input"
            />
          </div>

          <button
            type="submit"
            disabled={publishing}
            className="publish-button"
          >
            {publishing ? 'publishing...' : 'publish game'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublishView;
