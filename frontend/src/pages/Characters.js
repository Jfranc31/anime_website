// /src/Component/Characters.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useCharacterContext } from '../Context/CharacterContext';
import CharacterCard from '../cards/CharacterCard';

const Characters = () => {
    const { characterList, setCharacterList, selectedCharacterId, setSelectedCharacterId } = useCharacterContext();
    const [searchInput, setSearchInput] = useState('');

    const [editedCharacter, setEditedCharacter] = useState(null);

    useEffect(() => {
        axios.get('http://localhost:8080/characters')
            .then(response => setCharacterList(response.data))
            .catch(error => console.error(error));
    }, [setCharacterList]);

    const filteredCharacter = Array.isArray(characterList)
    ? characterList.filter(character => {
        const givenName = (character.names && character.names.givenName) || '';
        const matchesSearch = givenName.toLowerCase().includes(searchInput.toLowerCase());
        return matchesSearch;
    })
    : [];

    const sortedCharacter = [...filteredCharacter].sort((a, b) => {
        const aName = a.names && a.names.givenName ? a.names.givenName : '';
        const bName = b.names && b.names.givenName ? b.names.givenName : '';
        return aName.localeCompare(bName);
    });

    const handleDelete = async () => {
        try {
            const response = await fetch(`http://localhost:8080/characters/${selectedCharacterId._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                console.log('Character deleted successfully');
                const res = await axios.get('http://localhost:8080/characters');
                setCharacterList(res.data);
            } else {
                console.error('Failed to delete character:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting character:', error);
        }
    };

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