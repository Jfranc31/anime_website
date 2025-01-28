import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import data from '../Context/ContextApi';
import CharacterCard from '../cards/CharacterCard';
import browseStyles from '../styles/pages/Browse.module.css';
import Loader from '../constants/Loader';

const CHARACTERS_PER_PAGE = 20;
const LOAD_DELAY = 1000; // 500ms delay for smoother loading

const Characters = () => {
  const { characterList, setCharacterList } = useCharacterContext();
  const { userData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedCharacters, setDisplayedCharacters] = useState([]);
  const observer = useRef();
  const timeoutRef = useRef();

  useEffect(() => {
    setIsInitialLoading(true);
    axios
      .get('http://localhost:8080/characters/characters')
      .then((response) => {
        setCharacterList(response.data);
        setIsInitialLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsInitialLoading(false);
      });

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setCharacterList]);

  const filterCharacters = useCallback((characters) => {
    if (!Array.isArray(characters)) return [];

    return characters.filter((character) => {
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

      return namesToCheck.some(name => name.includes(searchInput.toLowerCase()));
    });
  }, [searchInput]);

  const getSortingName = useCallback((names) => {
    const givenName = (names.givenName || '').trim();
    const surName = (names.surName || '').trim();
    const nativeName = (names.nativeName || '').trim();

    if (userData.characterName === 'romaji-western') {
      return (surName || givenName || nativeName).toLowerCase();
    }
    return (givenName || surName || nativeName).toLowerCase();
  }, [userData.characterName]);

  const getFullName = useCallback((names) => {
    const givenName = names.givenName || '';
    const middleName = names.middleName || '';
    const surName = names.surName || '';
    const nativeName = names.nativeName || '';

    switch (userData.characterName) {
      case 'romaji':
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
      case 'romaji-western':
        return [surName, middleName, givenName].filter(Boolean).join(' ') || nativeName;
      case 'native':
        return nativeName || [givenName, middleName, surName].filter(Boolean).join(' ');
      default:
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
    }
  }, [userData.characterName]);

  useEffect(() => {
    const loadMoreCharacters = () => {
      const filtered = filterCharacters(characterList);
      const sorted = [...filtered].sort((a, b) => {
        const aName = getSortingName(a.names);
        const bName = getSortingName(b.names);
        return aName.localeCompare(bName);
      });

      setDisplayedCharacters(sorted.slice(0, page * CHARACTERS_PER_PAGE));
      setHasMore(sorted.length > page * CHARACTERS_PER_PAGE);

      timeoutRef.current = setTimeout(() => {
        setIsLoadingMore(false);
      }, LOAD_DELAY);
    };

    setIsLoadingMore(true);
    loadMoreCharacters();
  }, [characterList, page, searchInput, filterCharacters, getSortingName]);

  const lastCharacterElementRef = useCallback(node => {
    if (isLoadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  useEffect(() => {
    setPage(1);
  }, [searchInput]);

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
      </div>

      <div className={browseStyles.listSection}>
        {displayedCharacters.length === 0 && !isInitialLoading ? (
          <div className={browseStyles.noResults}>
            No characters found matching your criteria
          </div>
        ) : (
          <>
            <ul className={browseStyles.list}>
              {displayedCharacters.map((character, index) => (
                <li
                  key={character._id}
                  className={`${browseStyles.listItem} ${index >= displayedCharacters.length - CHARACTERS_PER_PAGE && isLoadingMore ? browseStyles.fadeIn : ''}`}
                  ref={index === displayedCharacters.length - 1 ? lastCharacterElementRef : null}
                >
                  <CharacterCard
                    character={character}
                    name={getFullName(character.names)}
                    setCharacterList={setCharacterList}
                  />
                </li>
              ))}
            </ul>
            {isLoadingMore && hasMore && (
              <div className={browseStyles.loadingMore}>
                <Loader />
              </div>
            )}
          </>
        )}
        {isInitialLoading && (
          <div className={browseStyles.loadingContainer}>
            <Loader />
          </div>
        )}
      </div>
    </div>
  );
};

export default Characters;
