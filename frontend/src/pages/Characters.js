import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import CharacterCard from '../cards/CharacterCard';
import SkeletonCard from '../cards/SkeletonCard';
import browseStyles from '../styles/pages/Browse.module.css';
import { useUser } from '../Context/ContextApi';

const CHARACTERS_PER_PAGE = 18;
const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Unknown'];

const Characters = () => {
  const { userData } = useUser();
  const [searchInput, setSearchInput] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const [characters, setCharacters] = useState([]);
  const limit = CHARACTERS_PER_PAGE;

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...(searchInput && { search: searchInput }),
        ...(selectedGender && { gender: selectedGender })
      });

      const response = await axiosInstance.get(`/characters/characters?${params.toString()}`);
      const { characters, total, pages } = response.data;
      setCharacters(characters);
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
  }, [currentPage, searchInput, selectedGender]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleGenderChange = (e) => {
    setSelectedGender(e.target.value);
    setCurrentPage(1); // Reset to first page when changing gender
  };

  const getFullName = (names) => {
    const givenName = names.givenName || '';
    const middleName = names.middleName || '';
    const surName = names.surName || '';
    const nativeName = names.nativeName || '';

    switch (userData.characterName) {
      case 'romaji':
        return [surName, middleName, givenName].filter(Boolean).join(' ') || nativeName;
      case 'romaji-western':
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
      case 'native':
        return nativeName || [givenName, middleName, surName].filter(Boolean).join(' ');
      default:
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
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

    return characters.map((character) => (
      <li key={character._id} className={browseStyles.listItem}>
        <CharacterCard
          character={character}
          title={getFullName(character.names)}
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
            onChange={handleSearch}
            className={browseStyles.searchInput}
          />
        </div>
        <div className={browseStyles.filters}>
          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Gender</h3>
            <select
              className={browseStyles.genreSelect}
              value={selectedGender}
              onChange={handleGenderChange}
            >
              <option value="">All Genders</option>
              {GENDER_OPTIONS.map(gender => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={browseStyles.listContainer}>
        <ul className={browseStyles.list}>
          {renderListItems()}
        </ul>
      </div>

      {totalPages > 1 && (
        <div className={browseStyles.pagination}>
          <button
            className={browseStyles.paginationButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <span className={browseStyles.pageInfo}>
            Page {currentPage} of {totalPages}
          </span>
          <button
            className={browseStyles.paginationButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Characters;
