// Footer.js

import React from 'react';
import { useUser } from '../../Context/ContextApi';
import styles from '../../styles/components/Footer.module.css';

const Footer = () => {
  const { userData } = useUser();
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.copyright}>
          © {currentYear} Anime Website. All rights reserved.
        </div>
        {userData && (
          <div className={styles.userInfo}>
            Logged in as: {userData.username}
          </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;
