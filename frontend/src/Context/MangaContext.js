// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

export const MangaContext = createContext();

export const MangaProvider = ({ children }) => {
  const [mangaList, setMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedMangaId, setSelectedMangaId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await axios.get('/mangas/mangas', {
          withCredentials: true
        });
        setMangaList(response.data);
      } catch (error) {
        console.error('Error fetching manga list:', error);
        setError('Unable to load manga list. Please try again later.');
        setMangaList([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <MangaContext.Provider
      value={{
        mangaList,
        setMangaList,
        selectedMangaId,
        setSelectedMangaId,
        isLoading,
        error
      }}
    >
      {children}
    </MangaContext.Provider>
  );
};

export const useMangaContext = () => {
  const context = useContext(MangaContext);
  if (!context) {
    throw new Error('useMangaContext must be used within a MangaProvider');
  }
  return context;
};
