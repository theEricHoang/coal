import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Navbar.css';

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
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-left">
          <Link to="/library" className="navbar-brand">
            <span className="navbar-brand-icon">🎮</span>
            GameLib
          </Link>

          {/* Navigation Links */}
          <div className="navbar-nav">
            <Link
              to="/library"
              className={`navbar-link ${isActive('/library') ? 'active' : ''}`}
            >
              Library
            </Link>
            <Link
              to="/upload"
              className={`navbar-link ${isActive('/upload') ? 'active' : ''}`}
            >
              Upload
            </Link>
          </div>
        </div>

        {/* User Section */}
        <div className="navbar-right">
          <div className="navbar-user">
            👤 {username}
          </div>
          <button onClick={handleLogout} className="navbar-logout-btn">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;