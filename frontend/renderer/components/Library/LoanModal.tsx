import React, { useState, useEffect, useRef } from 'react';
import { userAPI } from '../../services/api';
import './LoanModal.css';

interface User {
  user_id: number;
  username: string;
  profile_picture?: string;
}

interface LoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameTitle: string;
  gameId: number;
  ownershipId: number;
  onLoanCreated: () => void;
}

const LoanModal: React.FC<LoanModalProps> = ({
  isOpen,
  onClose,
  gameTitle,
  gameId,
  ownershipId,
  onLoanCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loanDuration, setLoanDuration] = useState(7); // days
  const [submitting, setSubmitting] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUser(null);
      setShowDropdown(false);
      setLoanDuration(7);
    }
  }, [isOpen]);

  useEffect(() => {
    // Debounced search
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    debounceTimer.current = setTimeout(async () => {
      await searchUsers(searchQuery);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [searchQuery]);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchUsers = async (query: string) => {
    setLoading(true);
    try {
      const results = await userAPI.searchUsers(query, 5);
      setSearchResults(results);
      setShowDropdown(true);
    } catch (err) {
      console.error('Failed to search users:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user: User) => {
    setSelectedUser(user);
    setSearchQuery('');
    setShowDropdown(false);
    setSearchResults([]);
  };

  const handleRemoveUser = () => {
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser) {
      alert('Please select a user to loan the game to');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`http://localhost:8000/library/loan/${ownershipId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loaned_to: selectedUser.user_id,
          loan_duration: loanDuration,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to loan game');
      }

      alert(`Game loaned to ${selectedUser.username} for ${loanDuration} days`);
      onLoanCreated();
      onClose();
    } catch (err: any) {
      console.error('Failed to loan game:', err);
      alert(err.message || 'Failed to loan game');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="loan-modal-overlay" onClick={onClose}>
      <div className="loan-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="loan-modal-header">
          <h2 className="loan-modal-title">loan game</h2>
          <button className="loan-modal-close" onClick={onClose}>×</button>
        </div>

        <form className="loan-modal-form" onSubmit={handleSubmit}>
          <div className="loan-modal-game-info">
            <span className="loan-modal-label">game</span>
            <span className="loan-modal-game-title">{gameTitle}</span>
          </div>

          <div className="loan-form-group">
            <label className="loan-form-label">loan to</label>
            
            {selectedUser ? (
              <div className="loan-selected-user">
                <div className="loan-user-display">
                  {selectedUser.profile_picture ? (
                    <img 
                      src={selectedUser.profile_picture} 
                      alt={selectedUser.username}
                      className="loan-user-avatar"
                    />
                  ) : (
                    <div className="loan-user-avatar-placeholder">
                      {selectedUser.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="loan-user-username">{selectedUser.username}</span>
                </div>
                <button
                  type="button"
                  className="loan-remove-user"
                  onClick={handleRemoveUser}
                >
                  ×
                </button>
              </div>
            ) : (
              <div className="loan-search-container" ref={dropdownRef}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="search username..."
                  className="loan-search-input"
                  disabled={submitting}
                />
                
                {loading && <div className="loan-search-loading">searching...</div>}
                
                {showDropdown && searchResults.length > 0 && (
                  <div className="loan-dropdown">
                    {searchResults.map((user) => (
                      <div
                        key={user.user_id}
                        className="loan-dropdown-item"
                        onClick={() => handleSelectUser(user)}
                      >
                        {user.profile_picture ? (
                          <img 
                            src={user.profile_picture} 
                            alt={user.username}
                            className="loan-dropdown-avatar"
                          />
                        ) : (
                          <div className="loan-dropdown-avatar-placeholder">
                            {user.username.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="loan-dropdown-username">{user.username}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {showDropdown && searchResults.length === 0 && !loading && searchQuery.trim().length >= 2 && (
                  <div className="loan-dropdown">
                    <div className="loan-dropdown-empty">no users found</div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="loan-form-group">
            <label className="loan-form-label">loan duration (days)</label>
            <input
              type="number"
              value={loanDuration}
              onChange={(e) => setLoanDuration(parseInt(e.target.value) || 1)}
              min="1"
              max="365"
              className="loan-form-input"
              disabled={submitting}
            />
          </div>

          <div className="loan-modal-actions">
            <button
              type="button"
              className="loan-btn loan-btn-cancel"
              onClick={onClose}
              disabled={submitting}
            >
              cancel
            </button>
            <button
              type="submit"
              className="loan-btn loan-btn-submit"
              disabled={submitting || !selectedUser}
            >
              {submitting ? 'loaning...' : 'loan game'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoanModal;
