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
import { fetchWithErrorHandling } from '../utils/apiUtils';

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

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const fetchAnimes = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...(searchInput && { search: searchInput }),
        ...(selectedGenres.length > 0 && { genres: selectedGenres.join(',') }),
        ...(selectedFormats.length > 0 && { formats: selectedFormats.join(',') }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedYear && { year: selectedYear }),
        ...(selectedSeason && { season: selectedSeason })
      });

      const response = await axiosInstance.get(`/animes/animes?${params.toString()}`);
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
  }, [
    currentPage,
    userData?._id,
    searchInput,
    selectedGenres,
    selectedFormats,
    selectedStatus,
    selectedYear,
    selectedSeason
  ]);

  useEffect(() => {
    const fetchUserStatuses = async () => {
      try {
        const response = await fetchWithErrorHandling(`/users/${userData._id}/anime-statuses`);
        setUserAnimeStatuses(response || {});
      } catch (error) {
        console.error('Error fetching user anime statuses:', error);
        setUserAnimeStatuses({});
      }
    };

    if (userData?._id) {
      fetchUserStatuses();
    }
  }, [userData?._id]);

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
            onChange={handleSearch}
            className={browseStyles.searchInput}
          />
        </div>
        <div className={browseStyles.filters}>
          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Genres</h3>
            <div className={browseStyles.selectedFilters}>
              {selectedGenres.map(genre => (
                <div key={genre} className={browseStyles.selectedFilter}>
                  {genre}
                  <button
                    className={browseStyles.removeGenreBtn}
                    onClick={() => handleGenreClick(genre)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <select
              className={browseStyles.genreSelect}
              onChange={(e) => {
                if (e.target.value) {
                  handleGenreClick(e.target.value);
                  e.target.value = ''; // Reset the select
                }
              }}
            >
              <option value="">Select a genre...</option>
              {AVAILABLE_GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Format</h3>
            <div className={browseStyles.selectedFilters}>
              {selectedFormats.map(format => (
                <div key={format} className={browseStyles.selectedFilter}>
                  {format}
                  <button
                    className={browseStyles.removeGenreBtn}
                    onClick={() => handleFormatClick(format)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <select
              className={browseStyles.filterSelect}
              onChange={(e) => {
                if (e.target.value) {
                  handleFormatClick(e.target.value);
                  e.target.value = ''; // Reset the select
                }
              }}
            >
              <option value="">Select a format...</option>
              {ANIME_FORMATS.map(format => (
                <option key={format} value={format}>{format}</option>
              ))}
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Status</h3>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={browseStyles.filterSelect}
            >
              <option value="">All Statuses</option>
              {AIRING_STATUS.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div className={browseStyles.filterSection}>
            <h3 className={browseStyles.filterTitle}>Year</h3>
            <select
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
            <h3 className={browseStyles.filterTitle}>Season</h3>
            <select
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
