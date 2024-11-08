// /src/pages/AddSection.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddAnime from './AddAnime';
import AddManga from './AddManga';
import AddNavbar from '../Components/Navbars/AddNavbar';
import '../styles/components/add_navbar.module.css';

const AddSection = () => {
  return (
    <div className="add-page">
      <AddNavbar />
      <div className="add-content">
        <Routes>
          <Route path="/" element={<Navigate to="anime" />} />
          <Route path="anime" element={<AddAnime />} />
          <Route path="manga" element={<AddManga />} />
        </Routes>
      </div>
    </div>
  );
};

export default AddSection;

