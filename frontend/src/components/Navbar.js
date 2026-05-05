import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import DefaultAvatar from './DefaultAvatar';
import '../styles/Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setProfileMenuOpen(false);
  };

  const handleProfileClick = () => {
    if (user?._id) {
      navigate(`/profile/${user._id}`);
      setProfileMenuOpen(false);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand" onClick={() => navigate('/')}>
          <div className="brand-icon">
            <img
              src="https://i.ibb.co/HLxK41vG/unnamed.jpg"
              alt="MindScroll Logo"
              className="logo-image"
            />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">MindScroll</h1>
            <p className="brand-tagline">Learning with Scrolling</p>
          </div>
        </div>

        {isAuthenticated && (
          <div className="navbar-nav">
            <button
              className={`nav-link ${location.pathname === '/feed' ? 'active' : ''}`}
              onClick={() => navigate('/feed')}
            >
              Feed
            </button>
          </div>
        )}

        {isAuthenticated ? (
          <div className="navbar-auth">
            <div className="profile-menu-wrapper">
              <button className="user-profile-btn" onClick={() => setProfileMenuOpen(!profileMenuOpen)}>
                <div className="user-avatar-nav">
                  {user?.profileImage ? (
                    <img src={user.profileImage} alt={user?.name} />
                  ) : (
                    <DefaultAvatar user={user} size="md" />
                  )}
                </div>
                <span className="user-name">{user?.name || user?.username}</span>
                <span className="dropdown-arrow">v</span>
              </button>

              {profileMenuOpen && (
                <div className="profile-dropdown">
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    My Profile
                  </button>
                  <button className="dropdown-item" onClick={() => navigate('/feed')}>
                    Feed
                  </button>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="navbar-links">
            <button onClick={() => navigate('/login')} className="btn-link">
              Login
            </button>
            <button onClick={() => navigate('/register')} className="btn-link btn-primary">
              Sign Up
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
