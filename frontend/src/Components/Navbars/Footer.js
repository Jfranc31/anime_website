// Footer.js

import React, { useContext } from 'react';
// import { Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import { useTheme } from '../../Context/ThemeContext';
import footerStyles from '../../styles/components/footer.module.css';
import data from '../../Context/ContextApi';
import Cookies from 'js-cookie';

const Footer = () => {
  const { userData, setUserData } = useContext(data);
  const { theme, setTheme } = useTheme();

  const handleLogout = () => {
    Cookies.remove('userInfo');
    window.location.href = '/login';
  };

  const handleThemeChange = async (newTheme) => {
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      await axiosInstance.put(`/users/${userData._id}/theme`,
        { theme: newTheme },
        {
          headers: {
            'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
          }
        }
      );

      // Update theme in context
      setTheme(newTheme);

      // Update theme in cookie
      const parsedUserInfo = JSON.parse(userInfo);
      parsedUserInfo.theme = newTheme;
      Cookies.set('userInfo', JSON.stringify(parsedUserInfo));

      // Update theme in userData context
      setUserData({...userData, theme: newTheme});

    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <>
      <footer className={footerStyles.footer}>
        <div className={footerStyles.footerContent}>
          {!userData?._id ? (
            <></>
          ) : (
            <>
              <button onClick={handleLogout} className={footerStyles.logOutButton}>
                LogOut
              </button>
              <div className={footerStyles.themeButtons}>
              <button
                className={`${footerStyles.themeButton} ${theme === 'light' ? footerStyles.active : ''}`}
                onClick={() => handleThemeChange('light')}
              >
                Default Theme
              </button>
              <button
                className={`${footerStyles.themeButton} ${theme === 'dark' ? footerStyles.active : ''}`}
                onClick={() => handleThemeChange('dark')}
              >
                Dark Theme
              </button>
            </div>
          </>
          )}

          <p>&copy; {new Date().getFullYear()} Your Website Name. All rights reserved.</p>
          <nav className={footerStyles.footerLinks}>
            <a href="/about">About</a>
            <a href="/contact">Contact</a>
            <a href="/privacy">Privacy Policy</a>
          </nav>
        </div>
      </footer>
    </>
  );
};

export default Footer;
