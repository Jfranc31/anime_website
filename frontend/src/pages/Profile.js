import React, { useContext } from 'react';
import axios from 'axios';
import profileStyles from '../styles/pages/Profile.module.css';
import { useTheme } from '../Context/ThemeContext';
import data from '../Context/ContextApi';

const Profile = () => {
  const { theme, setTheme } = useTheme();
  const { userData } = useContext(data);

  const handleThemeChange = async (newTheme) => {
    try {
      await axios.put(`/users/${userData._id}/theme`, { theme: newTheme });
      setTheme(newTheme);
    } catch (error) {
      console.error('Error updating theme:', error);
    }
  };

  return (
    <div className={profileStyles.profilePage}>
      <div className={profileStyles.profileHeader}>
        <h1>Profile Page</h1>
      </div>
      <div className={profileStyles.themeSelector}>
        <label>Theme Settings</label>
        <div className={profileStyles.themeButtons}>
          <button
            className={`${profileStyles.themeButton} ${theme === 'dark' ? profileStyles.active : ''}`}
            onClick={() => handleThemeChange('dark')}
          >
            Dark Theme
          </button>
          <button
            className={`${profileStyles.themeButton} ${theme === 'light' ? profileStyles.active : ''}`}
            onClick={() => handleThemeChange('light')}
          >
            Light Theme
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
