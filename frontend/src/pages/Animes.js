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
import { SEASONS, AVAILABLE_GENRES, ANIME_FORMATS, AIRING_STATUS, YEARS } from '../constants/filterOptions';

const Animes = () => {
  const { animeList, setAnimeList } = useAnimeContext();
  const { userData, setUserData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');

  const handleModalClose = () => {
    setIsAnimeEditorOpen(false);
  };

  // Function to change grid layout
  const changeLayout = async (layout) => {
    setGridLayout(layout);
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

  const determineSeason = (startDate) => {
    if (!startDate || !startDate.month)
      return { season: 'TBA', year: startDate?.year || 'TBA' };

    const month = startDate.month;
    let season;

    if (month >= 3 && month <= 5) season = 'Spring';
    else if (month >= 6 && month <= 8) season = 'Summer';
    else if (month >= 9 && month <= 11) season = 'Fall';
    else season = 'Winter';

    return {
      season,
      year: startDate.year || 'TBA',
    };
  };

  const filteredAnime = Array.isArray(animeList)
    ? animeList.filter((anime) => {
        const matchesSearch =
          anime.titles?.romaji?.toLowerCase().includes(searchInput.toLowerCase()) ||
          anime.titles?.english?.toLowerCase().includes(searchInput.toLowerCase()) ||
          anime.titles?.Native?.toLowerCase().includes(searchInput.toLowerCase());

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

        const matchesYear = !selectedYear || anime.releaseData.startDate.year === selectedYear;

        const { season } = determineSeason(anime.releaseData.startDate);
        const matchesSeason = !selectedSeason || season === selectedSeason;

        const matchesFormat =
          selectedFormats.length === 0 ||
          selectedFormats.includes(anime.typings.Format);

        const matchesStatus = !selectedStatus || anime.releaseData.releaseStatus === selectedStatus;

        return (
          matchesSearch &&
          matchesGenres &&
          matchesYear &&
          matchesSeason &&
          matchesFormat &&
          matchesStatus
        );
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

  const handleFormatChange = (selectedFormat) => {
    setSelectedFormats((prevFormats) => {
      if (!prevFormats.includes(selectedFormat)) {
        return [...prevFormats, selectedFormat];
      }
      return prevFormats;
    });
  };

  const handleRemoveFormat = (removedFormat) => {
    setSelectedFormats((prevFormats) =>
      prevFormats.filter((format) => format !== removedFormat)
    );
  };

  const handleGenreClick = (genre) => {
    setSelectedGenres((prevGenres) => {
      if (!prevGenres.includes(genre)) {
        return [...prevGenres, genre];
      }
      return prevGenres;
    });
  };

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>

        {/* New buttons for layout selection */}
        <div className={browseStyles.layoutButtons}>
          <button onClick={() => changeLayout('default')} className={browseStyles.layoutButton}>Default</button>
          <button onClick={() => changeLayout('wide')} className={browseStyles.layoutButton}>Wide</button>
          <button onClick={() => changeLayout('compact')} className={browseStyles.layoutButton}>Compact</button>
        </div>

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

        <div className={browseStyles.filterSection}>
          <select
            id="selectedYear"
            name="selectedYear"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="">All Years</option>
            {YEARS.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className={browseStyles.filterSection}>
          <select
            id="selectedSeason"
            name="selectedSeason"
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="">All Seasons</option>
            {SEASONS.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>

        <div className={browseStyles.filterSection}>
          <select
            id="selectedFormat"
            name="selectedFormat"
            value=""
            onChange={(e) => handleFormatChange(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="" disabled>
              Select a Format
            </option>
            {ANIME_FORMATS.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
          <div className={browseStyles.selectedFilters}>
            {selectedFormats.map((format) => (
              <div key={format} className={browseStyles.selectedFilter}>
                {format}
                <button
                  onClick={() => handleRemoveFormat(format)}
                  className={browseStyles.removeGenreBtn}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className={browseStyles.filterSection}>
          <select
            id="selectedAiring"
            name="selectedAiring"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="">All Airing Status</option>
            {AIRING_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>

      </div>

      <div className={`${browseStyles.animeListSection} ${browseStyles[gridLayout]}`}>
        {isLoading ? (
          <div className={browseStyles.loadingContainer}>
            <div className={browseStyles.loader}></div>
          </div>
        ) : (
          <div className={`${browseStyles.animeListContainer} ${browseStyles[gridLayout]}`}>
            {sortedAnime.length === 0 ? (
              <div className={browseStyles.noResults}>
                No anime found matching your criteria
              </div>
            ) : (
              <ul className={`${browseStyles.animeList} ${browseStyles[gridLayout]}`}>
                {sortedAnime.map((anime) => (
                  <li key={anime._id} className={browseStyles.animeListItem}>
                    <AnimeCard
                      anime={anime}
                      layout={gridLayout}
                      onTopRightButtonClick={handleTopRightButtonClick}
                      hideTopRightButton={!userData || !userData._id}
                      handleGenreClick={handleGenreClick}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

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
