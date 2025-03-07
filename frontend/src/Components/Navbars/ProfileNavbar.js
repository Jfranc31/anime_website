import React from "react";
import { NavLink } from 'react-router-dom';
import styles from '../../styles/components/add_navbar.module.css';

const ProfileNavigation = () => {
    return (
        <nav className={styles.addNavbar}>
            <div className={styles.navLinks}>
                <NavLink
                    to="/profile/overview"
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Overview
                </NavLink>
                <NavLink
                    to="/profile/animeProfile"
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Anime
                </NavLink>
                <NavLink
                    to="/profile/mangaProfile"
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Manga
                </NavLink>
                <NavLink
                    to="/profile/stats"
                    className={({ isActive }) => 
                        `${styles.link} ${isActive ? styles.active : ''}`
                    }
                >
                    Stats
                </NavLink>
            </div>
        </nav>
    );
};

export default ProfileNavigation;