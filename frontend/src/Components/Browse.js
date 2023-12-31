// /src/Component/Browse.js

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../AnimeCard';
import AnimeNotes from '../AnimeNotes';

const Browse = () => {
    const { animeList, setAnimeList, selectedAnimeId, setSelectedAnimeId } = useAnimeContext();
    const [showModal, setShowModal] = useState(false);
    const [searchInput, setSearchInput] = useState('');
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [selectedStatus, setSelectedStatus] = useState('All');


    const [editedAnime, setEditedAnime] = useState(null);
    const [editedCurrentEpisode, setEditedCurrentEpisode] = useState(null);
    const [editedStatus, setEditedStatus] = useState(null);

    const availableGenres = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Hentai", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
    const availableStatuses = ["All", "Planning", "Watching", "Completed"];


    useEffect(() => {
      axios.get('http://localhost:8080/browse')
        .then(response => setAnimeList(response.data))
        .catch(error => console.error(error));
    }, [setAnimeList]);
  
    const filteredAnime = Array.isArray(animeList) ? animeList.filter(anime => {
        const matchesSearch = anime.title.toLowerCase().includes(searchInput.toLowerCase());
        const matchesGenres =
          selectedGenres.length === 0 ||
          selectedGenres.every(genre =>
            anime.genres.map(g => g.genre.toLowerCase()).includes(genre.toLowerCase())
          );

          const matchesStatus = !selectedStatus || selectedStatus.toLowerCase() === 'all' || anime.status.toLowerCase() === selectedStatus.toLowerCase();
      
        return matchesSearch && matchesGenres && matchesStatus;
    }) : [];

    const sortedAnime = [...filteredAnime].sort((a, b) => a.title.localeCompare(b.title));
  
    const groupedAnime = {};
    sortedAnime.forEach(anime => {
        const status = anime.status;
        if (!groupedAnime[status]) {
        groupedAnime[status] = [anime];
        } else {
        groupedAnime[status].push(anime);
        }
    });

    const handleStatusChange = (selectedStatus) => {
        setSelectedStatus(selectedStatus);
    };

    const handleTopRightButtonClick = (anime) => {
        setSelectedAnimeId(anime);
        setShowModal(true);
        setEditedAnime(anime);
        setEditedCurrentEpisode(anime.currentEpisode);
        setEditedStatus(anime.status);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedAnimeId(null);
        setEditedAnime(null);
        setEditedCurrentEpisode(null);
        setEditedStatus(null);
    };
    
    const handleSaveChanges = async () => {
        try {
            // Make API request to update currentEpisode and status
            if(editedCurrentEpisode !== editedAnime.currentEpisode){
                await axios.put(`http://localhost:8080/browse/${editedAnime._id}/currentEpisode`, {
                    currentEpisode: editedCurrentEpisode
                })
            }else if(editedStatus !== editedAnime.status){
                await axios.put(`http://localhost:8080/browse/${editedAnime._id}/status`, {
                    status: editedStatus
                });
            }
            
    
            // Fetch the updated anime list
            const res = await axios.get('http://localhost:8080/browse');
            setAnimeList(res.data);
    
            // Close the modal after saving changes
            handleModalClose();
        } catch (error) {
            console.error('Failed to save changes:', error);
        }
    };
    

    const handleDelete = async () => {
        try {
            // Make DELETE request to delete the anime
            const response = await fetch(`http://localhost:8080/browse/${selectedAnimeId._id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
    
            if (response.ok) {
                console.log('Anime deleted successfully');
                // Fetch the updated anime list
                const res = await axios.get('http://localhost:8080/browse');
                setAnimeList(res.data);
    
                // Close the modal after saving changes
                handleModalClose();
            } else {
                console.error('Failed to delete anime:', response.statusText);
            }
        } catch (error) {
            console.error('Error deleting anime:', error);
        }
    };
    

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
                    <div className="status-filter-container">
                        <select
                            value={selectedStatus}
                            id="statusSearchInput"
                            name="statusSearchInput"
                            onChange={(e) => handleStatusChange(e.target.value)}
                        >
                            {availableStatuses.map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
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
                            onTopRightButtonClick={handleTopRightButtonClick}
                        />
                    </li>
                ))}
            </ul>
            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={handleModalClose}>
                    <div className="modal" onClick={(e) => e.stopPropagation()}>
                        {/* Modal Header */}
                        <div className="modal-header">
                            <img src={selectedAnimeId.border} alt={selectedAnimeId.title}></img>
                            <h2>{selectedAnimeId.title}</h2>
                            <span className="modal-button" onClick={handleModalClose}>×</span>
                            <button className='modal-save-btn' onClick={handleSaveChanges}>Save</button>
                        </div>
                        {/* Modal Body */}
                        <div className="modal-body">
                            {/* <p>Genres: {selectedAnimeId.genres.map((genreObj) => genreObj.genre).join(', ')}</p> */}
                            <div className='modal-currentepisode'>
                            <label htmlFor="currentEpisode">Current Episode:</label>
                            <input
                                type="number"
                                id="currentEpisode"
                                value={editedCurrentEpisode}
                                onChange={(e) => setEditedCurrentEpisode(e.target.value)}
                            />
                            </div>
                            <div className='modal-status'>
                                <label htmlFor="status">Status:</label>
                                <select
                                    id="status"
                                    value={editedStatus}
                                    onChange={(e) => setEditedStatus(e.target.value)}
                                >
                                    <option value="Planning">Planning</option>
                                    <option value="Watching">Watching</option>
                                    <option value="Completed">Completed</option>
                                </select>
                            </div>
                            <div className='modal-notes'>
                                <AnimeNotes animeId={selectedAnimeId._id}/>
                            </div>
                            <button className="modal-delete-btn" onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}


        </div>
    );
  };
  
  export default Browse;