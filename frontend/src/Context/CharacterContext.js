// src/context/CharacterContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

export const CharacterContext = createContext();

export const CharacterProvider = ({ children }) => {
  const [characterList, setCharacterList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCharacterId, setSelectedCharacterId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axiosInstance.get('/characters/characters');
        setCharacterList(response.data);
      } catch (error) {
        console.error('Error fetching character list:', error);
        setError(error.response?.data?.message || 'Unable to load character list. PLease try again later.');
        setCharacterList([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <CharacterContext.Provider
      value={{
        characterList,
        setCharacterList,
        selectedCharacterId,
        setSelectedCharacterId,
        isLoading,
        error
      }}
    >
      {children}
    </CharacterContext.Provider>
  );
};

export const useCharacterContext = () => {
  const context = useContext(CharacterContext);
  if (!context) {
    throw new Error(
      'useCharacterContext must be used within a CharacterProvider'
    );
  }
  return context;
};
