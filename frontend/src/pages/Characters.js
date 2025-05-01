import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useCharacterContext } from '../Context/CharacterContext';
import CharacterCard from '../cards/CharacterCard';
import SkeletonCard from '../cards/SkeletonCard';
import browseStyles from '../styles/pages/Browse.module.css';
import { useUser } from '../Context/ContextApi';

const Characters = () => {
  const { characterList, setCharacterList } = useCharacterContext();
  const { user } = useUser();
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const limit = 20;

  const characterName = useCallback((names) => {
    if (!names) return 'Unknown Name';
    switch (user?.preferences?.characterName) {
      case 'romaji':
        return [names.givenName, names.middleName, names.surName].filter(Boolean).join(' ') || names.nativeName;
      case 'romaji-western':
        return [names.surName, names.middleName, names.givenName].filter(Boolean).join(' ') || names.nativeName;
      case 'native':
        return names.nativeName || [names.givenName, names.middleName, names.surName].filter(Boolean).join(' ');
      default:
        return [names.givenName, names.middleName, names.surName].filter(Boolean).join(' ') || names.nativeName;
    }
  }, [user?.preferences?.characterName]);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/characters/characters?page=${currentPage}&limit=${limit}`);
      const { characters, total, pages } = response.data;
      setCharacterList(characters);
      setTotalPages(pages);
      setTotalCharacters(total);
      setError(null);
    } catch (err) {
      console.error('Error fetching characters:', err);
      setError('Failed to fetch characters');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCharacters();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderListItems = () => {
    if (loading) {
      return Array(limit).fill(0).map((_, index) => (
        <li key={index} className={browseStyles.listItem}>
          <SkeletonCard />
        </li>
      ));
    }

    return characterList.map((character) => (
      <li key={character._id} className={browseStyles.listItem}>
        <CharacterCard
          character={character}
          name={characterName(character.names)}
        />
      </li>
    ));
  };

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>
        <div className={browseStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search characters..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
      </div>

      <div className={browseStyles.listSection}>
        {characterList.length === 0 && !loading ? (
          <div className={browseStyles.noResults}>
            No characters found
          </div>
        ) : (
          <div className={browseStyles.listContainer}>
            <ul className={browseStyles.list}>
              {renderListItems()}
            </ul>
          </div>
        )}
      </div>

      <div className={browseStyles.pagination}>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Characters;
