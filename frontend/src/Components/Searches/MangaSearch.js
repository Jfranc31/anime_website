import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import searchStyles from '../../styles/components/search.module.css';

export const MangaSearch = ({ onMangaSelected, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedManga, setSelectedManga] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('/mangas/create-from-anilist', {
        title: searchTerm
      });

      console.log('MangaSearch - API Response:', response.data);

      setSearchResults(response.data);

    } catch (error) {
      console.error('Search error:', error);
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

  const handleSelect = (manga) => {
    setSelectedManga(selectedManga?.anilistId === manga.anilistId ? null : manga);
  };

  const handleSubmit = () => {
    if (selectedManga) {
      onMangaSelected(selectedManga);
      onClose();
    }
  };

  return (
    <div className={searchStyles.searchModalOverlay}>
      <div className={searchStyles.searchModal}>
        <div className={searchStyles.modalBody}>
          <div className={searchStyles.searchContainer}>
            <h2>Search Manga on AniList</h2>
            <div className={searchStyles.searchBox}>
              <form id='searchManga' onSubmit={handleSearch} className={searchStyles.searchForm}>
                <input
                  type='text'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder='Enter manga title...'
                  className={searchStyles.searchInput}
                />
                <button
                  type='submit'
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
                {searchResults.map(manga => (
                  <div
                    key={manga.anilistId}
                    className={`${searchStyles.itemCard} ${selectedManga?.anilistId === manga.anilistId ? searchStyles.selected : ''}`}
                    onClick={() => handleSelect(manga)}
                  >
                    <div className={searchStyles.itemImageContainer}>
                      <img
                        src={manga.images.image}
                        alt={manga.titles.english || manga.titles.romaji}
                        className={searchStyles.itemImage}
                      />
                      {selectedManga?.anilistId === manga.anilistId && (
                        <div className={searchStyles.selectedOverlay}>
                          <span className={searchStyles.checkmark}>✓</span>
                        </div>
                      )}
                    </div>
                    <div className={searchStyles.itemInfo}>
                      <p
                        className={searchStyles.itemName}
                      >
                        {manga.titles.english || manga.titles.romaji}
                      </p>
                      <div className={searchStyles.itemMeta}>
                        {[
                          { key: 'format', content: manga.typings.Format },
                          { key: 'dot', content: '•' },
                          { key: 'year', content: manga.releaseData.startDate.year }
                        ].map(item => (
                          <span key={`${manga.anilistId}-${item.key}`}>{item.content}</span>
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
                disabled={!selectedManga || loading}
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