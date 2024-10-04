// src/context/CharacterContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

export const CharacterContext = createContext();

export const CharacterProvider = ({ children }) => {
    const [characterList, setCharacterList] = useState([]);
    const [selectedCharacterId, setSelectedCharacterId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // fetch data from your API
                const response = await fetch('http://localhost:8080/characters/characters', {
                    credentials: 'include',
                });

                const data = await response.json();

                // Update the characterList in the context
                setCharacterList(data);
            } catch (error) {
                console.error('Error fetching character list:', error);
            }
        };
        fetchData();
    }, []);

    return (
        <CharacterContext.Provider value={{
            characterList,
            setCharacterList,
            selectedCharacterId,
            setSelectedCharacterId
        }}>
            {children}
        </CharacterContext.Provider>
    );
};

export const useCharacterContext = () => {
    const context = useContext(CharacterContext);
    if(!context) {
        throw new Error('useCharacterContext must be used within a CharacterProvider');
    }
    return context;
}