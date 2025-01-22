// /src/Component/Characters.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import data from '../Context/ContextApi';
import CharacterCard from '../cards/CharacterCard';
import browseStyles from '../styles/pages/Browse.module.css';

const Characters = () => {
  const { characterList, setCharacterList } = useCharacterContext();
  const { userData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    axios
      .get('http://localhost:8080/characters/characters')
      .then((response) => {
        setCharacterList(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [setCharacterList]);

  const filteredCharacter = Array.isArray(characterList)
    ? characterList.filter((character) => {
        const names = character.names || {};
        const givenName = names.givenName || '';
        const middleName = names.middleName || '';
        const surName = names.surName || '';
        const alterNames = names.alterNames || [];

        // Convert names to strings if they are not already
        const namesToCheck = [
          givenName,
          middleName,
          surName,
          ...(Array.isArray(alterNames) ? alterNames : [alterNames]),
        ].map(name => (typeof name === 'string' ? name : '').toLowerCase());

        const matchesSearch = namesToCheck.some(name => name.includes(searchInput.toLowerCase()));

        return matchesSearch;
      })
    : [];

    const getFullName = (names) => {
      switch (userData.characterName) {
        case 'romaji':
          return `${names.givenName} ${names.surName}`;
        case 'romaji-western':
          return `${names.surName} ${names.givenName}`;
        case 'native':
          return `${names.nativeName || ''}`;
        default:
          return `${names.givenName} ${names.surName}`;
      }
    };

  const sortedCharacter = [...filteredCharacter].sort((a, b) => {
    const aFullName = getFullName(a.names);
    const bFullName = getFullName(b.names);
    return aFullName.localeCompare(bFullName);
  });

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

      {isLoading ? (
        <div className={browseStyles.loadingContainer}>
          <div className={browseStyles.loader}></div>
        </div>
      ) : (
        <div className={browseStyles.listSection}>
          {sortedCharacter.length === 0 ? (
            <div className={browseStyles.noResults}>
              No characters found matching your criteria
            </div>
          ) : (
            <ul className={browseStyles.list}>
              {sortedCharacter.map((character) => (
                <li key={character._id} className={browseStyles.listItem}>
                  <CharacterCard
                    character={character}
                    name={getFullName(character.names)}
                    setCharacterList={setCharacterList}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default Characters;
