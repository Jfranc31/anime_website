// /src/Component/Mangas.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';

const Mangas =() => {
    const { mangaList, setMangaList } = useMangaContext();
    const [searchInput, setSearchInput] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);

    const availableGenres = [
        "Action", 
        "Adventure", 
        "Comedy", 
        "Drama", 
        "Ecchi", 
        "Fantasy", 
        "Horror", 
        "Hentai", 
        "Mahou Shoujo", 
        "Mecha", 
        "Music", 
        "Mystery", 
        "Psychological", 
        "Romance", 
        "Sci-Fi", 
        "Slice of Life", 
        "Sports", 
        "Supernatural", 
        "Thriller"
    ];

    useEffect(() => {
        axios.get('http://localhost:8080/mangas/mangas')
            .then(response => setMangaList(response.data))
            .catch(error => console.error(error));
    }, [setMangaList]);

    const filteredManga = Array.isArray(mangaList) ? mangaList.filter(manga => {
        const matchesSearch =
            manga.titles.romaji.toLowerCase().includes(searchInput.toLowerCase()) ||
            manga.titles.english.toLowerCase().includes(searchInput.toLowerCase()) ||
            manga.titles.Native.toLowerCase().includes(searchInput.toLowerCase());
    
        const matchesGenres =
            selectedGenres.length === 0 ||
            (manga.genres && Array.isArray(manga.genres) && selectedGenres.every(genre =>
                manga.genres.some(animeGenre => genre && animeGenre.toLowerCase().includes(genre.toLowerCase()))
        ));
    
        return matchesSearch && matchesGenres;
    }) : [];

    const sortedManga = [...filteredManga].sort((a, b) => {
        const titleA = (a.titles && a.titles.english) || ''; // handle undefined
        const titleB = (b.titles && b.titles.english) || ''; // handle undefined
        return titleA.localeCompare(titleB);
    });

    const handleGenreChange = (selectedGenre) => {
        setSelectedGenres(prevGenres => {
          if (!prevGenres.includes(selectedGenre)) {
            return [...prevGenres, selectedGenre];
          } else {
            return prevGenres; // Add this else block
          }
        });
    };

    const handleRemoveGenre = (removedGenre) => {
        setSelectedGenres(prevGenres => prevGenres.filter(genre => genre !== removedGenre));
    };

    return (
        <div className='browse-container'>
            <div className='filter-container'>
                <div className='search-container'>
                    <input
                        type='text'
                        id='searchInput'
                        name='seatchInput'
                        placeholder='Search...'
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className='genre-filter-container'>
                    <select
                        value=""
                        id='genreSearchInput'
                        name='genreSearchInput'
                        onChange={(e) => handleGenreChange(e.target.value)}
                    >
                        <option value="" disabled>Select a genre</option>
                        {availableGenres.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                        ))}
                    </select>
                    <div className="selected-genres">
                        {selectedGenres.map(genre => (
                            <div key={genre} className="selected-genre">
                                {genre}
                                <button onClick={() => handleRemoveGenre(genre)}>x</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <ul className="anime-list">
                {sortedManga.map(manga => (
                    <li key={manga._id}>
                        <MangaCard
                            manga={manga}
                            setMangaList={setMangaList}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Mangas;