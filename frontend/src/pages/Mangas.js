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

const Mangas = () => {
  const { mangaList, setMangaList } = useMangaContext();
  const { user, setUser } = useUser();
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

  const mangaTitle = (titles) => {
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
  };

  const fetchMangas = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/mangas/mangas?page=${currentPage}&limit=${limit}`);
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
    if (!user?._id) return;
    try {
      const response = await axiosInstance.get(`/users/${user._id}/manga-statuses`);
      setUserMangaStatuses(response.data);
    } catch (err) {
      console.error('Error fetching user manga statuses:', err);
    }
  };

  useEffect(() => {
    fetchMangas();
    fetchUserMangaStatuses();
  }, [currentPage, user?._id]);

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

    return mangaList.map((manga) => (
      <li key={manga._id} className={browseStyles.listItem}>
        <MangaCard
          manga={manga}
          title={mangaTitle(manga.titles)}
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
            onChange={(e) => setSearchInput(e.target.value)}
            className={browseStyles.searchInput}
          />
        </div>
        {/* Add other filter components here */}
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
