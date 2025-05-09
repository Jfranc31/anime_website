import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import profileStyles from '../styles/pages/Profile.module.css';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import UserMangaCard from '../cards/userMangaCard';
import { useUser } from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';

const LAYOUTS = {
    GRID: 'grid',
    COMPACT: 'compact'
};
  
const STATUS_TYPES = {
    READING: 'reading',
    PLANNING: 'planning',
    COMPLETED: 'completed'
};

const MangaProfile = () => {
    const { mangaList } = useMangaContext();
    const { userData, refreshUserData } = useUser();
    const [statusType, setStatusType] = useState(STATUS_TYPES.READING);
    const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
    const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
    const [userMangaList, setUserMangaList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [gridLayout, setGridLayout] = useState(LAYOUTS.GRID);
    const [error, setError] = useState(null);

    const handleMangaModalClose = () => {
        setIsMangaEditorOpen(false);
    };

    const fetchUserList = useCallback(async () => {
        if (!userData?._id) return;
    
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetchWithErrorHandling(`/users/${userData._id}/current`);
            // Combine all manga lists from UserList
            const lists = response.lists || {};
            const combined = [
                ...(lists.readingManga || []).map(item => ({...item, status: 'Reading'})),
                ...(lists.completedManga || []).map(item => ({...item, status: 'Completed'})),
                ...(lists.planningManga || []).map(item => ({...item, status: 'Planning'})),
            ];
            setUserMangaList(combined);
        } catch (err) {
            console.error('Error fetching user list:', err);
            setError('Failed to load user list. Please try again later.');
            setUserMangaList([]);
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
        userMangaList?.find((manga) => manga.mangaId?._id === mediaId)?.mangaId || null
    ), [userMangaList]);

    const getTitle = useCallback((titles) => {
        if (!titles) return '';
        const preference = userData?.title || 'english';
        return titles[preference] || titles.english || titles.romaji || titles.native || '';
    }, [userData?.title]);

    const filteredMediaList = useMemo(() => {
        if (!userMangaList?.length) return [];
        const statusMap = {
            [STATUS_TYPES.READING]: 'Reading',
            [STATUS_TYPES.PLANNING]: 'Planning',
            [STATUS_TYPES.COMPLETED]: 'Completed'
        };
        return userMangaList
            .filter((item) => item.status === statusMap[statusType])
            .map((item) => ({
                ...item,
                mediaDetails: item.mangaId, // Populated manga details
            }))
            .filter(item => item.mediaDetails)
            .sort((a, b) => {
                const titleA = getTitle(a.mediaDetails?.titles) || '';
                const titleB = getTitle(b.mediaDetails?.titles) || '';
                return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
            });
    }, [userMangaList, statusType, getTitle]);

    const handleProgressUpdate = async (id, newProgress) => {
        if (!userData?._id) return;
        
        const currentItem = userMangaList.find(item => item.mangaId._id === id);
        if (!currentItem) return;
    
        try {
            // Optimistic update
            setUserMangaList(prevList =>
                prevList.map(item =>
                    item.mangaId._id === id
                        ? { ...item, progress: newProgress }
                        : item
                )
            );
    
            await axiosInstance.post(`/users/${userData._id}/updateManga`, {
                mangaId: id,
                status: currentItem.status,
                currentChapter: newProgress,
                currentVolume: currentItem.currentVolume
            });
        } catch (err) {
            console.error('Error updating progress:', err);
            setError('Failed to update manga progress. Please try again.');
            fetchUserList(); // Revert changes on error
        }
    };

    const handleTopRightButtonClick = (type, media) => {
        if (type === 'manga' && media) {
            setSelectedMangaForEdit(media);
            setIsMangaEditorOpen(true);
        }
    };

    const onMangaDelete = (mangaId) => {
        if (!mangaId) return;
        
        setUserMangaList(prev => prev.filter(manga => manga.mangaId !== mangaId));
        refreshUserData(prev => {
            if (!prev?.mangas) return prev;
            return {
                ...prev,
                mangas: prev.mangas.filter(manga => manga.mangaId !== mangaId)
            };
        });
        setIsMangaEditorOpen(false);
    };

    const onMangaUpdate = (updatedManga) => {
        if (!updatedManga?.mangaId) return;
        
        setUserMangaList(prev =>
            prev.map(manga =>
                manga.mangaId === updatedManga.mangaId
                    ? { ...manga, ...updatedManga }
                    : manga
            )
        );
    
        refreshUserData(prev => {
            if (!prev?.mangas) return prev;
            return {
                ...prev,
                mangas: prev.mangas.map(manga => 
                    manga.mangaId === updatedManga.mangaId
                        ? { ...manga, ...updatedManga }
                        : manga
                )
            };
        });
        
        setIsMangaEditorOpen(false);
    };

    const renderColumnHeaders = () => {
        if (gridLayout !== LAYOUTS.COMPACT) return null;

        return (
            <div className={profileStyles.columnHeaders}>
                <div className={profileStyles.columnTitle}>Title</div>
                <div className={profileStyles.columnChapters}>Chapters</div>
                <div className={profileStyles.columnFormat}>Format</div>
            </div>
        );
    };

    if (!userData) {
        return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
    }

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
                                    <UserMangaCard 
                                        key={item.mangaId}
                                        manga={item.mediaDetails}
                                        name={getTitle(item.mediaDetails?.titles)}
                                        layout={gridLayout}
                                        onTopRightButtonClick={handleTopRightButtonClick}
                                        userProgress={item.progress}
                                        userStatus={item.status}
                                        onProgressUpdate={(newProgress) => 
                                            handleProgressUpdate(item.mangaId, newProgress)
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {isMangaEditorOpen && selectedMangaForEdit && (
                <div className={modalStyles.modalOverlay} onClick={handleMangaModalClose}>
                    <div className={modalStyles.modalContent} onClick={e => e.stopPropagation()}>
                        <MangaEditor
                            manga={selectedMangaForEdit}
                            userId={userData._id}
                            closeModal={handleMangaModalClose}
                            onMangaDelete={onMangaDelete}
                            onMangaUpdate={onMangaUpdate}
                            setUserData={refreshUserData}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MangaProfile;