// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

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
        // First get total count
        const countResponse = await axiosInstance.get('/animes/animes?page=1&limit=1');
        const totalItems = countResponse.data.totalItems || 0;
        
        // Then fetch all items
        const response = await axiosInstance.get(`/animes/animes?page=1&limit=${totalItems}`);
        setAnimeList(response.data.animes || []);
      } catch (error) {
        console.error('Error fetching anime list:', error);
        setError(error.response?.data?.message || 'Unable to load anime list. Please try again later.');
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
