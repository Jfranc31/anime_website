import React, { useContext } from 'react';
import settingsStyles from '../styles/pages/Settings.module.css';
import data from '../Context/ContextApi';
import { useTheme } from '../Context/ThemeContext';
import axios from 'axios';
import Cookies from 'js-cookie';

const Settings = () => {
  const { userData, setUserData } = useContext(data);
  const { theme, setTheme } = useTheme();

  const handleThemeChange = async (newTheme) => {
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      await axios.put(`/users/${userData._id}/theme`,
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
    <div className={settingsStyles.settingsPage}>
      <div className={settingsStyles.sidebar}>
        <h3>Settings</h3>
        <nav>
          <ul>
            <li className={settingsStyles.active}>Profile</li>
            <li>Account</li>
            <li>Anime & Manga</li>
          </ul>
        </nav>
      </div>

      <div className={settingsStyles.content}>
        <section className={settingsStyles.section}>
          <h2>Site Theme</h2>
          <div className={settingsStyles.themeButtons}>
            <button
              className={`${settingsStyles.themeButton} ${theme === 'light' ? settingsStyles.active : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              Default Theme
            </button>
            <button
              className={`${settingsStyles.themeButton} ${theme === 'dark' ? settingsStyles.active : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              Dark Theme
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;
