// /src/Components/Navbars/AddNavbar.js
import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/components/add_navbar.module.css';

const AddNavbar = () => {
    return (
        <nav className={styles.addNavbar}>
            <div className={styles.navLinks}>
                <NavLink 
                    to="/add/anime" 
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Anime
                </NavLink>
                <NavLink 
                    to="/add/manga" 
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Manga
                </NavLink>
                <NavLink 
                    to="/add/character" 
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Character
                </NavLink>
            </div>
        </nav>
    );
};

export default AddNavbar;