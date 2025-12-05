import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, handleApiError } from '../../services/api';
import { UserLogin } from '../../types';
import './Signin.css';
import coal_logo from '../../assets/coal_logo.png';

interface SignInProps {
  onSignIn: () => void;
}

const SignIn: React.FC<SignInProps> = ({ onSignIn }) => {
  const [formData, setFormData] = useState<UserLogin>({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      console.log('Login successful:', response);
      onSignIn(); // Update parent component state
    } catch (err) {
      const errorMessage = handleApiError(err);
      setError(errorMessage);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-container">
      <div className="signin-card">
        <div className="signin-header">
          <img src={coal_logo} alt="COAL Logo" className="signin-logo" />
          <h2 className="signin-title">
            COAL
          </h2>
          <p className="signin-subtitle">
            sign in
          </p>
        </div>

        {error && (
          <div className="signin-error">
            {error}
          </div>
        )}

        <form className="form" onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="email"
            className="form-input"
            required
            disabled={loading}
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="password"
            className="form-input"
            required
            disabled={loading}
          />

          <div className="form-buttons">
            <Link to="/signup" className="signup-button">
              sign up
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="submit-button"
            >
              {loading ? 'signing in...' : 'sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SignIn;