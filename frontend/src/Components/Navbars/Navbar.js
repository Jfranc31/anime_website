// Navbar.js
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../../styles/components/navbar.module.css';

const Navbar = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const toggleMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    const closeMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <>
            {/* Regular Navbar */}
            <div className={styles.top}>
                <div className={styles.logo}>AniManga</div>
                <div className={styles.Navbar}>
                    <Link to="/">Home</Link>
                    <Link to="/animes">Anime List</Link>
                    <Link to="/mangas">Manga List</Link>
                    <Link to="/characters">Characters</Link>
                    <Link to="/profile">Profile</Link>
                    <Link to="/add">Add</Link>
                </div>
            </div>

            {/* Mobile Menu Button */}
            <button className={styles.menuButton} onClick={toggleMenu}>
                ☰
            </button>

            {/* Mobile Menu */}
            <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.show : ''}`}>
                <Link to="/" onClick={closeMenu}>Home</Link>
                <Link to="/animes" onClick={closeMenu}>Anime List</Link>
                <Link to="/mangas" onClick={closeMenu}>Manga List</Link>
                <Link to="/characters" onClick={closeMenu}>Characters</Link>
                <Link to="/profile" onClick={closeMenu}>Profile</Link>
                <Link to="/add" onClick={closeMenu}>Add</Link>
            </div>
        </>
    );
};

export default Navbar;