// /src/Component/Characters.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import CharacterCard from '../cards/CharacterCard';

const Characters = () => {
    const { characterList, setCharacterList } = useCharacterContext();
    const [searchInput, setSearchInput] = useState('');

    useEffect(() => {
        axios.get('http://localhost:8080/characters/characters')
            .then(response => setCharacterList(response.data))
            .catch(error => console.error(error));
    }, [setCharacterList]);

    const filteredCharacter = Array.isArray(characterList)
        ? characterList.filter(character => {
            const givenName = 
                (character.names && character.names.givenName) || '';
            const middleName = 
                (character.names && character.names.middleName) || '';
            const surName = 
                (character.names && character.names.surName) || '';
            const alterName = 
                (character.names && character.names.alterNames) || '';

            const searchInputLower = searchInput.toLowerCase();

            const matchesSearch =
                givenName.toLowerCase().includes(searchInputLower) ||
                middleName.toLowerCase().includes(searchInputLower) ||
                surName.toLowerCase().includes(searchInputLower) ||
                alterName.toLowerCase().includes(searchInputLower);

            return matchesSearch;
            })
        : [];



    const sortedCharacter = [...filteredCharacter].sort((a, b) => {
        const aName = a.names && a.names.givenName ? a.names.givenName : '';
        const bName = b.names && b.names.givenName ? b.names.givenName : '';
        return aName.localeCompare(bName);
    });

    return (
        <div className='browse-container'>
            <div className='filter-container'>
                <div className='search-container'>
                    <input
                        type="text"
                        id="searchInput" 
                        name="searchInput"
                        placeholder="Search..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
            </div>
            <ul className='anime-list'>
                {sortedCharacter.map(character => (
                    <li key={character._id}>
                        <CharacterCard
                            character={character}
                            setCharacterList={setCharacterList}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Characters;