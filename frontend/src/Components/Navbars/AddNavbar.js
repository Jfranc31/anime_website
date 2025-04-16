import React from 'react';
import { NavLink } from 'react-router-dom';
import styles from '../../styles/components/add_navbar.module.css';

const AddNavbar = () => {
  return (
    <div className={styles.addNavbar}>
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
      </div>
    </div>
  );
};

export default AddNavbar;
