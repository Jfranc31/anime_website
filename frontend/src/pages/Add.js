// /src/pages/AddSection.js
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddAnime from '../pages/AddAnime';
import AddManga from '../pages/AddManga';
import AddNavbar from '../Components/Navbars/AddNavbar';

const AddSection = () => {
  return (
    <div>
      <AddNavbar />
      <Routes>
        <Route path="/" element={<Navigate to="anime" />} />
        <Route path="anime" element={<AddAnime />} />
        <Route path="manga" element={<AddManga />} />
      </Routes>
    </div>
  );
};

export default AddSection;

