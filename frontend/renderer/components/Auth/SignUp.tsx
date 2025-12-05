import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, studioAPI, handleApiError } from '../../services/api';
import { UserCreate } from '../../types';
import './SignUp.css';
import coal_logo from '../../assets/coal_logo.png';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'user', // default role
  });
  const [studioData, setStudioData] = useState({
    studioName: '',
    contactInfo: '',
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    if (e.target.name === 'confirmPassword') {
      setConfirmPassword(e.target.value);
    } else if (e.target.name === 'studioName' || e.target.name === 'contactInfo') {
      setStudioData({
        ...studioData,
        [e.target.name]: e.target.value,
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
    if (error) setError('');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const validateForm = (): boolean => {
    if (formData.password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    if (formData.role === 'studio') {
      if (!studioData.studioName.trim()) {
        setError('Studio name is required');
        return false;
      }
      if (!logoFile) {
        setError('Studio logo is required');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Step 1: Create user account
      const userResponse = await authAPI.register(formData);
      console.log('User registration successful:', userResponse);

      // If studio account, create studio and upload logos
      if (formData.role === 'studio' && logoFile) {
        // Step 2: Create studio record
        const studioResponse = await studioAPI.createStudio({
          name: studioData.studioName,
          contact_info: studioData.contactInfo,
          user_id: userResponse.user_id,
        });
        console.log('Studio creation successful:', studioResponse);

        // Step 3: Upload logo as user profile picture
        await studioAPI.uploadProfilePicture(userResponse.user_id, logoFile);
        console.log('Profile picture uploaded');

        // Step 4: Upload logo as studio logo
        await studioAPI.uploadLogo(studioResponse.studio_id, logoFile);
        console.log('Studio logo uploaded');
      }

      setSuccess(true);
      
      // Redirect to sign in after 2 seconds
      setTimeout(() => {
        navigate('/signin');
      }, 2000);
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-header">
          <img src={coal_logo} alt="COAL Logo" className="signup-logo" />
          <h2 className="signup-title">
            COAL
          </h2>
          <p className="signup-subtitle">
            sign up
          </p>
        </div>

        {error && (
          <div className="signup-error">
            {error}
          </div>
        )}

        {success && (
          <div className="signup-success">
            Account created successfully! Redirecting to sign in...
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="username"
            className="form-input"
            required
            disabled={loading || success}
          />

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email"
            className="form-input"
            required
            disabled={loading || success}
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="form-select"
            disabled={loading || success}
          >
            <option value="user">user (player)</option>
            <option value="studio">studio/publisher</option>
          </select>

          {formData.role === 'studio' && (
            <>
              <input
                type="text"
                name="studioName"
                value={studioData.studioName}
                onChange={handleChange}
                placeholder="studio name"
                className="form-input"
                required
                disabled={loading || success}
              />

              <textarea
                name="contactInfo"
                value={studioData.contactInfo}
                onChange={handleChange}
                placeholder="contact info (optional)"
                className="form-textarea"
                disabled={loading || success}
                rows={3}
              />

              <div className="form-file-input">
                <label htmlFor="logo" className="file-label">
                  {logoFile ? logoFile.name : 'upload studio logo'}
                </label>
                <input
                  type="file"
                  id="logo"
                  name="logo"
                  onChange={handleLogoChange}
                  accept="image/*"
                  className="file-input"
                  required
                  disabled={loading || success}
                />
              </div>
            </>
          )}

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="password (min. 6 characters)"
            className="form-input"
            required
            disabled={loading || success}
          />

          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={handleChange}
            placeholder="confirm password"
            className="form-input"
            required
            disabled={loading || success}
          />

          <div className="form-buttons">
            <Link to="/signin" className="signin-button">
              sign in
            </Link>
            <button
              type="submit"
              disabled={loading || success}
              className="submit-button"
            >
              {loading ? 'creating account...' : success ? 'success!' : 'sign up'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignUp;