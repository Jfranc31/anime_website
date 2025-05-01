import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useAnimeContext } from '../Context/AnimeContext';
import AnimeCard from '../cards/AnimeCard';
import SkeletonCard from '../cards/SkeletonCard';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { SEASONS, AVAILABLE_GENRES, ANIME_FORMATS, AIRING_STATUS, YEARS } from '../constants/filterOptions';
import { useUser } from '../Context/ContextApi';
import { useTitlePreference } from '../hooks/useTitlePreference';

const Animes = () => {
  const { animeList, setAnimeList } = useAnimeContext();
  const { userData, setUserData } = useUser();
  const { getTitle } = useTitlePreference();
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

  const fetchUserAnimeStatuses = async () => {
    if (!userData?._id) return;
    try {
      const response = await axiosInstance.get(`/users/${userData._id}/anime-statuses`);
      setUserAnimeStatuses(response.data);
    } catch (err) {
      console.error('Error fetching user anime statuses:', err);
    }
  };

  useEffect(() => {
    fetchAnimes();
    fetchUserAnimeStatuses();
  }, [currentPage, userData?._id]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleGenreClick = (genre) => {
    setSelectedGenres(prev => {
      if (prev.includes(genre)) {
        return prev.filter(g => g !== genre);
      }
      return [...prev, genre];
    });
  };

  const handleFormatClick = (format) => {
    setSelectedFormats(prev => {
      if (prev.includes(format)) {
        return prev.filter(f => f !== format);
      }
      return [...prev, format];
    });
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
          title={getTitle(anime.titles)}
          userStatus={userAnimeStatuses[anime._id]}
          onEditClick={() => {
            setSelectedAnimeForEdit(anime);
            setIsAnimeEditorOpen(true);
          }}
          onStatusChange={async (newStatus) => {
            if (!userData?._id) return;
            try {
              await axiosInstance.post(`/users/${userData._id}/anime-status`, {
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
          handleGenreClick={handleGenreClick}
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
        <div className={browseStyles.filters}>
          <div className={browseStyles.genreFilters}>
            <h3>Genres</h3>
            <div className={browseStyles.filterOptions}>
              {AVAILABLE_GENRES.map(genre => (
                <button
                  key={genre}
                  className={`${browseStyles.filterOption} ${selectedGenres.includes(genre) ? browseStyles.selected : ''}`}
                  onClick={() => handleGenreClick(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <div className={browseStyles.filterGroup}>
            <h3>Format</h3>
            <div className={browseStyles.filterOptions}>
              {ANIME_FORMATS.map(format => (
                <button
                  key={format}
                  className={`${browseStyles.filterOption} ${selectedFormats.includes(format) ? browseStyles.selected : ''}`}
                  onClick={() => handleFormatClick(format)}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
          <div className={browseStyles.filterGroup}>
            <h3>Status</h3>
            <div className={browseStyles.filterOptions}>
              {AIRING_STATUS.map(status => (
                <button
                  key={status}
                  className={`${browseStyles.filterOption} ${selectedStatus === status ? browseStyles.selected : ''}`}
                  onClick={() => setSelectedStatus(status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
          <div className={browseStyles.filterGroup}>
            <h3>Year</h3>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className={browseStyles.yearSelect}
            >
              <option value="">All Years</option>
              {YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className={browseStyles.filterGroup}>
            <h3>Season</h3>
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className={browseStyles.seasonSelect}
            >
              <option value="">All Seasons</option>
              {SEASONS.map(season => (
                <option key={season} value={season}>{season}</option>
              ))}
            </select>
          </div>
        </div>
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
              userId={userData?._id}
              closeModal={handleModalClose}
              onAnimeDelete={() => {
                handleModalClose();
                fetchAnimes();
              }}
              setUser={setUserData}
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
