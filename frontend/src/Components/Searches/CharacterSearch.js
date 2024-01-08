// src/Components/Searches/CharacterSearch.js

import React, { useState, useEffect } from "react";
import axios from 'axios';

export default function CharacterSearch({ onCharacterSelected, onClose }) {
    const [characters, setCharacters] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCharacters, setSelectedCharacters] = useState([]);

    const handleSearch = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/searchcharacters?query=${searchQuery}`);
            const charactersArray = response.data.characters;

            if (Array.isArray(charactersArray)) {
                setCharacters(charactersArray);
            } else {
                console.error('Invalid response data:', response.data);
            }
        } catch (error) {
            console.error('Error fetching characters:', error.message);
        }
    };

    const handleCharacterClick = (character) => {
        setSelectedCharacters((prevSelected) => {
            if (prevSelected.includes(character)) {
                return prevSelected.filter((selected) => selected !== character);
            } else {
                return [...prevSelected, character];
            }
        });
    };

    const handleConfirmSelection = () => {
        onCharacterSelected(selectedCharacters);
        onClose();
    };

    return (
        <div className="character-search">
            <div>
                <input
                    type="text"
                    placeholder="Search characters..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch}>Search</button>
            </div>
            <div className="character-cards">
                {characters.map((character) => (
                    <li 
                        key={character._id} 
                        className={`character-card ${selectedCharacters.includes(character) ? 'selected' : ''}`}
                        onClick={() => handleCharacterClick(character)}
                    >
                        <div className="img-container">
                            <img src={character.characterImage} alt={character.names.givenName} />
                            <div className="character-name">
                                {character.names.givenName} {character.names.middleName} {character.names.surName}
                            </div>
                        </div>
                    </li>
                ))}
            </div>
            <button onClick={handleConfirmSelection}>Confirm Selection</button>
        </div>
    );
}


  