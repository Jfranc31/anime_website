import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosConfig';
import { useMangaContext } from '../Context/MangaContext';
import MangaCard from '../cards/MangaCard';
import SkeletonCard from '../cards/SkeletonCard';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import modalStyles from '../styles/components/Modal.module.css';
import browseStyles from '../styles/pages/Browse.module.css';
import { MANGA_FORMATS, AVAILABLE_GENRES, AIRING_STATUS, YEARS } from '../constants/filterOptions';
import { useUser } from '../Context/ContextApi';
import { useTitlePreference } from '../hooks/useTitlePreference';

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { userData, setUserData } = useUser();
  const { getTitle } = useTitlePreference();
  const [userMangaStatuses, setUserMangaStatuses] = useState({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedFormats, setSelectedFormats] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [gridLayout, setGridLayout] = useState('default');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMangas, setTotalMangas] = useState(0);
  const limit = 20;

  const handleModalClose = () => setIsMangaEditorOpen(false);
  const changeLayout = (layout) => setGridLayout(layout);

  const fetchMangas = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: limit,
        ...(searchInput && { search: searchInput }),
        ...(selectedGenres.length > 0 && { genres: selectedGenres.join(',') }),
        ...(selectedFormats.length > 0 && { formats: selectedFormats.join(',') }),
        ...(selectedStatus && { status: selectedStatus }),
        ...(selectedYear && { year: selectedYear })
      });

      const response = await axiosInstance.get(`/mangas/mangas?${params.toString()}`);
      const { mangas, total, pages } = response.data;
      setMangaList(mangas);
      setTotalPages(pages);
      setTotalMangas(total);
      setError(null);
    } catch (err) {
      console.error('Error fetching mangas:', err);
      setError('Failed to fetch mangas');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserMangaStatuses = async () => {
    if (!userData?._id) return;
    try {
      const response = await axiosInstance.get(`/users/${userData._id}/manga-statuses`);
      setUserMangaStatuses(response.data);
    } catch (err) {
      console.error('Error fetching user manga statuses:', err);
    }
  };

  useEffect(() => {
    fetchMangas();
    fetchUserMangaStatuses();
  }, [currentPage, userData?._id, searchInput, selectedGenres, selectedFormats, selectedStatus, selectedYear]);

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

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const renderListItems = () => {
    if (loading) {
      return Array(limit).fill(0).map((_, index) => (
        <li key={index} className={browseStyles.listItem}>
          <SkeletonCard />
        </li>
      ));
    }

    return mangaList.map((manga) => (
      <li key={manga._id} className={browseStyles.listItem}>
        <MangaCard
          manga={manga}
          title={getTitle(manga.titles)}
          userStatus={userMangaStatuses[manga._id]}
          onEditClick={() => {
            setSelectedMangaForEdit(manga);
            setIsMangaEditorOpen(true);
          }}
          onStatusChange={async (newStatus) => {
            if (!userData?._id) return;
            try {
              await axiosInstance.post(`/users/${userData._id}/manga-status`, {
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
            placeholder="Search mangas..."
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
              {MANGA_FORMATS.map(format => (
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
        </div>
      </div>

      <div className={`${browseStyles.listSection} ${browseStyles[gridLayout]}`}>
        {mangaList.length === 0 && !loading ? (
          <div className={browseStyles.noResults}>
            No mangas found
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
              userId={userData?._id}
              closeModal={handleModalClose}
              onMangaDelete={() => {
                handleModalClose();
                fetchMangas();
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

export default Mangas;
