import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useCharacterContext } from '../Context/CharacterContext';
import data from '../Context/ContextApi';
import CharacterCard from '../cards/CharacterCard';
import SkeletonCard from '../cards/SkeletonCard';
import browseStyles from '../styles/pages/Browse.module.css';
import { useUser } from '../Context/ContextApi';

const CHARACTERS_PER_PAGE = 18;
const DEBOUNCE_DELAY = 300; // ms delay for search debouncing

const Characters = () => {
  const { characterList, setCharacterList } = useCharacterContext();
  const { userData } = useUser();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedAnime, setSelectedAnime] = useState('');
  const [selectedManga, setSelectedManga] = useState('');
  const [showBirthdayToday, setShowBirthdayToday] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCharacters, setTotalCharacters] = useState(0);
  const limit = 20;
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedCharacters, setDisplayedCharacters] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [characters, setCharacters] = useState([]);
  const [error, setError] = useState(null);

  const observer = useRef();
  const filteredCharactersRef = useRef([]);
  const isLoadingRef = useRef(false);
  const debounceTimeout = useRef(null);

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchInput]);

  // Handle character loading transitions
  const handleCharacterLoad = useCallback((characterId) => {
    setLoadingStates(prev => ({
      ...prev,
      [characterId]: true
    }));

    setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
        [characterId]: false
      }));
    }, Math.random() * 300 + 200);
  }, []);

  // Initialize loading states for new characters
  useEffect(() => {
    displayedCharacters.forEach(character => {
      if (loadingStates[character._id] === undefined) {
        handleCharacterLoad(character._id);
      }
    });
  }, [displayedCharacters, handleCharacterLoad, loadingStates]);

  // Initial data fetch
  useEffect(() => {
    setIsInitialLoading(true);
    fetchCharacters();
  }, [currentPage, debouncedSearch, selectedGender, selectedAnime, selectedManga, showBirthdayToday]);

  const fetchCharacters = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(selectedGender && { gender: selectedGender }),
        ...(selectedAnime && { animeId: selectedAnime }),
        ...(selectedManga && { mangaId: selectedManga }),
        ...(showBirthdayToday && { birthdayToday: true })
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
      setIsInitialLoading(false);
    }
  };

  const getFullName = useCallback((names) => {
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
  }, [userData.characterName]);

  const getSortingName = useCallback((names) => {
    const givenName = (names.givenName || '').trim();
    const surName = (names.surName || '').trim();
    const nativeName = (names.nativeName || '').trim();

    if (userData.characterName === 'romaji-western') {
      return (givenName || surName || nativeName).toLowerCase();
    }
    return (surName || givenName || nativeName).toLowerCase();
  }, [userData.characterName]);

  // Filter and sort character list
  const filterAndSortCharacters = useCallback(() => {
    if (!Array.isArray(characterList)) return [];

    return characterList.filter(character => {
      const names = character.names || {};
      const givenName = names.givenName || '';
      const middleName = names.middleName || '';
      const surName = names.surName || '';
      const alterNames = names.alterNames || [];

      const namesToCheck = [
        givenName,
        middleName,
        surName,
        ...(Array.isArray(alterNames) ? alterNames : [alterNames]),
      ].map(name => (typeof name === 'string' ? name : '').toLowerCase());

      return namesToCheck.some(name => name.includes(debouncedSearch.toLowerCase()));
    }).sort((a, b) => {
      const aName = getSortingName(a.names);
      const bName = getSortingName(b.names);
      return aName.localeCompare(bName);
    });
  }, [characterList, debouncedSearch, getSortingName]);

  // Update filtered characters when filters change
  useEffect(() => {
    if (!characterList || isSearching) return;

    setDisplayedCharacters([]); // Clear current display
    filteredCharactersRef.current = filterAndSortCharacters();

    // Load initial batch
    const initialBatch = filteredCharactersRef.current.slice(0, CHARACTERS_PER_PAGE);
    setDisplayedCharacters(initialBatch);
    setHasMore(filteredCharactersRef.current.length > CHARACTERS_PER_PAGE);
  }, [filterAndSortCharacters, characterList, isSearching]);

  // Load more characters
  const loadMoreCharacters = useCallback(() => {
    if (isLoadingRef.current || !hasMore || isSearching) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const currentLength = displayedCharacters.length;
    const nextBatch = filteredCharactersRef.current.slice(
      currentLength,
      currentLength + CHARACTERS_PER_PAGE
    );

    setTimeout(() => {
      setDisplayedCharacters(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + CHARACTERS_PER_PAGE < filteredCharactersRef.current.length);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 500);
  }, [displayedCharacters.length, hasMore, isSearching]);

  // Intersection Observer setup
  const lastCharacterElementRef = useCallback(node => {
    if (isLoadingMore || isSearching) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreCharacters();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMoreCharacters, isSearching]);

  // Render list items with transitions
  const renderListItems = () => {
    const items = [];

    displayedCharacters.forEach((character, index) => {
      const isLoading = loadingStates[character._id];
      items.push(
        <li
          key={character._id}
          ref={index === displayedCharacters.length - 1 ? lastCharacterElementRef : null}
          className={`${browseStyles.listItem} ${isLoading ? browseStyles.loading : browseStyles.loaded}`}
        >
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <div className={browseStyles.fadeIn}>
              <CharacterCard
                character={character}
                name={getFullName(character.names)}
                setCharacterList={setCharacterList}
              />
            </div>
          )}
        </li>
      );
    });

    if ((isLoadingMore || isSearching) && hasMore) {
      for (let i = 0; i < 4; i++) {
        items.push(
          <li key={`skeleton-more-${i}`} className={`${browseStyles.listItem} ${browseStyles.loading}`}>
            <SkeletonCard />
          </li>
        );
      }
    }

    return items;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>
        <div className={browseStyles.searchContainer}>
          <input
            type="text"
            id="searchInput"
            name="searchInput"
            placeholder="Search characters..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
        <div className={browseStyles.filters}>
          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Gender</h3>
            <select
              value={selectedGender}
              onChange={(e) => {
                setSelectedGender(e.target.value);
                setCurrentPage(1); // Reset to first page when changing filter
              }}
              className={browseStyles.filterSelect}
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Unknown">Unknown</option>
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Appears in Anime</h3>
            <select
              value={selectedAnime}
              onChange={(e) => {
                setSelectedAnime(e.target.value);
                setCurrentPage(1);
              }}
              className={browseStyles.filterSelect}
            >
              <option value="">All Anime</option>
              {/* You'll need to fetch and map available anime here */}
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Appears in Manga</h3>
            <select
              value={selectedManga}
              onChange={(e) => {
                setSelectedManga(e.target.value);
                setCurrentPage(1);
              }}
              className={browseStyles.filterSelect}
            >
              <option value="">All Manga</option>
              {/* You'll need to fetch and map available manga here */}
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Birthday</h3>
            <div className={browseStyles.filterOptions}>
              <label className={browseStyles.filterOption}>
                <input
                  type="checkbox"
                  checked={showBirthdayToday}
                  onChange={(e) => {
                    setShowBirthdayToday(e.target.checked);
                    setCurrentPage(1);
                  }}
                />
                Show characters with birthday today
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className={browseStyles.listSection}>
        {displayedCharacters.length === 0 && !isInitialLoading && !isLoadingMore && !isSearching ? (
          <div className={browseStyles.noResults}>
            No characters found matching your criteria
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
          className={browseStyles.paginationButton}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
          className={browseStyles.paginationButton}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Characters;
