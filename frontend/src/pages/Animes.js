import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../cards/AnimeCard';
import SkeletonCard from '../cards/SkeletonCard';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { SEASONS, AVAILABLE_GENRES, ANIME_FORMATS, AIRING_STATUS, YEARS } from '../constants/filterOptions';
import { useUser } from '../Context/ContextApi';

const ANIMES_PER_PAGE = 18;

const Animes = () => {
  const { animeList, setAnimeList } = useAnimeContext();
  const { userData, setUserData, refreshUserData } = useUser();
  const [userAnimeStatuses, setUserAnimeStatuses] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedAnimes, setDisplayedAnimes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);

  const observer = useRef();
  const filteredAnimesRef = useRef([]);
  const isLoadingRef = useRef(false);

  const handleModalClose = () => setIsAnimeEditorOpen(false);
  const changeLayout = (layout) => setGridLayout(layout);

  const handleAnimeLoad = useCallback((animeId) => {
    setLoadingStates(prev => ({
      ...prev,
      [animeId]: true
    }));

    setTimeout(() => {
      setLoadingStates(prev => ({
        ...prev,
        [animeId]: false
      }));
    }, Math.random() * 300 + 200);
  }, []);

  useEffect(() => {
    displayedAnimes.forEach(anime => {
      if (loadingStates[anime._id] === undefined) {
        handleAnimeLoad(anime._id);
      }
    });
  }, [displayedAnimes, handleAnimeLoad, loadingStates]);

  const animeTitle = useCallback((titles) => {
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

  const fetchAnimes = useCallback(async () => {
    try {
      setIsInitialLoading(true);
      const response = await axiosInstance.get('/animes/animes');
      setAnimeList(response.data);
      setIsInitialLoading(false);
    } catch (error) {
      console.error('Error fetching anime:', error);
      setIsInitialLoading(false);
    }
  }, [setAnimeList]);

  // Initial fetch
  useEffect(() => {
    fetchAnimes();
  }, [fetchAnimes]);

  // Add event listerners for anime updates
  useEffect(() => {
    const handleAnimeCreated = (event) => {
      const newAnime = event.detail;
      console.log('Anime created event received:', newAnime);

      // Update anime list with new anime
      setAnimeList(prevList => {
        console.log('Previous anime list:', prevList);
        const exists = prevList.some(anime => anime._id === newAnime._id);
        if (exists) {
          return prevList.map(anime =>
            anime._id === newAnime._id ? newAnime : anime
          );
        }
        const newList = [newAnime, ...prevList];
        console.log('Updated anime list:', newList);
        return newList;
      });

      // Initialize loading state for new anime
      handleAnimeLoad(newAnime._id);

      // directly update displated animes
      setDisplayedAnimes(prevDisplayed => {
        console.log('Previous displayed animes:', prevDisplayed);
        const newDisplayed = [newAnime, ...prevDisplayed].slice(0, ANIMES_PER_PAGE);
        console.log('Updated displayed animes:', newDisplayed);
        return newDisplayed;
      });
    };

    const handleAnimeUpdated = (event) => {
      const updatedAnime = event.detail;
      setAnimeList(prevList =>
        prevList.map(anime =>
          anime._id === updatedAnime._id ? updatedAnime : anime
        )
      );
    };

    const handleAnimeDeleted = (event) => {
      const deletedAnimeId = event.detail;
      setAnimeList(prevList =>
        prevList.filter(anime => anime._id !== deletedAnimeId)
      );
    };

    // Add event listeners
    window.addEventListener('animeCreated', handleAnimeCreated);
    window.addEventListener('animeUpdated', handleAnimeUpdated);
    window.addEventListener('animeDeleted', handleAnimeDeleted);

    // Cleanup function
    return () => {
      window.removeEventListener('animeCreated', handleAnimeCreated);
      window.removeEventListener('animeUpdated', handleAnimeUpdated);
      window.removeEventListener('animeDeleted', handleAnimeDeleted);
    };
  }, [handleAnimeLoad, setAnimeList]);

  // Fetch user's current anime statuses when userData changes
  useEffect(() => {
    const fetchUserAnimeStatuses = async () => {
      if (!userData?._id) {
        setUserAnimeStatuses({});
        return;
      }

      try {
        const userResponse = await axiosInstance.get(`/users/${userData._id}/current`);
        const currentUser = userResponse.data;

        // Create a map of animeId to status for quick lookup
        const statusMap = {};
        currentUser?.animes?.forEach(anime => {
          statusMap[anime.animeId] = anime.status;
        });

        setUserAnimeStatuses(statusMap);
      } catch (error) {
        console.error('Error fetching user anime statuses:', error);
      }
    };

    fetchUserAnimeStatuses();
  }, [userData]);

  // Update getAnimeStatus to use the status map
  const getAnimeStatus = useCallback((animeId) => {
    return userAnimeStatuses[animeId] || null;
  }, [userAnimeStatuses]);

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

  const filterAndSortAnimes = useCallback(() => {
    if (!Array.isArray(animeList)) return [];

    return animeList.filter((anime) => {
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

      const { season } = determineSeason(anime.releaseData.startDate);

      const matchesYear = !selectedYear || anime.releaseData.startDate.year === selectedYear;
      const matchesSeason = !selectedSeason || season === selectedSeason;
      const matchesFormat = selectedFormats.length === 0 || selectedFormats.includes(anime.typings.Format);
      const matchesStatus = !selectedStatus || anime.releaseData.releaseStatus === selectedStatus;

      return matchesSearch && matchesGenres && matchesYear && matchesSeason && matchesFormat && matchesStatus;
    }).sort((a, b) => {
      const titleA = animeTitle(a.titles);
      const titleB = animeTitle(b.titles);
      return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
    });
  }, [animeList, searchInput, selectedGenres, selectedSeason, selectedYear, selectedFormats, selectedStatus, animeTitle]);

  useEffect(() => {
    if (!animeList) return;

    setDisplayedAnimes([]); // Clear current display
    filteredAnimesRef.current = filterAndSortAnimes();

    // Load initial batch
    const initialBatch = filteredAnimesRef.current.slice(0, ANIMES_PER_PAGE);
    setDisplayedAnimes(initialBatch);
    setHasMore(filteredAnimesRef.current.length > ANIMES_PER_PAGE);
  }, [filterAndSortAnimes, animeList]);

  const loadMoreAnimes = useCallback(() => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoadingMore(true);

    const currentLength = displayedAnimes.length;
    const nextBatch = filteredAnimesRef.current.slice(
      currentLength,
      currentLength + ANIMES_PER_PAGE
    );

    setTimeout(() => {
      setDisplayedAnimes(prev => [...prev, ...nextBatch]);
      setHasMore(currentLength + ANIMES_PER_PAGE < filteredAnimesRef.current.length);
      setIsLoadingMore(false);
      isLoadingRef.current = false;
    }, 500);
  }, [displayedAnimes.length, hasMore]);

  const lastAnimeElementRef = useCallback(node => {
    if (isLoadingMore) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreAnimes();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMoreAnimes]);

  const renderListItems = () => {
    const items = [];

    displayedAnimes.forEach((anime, index) => {
      const isLoading = loadingStates[anime._id];
      const animeStatus = getAnimeStatus(anime._id);
      items.push(
        <li
          key={anime._id}
          ref={index === displayedAnimes.length - 1 ? lastAnimeElementRef : null}
          className={`${browseStyles.listItem} ${isLoading ? browseStyles.loading : browseStyles.loaded}`}
        >
          {isLoading ? (
            <SkeletonCard layout={gridLayout} />
          ) : (
            <div className={browseStyles.fadeIn}>
              <AnimeCard
                anime={anime}
                name={animeTitle(anime.titles)}
                layout={gridLayout}
                onTopRightButtonClick={handleTopRightButtonClick}
                hideTopRightButton={!userData || !userData._id}
                handleGenreClick={handleGenreClick}
                status={animeStatus}
                onAddToLibrary={handleAddToLibrary}
              />
            </div>
          )}
        </li>
      );
    });

    if (isLoadingMore && hasMore) {
      for (let i = 0; i < 4; i++) {
        items.push(
          <li key={`skeleton-more${i}`} className={`${browseStyles.listItem} ${browseStyles.loading}`}>
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

  const handleTopRightButtonClick = (anime) => {
    setSelectedAnimeForEdit(anime);
    setIsAnimeEditorOpen(true);
  };

  const onAnimeDelete = (animeId) => {
    setUserData(prev => {
      if (!prev?.animes) return prev;
      return {
        ...prev,
        animes: prev.animes.filter(anime => anime.animeId !== animeId)
      };
    });
    setIsAnimeEditorOpen(false);
  };

  const handleAddToLibrary = async (animeId) => {
    if (!userData?._id) return;
    
    try {
      await axiosInstance.post(`/users/${userData._id}/addAnime`, { animeId });
      refreshUserData();
    } catch (err) {
      setError('Failed to add anime to library');
      console.error('Error:', err);
    }
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
            <option value="" disabled>Select a Format</option>
            {ANIME_FORMATS.map(format => (
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

      <div className={`${browseStyles.listSection} ${browseStyles[gridLayout]}`}>
        {displayedAnimes.length === 0 && !isInitialLoading && !isLoadingMore ? (
          <div className={browseStyles.noResults}>
            No anime found matching your criteria
          </div>
        ) : (
          <div className={`${browseStyles.listContainer} ${browseStyles[gridLayout]}`}>
            <ul className={`${browseStyles.list} ${browseStyles[gridLayout]}`}>
              {renderListItems()}
            </ul>
          </div>
        )}
      </div>

      {isAnimeEditorOpen && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div className={modalStyles.characterModal} onClick={(e) => e.stopPropagation()}>
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
