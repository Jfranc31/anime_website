// src/context/AnimeContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

export const MangaContext = createContext();

export const MangaProvider = ({ children }) => {
    const [mangaList, setMangaList] = useState([]);
    const [selectedMangaId, setSelectedMangaId] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {

                // Fetch data from your API
                const response = await fetch(
                    'http://localhost:8080/mangas/mangas', {
                        credentials: 'include',
                    }
                );

                const data = await response.json();

                // Update the mangaList in the context
                setMangaList(data);

            } catch (error) {
                console.error('Error fetching manga list:', error);
            }
        };

        fetchData();
    }, []);

    return (
        <MangaContext.Provider value={{
            mangaList,
            setMangaList,
            selectedMangaId,
            setSelectedMangaId
        }}>
            {children}
        </MangaContext.Provider>
    );
};

export const useMangaContext = () => {
    const context = useContext(MangaContext);

    if (!context) {
        throw new Error(
            'useAnimeContext must be used within an MangaProvider'
        );
    }

    return context;
};