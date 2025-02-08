import React, { useState, useEffect, useContext, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import SkeletonCard from '../cards/SkeletonCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { MANGA_FORMATS, AVAILABLE_GENRES, AIRING_STATUS, YEARS } from '../constants/filterOptions';

const MANGAS_PER_PAGE = 18;

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { userData, setUserData } = useContext(data);
  const [userMangaStatuses, setUserMangaStatuses] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedMangas, setDisplayedMangas] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const[updateTrigger, setUpdateTrigger] = useState(0);

  const observer = useRef();
  const filteredMangasRef = useRef([]);
  const isLoadingRef = useRef(false);

  const handleModalClose = () => setIsMangaEditorOpen(false);
  const changeLayout = (layout) => setGridLayout(layout);

  // NEW: Handle manga loading transitions
  const handleMangaLoad = useCallback((mangaId) => {
    setLoadingStates(prev => ({
      ...prev,
      [mangaId]: true
    }));

    setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
        [mangaId]: false
      }));
    }, Math.random() * 300 + 200);
  }, []);

  // NEW: Initialize loading states for new mangas
  useEffect(() => {
    displayedMangas.forEach(manga => {
      if (loadingStates[manga._id] === undefined) {
        handleMangaLoad(manga._id);
      }
    });
  }, [displayedMangas, handleMangaLoad, loadingStates]);

  const mangaTitle = useCallback((titles) => {
    switch (userData.title) {
      case 'english':
        return titles.english || titles.romaji;
      case 'romaji':
        return titles.romaji || titles.english;
      case 'native':
        return titles.native;
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  }, [userData.title]);

  const fetchMangas = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const response = await axiosInstance.get('8080/mangas/mangas');
      setMangaList(response.data);
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error fetching manga:', error);
      setIsInitialLoading(false);
    }
  }, [setMangaList]);

  // Initial fetch
  useEffect(() => {
    fetchMangas();
  }, [fetchMangas, updateTrigger]);

  // Add event listeners for manga updates
  useEffect(() => {
    const handleMangaCreated = (event) => {
      const newManga = event.detail;

      // Update manga list with new manga
      setMangaList(prevList => {
        // Check if manga already exists
        const exists = prevList.some(manga => manga._id === newManga._id);
        if (exists) {
          return prevList.map(manga =>
            manga._id === newManga._id ? newManga : manga
          );
        }
        return [...prevList, newManga];
      });

      // Initialize loading state for new manga
      handleMangaLoad(newManga._id);

      // Trigger a refresh of the filtered list
      setUpdateTrigger(prev => prev + 1);
    };

    const handleMangaUpdated = (event) => {
      const updatedManga = event.detail;
      setMangaList(prevList =>
        prevList.map(manga =>
          manga._id === updatedManga._id ? updatedManga : manga
        )
      );
    };

    const handleMangaDeleted = (event) => {
      const deletedMangaId = event.detail;
      setMangaList(prevList =>
        prevList.filter(manga => manga._id !== deletedMangaId)
      );
    };

    // Add event listeners
    window.addEventListener('mangaCreated', handleMangaCreated);
    window.addEventListener('mangaUpdated', handleMangaUpdated);
    window.addEventListener('mangaDeleted', handleMangaDeleted);

    // Cleanup function
    return () => {
      window.removeEventListener('mangaCreated', handleMangaCreated);
      window.removeEventListener('mangaUpdated', handleMangaUpdated);
      window.removeEventListener('mangaDeleted', handleMangaDeleted);
    };
  }, [handleMangaLoad]);

  // Fetch user's current manga statuses when userData changes
  useEffect(() => {
    const fetchUserMangaStatuses = async () => {
      if (!userData?._id) {
        setUserMangaStatuses({});
        return;
      }

      try {
        const userResponse = await axiosInstance.get(`/users/${userData._id}/current`);
        const currentUser = userResponse.data;

        // Create a map of mangaId to status for quick lookup
        const statusMap = {};
        currentUser?.mangas?.forEach(manga => {
          statusMap[manga.mangaId] = manga.status;
        });

        setUserMangaStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching user manga statuses:', error);
      }
    };

    fetchUserMangaStatuses();
  }, [userData]);

  // Update getMangaStatus to use the status map
  const getMangaStatus = useCallback((mangaId) => {
    return userMangaStatuses[mangaId] || null;
  }, [userMangaStatuses]);

  // Filter and sort manga list
  const filterAndSortMangas = useCallback(() => {
    if (!Array.isArray(mangaList)) return [];

    return mangaList.filter(manga => {
      const matchesSearch =
        manga.titles?.romaji?.toLowerCase().includes(searchInput.toLowerCase()) ||
        manga.titles?.english?.toLowerCase().includes(searchInput.toLowerCase()) ||
        manga.titles?.Native?.toLowerCase().includes(searchInput.toLowerCase());

      const matchesGenres =
        selectedGenres.length === 0 ||
        (manga.genres &&
          Array.isArray(manga.genres) &&
          selectedGenres.every(genre =>
            manga.genres.some(
              mangaGenre =>
                genre &&
                mangaGenre.toLowerCase().includes(genre.toLowerCase())
            )
          ));

      const matchesYear = !selectedYear || manga.releaseData.startDate.year === selectedYear;
      const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(manga.typings.Format);
      const matchesStatus = !selectedStatus || manga.releaseData.releaseStatus === selectedStatus;

      return matchesSearch && matchesGenres && matchesYear && matchesFormat && matchesStatus;
    }).sort((a, b) => {
      const titleA = mangaTitle(a.titles);
      const titleB = mangaTitle(b.titles);
      return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    });
  }, [mangaList, searchInput, selectedGenres, selectedYear, selectedFormats, selectedStatus, mangaTitle]);

  // Update filtered mangas when filters change
  useEffect(() => {
    if (!mangaList) return;

    setDisplayedMangas([]); // Clear current display
    filteredMangasRef.current = filterAndSortMangas();

    // Load initial batch
    const initialBatch = filteredMangasRef.current.slice(0, MANGAS_PER_PAGE);
    setDisplayedMangas(initialBatch);
    setHasMore(filteredMangasRef.current.length > MANGAS_PER_PAGE);
  }, [filterAndSortMangas, mangaList]);

  // Load more mangas
  const loadMoreMangas = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const currentLength = displayedMangas.length;
    const nextBatch = filteredMangasRef.current.slice(
      currentLength,
      currentLength + MANGAS_PER_PAGE
    );

    setTimeout(() => {
      setDisplayedMangas(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + MANGAS_PER_PAGE < filteredMangasRef.current.length);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 500);
  }, [displayedMangas.length, hasMore]);

  // Intersection Observer setup
  const lastMangaElementRef = useCallback(node => {
    if (isLoadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMangas();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMoreMangas]);

  // NEW: Render list items with transitions
  const renderListItems = () => {
    const items = [];

    displayedMangas.forEach((manga, index) => {
      const isLoading = loadingStates[manga._id];
      const mangaStatus = getMangaStatus(manga._id);
      items.push(
        <li
          key={manga._id}
          ref={index === displayedMangas.length - 1 ? lastMangaElementRef : null}
          className={`${browseStyles.listItem} ${isLoading ? browseStyles.loading : browseStyles.loaded}`}
        >
          {isLoading ? (
            <SkeletonCard layout={gridLayout} />
          ) : (
            <div className={browseStyles.fadeIn}>
              <MangaCard
                manga={manga}
                name={mangaTitle(manga.titles)}
                layout={gridLayout}
                onTopRightButtonClick={handleTopRightButtonClick}
                hideTopRightButton={!userData || !userData._id}
                handleGenreClick={handleGenreClick}
                status={mangaStatus}
              />
            </div>
          )}
        </li>
      );
    });

    if (isLoadingMore && hasMore) {
      for (let i = 0; i < 4; i++) {
        items.push(
          <li key={`skeleton-more-${i}`} className={`${browseStyles.listItem} ${browseStyles.loading}`}>
            <SkeletonCard layout={gridLayout} />
          </li>
        );
      }
    }

    return items;
  };

  const handleGenreClick = (genre) => {
    setSelectedGenres(prev => prev.includes(genre) ? prev : [...prev, genre]);
  };

  const handleRemoveGenre = (genre) => {
    setSelectedGenres(prev => prev.filter(g => g !== genre));
  };

  const handleFormatChange = (format) => {
    setSelectedFormats(prev => prev.includes(format) ? prev : [...prev, format]);
  };

  const handleRemoveFormat = (format) => {
    setSelectedFormats(prev => prev.filter(f => f !== format));
  };

  const handleTopRightButtonClick = (manga) => {
    setSelectedMangaForEdit(manga);
    setIsMangaEditorOpen(true);
  };

  const onMangaDelete = (mangaId) => {
    setUserData(prev => {
      if (!prev?.mangas) return prev;
      return {
        ...prev,
        mangas: prev.mangas.filter(manga => manga.mangaId !== mangaId)
      };
    });
    setIsMangaEditorOpen(false);
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
        {displayedMangas.length === 0 && !isInitialLoading && !isLoadingMore ? (
          <div className={browseStyles.noResults}>
            No manga found matching your criteria
          </div>
        ) : (
          <div className={`${browseStyles.listContainer} ${browseStyles[gridLayout]}`}>
            <ul className={`${browseStyles.list} ${browseStyles[gridLayout]}`}>
              {renderListItems()}
            </ul>
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
