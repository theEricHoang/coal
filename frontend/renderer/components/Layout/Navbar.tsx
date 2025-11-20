import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const username = localStorage.getItem('username') || 'User';

  const handleLogout = () => {
    authAPI.logout();
    onLogout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '64px'
      }}>
        {/* Logo/Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <Link
            to="/library"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <span style={{ fontSize: '1.8rem' }}>🎮</span>
            GameLib
          </Link>

          {/* Navigation Links */}
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Link
              to="/library"
              style={{
                color: isActive('/library') ? '#3b82f6' : '#94a3b8',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/library') ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: isActive('/library') ? '600' : '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isActive('/library')) {
e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive('/library')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Library
            </Link>
            <Link
              to="/upload"
              style={{
                color: isActive('/upload') ? '#3b82f6' : '#94a3b8',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                backgroundColor: isActive('/upload') ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                fontWeight: isActive('/upload') ? '600' : '500',
                transition: 'all 0.2s'
              }}
              onMouseOver={(e) => {
                if (!isActive('/upload')) {
                  e.currentTarget.style.backgroundColor = 'rgba(148, 163, 184, 0.1)';
                }
              }}
              onMouseOut={(e) => {
                if (!isActive('/upload')) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              Upload
            </Link>
          </div>
        </div>

        {/* User Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            color: '#e2e8f0',
            fontSize: '0.95rem',
            padding: '0.5rem 1rem',
            backgroundColor: '#0f172a',
            borderRadius: '6px',
            border: '1px solid #334155'
          }}>
            👤 {username}
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;