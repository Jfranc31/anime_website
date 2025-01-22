// /src/Component/Mangas.js

import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { MANGA_FORMATS, AVAILABLE_GENRES, AIRING_STATUS, YEARS } from '../constants/filterOptions';

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { userData, setUserData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');

  const handleModalClose = () => {
    setIsMangaEditorOpen(false);
  };

  // Function to change grid layout
  const changeLayout = (layout) => {
    setGridLayout(layout);
  };

  useEffect(() => {
    setIsLoading(true);
    axios
      .get('http://localhost:8080/mangas/mangas')
      .then((response) => {
        setMangaList(response.data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsLoading(false);
      });
  }, [setMangaList]);

  const filteredManga = Array.isArray(mangaList)
    ? mangaList.filter((manga) => {
        const matchesSearch =
          manga.titles?.romaji?.toLowerCase().includes(searchInput.toLowerCase()) ||
          manga.titles?.english?.toLowerCase().includes(searchInput.toLowerCase()) ||
          manga.titles?.Native?.toLowerCase().includes(searchInput.toLowerCase());

        const matchesGenres =
          selectedGenres.length === 0 ||
          (manga.genres &&
            Array.isArray(manga.genres) &&
            selectedGenres.every((genre) =>
              manga.genres.some(
                (mangaGenre) =>
                  genre &&
                  mangaGenre.toLowerCase().includes(genre.toLowerCase())
              )
            ));

        const matchesYear = !selectedYear || manga.releaseData.startDate.year === selectedYear;

        const matchesFormat =
          selectedFormats.length === 0 ||
          selectedFormats.includes(manga.typings.Format);

        const matchesStatus = !selectedStatus || manga.releaseData.releaseStatus === selectedStatus;

        return (
          matchesSearch &&
          matchesGenres &&
          matchesYear &&
          matchesFormat &&
          matchesStatus
        );
      })
    : [];

  const mangaTitle = (titles) => {
    switch (userData.title) {
      case 'english':
        return titles.english || titles.romaji
      case 'romaji':
        return titles.romaji || titles.english
      case 'native':
        return titles.native
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  };

  const sortedManga = [...filteredManga].sort((a, b) => {
    const titleA = mangaTitle(a.titles)
    const titleB = mangaTitle(b.titles)
    return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
  });

  const handleGenreClick = (genre) => {
    setSelectedGenres((prevGenres) => {
      if (!prevGenres.includes(genre)) {
        return [...prevGenres, genre];
      }
      return prevGenres;
    });
  };

  const handleRemoveGenre = (removedGenre) => {
    setSelectedGenres((prevGenres) =>
      prevGenres.filter((genre) => genre !== removedGenre)
    );
  };

  const onMangaDelete = (mangaId) => {
    setUserData((prevUserData) => {
      if (!prevUserData || !prevUserData.mangas) {
        return prevUserData;
      }
      const updatedUser = { ...prevUserData };
      const updatedMangas = updatedUser.mangas.filter(
        (manga) => manga.mangaId !== mangaId
      );
      updatedUser.mangas = updatedMangas;
      return updatedUser;
    });

    // Close the modal
    setIsMangaEditorOpen(false);
  };

  const handleTopRightButtonClick = (manga) => {
    setSelectedMangaForEdit(manga);
    setIsMangaEditorOpen(true);
  };

  const onTopRightButtonClick = handleTopRightButtonClick;

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
            placeholder="Search manga..."
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
            onChange={(e) => handleGenreClick(e.target.value)}
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
            id="selectedFormat"
            name="selectedFormat"
            value=""
            onChange={(e) => handleFormatChange(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="" disabled>Select a Format</option>
            {MANGA_FORMATS.map(format => (
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
            id="selectedStatus"
            name="selectedStatus"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className={browseStyles.filterSelect}
          >
            <option value="">All Status</option>
            {AIRING_STATUS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={`${browseStyles.listSection} ${browseStyles[gridLayout]}`}>
        {isLoading ? (
          <div className={browseStyles.loadingContainer}>
            <div className={browseStyles.loader}></div>
          </div>
        ) : (
          <div className={`${browseStyles.listContainer} ${browseStyles[gridLayout]}`}>
            {sortedManga.length === 0 ? (
              <div className={browseStyles.noResults}>
                No manga found matching your criteria
              </div>
            ) : (
              <ul className={`${browseStyles.list} ${browseStyles[gridLayout]}`}>
                {sortedManga.map((manga) => (
                  <li key={manga._id} className={browseStyles.listItem}>
                    <MangaCard
                      manga={manga}
                      name={mangaTitle(manga.titles)}
                      layout={gridLayout}
                      onTopRightButtonClick={onTopRightButtonClick}
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
      {isMangaEditorOpen && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <MangaEditor
              manga={selectedMangaForEdit}
              userId={userData._id}
              closeModal={handleModalClose}
              onMangaDelete={onMangaDelete}
              setUserData={setUserData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Mangas;
