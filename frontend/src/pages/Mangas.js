// /src/Component/Mangas.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import data from '../Context/ContextApi';
import styles from '../styles/components/Modal.module.css';
const Mangas =() => {
    const { mangaList, setMangaList } = useMangaContext();
    const {userData,setUserData} = useContext(data);
    const [searchInput, setSearchInput] = useState('');
    const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        setIsMangaEditorOpen(false);
    };

    useEffect(() => {
        setIsLoading(true);
        axios.get('http://localhost:8080/mangas/mangas')
            .then(response => {
                setMangaList(response.data);
                setIsLoading(false);
            })
            .catch(error => {
                console.error(error);
                setIsLoading(false);
            });
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

    const onMangaDelete = (mangaId) => {
        setUserData((prevUserData) => {
            const updatedUser = { ...prevUserData };
            const updatedMangas = updatedUser.mangas.filter((manga) => manga.mangaId !== mangaId);
            updatedUser.mangas = updatedMangas;
            return updatedUser;
        });
    };

    const handleTopRightButtonClick = (manga) => {
        setSelectedMangaForEdit(manga);
        setIsMangaEditorOpen(true);
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
                        placeholder="Search manga..."
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="genre-filter-container">
                    <select
                        value=""
                        id="genreSearchInput"
                        name="genreSearchInput"
                        onChange={(e) => handleGenreChange(e.target.value)}
                        className="genre-select"
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
                                <button 
                                    onClick={() => handleRemoveGenre(genre)}
                                    className="remove-genre-btn"
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <div className="loader"></div>
                </div>
            ) : (
                <div className="manga-list-section">
                    {sortedManga.length === 0 ? (
                        <div className="no-results">
                            No manga found matching your criteria
                        </div>
                    ) : (
                        <ul className="manga-list">
                            {sortedManga.map(manga => (
                                <li key={manga._id} className="manga-list-item">
                                    <MangaCard
                                        manga={manga}
                                        onTopRightButtonClick={onTopRightButtonClick}
                                        setMangaList={setMangaList}
                                    />
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
            {isMangaEditorOpen && (
                <div className={styles.characterModalOverlay} onClick={handleModalClose}>
                    <div className={styles.characterModal} onClick={e => e.stopPropagation()}>
                        <MangaEditor
                            manga={selectedMangaForEdit}
                        userId={userData._id}
                        closeModal={handleModalClose}
                        onMangaDelete={onMangaDelete}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Mangas;