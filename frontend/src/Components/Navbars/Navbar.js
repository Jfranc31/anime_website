// Navbar.js
import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import navbarStyles from '../../styles/components/navbar.module.css';
import data from '../../Context/ContextApi';
import { DEFAULT_AVATAR } from '../../constants/assets';
import Cookies from 'js-cookie';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isBrowseMenuOpen, setBrowseMenuOpen] = useState(false);
  const { userData } = useContext(data);
  const profileRef = useRef(null);
  const browseRef = useRef(null);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleMouseEnter = () => {
    setIsProfileMenuOpen(true);
  };

  const handleMouseLeave = () => {
    setIsProfileMenuOpen(false);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  };

  const handleLogout = () => {
    Cookies.remove('userInfo');
    window.location.href = '/login';
  };

  const handleBrowseMouseEnter = () => {
    setBrowseMenuOpen(true);
  };

  const handleBrowseMouseLeave = () => {
    setBrowseMenuOpen(false);
  };

  return (
    <>
      <div className={navbarStyles.top}>
        <div className={navbarStyles.logo}>AniManga</div>
        <div className={navbarStyles.Navbar}>
          {userData?._id && (
            <>
              <Link to="/">Home</Link>
              <Link to="/profile">Profile</Link>
            </>
          )}
          <div 
            className={navbarStyles.browseSection}
            onMouseEnter={handleBrowseMouseEnter}
            onMouseLeave={handleBrowseMouseLeave}
            ref={browseRef}
          >
            <Link to="/animes">Browse</Link>
            {isBrowseMenuOpen && (
              <div className={navbarStyles.browseDropdown}>
                <div className={navbarStyles.dropdownSection}>
                  <Link to="/animes">
                    <div className={navbarStyles.dropdownItem}>
                      <div className={navbarStyles.itemIcon}>🎬</div>
                      <div className={navbarStyles.itemContent}>
                        <div className={navbarStyles.itemTitle}>Anime</div>
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className={navbarStyles.dropdownSection}>
                  <Link to="/mangas">
                    <div className={navbarStyles.dropdownItem}>
                      <div className={navbarStyles.itemIcon}>📚</div>
                      <div className={navbarStyles.itemContent}>
                        <div className={navbarStyles.itemTitle}>Manga</div>
                      </div>
                    </div>
                  </Link>
                </div>

                <div className={navbarStyles.dropdownDivider}></div>

                <div className={navbarStyles.dropdownSection}>
                  <Link to="/characters">
                    <div className={navbarStyles.dropdownItem}>
                      <div className={navbarStyles.itemIcon}>👥</div>
                      <div className={navbarStyles.itemContent}>
                        <div className={navbarStyles.itemTitle}>Characters</div>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}
          </div>
          
          {!userData?._id ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <div 
              className={navbarStyles.profileSection}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              ref={profileRef}
            >
              <div className={navbarStyles.profileIcon}>
                <img 
                  src={userData?.avatar || DEFAULT_AVATAR}
                  alt="Profile" 
                  className={navbarStyles.avatarImage}
                />
              </div>
              {isProfileMenuOpen && (
                <div className={navbarStyles.profileDropdown}>
                  <Link to="/profile">Profile</Link>
                  <Link to="/settings">Settings</Link>
                  {userData.role === 'admin' && (
                    <>
                      <Link to="/add">Add</Link>
                      <Link to="/admin/users">Users</Link>
                    </>
                  )}
                  <button 
                    onClick={handleLogout}
                    className={navbarStyles.logoutButton}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <button className={navbarStyles.menuButton} onClick={toggleMenu}>
        ☰
      </button>

      <div className={`${navbarStyles.mobileMenu} ${isMobileMenuOpen ? navbarStyles.show : ''}`}>
        {userData?._id && (
          <>
            <Link to="/" onClick={closeMenu}>Home</Link>
            <Link to="/profile" onClick={closeMenu}>Profile</Link>
          </>
        )}
        <Link to="/animes" onClick={closeMenu}>Browse Anime</Link>
        <Link to="/mangas" onClick={closeMenu}>Browse Manga</Link>
        <Link to="/characters" onClick={closeMenu}>Browse Characters</Link>
        {!userData?._id ? (
          <>
            <Link to="/login" onClick={closeMenu}>Login</Link>
            <Link to="/register" onClick={closeMenu}>Register</Link>
          </>
        ) : (
          <>
            <Link to="/profile" onClick={closeMenu}>Profile</Link>
            <Link to="/settings" onClick={closeMenu}>Settings</Link>
            {userData.role === 'admin' && (
              <>
                <Link to="/add" onClick={closeMenu}>Add</Link>
                <Link to="/admin/users" onClick={closeMenu}>Users</Link>
              </>
            )}
            <button 
              onClick={() => {
                closeMenu();
                handleLogout();
              }}
              className={navbarStyles.mobileLogoutButton}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
