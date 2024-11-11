// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const AnimeContext = createContext();

export const AnimeProvider = ({ children }) => {
  const [animeList, setAnimeList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAnimeId, setSelectedAnimeId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/animes/animes', {
          withCredentials: true
        });
        setAnimeList(response.data);
      } catch (error) {
        console.error('Error fetching anime list:', error);
        setError('Unable to load anime list. Please try again later.');
        setAnimeList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <AnimeContext.Provider
      value={{
        animeList,
        setAnimeList,
        selectedAnimeId,
        setSelectedAnimeId,
        isLoading,
        error
      }}
    >
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
