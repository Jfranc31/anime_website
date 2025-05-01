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
const DEBOUNCE_DELAY = 300; // ms delay for search debouncing

const Animes = () => {
  const { animeList, setAnimeList } = useAnimeContext();
  const { user, setUser } = useUser();
  const [userAnimeStatuses, setUserAnimeStatuses] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedAnimes, setDisplayedAnimes] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSeason, setSelectedSeason] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [error, setError] = useState(null);

  const observer = useRef();
  const filteredAnimesRef = useRef([]);
  const isLoadingRef = useRef(false);
  const debounceTimeout = useRef(null);

  const handleModalClose = () => setIsAnimeEditorOpen(false);
  const changeLayout = (layout) => setGridLayout(layout);

  const animeTitle = useCallback((titles) => {
    if (!titles) return 'Unknown Title';
    switch (user?.preferences?.titleLanguage) {
      case 'english':
        return titles.english || titles.romaji;
      case 'romaji':
        return titles.romaji || titles.english;
      case 'native':
        return titles.native;
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  }, [user?.preferences?.titleLanguage]);

  // Debounce search input
  useEffect(() => {
    setIsSearching(true);
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setIsSearching(false);
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [searchInput]);

  // Handle anime loading transitions
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

  // Initialize loading states for new animes
  useEffect(() => {
    displayedAnimes.forEach(anime => {
      if (loadingStates[anime._id] === undefined) {
        handleAnimeLoad(anime._id);
      }
    });
  }, [displayedAnimes, handleAnimeLoad, loadingStates]);

  // Initial data fetch
  useEffect(() => {
    setIsInitialLoading(true);
    fetchAnimes();
  }, []);

  const fetchAnimes = async () => {
    try {
      const response = await axiosInstance.get('/animes/animes');
      setAnimeList(response.data.animes);
      setError(null);
    } catch (err) {
      console.error('Error fetching animes:', err);
      setError('Failed to fetch animes');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Filter and sort anime list
  const filterAndSortAnimes = useCallback(() => {
    if (!Array.isArray(animeList)) return [];

    return animeList.filter(anime => {
      const titles = anime.titles || {};
      const english = titles.english || '';
      const romaji = titles.romaji || '';
      const native = titles.native || '';
      const alterNames = titles.alterNames || [];

      const namesToCheck = [
        english,
        romaji,
        native,
        ...(Array.isArray(alterNames) ? alterNames : [alterNames]),
      ].map(name => (typeof name === 'string' ? name : '').toLowerCase());

      return namesToCheck.some(name => name.includes(debouncedSearch.toLowerCase()));
    }).sort((a, b) => {
      const aTitle = animeTitle(a.titles).toLowerCase();
      const bTitle = animeTitle(b.titles).toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [animeList, debouncedSearch, animeTitle]);

  // Update filtered animes when filters change
  useEffect(() => {
    if (!animeList || isSearching) return;

    setDisplayedAnimes([]); // Clear current display
    filteredAnimesRef.current = filterAndSortAnimes();

    // Load initial batch
    const initialBatch = filteredAnimesRef.current.slice(0, ANIMES_PER_PAGE);
    setDisplayedAnimes(initialBatch);
    setHasMore(filteredAnimesRef.current.length > ANIMES_PER_PAGE);
  }, [filterAndSortAnimes, animeList, isSearching]);

  // Load more animes
  const loadMoreAnimes = useCallback(() => {
    if (isLoadingRef.current || !hasMore || isSearching) return;

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
  }, [displayedAnimes.length, hasMore, isSearching]);

  // Intersection Observer setup
  const lastAnimeElementRef = useCallback(node => {
    if (isLoadingMore || isSearching) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreAnimes();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMoreAnimes, isSearching]);

  const renderListItems = () => {
    const items = [];

    displayedAnimes.forEach((anime, index) => {
      const isLoading = loadingStates[anime._id];
      items.push(
        <li
          key={anime._id}
          ref={index === displayedAnimes.length - 1 ? lastAnimeElementRef : null}
          className={`${browseStyles.listItem} ${isLoading ? browseStyles.loading : browseStyles.loaded}`}
        >
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <div className={browseStyles.fadeIn}>
              <AnimeCard
                anime={anime}
                userStatus={userAnimeStatuses[anime._id]}
                onEditClick={() => {
                  setSelectedAnimeForEdit(anime);
                  setIsAnimeEditorOpen(true);
                }}
                onStatusChange={async (newStatus) => {
                  if (!user?._id) return;
                  try {
                    await axiosInstance.post(`/users/${user._id}/anime-status`, {
                      animeId: anime._id,
                      status: newStatus
                    });
                    setUserAnimeStatuses(prev => ({
                      ...prev,
                      [anime._id]: newStatus
                    }));
                  } catch (error) {
                    console.error('Error updating anime status:', error);
                  }
                }}
              />
            </div>
          )}
        </li>
      );
    });

    if ((isLoadingMore || isSearching) && hasMore) {
      for (let i = 0; i < 4; i++) {
        items.push(
          <li key={`skeleton-more-${i}`} className={`${browseStyles.listItem} ${browseStyles.loading}`}>
            <SkeletonCard />
          </li>
        );
      }
    }

    return items;
  };

  return (
    <div className={browseStyles.browseContainer}>
      <div className={browseStyles.filterContainer}>
        <div className={browseStyles.searchContainer}>
          <input
            type="text"
            placeholder="Search animes..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
        {/* Add other filter components here */}
      </div>

      <div className={`${browseStyles.listSection} ${browseStyles[gridLayout]}`}>
        {displayedAnimes.length === 0 && !isInitialLoading && !isLoadingMore && !isSearching ? (
          <div className={browseStyles.noResults}>
            No animes found matching your criteria
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
              userId={user?._id}
              closeModal={handleModalClose}
              onAnimeDelete={() => {
                handleModalClose();
                fetchAnimes();
              }}
              setUser={setUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Animes;
