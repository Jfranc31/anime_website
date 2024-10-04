// /src/Component/Animes.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../cards/AnimeCard';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import data from '../Context/ContextApi';

const Animes = () => {
    const { animeList, setAnimeList } = useAnimeContext();
    const {userData,setUserData} = useContext(data);
    const [searchInput, setSearchInput] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
    const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);

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

    const handleModalClose = () => {
        setIsAnimeEditorOpen(false);
    };

    useEffect(() => {
      axios.get('http://localhost:8080/animes/animes')
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
            (anime.genres && Array.isArray(anime.genres) && selectedGenres.every(genre =>
                anime.genres.some(animeGenre => genre && animeGenre.toLowerCase().includes(genre.toLowerCase()))
        ));
    
        return matchesSearch && matchesGenres;
    }) : [];

    const sortedAnime = [...filteredAnime].sort((a, b) => {
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

    const onAnimeDelete = (animeId) => {
        // Implement logic to update the user's anime list after deletion
        setUserData((prevUserData) => {
          const updatedUser = { ...prevUserData };
          const updatedAnimes = updatedUser.animes.filter((anime) => anime.animeId !== animeId);
          updatedUser.animes = updatedAnimes;
          return updatedUser;
        });
    };

    // Function to handle the top-right button click
    const handleTopRightButtonClick = (anime) => {
        setSelectedAnimeForEdit(anime);
        setIsAnimeEditorOpen(true);
    };

    const onTopRightButtonClick = handleTopRightButtonClick;

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
                            onTopRightButtonClick={onTopRightButtonClick}
                            setAnimeList={setAnimeList}
                        />
                    </li>
                ))}
            </ul>
            {/* Render AnimeEditor modal conditionally */}
            {isAnimeEditorOpen && (
                <div className="character-modal-overlay" onClick={handleModalClose}>

                    <AnimeEditor
                        anime={selectedAnimeForEdit}
                        userId={userData._id}
                        closeModal={handleModalClose}
                        onAnimeDelete={onAnimeDelete}
                    />
                </div>
            )}
        </div>
    );
  };
  
  export default Animes;