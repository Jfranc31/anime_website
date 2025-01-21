import React, { useContext, useState } from 'react';
import settingsStyles from '../styles/pages/Settings.module.css';
import data from '../Context/ContextApi';
import { useTheme } from '../Context/ThemeContext';
import AvatarUpload from '../Context/AvatarUpload';
import axios from 'axios';
import Cookies from 'js-cookie';

const Settings = () => {
  const { userData, setUserData } = useContext(data);
  const [activeTab, setActiveTab] =useState('Profile');
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

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleLanguageChange = async (type, value) => {
    try {
      const userInfo = Cookies.get('userInfo');
      if (!userInfo) {
        throw new Error('No authentication token found');
      }

      // Update the user settings in the backend
      await axios.put(`/users/${userData._id}/${type}`, {
        [type]: value,
      }, {
        headers: {
          'Authorization': `Bearer ${JSON.parse(userInfo)._id}`
        }
      });

      // Update userData context
      const updatedUserData = { ...userData, [type]: value };
      setUserData(updatedUserData);

      // Update the userInfo cookie
      const parsedUserInfo = JSON.parse(userInfo);
      parsedUserInfo[type] = value; // Update the specific language setting
      Cookies.set('userInfo', JSON.stringify(parsedUserInfo));

    } catch (error) {
      console.error('Error updating language settings:', error);
    }
  };

  const renderProfileSection = () => (
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
      <section className={settingsStyles.section}>
        <h2>Avatar Upload</h2>
        <AvatarUpload userId={userData._id} />
      </section>
    </div>
  );

  const renderAnimeMangaSection = () => (
    <div className={settingsStyles.content}>
      <section className={settingsStyles.section}>
        <h2>Titles</h2>
        <select
          value={userData.title}
          onChange={(e) => handleLanguageChange('title', e.target.value)}
        >
          <option value="romaji">Romaji (Shingeki no Kyojin)</option>
          <option value="english">English (Attack on Titan)</option>
          <option value="native">Native (進撃の巨人)</option>
        </select>
      </section>
      <section className={settingsStyles.section}>
        <h2>Character Names</h2>
        <select
          value={userData.characterName}
          onChange={(e) => handleLanguageChange('characterName', e.target.value)}
        >
          <option value="romaji-western">Romaji, Western Order (Killua Zoldyck)</option>
          <option value="romaji">Romaji (Zoldyck Killua)</option>
          <option value="native">Native (キルア＝ゾルディック)</option>
        </select>
      </section>
    </div>
  );

  return (
    <div className={settingsStyles.settingsPage}>
      <div className={settingsStyles.sidebar}>
        <h3>Settings</h3>
        <nav>
          <ul>
            <li className={activeTab === 'Profile' ? settingsStyles.active : ''} onClick={() => handleTabChange('Profile')}>Profile</li>
            <li className={activeTab === 'Account' ? settingsStyles.active : ''} onClick={() => handleTabChange('Account')}>Account</li>
            <li className={activeTab === 'Anime&Manga' ? settingsStyles.active : ''} onClick={() => handleTabChange('Anime&Manga')}>Anime & Manga</li>
          </ul>
        </nav>
      </div>

      {activeTab === 'Profile' && renderProfileSection()}
      {activeTab === 'Anime&Manga' && renderAnimeMangaSection()}

    </div>
  );
};

export default Settings;
