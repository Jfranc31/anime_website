import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import searchStyles from '../../styles/components/search.module.css';

export const MangaSearch = ({ onMangaSelected, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); 

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/mangas/create-from-anilist', {
        title: searchTerm
      });

      console.log('MangaSearch - API Response:', response.data);

      if (response.data.manga) {
        console.log('MangaSearch - Existing Manga:', response.data.manga);
        onMangaSelected(response.data.manga);
      } else {
        console.log('MangaSearch - New Manga Data:', response.data);
        onMangaSelected(response.data);
      }
      onClose();
    } catch (error) {
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error searching manga'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={searchStyles.searchModalOverlay}>
      <div className={searchStyles.searchModal}>
        <div className={searchStyles.modalBody}>
          <div className={searchStyles.searchContainer}>
            <h2>Search Manga on AniList</h2>
            <form id="searchManga" onSubmit={handleSearch}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Enter manga title..."
              className={searchStyles.searchInput}
              />
            </form>
            {error && <p className={searchStyles.error}>{error}</p>}
            <div className={searchStyles.actionButtons}>
              <button form="searchManga" type="submit" disabled={loading} className={searchStyles.selectButton}>
                {loading ? 'Searching...' : 'Search'}
              </button>
              <button onClick={onClose} className={searchStyles.cancelButton}>Cancel</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};