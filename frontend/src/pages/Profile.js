import React, { useContext } from 'react';
import axios from 'axios';
import profileStyles from '../styles/pages/Profile.module.css';
import { useTheme } from '../Context/ThemeContext';
import data from '../Context/ContextApi';

const Profile = () => {
  const { userData } = useContext(data);

  return (
    <div className={profileStyles.profilePage}>
      <div className={profileStyles.profileHeader}>
        <h1>Profile Page</h1>
      </div>
    </div>
  );
};

export default Profile;
