import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import UserAnimeCard from '../cards/userAnimeCard';
import { useUser } from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';

const LAYOUTS = {
    GRID: 'grid',
    COMPACT: 'compact'
  };
  
  const STATUS_TYPES = {
    WATCHING: 'Watching',
    PLANNING: 'Planning',
    COMPLETED: 'Completed'
  };

const AnimeProfile = () => {
    const { animeList } = useAnimeContext();
    const { userData, refreshUserData } = useUser();
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
            setUserAnimeList(response.animes || []);
        } catch (err) {
            console.error('Error fetching user list:', err);
            setError('Failed to load user list. Please try again later.');
            setUserAnimeList([]);
        } finally {
            setIsLoading(false);
        }
    }, [userData?._id]);

    useEffect(() => {
        if (userData?._id) {
            fetchUserList();
        }
    }, [userData?._id, fetchUserList]);
    
    const getMediaById = useCallback((mediaId) => (
        animeList?.find((anime) => anime._id === mediaId)
    ), [animeList]);

    const getTitle = useCallback((titles) => {
        if (!titles) return '';
        const preference = userData?.title || 'english';
        return titles[preference] || titles.english || titles.romaji || titles.native || '';
    }, [userData?.title]);

    const filteredMediaList = useMemo(() => {
        if (!userAnimeList?.length) return [];
        
        return userAnimeList
            .filter((item) => item.status === statusType)
            .map((item) => ({
                ...item,
                mediaDetails: getMediaById(item.animeId),
            }))
            .filter(item => item.mediaDetails) // Filter out items with no media details
            .sort((a, b) => {
                const titleA = getTitle(a.mediaDetails?.titles) || '';
                const titleB = getTitle(b.mediaDetails?.titles) || '';
                return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
            });
    }, [userAnimeList, statusType, getMediaById, getTitle]);

    const handleProgressUpdate = async (id, newProgress) => {
        if (!userData?._id) return;
        
        const currentItem = userAnimeList.find(item => item.animeId === id);
        if (!currentItem) return;
    
        try {
            // Optimistic update
            setUserAnimeList(prevList =>
                prevList.map(item =>
                    item.animeId === id
                        ? { ...item, currentEpisode: newProgress }
                        : item
                )
            );
    
            await axiosInstance.post(`/users/${userData._id}/updateAnime`, {
                animeId: id,
                status: currentItem.status,
                currentEpisode: newProgress
            });
        } catch (err) {
            console.error('Error updating progress:', err);
            setError('Failed to update anime progress. Please try again.');
            fetchUserList(); // Revert changes on error
        }
    };

    const handleTopRightButtonClick = (type, media) => {
        if (type === 'anime' && media) {
            setSelectedAnimeForEdit(media);
            setIsAnimeEditorOpen(true);
        }
    };

    const onAnimeDelete = (animeId) => {
        if (!animeId) return;
        
        setUserAnimeList(prev => prev.filter(anime => anime.animeId !== animeId));
        refreshUserData(prev => {
            if (!prev?.animes) return prev;
            return {
                ...prev,
                animes: prev.animes.filter(anime => anime.animeId !== animeId)
            };
        });
        setIsAnimeEditorOpen(false);
    };

    const onAnimeUpdate = (updatedAnime) => {
        if (!updatedAnime?.animeId) return;
        
        setUserAnimeList(prev => 
            prev.map(anime => 
                anime.animeId === updatedAnime.animeId 
                    ? { ...anime, ...updatedAnime } 
                    : anime
            )
        );
        
        refreshUserData(prev => {
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
                                src={`${process.env.REACT_APP_BACKEND_URL}${userData?.avatar}`}
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
                                    name={getTitle(item.mediaDetails?.titles)}
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
                {isAnimeEditorOpen && selectedAnimeForEdit && (
                    <div className={modalStyles.modalOverlay}>
                        <div className={modalStyles.modalContent}>
                            <AnimeEditor
                            anime={selectedAnimeForEdit}
                            onClose={handleAnimeModalClose}
                            onDelete={onAnimeDelete}
                            onUpdate={onAnimeUpdate}
                            />
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AnimeProfile;