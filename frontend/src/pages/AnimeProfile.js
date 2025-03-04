import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import UserAnimeCard from '../cards/userAnimeCard';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';

const LAYOUTS = {
    GRID: 'grid',
    COMPACT: 'compact'
  };
  
  const STATUS_TYPES = {
    WATCHING: 'watching',
    PLANNING: 'planning',
    COMPLETED: 'completed'
  };

const AnimeProfile = () => {
    const { animeList } = useAnimeContext();
    const { userData, setUserData } = useContext(data);
    const [statusType, setStatusType] = useState(STATUS_TYPES.WATCHING);
    const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
    const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
    const [userAnimeList, setUserAnimeList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gridLayout, setGridLayout] = useState(LAYOUTS.GRID);
    const [error, setError] = useState(null);

    const handleAnimeModalClose = () => {
        setIsAnimeEditorOpen(false);
    };

    const fetchUserList = useCallback(async () => {
        if (!userData?._id) return;
    
        try {
          setIsLoading(true);
          setError(null);
          const response = await fetchWithErrorHandling(`/users/${userData._id}/current`);
          setUserAnimeList(response.animes);
        } catch (err) {
          setError('Failed to load user list. Please try again later.');
          setUserAnimeList([]);
        } finally {
          setIsLoading(false);
        }
    }, [userData?._id]);

    useEffect(() => {
        if (userData?._id && animeList?.length) {
          fetchUserList();
        }
    }, [userData?._id, animeList, fetchUserList]);
    
    const getMediaById = useCallback((mediaId) => (
        animeList?.find((anime) => anime._id === mediaId)
    ), [animeList]);

    const getTitle = useCallback((titles) => {
        const preference = userData?.title || 'english';
        return titles[preference] || titles.english || titles.romaji || titles.native;
    }, [userData?.title]);

    const filteredMediaList = useMemo(() => {
        const list = userAnimeList;
        if (!list?.length) return [];
        
        const statusMap = {
          [STATUS_TYPES.WATCHING]: 'Watching',
          [STATUS_TYPES.PLANNING]: 'Planning',
          [STATUS_TYPES.COMPLETED]: 'Completed'
        };
        
        return list
          .filter((item) => item.status === statusMap[statusType])
          .map((item) => ({
            ...item,
            mediaDetails: getMediaById(item.animeId),
          }))
          .sort((a, b) => {
            const titleA = getTitle(a.mediaDetails?.titles) || '';
            const titleB = getTitle(b.mediaDetails?.titles) || '';
    
            return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
          });
    }, [userAnimeList, statusType, getMediaById, getTitle]);

    const handleProgressUpdate = async (id, newProgress) => {
        const currentList = userAnimeList;
        const currentItem = currentList.find(item => 
          item.animeId === id
        );
    
        if (!currentItem || !userData?._id) return;
    
        const updateList = setUserAnimeList;
        const progressField = 'currentEpisode';
    
        try {
          // Optimistic update
          updateList(prevList =>
            prevList.map(item =>
              item.animeId === id
                ? { ...item, [progressField]: newProgress }
                : item
            )
          );
    
          const endpoint = `/users/${userData._id}/update${'Anime'}`;
          await axiosInstance.post(endpoint, {
            ['animeId']: id,
            status: currentItem.status,
            [progressField]: newProgress
          });
        } catch (err) {
          setError(`Failed to update anime progress. Please try again.`);
          fetchUserList(); // Revert changes on error
        }
    };

    const handleTopRightButtonClick = (type, media) => {
        if (type === 'anime') {
          setSelectedAnimeForEdit(media);
          setIsAnimeEditorOpen(true);
        };
    };

    const onAnimeDelete = (animeId) => {
        setUserAnimeList(prev => prev.filter(anime => anime.animeId !== animeId));
        setUserData(prev => {
            if (!prev?.animes) return prev;
            return {
            ...prev,
            animes: prev.animes.filter(anime => anime.animeId !== animeId)
            };
        });
        setIsAnimeEditorOpen(false);
    };

    const onAnimeUpdate = (updatedAnime) => {
        // Update the anime in the userAnimeList
        setUserAnimeList(prev => 
          prev.map(anime => 
            anime.animeId === updatedAnime.animeId 
              ? { ...anime, ...updatedAnime } 
              : anime
          )
        );
        
        // Update userData if needed
        setUserData(prev => {
          if (!prev?.animes) return prev;
          return {
            ...prev,
            animes: prev.animes.map(anime => 
              anime.animeId === updatedAnime.animeId 
                ? { ...anime, ...updatedAnime } 
                : anime
            )
          };
        });
        
        setIsAnimeEditorOpen(false);
    };

    const renderColumnHeaders = () => {
        if (gridLayout !== LAYOUTS.COMPACT) return null;

        return (
            <div className={profileStyles.columnHeaders}>
                <div className={profileStyles.columnTitle}>Title</div>
                <div className={profileStyles.columnProgress}>Progress</div>
                <div className={profileStyles.columnFormat}>Format</div>
            </div>
        );

    };

    if (!userData) {
        return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
    };

    return (
        <div className={profileStyles.profilePage}>
            <div className={profileStyles.profileHeader}>
                <div className={profileStyles.userInfo}>
                    <div className={profileStyles.avatarContainer}>
                        <div className={profileStyles.avatar}>
                            <img
                                src={`http://localhost:8080${userData?.avatar}`}
                                alt="Profile"
                            />
                        </div>
                    </div>
                    <div className={profileStyles.userDetails}>
                        <h1>{userData.username}</h1>
                    </div>
                </div>
                <div className={profileStyles.contentSection}>
                    <div className={profileStyles.controls}>
                        <div className={profileStyles.layoutControls}>
                            {Object.values(LAYOUTS).map((layout) => (
                                <button
                                key={layout}
                                onClick={() => setGridLayout(layout)}
                                className={`${profileStyles.layoutButton} ${
                                    gridLayout === layout ? profileStyles.activeLayout : ''
                                }`}
                                >
                                {layout.charAt(0).toUpperCase() + layout.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className={profileStyles.statusTabs}>
                        {Object.values(STATUS_TYPES).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusType(status)}
                            className={`${profileStyles.statusTab} ${
                            statusType === status ? profileStyles.activeStatus : ''
                            }`}
                        >
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                        </button>
                        ))}
                    </div>

                    {error && (
                        <div className={profileStyles.error}>
                        {error}
                        </div>
                    )}

                    {isLoading ? (
                        <div className={profileStyles.loading}>Loading...</div>
                    ) : (
                        <div className={profileStyles.listContainer}>
                            {gridLayout === LAYOUTS.COMPACT && renderColumnHeaders()}
                            <div className={`${profileStyles.contentGrid} ${profileStyles[gridLayout]}`}>
                                {filteredMediaList.map((item) => (
                                    <UserAnimeCard 
                                    key={item.animeId}
                                    anime={item.mediaDetails}
                                    name={getTitle(item.mediaDetails.titles)}
                                    layout={gridLayout}
                                    onTopRightButtonClick={handleTopRightButtonClick}
                                    userProgress={item.currentEpisode}
                                    userStatus={item.status}
                                    onProgressUpdate={(newProgress) => 
                                    handleProgressUpdate(item.animeId, newProgress)
                                    }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                {isAnimeEditorOpen && (
                    <div className={modalStyles.modalOverlay} onClick={handleAnimeModalClose}>
                    <div className={modalStyles.characterModal} onClick={(e) => e.stopPropagation()}>
                        <AnimeEditor
                        anime={selectedAnimeForEdit}
                        userId={userData._id}
                        closeModal={handleAnimeModalClose}
                        onAnimeDelete={onAnimeDelete}
                        onAnimeUpdate={onAnimeUpdate}
                        setUserData={setUserData}
                        />
                    </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AnimeProfile;