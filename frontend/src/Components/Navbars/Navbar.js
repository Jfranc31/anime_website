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
  const { userData } = useContext(data);
  const profileRef = useRef(null);

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

  return (
    <>
      <div className={navbarStyles.top}>
        <div className={navbarStyles.logo}>AniManga</div>
        <div className={navbarStyles.Navbar}>
          {userData?._id && <Link to="/">Home</Link>}
          <Link to="/animes">Anime List</Link>
          <Link to="/mangas">Manga List</Link>
          <Link to="/characters">Characters</Link>
          
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
        {userData?._id && <Link to="/" onClick={closeMenu}>Home</Link>}
        <Link to="/animes" onClick={closeMenu}>Anime List</Link>
        <Link to="/mangas" onClick={closeMenu}>Manga List</Link>
        <Link to="/characters" onClick={closeMenu}>Characters</Link>
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
