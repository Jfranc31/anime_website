import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { MANGA_FORMATS, AVAILABLE_GENRES, AIRING_STATUS, YEARS } from '../constants/filterOptions';
import Loader from '../constants/Loader';

const MANGAS_PER_PAGE = 20;
const LOAD_DELAY = 500;

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { userData, setUserData } = useContext(data);
  const [searchInput, setSearchInput] = useState('');
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedMangas, setDisplayedMangas] = useState([]);
  const observer = useRef();
  const timeoutRef = useRef();

  const handleModalClose = () => {
    setIsMangaEditorOpen(false);
  };

  const changeLayout = (layout) => {
    setGridLayout(layout);
  };

  useEffect(() => {
    setIsInitialLoading(true);
    axios
      .get('http://localhost:8080/mangas/mangas')
      .then((response) => {
        setMangaList(response.data);
        setIsInitialLoading(false);
      })
      .catch((error) => {
        console.error(error);
        setIsInitialLoading(false);
      });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [setMangaList]);

  const filterMangas = useCallback((mangas) => {
    if (!Array.isArray(mangas)) return [];

    return mangas.filter((manga) => {
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
    });
  }, [searchInput, selectedGenres, selectedYear, selectedFormats, selectedStatus]);

  const mangaTitle = useCallback((titles) => {
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
  }, [userData.title]);

  useEffect(() => {
    const loadMoreMangas = () => {
      const filtered = filterMangas(mangaList);
      const sorted = [...filtered].sort((a, b) => {
        const titleA = mangaTitle(a.titles);
        const titleB = mangaTitle(b.titles);
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      });

      setDisplayedMangas(sorted.slice(0, page * MANGAS_PER_PAGE));
      setHasMore(sorted.length > page * MANGAS_PER_PAGE);

      timeoutRef.current = setTimeout(() => {
        setIsLoadingMore(false);
      }, LOAD_DELAY);
    };

    setIsLoadingMore(true);
    loadMoreMangas();
  }, [mangaList, page, searchInput, selectedGenres, selectedYear, selectedFormats, selectedStatus, filterMangas, mangaTitle]);

  const lastMangaElementRef = useCallback(node => {
    if (isLoadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prevPage => prevPage + 1);
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchInput, selectedGenres, selectedYear, selectedFormats, selectedStatus]);

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
    setIsMangaEditorOpen(false);
  };

  const handleTopRightButtonClick = (manga) => {
    setSelectedMangaForEdit(manga);
    setIsMangaEditorOpen(true);
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

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>
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
            <option value="" disabled>Select a genre</option>
            {AVAILABLE_GENRES.map((genre) => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
          <div className={browseStyles.selectedGenres}>
            {selectedGenres.map((genre) => (
              <div key={genre} className={browseStyles.selectedGenre}>
                {genre}
                <button onClick={() => handleRemoveGenre(genre)} className={browseStyles.removeGenreBtn}>×</button>
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
                <button onClick={() => handleRemoveFormat(format)} className={browseStyles.removeGenreBtn}>×</button>
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
        {displayedMangas.length === 0 && !isInitialLoading ? (
          <div className={browseStyles.noResults}>
            No manga found matching your criteria
          </div>
        ) : (
          <>
            <div className={`${browseStyles.listContainer} ${browseStyles[gridLayout]}`}>
              <ul className={`${browseStyles.list} ${browseStyles[gridLayout]}`}>
                {displayedMangas.map((manga, index) => (
                  <li
                    key={manga._id}
                    className={`${browseStyles.listItem} ${index >= displayedMangas.length - MANGAS_PER_PAGE && isLoadingMore ? browseStyles.fadeIn : ''}`}
                    ref={index === displayedMangas.length - 1 ? lastMangaElementRef : null}
                  >
                    <MangaCard
                      manga={manga}
                      name={mangaTitle(manga.titles)}
                      layout={gridLayout}
                      onTopRightButtonClick={handleTopRightButtonClick}
                      hideTopRightButton={!userData || !userData._id}
                      handleGenreClick={handleGenreClick}
                    />
                  </li>
                ))}
              </ul>
            </div>
            {isLoadingMore && hasMore && (
              <div className={browseStyles.loadingMore}>
                <Loader />
              </div>
            )}
          </>
        )}
        {isInitialLoading && (
          <div className={browseStyles.loadingContainer}>
            <Loader />
          </div>
        )}
      </div>

      {isMangaEditorOpen && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div className={modalStyles.characterModal} onClick={(e) => e.stopPropagation()}>
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
