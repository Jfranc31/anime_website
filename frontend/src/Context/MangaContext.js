// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

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
        // First get total count
        const countResponse = await axiosInstance.get('/mangas/mangas?page=1&limit=1');
        const totalItems = countResponse.data.totalItems || 0;
        
        // Then fetch all items
        const response = await axiosInstance.get(`/mangas/mangas?page=1&limit=${totalItems}`);
        setMangaList(response.data.mangas || []);
      } catch (error) {
        console.error('Error fetching manga list:', error);
        setError(error.response?.data?.message || 'Unable to load manga list. Please try again later.');
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
