// Navbar.js
import React, { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import navbarStyles from '../../styles/components/navbar.module.css';
import data from '../../Context/ContextApi';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { userData } = useContext(data);

  const toggleMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className={navbarStyles.top}>
        <div className={navbarStyles.logo}>AniManga</div>
        <div className={navbarStyles.Navbar}>
          {/* Auth Routes */}
          {!userData?._id ? (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register">Register</Link>
            </>
          ) : (
            <>
              <Link to="/">Home</Link>
              <Link to="/animes">Anime List</Link>
              <Link to="/mangas">Manga List</Link>
              <Link to="/characters">Characters</Link>
              <Link to="/profile">Profile</Link>
              {userData.role === 'admin' && (
                <>
                  <Link to="/add">Add</Link>
                  <Link to="/admin/users">Users</Link>
                </>
              )}
            </>
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
            {userData.role === 'admin' && (
              <>
                <Link to="/add" onClick={closeMenu}>Add</Link>
                <Link to="/admin/users" onClick={closeMenu}>Users</Link>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default Navbar;
