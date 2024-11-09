// /src/Component/Characters.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import CharacterCard from '../cards/CharacterCard';
import styles1 from '../styles/pages/Browse.module.css';

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
        <div className={styles1.browseContainer}>
            <div className={styles1.filterContainer}>
                <div className={styles1.searchContainer}>
                    <input
                        type="text"
                        id="searchInput" 
                        name="searchInput"
                        placeholder="Search characters..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className={styles1.searchInput}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className={styles1.loadingContainer}>
                    <div className={styles1.loader}></div>
                </div>
            ) : (
                <div className={styles1.characterListSection}>
                    {sortedCharacter.length === 0 ? (
                        <div className={styles1.noResults}>
                            No characters found matching your criteria
                        </div>
                    ) : (
                        <ul className={styles1.characterList}>
                            {sortedCharacter.map(character => (
                                <li key={character._id} className={styles1.characterListItem}>
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