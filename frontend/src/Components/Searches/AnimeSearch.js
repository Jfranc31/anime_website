import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import searchStyles from '../../styles/components/search.module.css';

export const AnimeSearch = ({ onAnimeSelected, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/animes/create-from-anilist', {
        title: searchTerm
      });
      
      console.log('AnimeSearch - API Response:', response.data);
      
      if (response.data.anime) {
        console.log('AnimeSearch - Existing Anime:', response.data.anime);
        onAnimeSelected(response.data.anime);
      } else {
        console.log('AnimeSearch - New Anime Data:', response.data);
        onAnimeSelected(response.data);
      }
      onClose();
    } catch (error) {
      console.error('Search error:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error searching anime'
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
            <h2>Search Anime on AniList</h2>
            <form id="searchAnime" onSubmit={handleSearch}>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter anime title..."
                className={searchStyles.searchInput}
              />
            </form>
            {error && <p className={searchStyles.error}>{error}</p>}
            <div className={searchStyles.actionButtons}>
              <button form="searchAnime" type="submit" disabled={loading} className={searchStyles.selectButton}>
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