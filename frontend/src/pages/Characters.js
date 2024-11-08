// /src/Component/Characters.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import CharacterCard from '../cards/CharacterCard';

const Characters = () => {
    const { characterList, setCharacterList } = useCharacterContext();
    const [searchInput, setSearchInput] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        axios.get('http://localhost:8080/characters/characters')
            .then(response => {
                setCharacterList(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error(error);
                setIsLoading(false);
            });
    }, [setCharacterList]);

    const filteredCharacter = Array.isArray(characterList)
    ? characterList.filter(character => {
        const givenName = (character.names && character.names.givenName) || '';
        const middleName = (character.names && character.names.middleName) || '';
        const surName = (character.names && character.names.surName) || '';
        const alterName = (character.names && character.names.alterNames) || '';

        const matchesSearch =
            givenName.toLowerCase().includes(searchInput.toLowerCase()) ||
            middleName.toLowerCase().includes(searchInput.toLowerCase()) ||
            surName.toLowerCase().includes(searchInput.toLowerCase()) ||
            alterName.toLowerCase().includes(searchInput.toLowerCase());

        return matchesSearch;
        })
    : [];


    const sortedCharacter = [...filteredCharacter].sort((a, b) => {
        const aName = a.names && a.names.givenName ? a.names.givenName : '';
        const bName = b.names && b.names.givenName ? b.names.givenName : '';
        return aName.localeCompare(bName);
    });

    return (
        <div className="browse-container">
            <div className="filter-container">
                <div className="search-container">
                    <input
                        type="text"
                        id="searchInput" 
                        name="searchInput"
                        placeholder="Search characters..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="search-input"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="character-list-section">
                    {sortedCharacter.length === 0 ? (
                        <div className="no-results">
                            No characters found matching your criteria
                        </div>
                    ) : (
                        <ul className="character-list">
                            {sortedCharacter.map(character => (
                                <li key={character._id} className="character-list-item">
                                    <CharacterCard
                                        character={character}
                                        setCharacterList={setCharacterList}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {/* Modal component */}
        </div>
    );
};

export default Characters;