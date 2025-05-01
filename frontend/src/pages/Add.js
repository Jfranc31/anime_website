// /src/pages/AddSection.js
import React, { useContext, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AddAnime from './AddAnime';
import AddManga from './AddManga';
import AddNavbar from '../Components/Navbars/AddNavbar';
import '../styles/components/add_navbar.module.css';
import { useUser } from '../Context/ContextApi';
import axiosInstance from '../utils/axiosConfig';
import styles from '../styles/pages/Add.module.css';

const AddSection = () => {
  const { userData } = useUser();
  const [formData, setFormData] = useState({
    title: '',
    type: 'anime',
    description: '',
    genres: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userData?._id) return;

    try {
      setLoading(true);
      setError(null);
      await axiosInstance.post(`/users/${userData._id}/add`, formData);
      setSuccess('Content added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add content');
    } finally {
      setLoading(false);
    }
  };

  if (!userData || userData.role !== 'admin') {
    return <Navigate to="/" />;
  }

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
