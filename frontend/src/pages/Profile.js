import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import UserAnimeCard from '../cards/userAnimeCard';
import MangaCard from '../cards/MangaCard';
import data from '../Context/ContextApi';

const LAYOUTS = {
  GRID: 'grid',
  COMPACT: 'compact'
};

const STATUS_TYPES = {
  WATCHING: 'watching',
  PLANNING: 'planning',
  COMPLETED: 'completed'
};

const MEDIA_TYPES = {
  ANIME: 'anime',
  MANGA: 'manga'
};

const Profile = () => {
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const { userData } = useContext(data);
  const [mediaType, setMediaType] = useState(MEDIA_TYPES.ANIME);
  const [statusType, setStatusType] = useState(STATUS_TYPES.WATCHING);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState(LAYOUTS.GRID);
  const [error, setError] = useState(null);

  const fetchUserList = useCallback(async () => {
    if (!userData?._id) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchWithErrorHandling(`/users/${userData._id}/current`);
      setUserAnimeList(response.animes);
      setUserMangaList(response.mangas);
    } catch (err) {
      setError('Failed to load user list. Please try again later.');
      setUserAnimeList([]);
      setUserMangaList([]);
    } finally {
      setIsLoading(false);
    }
  }, [userData?._id]);

  useEffect(() => {
    if (userData?._id && animeList?.length && mangaList?.length) {
      fetchUserList();
    }
  }, [userData?._id, animeList, mangaList, fetchUserList]);

  const getMediaById = useCallback((mediaId, type) => (
    type === MEDIA_TYPES.ANIME 
      ? animeList?.find((anime) => anime._id === mediaId)
      : mangaList?.find((manga) => manga._id === mediaId)
  ), [animeList, mangaList]);

  const getTitle = useCallback((titles) => {
    const preference = userData?.title || 'english';
    return titles[preference] || titles.english || titles.romaji || titles.native;
  }, [userData?.title]);

  const filteredMediaList = useMemo(() => {
    const list = mediaType === MEDIA_TYPES.ANIME ? userAnimeList : userMangaList;
    if (!list?.length) return [];
    
    const statusMap = {
      [STATUS_TYPES.WATCHING]: mediaType === MEDIA_TYPES.ANIME ? 'Watching' : 'Reading',
      [STATUS_TYPES.PLANNING]: 'Planning',
      [STATUS_TYPES.COMPLETED]: 'Completed'
    };
    
    return list
      .filter((item) => item.status === statusMap[statusType])
      .map((item) => ({
        ...item,
        mediaDetails: getMediaById(
          mediaType === MEDIA_TYPES.ANIME ? item.animeId : item.mangaId,
          mediaType
        ),
      }))
      .sort((a, b) => {
        const titleA = a.mediaDetails?.titles?.[userData?.title] || '';
        const titleB = b.mediaDetails?.titles?.[userData?.title] || '';

        return titleA.localeCompare(titleB);
      });
  }, [userAnimeList, userMangaList, statusType, getMediaById, mediaType, userData?.title]);

  const handleProgressUpdate = async (id, newProgress) => {
    const isAnime = mediaType === MEDIA_TYPES.ANIME;
    const currentList = isAnime ? userAnimeList : userMangaList;
    const currentItem = currentList.find(item => 
      isAnime ? item.animeId === id : item.mangaId === id
    );

    if (!currentItem || !userData?._id) return;

    const updateList = isAnime ? setUserAnimeList : setUserMangaList;
    const progressField = isAnime ? 'currentEpisode' : 'currentChapter';

    try {
      // Optimistic update
      updateList(prevList =>
        prevList.map(item =>
          (isAnime ? item.animeId : item.mangaId) === id
            ? { ...item, [progressField]: newProgress }
            : item
        )
      );

      const endpoint = `/users/${userData._id}/update${isAnime ? 'Anime' : 'Manga'}`;
      await axiosInstance.post(endpoint, {
        [isAnime ? 'animeId' : 'mangaId']: id,
        status: currentItem.status,
        [progressField]: newProgress,
        ...(isAnime ? {} : { currentVolume: currentItem.currentVolume })
      });
    } catch (err) {
      setError(`Failed to update ${mediaType} progress. Please try again.`);
      fetchUserList(); // Revert changes on error
    }
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
                src={`http://localhost:8080${userData?.avatar}`}
                alt="Profile"
              />
            </div>
          </div>
          <div className={profileStyles.userDetails}>
            <h1>{userData.username}</h1>
          </div>
        </div>

        <div className={profileStyles.statsContainer}>
          <div className={profileStyles.statCard}>
            <h3>Anime Stats</h3>
            <div className={profileStyles.statValue}>
              {userAnimeList.length || 0} Total
            </div>
          </div>
          <div className={profileStyles.statCard}>
            <h3>Manga Stats</h3>
            <div className={profileStyles.statValue}>
              {userMangaList.length || 0} Total
            </div>
          </div>
        </div>
      </div>

      <div className={profileStyles.contentSection}>
        <div className={profileStyles.controls}>
          <div className={profileStyles.tabContainer}>
            <button
              className={`${profileStyles.tabButton} ${mediaType === MEDIA_TYPES.ANIME ? profileStyles.activeTab : ''}`}
              onClick={() => setMediaType(MEDIA_TYPES.ANIME)}
            >
              Anime
            </button>
            <button
              className={`${profileStyles.tabButton} ${mediaType === MEDIA_TYPES.MANGA ? profileStyles.activeTab : ''}`}
              onClick={() => setMediaType(MEDIA_TYPES.MANGA)}
            >
              Manga
            </button>
          </div>

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
              {mediaType === MEDIA_TYPES.ANIME && status === STATUS_TYPES.WATCHING
                ? 'Watching'
                : mediaType === MEDIA_TYPES.MANGA && status === STATUS_TYPES.WATCHING
                ? 'Reading'
                : status.charAt(0).toUpperCase() + status.slice(1)}
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
          <div className={`${profileStyles.contentGrid} ${profileStyles[gridLayout]}`}>
            {filteredMediaList.map((item) => (
              mediaType === MEDIA_TYPES.ANIME ? (
                <UserAnimeCard
                  key={item.animeId}
                  anime={item.mediaDetails}
                  name={getTitle(item.mediaDetails.titles)}
                  layout={gridLayout}
                  userProgress={item.currentEpisode}
                  userStatus={item.status}
                  onProgressUpdate={(newProgress) => 
                    handleProgressUpdate(item.animeId, newProgress)
                  }
                />
              ) : (
                <MangaCard
                  key={item.mangaId}
                  manga={item.mediaDetails}
                  name={getTitle(item.mediaDetails.titles)}
                  layout={gridLayout}
                  userProgress={item.currentChapter}
                  onProgressUpdate={(newProgress) => 
                    handleProgressUpdate(item.mangaId, newProgress)
                  }
                />
              )
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Profile;