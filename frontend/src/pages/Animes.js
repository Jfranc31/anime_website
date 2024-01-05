// /src/Component/Animes.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../cards/AnimeCard';

const Animes = () => {
    const { animeList, setAnimeList, selectedAnimeId, setSelectedAnimeId } = useAnimeContext();
    const [searchInput, setSearchInput] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);

    const availableGenres = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Hentai", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];

    useEffect(() => {
      axios.get('http://localhost:8080/animes')
        .then(response => setAnimeList(response.data))
        .catch(error => console.error(error));
    }, [setAnimeList]);
  
    const filteredAnime = Array.isArray(animeList) ? animeList.filter(anime => {
        const matchesSearch =
            anime.titles.romaji.toLowerCase().includes(searchInput.toLowerCase()) ||
            anime.titles.english.toLowerCase().includes(searchInput.toLowerCase()) ||
            anime.titles.Native.toLowerCase().includes(searchInput.toLowerCase());
    
        const matchesGenres =
            selectedGenres.length === 0 ||
            selectedGenres.every(genre =>
                anime.genres.map(g => g.genre.toLowerCase()).includes(genre.toLowerCase())
            );
    
        return matchesSearch && matchesGenres;
    }) : [];

    const sortedAnime = [...filteredAnime].sort((a, b) => a.title.localeCompare(b.title));

    const handleCardClick = (animeId) => {
        setSelectedAnimeId(animeId);
    };

    const handleGenreChange = (selectedGenre) => {
        setSelectedGenres(prevGenres => {
          if (!prevGenres.includes(selectedGenre)) {
            return [...prevGenres, selectedGenre];
          }
          return prevGenres;
        });
    };

    const handleRemoveGenre = (removedGenre) => {
        setSelectedGenres(prevGenres => prevGenres.filter(genre => genre !== removedGenre));
    };
  
    return (
        <div className="browse-container">
            <div className="filter-container">
                <div className="search-container">
                    <input
                        type="text"
                        id="searchInput" 
                        name="searchInput"
                        placeholder="Search..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>
                <div className="genre-filter-container">
                    
                    <select
                        value="" // Use an empty string as the default value
                        id="genreSearchInput"
                        name="genreSearchInput"
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
                {sortedAnime.map(anime => (
                    <li key={anime._id}>
                        <AnimeCard
                            anime={anime}
                            setAnimeList={setAnimeList}
                            onCardClick={handleCardClick}
                        />
                    </li>
                ))}
            </ul>
        </div>
    );
  };
  
  export default Animes;