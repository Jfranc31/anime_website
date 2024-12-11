import React, { useState } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import searchStyles from '../../styles/components/search.module.css';

export const AnilistCharacterSearch = ({ onCharacterSelected, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post(`/characters/create-from-anilist`, {
        name: searchTerm
      });

      console.log('AnilistCharacterSearch - API Response:', response.data);

      setSearchResults(response.data);

    } catch (error) {
      console.error('Search error:', error);
      setError(
        error.response?.data?.message || 
        error.response?.data?.error || 
        error.message || 
        'Error searching character'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (character) => {
    setSelectedCharacter(selectedCharacter?.anilistId === character.anilistId ? null : character);
  };

  const handleSubmit = () => {
    if (selectedCharacter) {
      onCharacterSelected(selectedCharacter);
      onClose();
    }
  };

  const getFullName = (names) => {
    const nameParts = [];
    if (names.givenName) nameParts.push(names.givenName);
    if (names.middleName) nameParts.push(names.middleName);
    if (names.surName) nameParts.push(names.surName);
    return nameParts.join(' ');
  };

  return (
    <div className={searchStyles.searchModalOverlay}>
      <div className={searchStyles.searchModal}>
        <div className={searchStyles.modalBody}>
          <div className={searchStyles.searchContainer}>
          <h2>Search Character on AniList</h2>
            <div className={searchStyles.searchBox}>
              <form id="searchCharacter" onSubmit={handleSearch} className={searchStyles.searchForm}>
                <input
                  type="text"
                  value={searchTerm}
                  id="searchCharacter"
                  name="searchCharacter"
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter character name..."
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
                {searchResults.map(character => (
                  <div 
                    key={character.anilistId} 
                    className={`${searchStyles.itemCard} ${selectedCharacter?.anilistId === character.anilistId ? searchStyles.selected : ''}`}
                    onClick={() => handleSelect(character)}
                  >
                    <div className={searchStyles.itemImageContainer}>
                      <img 
                        src={character.characterImage} 
                        alt={character.names.givenName || character.names.romaji}
                        className={searchStyles.itemImage}
                      />
                      {selectedCharacter?.anilistId === character.anilistId && (
                        <div className={searchStyles.selectedOverlay}>
                          <span className={searchStyles.checkmark}>✓</span>
                        </div>
                      )}
                    </div>
                    <div className={searchStyles.itemInfo}>
                      <p 
                        className={searchStyles.itemName} 
                      >
                        {getFullName(character.names) || getFullName(character.names)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className={searchStyles.actionButtons}>
              <button 
                onClick={handleSubmit}
                disabled={!selectedCharacter || loading}
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