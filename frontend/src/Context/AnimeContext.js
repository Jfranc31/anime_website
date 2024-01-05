// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

export const AnimeContext = createContext();

export const AnimeProvider = ({ children }) => {
  const [animeList, setAnimeList] = useState([]);
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {

        // Fetch data from your API
        const response = await fetch('http://localhost:8080/animes', {
          credentials: 'include',
        });

        const data = await response.json();

        // Update the animeList in the context
        setAnimeList(data);

      } catch (error) {
        console.error('Error fetching anime list:', error);
      }
    };

    fetchData();
  }, []);

  return (
    <AnimeContext.Provider value={{
      animeList,
      setAnimeList,
      selectedAnimeId,
      setSelectedAnimeId
    }}>
      {children}
    </AnimeContext.Provider>
  );
};

export const useAnimeContext = () => {
  const context = useContext(AnimeContext);

  if (!context) {
    throw new Error('useAnimeContext must be used within an AnimeProvider');
  }

  return context;
};