import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import searchStyles from '../../styles/components/search.module.css';

export const AnimeSearch = ({ onAnimeSelected, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedAnime, setSelectedAnime] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/animes/create-from-anilist', {
        title: searchTerm
      });
      
      console.log('AnimeSearch - API Response:', response.data);
      
      setSearchResults(response.data);
      
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

  const handleSelect = (anime) => {
    setSelectedAnime(selectedAnime?.anilistId === anime.anilistId ? null : anime);
  };

  const handleSubmit = () => {
    if (selectedAnime) {
      onAnimeSelected(selectedAnime);
      onClose();
    }
  };

  return (
    <div className={searchStyles.searchModalOverlay}>
      <div className={searchStyles.searchModal}>
        <div className={searchStyles.modalBody}>
          <div className={searchStyles.searchContainer}>
            <h2>Search Anime on AniList</h2>
            <div className={searchStyles.searchBox}>
              <form id="searchAnime" onSubmit={handleSearch} className={searchStyles.searchForm}>
                <input
                  type="text"
                  id="animeTitle"
                  name="animeTitle"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter anime title..."
                  className={searchStyles.searchInput}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  className={searchStyles.searchButton}
                >
                  {loading ? 'Searching...' : 'Search'}
                </button>
              </form>
            </div>

            {error && (
              <p className={searchStyles.error}>{error}</p>
            )}

            {searchResults.length > 0 && (
              <div className={searchStyles.itemsGrid}>
                {searchResults.map(anime => (
                  <div 
                    key={anime.anilistId} 
                    className={`${searchStyles.itemCard} ${selectedAnime?.anilistId === anime.anilistId ? searchStyles.selected : ''}`}
                    onClick={() => handleSelect(anime)}
                  >
                    <div className={searchStyles.itemImageContainer}>
                      <img 
                        src={anime.images.image} 
                        alt={anime.titles.english || anime.titles.romaji}
                        className={searchStyles.itemImage}
                      />
                      {selectedAnime?.anilistId === anime.anilistId && (
                        <div className={searchStyles.selectedOverlay}>
                          <span className={searchStyles.checkmark}>✓</span>
                        </div>
                      )}
                    </div>
                    <div className={searchStyles.itemInfo}>
                      <p 
                        className={searchStyles.itemName} 
                      >
                        {anime.titles.english || anime.titles.romaji}
                      </p>
                      <div className={searchStyles.itemMeta}>
                        {[
                          { key: 'format', content: anime.typings.Format },
                          { key: 'dot', content: '•' },
                          { key: 'year', content: anime.releaseData.startDate.year }
                        ].map(item => (
                          <span key={`${anime.anilistId}-${item.key}`}>{item.content}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={searchStyles.actionButtons}>
              <button 
                onClick={handleSubmit}
                disabled={!selectedAnime || loading}
                className={searchStyles.selectButton}
              >
                Select
              </button>
              <button 
                onClick={onClose} 
                className={searchStyles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 