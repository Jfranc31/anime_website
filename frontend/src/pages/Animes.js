// /src/Component/Animes.js

// Importing React and other dependencies
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../cards/AnimeCard';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { Link } from 'react-router-dom';

// Constants
const AVAILABLE_GENRES = [
  'Action',
  'Adventure',
  'Comedy',
  'Drama',
  'Ecchi',
  'Fantasy',
  'Horror',
  'Hentai',
  'Mahou Shoujo',
  'Mecha',
  'Music',
  'Mystery',
  'Psychological',
  'Romance',
  'Sci-Fi',
  'Slice of Life',
  'Sports',
  'Supernatural',
  'Thriller',
];

const Animes = () => {
  const { animeList, setAnimeList } = useAnimeContext();
  const { userData, setUserData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const handleModalClose = () => {
    setIsAnimeEditorOpen(false);
  };

  useEffect(() => {
    setIsLoading(true);
    axios
      .get('http://localhost:8080/animes/animes')
      .then((response) => {
        setAnimeList(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [setAnimeList]);

  const filteredAnime = Array.isArray(animeList)
    ? animeList.filter((anime) => {
        const matchesSearch =
          anime.titles.romaji
            .toLowerCase()
            .includes(searchInput.toLowerCase()) ||
          anime.titles.english
            .toLowerCase()
            .includes(searchInput.toLowerCase()) ||
          anime.titles.Native.toLowerCase().includes(searchInput.toLowerCase());

        const matchesGenres =
          selectedGenres.length === 0 ||
          (anime.genres &&
            Array.isArray(anime.genres) &&
            selectedGenres.every((genre) =>
              anime.genres.some(
                (animeGenre) =>
                  genre &&
                  animeGenre.toLowerCase().includes(genre.toLowerCase())
              )
            ));

        return matchesSearch && matchesGenres;
      })
    : [];

  const sortedAnime = [...filteredAnime].sort((a, b) => {
    const titleA = (a.titles && a.titles.english) || ''; // handle undefined
    const titleB = (b.titles && b.titles.english) || ''; // handle undefined
    return titleA.localeCompare(titleB);
  });

  const handleGenreChange = (selectedGenre) => {
    setSelectedGenres((prevGenres) => {
      if (!prevGenres.includes(selectedGenre)) {
        return [...prevGenres, selectedGenre];
      } else {
        return prevGenres;
      }
    });
  };

  const handleRemoveGenre = (removedGenre) => {
    setSelectedGenres((prevGenres) =>
      prevGenres.filter((genre) => genre !== removedGenre)
    );
  };

  const onAnimeDelete = (animeId) => {
    setUserData((prevUserData) => {
      if (!prevUserData || !prevUserData.animes) {
        return prevUserData;
      }
      const updatedUser = { ...prevUserData };
      const updatedAnimes = updatedUser.animes.filter(
        (anime) => anime.animeId !== animeId
      );
      updatedUser.animes = updatedAnimes;
      return updatedUser;
    });

    // Close the modal
    setIsAnimeEditorOpen(false);
  };

  // Function to handle the top-right button click
  const handleTopRightButtonClick = (anime) => {
    setSelectedAnimeForEdit(anime);
    setIsAnimeEditorOpen(true);
  };

  const onTopRightButtonClick = handleTopRightButtonClick;

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>
        <div className={browseStyles.searchContainer}>
          <input
            type="text"
            id="searchInput"
            name="searchInput"
            placeholder="Search anime..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
        <div className={browseStyles.genreFilterContainer}>
          <select
            value=""
            id="genreSearchInput"
            name="genreSearchInput"
            onChange={(e) => handleGenreChange(e.target.value)}
            className={browseStyles.genreSelect}
          >
            <option value="" disabled>
              Select a genre
            </option>
            {AVAILABLE_GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </select>
          <div className={browseStyles.selectedGenres}>
            {selectedGenres.map((genre) => (
              <div key={genre} className={browseStyles.selectedGenre}>
                {genre}
                <button
                  onClick={() => handleRemoveGenre(genre)}
                  className={browseStyles.removeGenreBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className={browseStyles.loadingContainer}>
          <div className={browseStyles.loader}></div>
        </div>
      ) : (
        <div className={browseStyles.animeListSection}>
          {sortedAnime.length === 0 ? (
            <div className={browseStyles.noResults}>
              No anime found matching your criteria
            </div>
          ) : (
            <ul className={browseStyles.animeList}>
              {sortedAnime.map((anime) => (
                <li key={anime._id} className={browseStyles.animeListItem}>
                  <AnimeCard
                    anime={anime}
                    onTopRightButtonClick={handleTopRightButtonClick}
                    hideTopRightButton={!userData || !userData._id}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {isAnimeEditorOpen && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimeEditor
              anime={selectedAnimeForEdit}
              userId={userData._id}
              closeModal={handleModalClose}
              onAnimeDelete={onAnimeDelete}
              setUserData={setUserData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Animes;
