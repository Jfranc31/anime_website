// src/Components/Searches/CharacterSearch.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import searchStyles from '../../styles/components/search.module.css';

export default function CharacterSearch({ onCharacterSelected, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCharacters, setSelectedCharacters] = useState([]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchCharacters();
      } else {
        setCharacters([]); // Clear results if search is empty
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const searchCharacters = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/characters/searchcharacters', {
        params: { query: searchTerm },
      });
      console.log('Character Data Response: ', response);
      const characterData = response.data.characters || [];
      console.log('Character Data: ', characterData);
      setCharacters(characterData);
    } catch (error) {
      console.error('Error searching characters:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterClick = (character) => {
    setSelectedCharacters((prev) => {
      const isSelected = prev.some((c) => c._id === character._id);
      if (isSelected) {
        return prev.filter((c) => c._id !== character._id);
      } else {
        return [...prev, character];
      }
    });
  };

  const handleConfirmSelection = () => {
    onCharacterSelected(selectedCharacters);
    onClose();
  };

  return (
    <div className={searchStyles.searchModalOverlay}>
      <div className={searchStyles.searchModal}>
        <div className={searchStyles.modalBody}>
          <div className={searchStyles.searchContainer}>
            <h2>Search Characters</h2>
            <div className={searchStyles.searchBox}>
              <input
                id="searchCharacter"
                name="searchCharacter"
                type="text"
                placeholder="Search characters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchStyles.searchInput}
              />
            </div>

            {loading ? (
              <div className={searchStyles.loading}>Searching...</div>
            ) : (
              <div className={searchStyles.itemsGrid}>
                {characters.length === 0 ? (
                  <div className={searchStyles.noResults}>
                    {searchTerm ? 'No characters found' : 'Start typing to search characters'}
                  </div>
                ) : (
                  characters.map((character) => (
                    <div
                      key={character._id}
                      className={`${searchStyles.itemCard} ${selectedCharacters.includes(character) ? searchStyles.selected : ''}`}
                      onClick={() => handleCharacterClick(character)}
                    >
                      <div className={searchStyles.itemImageContainer}>
                        <img
                          src={character.characterImage}
                          alt={`${character.names?.givenName || ''} ${character.names?.middleName || ''} ${character.names?.surName || ''}`}
                          className={searchStyles.itemImage}
                        />
                        {selectedCharacters.includes(character) && (
                          <div className={searchStyles.selectedOverlay}>
                            <span className={searchStyles.checkmark}>✓</span>
                          </div>
                        )}
                      </div>
                      <div className={searchStyles.itemInfo}>
                        <p className={searchStyles.itemName}>
                          {`${character.names?.givenName || 'Unknown'} ${character.names?.middleName || ''} ${character.names?.surName || ''}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            <div className={searchStyles.actionButtons}>
              <button
                className={searchStyles.selectButton}
                onClick={handleConfirmSelection}
                disabled={selectedCharacters.length === 0}
              >
                Select Characters
              </button>
              <button className={searchStyles.cancelButton} onClick={onClose}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
