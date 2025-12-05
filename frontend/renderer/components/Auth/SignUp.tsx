import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, handleApiError } from '../../services/api';
import { UserCreate } from '../../types';
import './SignUp.css';

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<UserCreate>({
    username: '',
    email: '',
    password: '',
    role: 'user', // default role
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'confirmPassword') {
      setConfirmPassword(e.target.value);
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value,
      });
    }
    if (error) setError('');
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
      const response = await authAPI.register(formData);
      console.log('Registration successful:', response);
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
          <h2 className="signup-title">
            Create Account
          </h2>
          <p className="signup-subtitle">
            Join our gaming community today
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

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
              className="form-input"
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="form-input"
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
              disabled={loading || success}
            >
              <option value="user">User (Player)</option>
              <option value="studio">Studio/Publisher</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
              className="form-input"
              required
              disabled={loading || success}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              className="form-input"
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            className="submit-button"
          >
            {loading ? 'Creating Account...' : success ? 'Success!' : 'Sign Up'}
          </button>
        </form>

        <div className="signup-footer">
          Already have an account?{' '}
          <Link to="/signin" className="signup-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;