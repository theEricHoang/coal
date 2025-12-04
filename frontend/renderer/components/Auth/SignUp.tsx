import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, handleApiError } from '../../services/api';
import { UserCreate } from '../../types';

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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#0f172a',
      backgroundImage: 'linear-gradient(to bottom right, #1e293b, #0f172a)',
      padding: '2rem 1rem'
    }}>
      <div style={{
        backgroundColor: '#1e293b',
        padding: '2.5rem',
        borderRadius: '12px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{
            color: 'white',
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Create Account
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Join our gaming community today
          </p>
        </div>

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
            Account created successfully! Redirecting to sign in...
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              color: '#e2e8f0',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Choose a username"
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
              required
              disabled={loading || success}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              color: '#e2e8f0',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
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
              required
              disabled={loading || success}
            />
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              color: '#e2e8f0',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Account Type
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
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
              disabled={loading || success}
            >
              <option value="user">User (Player)</option>
              <option value="studio">Studio/Publisher</option>
            </select>
          </div>

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              color: '#e2e8f0',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password (min. 6 characters)"
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
              required
              disabled={loading || success}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              color: '#e2e8f0',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
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
              required
              disabled={loading || success}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: '100%',
              padding: '0.875rem',
              backgroundColor: (loading || success) ? '#1e40af' : '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: (loading || success) ? 'not-allowed' : 'pointer',
              fontSize: '1rem',
              fontWeight: '600',
              transition: 'background-color 0.2s',
              opacity: (loading || success) ? 0.7 : 1
            }}
            onMouseOver={(e) => {
              if (!loading && !success) e.currentTarget.style.backgroundColor = '#2563eb';
            }}
            onMouseOut={(e) => {
              if (!loading && !success) e.currentTarget.style.backgroundColor = '#3b82f6';
            }}
          >
            {loading ? 'Creating Account...' : success ? 'Success!' : 'Sign Up'}
          </button>
        </form>

        <div style={{
          marginTop: '1.5rem',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '0.875rem'
        }}>
          Already have an account?{' '}
          <Link
            to="/signin"
            style={{
              color: '#3b82f6',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignUp;