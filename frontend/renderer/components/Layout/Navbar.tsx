import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { authAPI } from '../../services/api';
import './Navbar.css';
import coal_logo from '../../assets/coal_logo.png';
import monk_pfp from '../../assets/monk_pfp.png';

interface NavbarProps {
  onLogout: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onLogout }) => {
  const location = useLocation();
  const username = localStorage.getItem('username') || 'User';
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    authAPI.logout();
    onLogout();
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo/Brand */}
        <div className="navbar-left">
          <Link to="/library" className="navbar-brand">
            <img src={coal_logo} alt="COAL Logo" className="navbar-logo" />
          </Link>

          {/* Navigation Links */}
          <div className="navbar-nav">
            <Link
              to="/library"
              className={`navbar-link ${isActive('/library') ? 'active' : ''}`}
            >
              library
            </Link>
            <Link
              to="/upload"
              className={`navbar-link ${isActive('/upload') ? 'active' : ''}`}
            >
              upload
            </Link>
          </div>
        </div>

        {/* User Section */}
        <div className="navbar-right">
          <div className="navbar-user">
            {/* Chevron Icon */}
            <svg 
              className="navbar-user-chevron" 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              onClick={toggleDropdown}
              style={{ cursor: 'pointer' }}
            >
              <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            
            {/* Username and Status */}
            <div className="navbar-user-info">
              <div className="navbar-user-username">{username}</div>
              <div className="navbar-user-status">Online</div>
            </div>
            
            {/* Profile Picture */}
            <div className="navbar-user-pfp-container">
              <img src={monk_pfp} alt="Profile" className="navbar-user-pfp" />
            </div>
          </div>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="navbar-dropdown">
              <button onClick={handleLogout} className="navbar-dropdown-item">
                logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;