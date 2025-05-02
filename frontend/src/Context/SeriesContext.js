import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';

const SeriesContext = createContext();

export const SeriesProvider = ({ children }) => {
  const [animes, setAnimes] = useState([]);
  const [mangas, setMangas] = useState([]);
  const [characters, setCharacters] = useState([]);
  const [loading, setLoading] = useState({
    animes: true,
    mangas: true,
    characters: true
  });
  const [error, setError] = useState({
    animes: null,
    mangas: null,
    characters: null
  });

  const fetchAllAnimes = async () => {
    try {
      setLoading(prev => ({ ...prev, animes: true }));
      const response = await axiosInstance.get('/animes/all');
      setAnimes(response.data);
      setError(prev => ({ ...prev, animes: null }));
    } catch (err) {
      console.error('Error fetching all animes:', err);
      setError(prev => ({ ...prev, animes: 'Failed to fetch animes' }));
    } finally {
      setLoading(prev => ({ ...prev, animes: false }));
    }
  };

  const fetchAllMangas = async () => {
    try {
      setLoading(prev => ({ ...prev, mangas: true }));
      const response = await axiosInstance.get('/mangas/all');
      setMangas(response.data);
      setError(prev => ({ ...prev, mangas: null }));
    } catch (err) {
      console.error('Error fetching all mangas:', err);
      setError(prev => ({ ...prev, mangas: 'Failed to fetch mangas' }));
    } finally {
      setLoading(prev => ({ ...prev, mangas: false }));
    }
  };

  const fetchAllCharacters = async () => {
    try {
      setLoading(prev => ({ ...prev, characters: true }));
      const response = await axiosInstance.get('/characters/all');
      setCharacters(response.data);
      setError(prev => ({ ...prev, characters: null }));
    } catch (err) {
      console.error('Error fetching all characters:', err);
      setError(prev => ({ ...prev, characters: 'Failed to fetch characters' }));
    } finally {
      setLoading(prev => ({ ...prev, characters: false }));
    }
  };

  useEffect(() => {
    fetchAllAnimes();
    fetchAllMangas();
    fetchAllCharacters();
  }, []);

  const value = {
    animes,
    mangas,
    characters,
    loading,
    error,
    refreshAnimes: fetchAllAnimes,
    refreshMangas: fetchAllMangas,
    refreshCharacters: fetchAllCharacters
  };

  return (
    <SeriesContext.Provider value={value}>
      {children}
    </SeriesContext.Provider>
  );
};

export const useSeries = () => {
  const context = useContext(SeriesContext);
  if (!context) {
    throw new Error('useSeries must be used within a SeriesProvider');
  }
  return context;
}; 