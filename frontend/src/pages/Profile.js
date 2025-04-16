import React, { useContext } from 'react';
import profileStyles from '../styles/pages/Profile.module.css';
import data from '../Context/ContextApi';
import ProfileNavigation from '../Components/Navbars/ProfileNavbar';
import '../styles/components/add_navbar.module.css';
import AnimeProfile from './AnimeProfile';
import MangaProfile from './MangaProfile';
import Stats from './StatsProfile';
import Overview from './OverviewProfile';
import { Routes, Route, Navigate } from 'react-router-dom'

const Profile = () => {
  const { userData } = useContext(data);

  if (!userData) {
    return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
  }

  return (
    <div className="add-page">
      <ProfileNavigation />
      <div className="add-content">
        <Routes>
          <Route path="/" element={<Navigate to="overview" />} />
          <Route path="overview" element={<Overview />} />
          <Route path="animeProfile" element={<AnimeProfile />} />
          <Route path="mangaProfile" element={<MangaProfile />} />
          <Route path="stats" element={<Stats />} />
        </Routes>
      </div>
    </div>
  );
};

export default Profile;