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
  const { user, setUser } = useUser();
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalAnimes, setTotalAnimes] = useState(0);
  const limit = 20;

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

  const fetchAnimes = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/animes/animes?page=${currentPage}&limit=${limit}`);
      const { animes, total, pages } = response.data;
      setAnimeList(animes);
      setTotalPages(pages);
      setTotalAnimes(total);
      setError(null);
    } catch (err) {
      console.error('Error fetching animes:', err);
      setError('Failed to fetch animes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimes();
  }, [currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const renderListItems = () => {
    if (loading) {
      return Array(limit).fill(0).map((_, index) => (
        <li key={index} className={browseStyles.listItem}>
          <SkeletonCard />
        </li>
      ));
    }

    return animeList.map((anime) => (
      <li key={anime._id} className={browseStyles.listItem}>
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
      </li>
    ));
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
        {animeList.length === 0 && !loading ? (
          <div className={browseStyles.noResults}>
            No animes found
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

      <div className={browseStyles.pagination}>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
        >
          Previous
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage === totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Animes;
