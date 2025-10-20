import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMenuOpen(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" onClick={closeMenu}>
          <span className="brand-icon">📚</span>
          <span className="brand-text">Exam Practice</span>
        </Link>
        
        <button 
          className={`navbar-toggle ${isMenuOpen ? 'active' : ''}`} 
          onClick={toggleMenu}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
          <span className="hamburger-line"></span>
        </button>
        
        <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            <Link to="/" className="navbar-link" onClick={closeMenu}>
              <span className="nav-icon">🏠</span>
              Dashboard
            </Link>
            <Link to="/exams" className="navbar-link" onClick={closeMenu}>
              <span className="nav-icon">📋</span>
              Exams
            </Link>
            <Link to="/history" className="navbar-link" onClick={closeMenu}>
              <span className="nav-icon">📊</span>
              History
            </Link>
            {isAdmin() && (
              <Link to="/admin" className="navbar-link navbar-link-admin" onClick={closeMenu}>
                <span className="nav-icon">⚙️</span>
                Admin
              </Link>
            )}
          </div>
          
          <div className="navbar-user">
            <div className="user-info">
              <span className="user-email">{user?.email}</span>
              {isAdmin() && <span className="admin-badge">Admin</span>}
            </div>
            <button onClick={handleLogout} className="btn-logout">
              <span className="logout-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
        
        {/* Overlay for mobile menu */}
        {isMenuOpen && (
          <div className="navbar-overlay" onClick={closeMenu}></div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;