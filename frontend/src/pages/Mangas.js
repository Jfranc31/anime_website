import React, { useState, useEffect, useRef, useCallback } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import SkeletonCard from '../cards/SkeletonCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { MANGA_FORMATS, AVAILABLE_GENRES, AIRING_STATUS, YEARS } from '../constants/filterOptions';
import { useUser } from '../Context/ContextApi';

const MANGAS_PER_PAGE = 18;
const DEBOUNCE_DELAY = 300; // ms delay for search debouncing

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { user, setUser } = useUser();
  const [userMangaStatuses, setUserMangaStatuses] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [displayedMangas, setDisplayedMangas] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const [isSearching, setIsSearching] = useState(false);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [error, setError] = useState(null);

  const observer = useRef();
  const filteredMangasRef = useRef([]);
  const isLoadingRef = useRef(false);
  const debounceTimeout = useRef(null);

  const handleModalClose = () => setIsMangaEditorOpen(false);
  const changeLayout = (layout) => setGridLayout(layout);

  const mangaTitle = useCallback((titles) => {
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

  // Handle manga loading transitions
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

  // Initialize loading states for new mangas
  useEffect(() => {
    displayedMangas.forEach(manga => {
      if (loadingStates[manga._id] === undefined) {
        handleMangaLoad(manga._id);
      }
    });
  }, [displayedMangas, handleMangaLoad, loadingStates]);

  // Initial data fetch
  useEffect(() => {
    setIsInitialLoading(true);
    fetchMangas();
  }, []);

  const fetchMangas = async () => {
    try {
      const response = await axiosInstance.get('/mangas/mangas');
      setMangaList(response.data.mangas);
      setError(null);
    } catch (err) {
      console.error('Error fetching mangas:', err);
      setError('Failed to fetch mangas');
    } finally {
      setIsInitialLoading(false);
    }
  };

  // Filter and sort manga list
  const filterAndSortMangas = useCallback(() => {
    if (!Array.isArray(mangaList)) return [];

    return mangaList.filter(manga => {
      const titles = manga.titles || {};
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
      const aTitle = mangaTitle(a.titles).toLowerCase();
      const bTitle = mangaTitle(b.titles).toLowerCase();
      return aTitle.localeCompare(bTitle);
    });
  }, [mangaList, debouncedSearch, mangaTitle]);

  // Update filtered mangas when filters change
  useEffect(() => {
    if (!mangaList || isSearching) return;

    setDisplayedMangas([]); // Clear current display
    filteredMangasRef.current = filterAndSortMangas();

    // Load initial batch
    const initialBatch = filteredMangasRef.current.slice(0, MANGAS_PER_PAGE);
    setDisplayedMangas(initialBatch);
    setHasMore(filteredMangasRef.current.length > MANGAS_PER_PAGE);
  }, [filterAndSortMangas, mangaList, isSearching]);

  // Load more mangas
  const loadMoreMangas = useCallback(() => {
    if (isLoadingRef.current || !hasMore || isSearching) return;

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
  }, [displayedMangas.length, hasMore, isSearching]);

  // Intersection Observer setup
  const lastMangaElementRef = useCallback(node => {
    if (isLoadingMore || isSearching) return;

    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMangas();
      }
    });

    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, loadMoreMangas, isSearching]);

  const renderListItems = () => {
    const items = [];

    displayedMangas.forEach((manga, index) => {
      const isLoading = loadingStates[manga._id];
      items.push(
        <li
          key={manga._id}
          ref={index === displayedMangas.length - 1 ? lastMangaElementRef : null}
          className={`${browseStyles.listItem} ${isLoading ? browseStyles.loading : browseStyles.loaded}`}
        >
          {isLoading ? (
            <SkeletonCard />
          ) : (
            <div className={browseStyles.fadeIn}>
              <MangaCard
                manga={manga}
                userStatus={userMangaStatuses[manga._id]}
                onEditClick={() => {
                  setSelectedMangaForEdit(manga);
                  setIsMangaEditorOpen(true);
                }}
                onStatusChange={async (newStatus) => {
                  if (!user?._id) return;
                  try {
                    await axiosInstance.post(`/users/${user._id}/manga-status`, {
                      mangaId: manga._id,
                      status: newStatus
                    });
                    setUserMangaStatuses(prev => ({
                      ...prev,
                      [manga._id]: newStatus
                    }));
                  } catch (error) {
                    console.error('Error updating manga status:', error);
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
            placeholder="Search mangas..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
        {/* Add other filter components here */}
      </div>

      <div className={`${browseStyles.listSection} ${browseStyles[gridLayout]}`}>
        {displayedMangas.length === 0 && !isInitialLoading && !isLoadingMore && !isSearching ? (
          <div className={browseStyles.noResults}>
            No mangas found matching your criteria
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
              userId={user?._id}
              closeModal={handleModalClose}
              onMangaDelete={() => {
                handleModalClose();
                fetchMangas();
              }}
              setUser={setUser}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Mangas;
