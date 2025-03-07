import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import axiosInstance from '../utils/axiosConfig';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import AnimeEditor from '../Components/ListEditors/AnimeEditor';
import MangaEditor from '../Components/ListEditors/MangaEditor';
import UserAnimeCard from '../cards/userAnimeCard';
import UserMangaCard from '../cards/userMangaCard';
import data from '../Context/ContextApi';
import modalStyles from '../styles/components/Modal.module.css';
import ProfileNavigation from '../Components/Navbars/ProfileNavbar';
import '../styles/components/add_navbar.module.css';
import AnimeProfile from './AnimeProfile';
import MangaProfile from './MangaProfile';
import Stats from './StatsProfile';
import Overview from './OverviewProfile';
import { Routes, Route, Navigate } from 'react-router-dom'

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
  const { userData, setUserData } = useContext(data);
  const [mediaType, setMediaType] = useState(MEDIA_TYPES.ANIME);
  const [statusType, setStatusType] = useState(STATUS_TYPES.WATCHING);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [selectedAnimeForEdit, setSelectedAnimeForEdit] = useState(null);
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [selectedMangaForEdit, setSelectedMangaForEdit] = useState(null);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gridLayout, setGridLayout] = useState(LAYOUTS.GRID);
  const [error, setError] = useState(null);

  const handleMangaModalClose = () => {
    setIsMangaEditorOpen(false);
  };

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
        const titleA = getTitle(a.mediaDetails?.titles) || '';
        const titleB = getTitle(b.mediaDetails?.titles) || '';

        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      });
  }, [userAnimeList, userMangaList, statusType, getMediaById, mediaType, getTitle]);

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

  const handleTopRightButtonClick = (type, media) => {
    if (type === 'anime') {
      setSelectedAnimeForEdit(media);
      setIsAnimeEditorOpen(true);
    } else {
      setSelectedMangaForEdit(media);
      setIsMangaEditorOpen(true);
    }
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

  const onMangaDelete = (mangaId) => {
    setUserMangaList(prev => prev.filter(manga => manga.mangaId !== mangaId));
    setUserData(prev => {
      if (!prev?.mangas) return prev;
      return {
        ...prev,
        mangas: prev.mangas.filter(manga => manga.mangaId !== mangaId)
      };
    });
    setIsMangaEditorOpen(false);
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

  const onMangaUpdate = (updatedManga) => {
    // Update the manga in the userMangaList
    setUserMangaList(prev =>
      prev.map(manga =>
        manga.mangaId === updatedManga.mangaId
          ? { ...manga, ...updatedManga}
          : manga
      )
    );

    // Update userData if needed
    setUserData(prev => {
      if(!prev?.mangas) return prev;
      return {
        ...prev,
        mangas: prev.mangas.map(manga => 
          manga.mangaId === updatedManga.mangaId
            ? { ...manga, ...updatedManga }
            : manga
        )
      };
    });
  };

  const renderColumnHeaders = () => {
    if (gridLayout !== LAYOUTS.COMPACT) return null;

    if (mediaType === MEDIA_TYPES.ANIME) {
      return (
        <div className={profileStyles.columnHeaders}>
          <div className={profileStyles.columnTitle}>Title</div>
          <div className={profileStyles.columnProgress}>Progress</div>
          <div className={profileStyles.columnFormat}>Format</div>
        </div>
      );
    } else {
      return (
        <div className={profileStyles.columnHeaders}>
          <div className={profileStyles.columnTitle}>Title</div>
          <div className={profileStyles.columnChapters}>Chapters</div>
          <div className={profileStyles.columnFormat}>Format</div>
        </div>
      );
    }
  };

  const animeStatusCounts = useMemo(() => {
    return userAnimeList.reduce((acc, item) => {
      switch(item.status) {
        case 'Watching':
          acc.watching++;
          break;
        case 'Planning':
          acc.planning++;
          break;
        case 'Completed':
          acc.completed++;
          break;
        default:
          break;
      }
      return acc;
    }, { watching: 0, planning: 0, completed: 0 });
  }, [userAnimeList]);
  
  const mangaStatusCounts = useMemo(() => {
    return userMangaList.reduce((acc, item) => {
      switch(item.status) {
        case 'Reading':
          acc.reading++;
          break;
        case 'Planning':
          acc.planning++;
          break;
        case 'Completed':
          acc.completed++;
          break;
        default:
          break;
      }
      return acc;
    }, { reading: 0, planning: 0, completed: 0 });
  }, [userMangaList]);
  
  const animeProgressStats = useMemo(() => {
    const completedSeries = userAnimeList.filter(item => 
      item.status === 'Completed'
    ).length;
  
    const seriesWithProgress = userAnimeList.filter(item => 
      item.currentEpisode > 0
    ).length;
  
    const episodesWatched = userAnimeList.reduce((sum, item) => 
      sum + (item.currentEpisode || 0), 0);
    
    const totalPossibleEpisodes = userAnimeList.reduce((sum, item) => {
      const anime = animeList?.find(a => a._id === item.animeId);
      const maxEpisodes = parseInt(anime?.lengths?.Episodes || 0);
      
      // If series is ongoing or max episodes unknown, use current progress
      return sum + (maxEpisodes > 0 ? maxEpisodes : item.currentEpisode);
    }, 0);
  
    const completionPercentage = seriesWithProgress > 0
      ? Math.round((completedSeries / seriesWithProgress) * 100)
      : 0;
  
    return { 
      episodesWatched, 
      completedSeries,
      seriesWithProgress,
      completionPercentage 
    };
  }, [userAnimeList, animeList]);
  
  const mangaProgressStats = useMemo(() => {
    const completedSeries = userMangaList.filter(item => 
      item.status === 'Completed'
    ).length;
  
    const seriesWithProgress = userMangaList.filter(item => 
      item.currentChapter > 0
    ).length;
  
    const chaptersRead = userMangaList.reduce((sum, item) => 
      sum + (item.currentChapter || 0), 0);
    
    const volumesRead = userMangaList.reduce((sum, item) => 
      sum + (item.currentVolume || 0), 0);
    
    const totalPossibleChapters = userMangaList.reduce((sum, item) => {
      const manga = mangaList?.find(m => m._id === item.mangaId);
      const maxChapters = parseInt(manga?.lengths?.chapters || 0);
      
      // If series is ongoing or max chapters unknown, use current progress
      return sum + (maxChapters > 0 ? maxChapters : item.currentChapter);
    }, 0);
  
    const completionPercentage = seriesWithProgress > 0
      ? Math.round((completedSeries / seriesWithProgress) * 100)
      : 0;
  
    return { 
      chaptersRead, 
      volumesRead,
      completedSeries,
      seriesWithProgress,
      completionPercentage 
    };
  }, [userMangaList, mangaList]);
  
  const animeFormatCounts = useMemo(() => {
    return userAnimeList.reduce((acc, item) => {
      const anime = animeList?.find(a => a._id === item.animeId);
      const format = anime?.typings.Format?.toLowerCase() || 'other';
      
      switch(format) {
        case 'tv':
          acc.tv++;
          break;
        case "tv short":
          acc.tv_short++;
          break;
        case 'movie':
          acc.movie++;
          break;
        case 'ova':
          acc.ova++;
          break;
        case 'ona':
          acc.ona++;
          break;
        case 'special':
          acc.special++;
          break;
        case 'music':
          acc.music++;
          break;
        default:
          acc.other++;
      }
      
      return acc;
    }, { tv: 0, tv_short: 0, movie: 0, ova: 0, ona: 0, special: 0, music: 0, other: 0 });
  }, [userAnimeList, animeList]);
  
  const mangaFormatCounts = useMemo(() => {
    return userMangaList.reduce((acc, item) => {
      const manga = mangaList?.find(m => m._id === item.mangaId);
      const format = manga?.typings.Format?.toLowerCase() || 'other';
      
      switch(format) {
        case 'manga':
          acc.manga++;
          break;
        case 'light novel':
          acc.light_novel++;
          break;
        case 'one shot':
          acc.oneShot++;
          break;
        default:
          acc.other++;
      }
      
      return acc;
    }, { manga: 0, light_novel: 0, oneShot: 0, other: 0 });
  }, [userMangaList, mangaList]);

  if (!userData) {
    return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
  }

  return (
    <div className="add-page">
      <ProfileNavigation />
      <div className="add-content">
        <Routes>
          <Route path="/" element={<Navigate to="overview" />} />
          <Route path="overview" element={<Overview />} />
          <Route path="animeProfile" element={<AnimeProfile />} />
          <Route path="mangaProfile" element={<MangaProfile />} />
          <Route path="stats" element={<Stats />} />
        </Routes>
      </div>
    </div>
  );
  // return (
  //   <div className={profileStyles.profilePage}>
  //     <div className={profileStyles.profileHeader}>
  //       <div className={profileStyles.userInfo}>
  //         <div className={profileStyles.avatarContainer}>
  //           <div className={profileStyles.avatar}>
  //             <img
  //               src={`http://localhost:8080${userData?.avatar}`}
  //               alt="Profile"
  //             />
  //           </div>
  //         </div>
  //         <div className={profileStyles.userDetails}>
  //           <h1>{userData.username}</h1>
  //         </div>
  //       </div>

  //       <div className={profileStyles.statsContainer}>
  //         <div className={profileStyles.statCard}>
  //           <h3>Anime Stats</h3>
  //           <div className={profileStyles.statValue}>
  //             {userAnimeList.length || 0} Total
  //           </div>
  //           <div className={profileStyles.statBreakdown}>
  //             <div>{animeStatusCounts.planning} Planning</div>
  //             <div>{animeStatusCounts.watching} Watching</div>
  //             <div>{animeStatusCounts.completed} Completed</div>
  //             <div className={profileStyles.formatStats}>
  //               <div>TV: {animeFormatCounts.tv}</div>
  //               <div>TV Short: {animeFormatCounts.tv_short}</div>
  //               <div>Movies: {animeFormatCounts.movie}</div>
  //               <div>OVA: {animeFormatCounts.ova}</div>
  //               <div>ONA: {animeFormatCounts.ona}</div>
  //               <div>Specials: {animeFormatCounts.special}</div>
  //               <div>Music: {animeFormatCounts.music}</div>
  //               <div>Other: {animeFormatCounts.other}</div>
  //             </div>
  //             <div>Completed Series: {animeProgressStats.completedSeries} / {animeProgressStats.seriesWithProgress}</div>
  //             <div>Completion Rate: {animeProgressStats.completionPercentage}%</div>
  //             <div>Total Episodes Watched: {animeProgressStats.episodesWatched}</div>
  //           </div>
  //         </div>
  //         <div className={profileStyles.statCard}>
  //           <h3>Manga Stats</h3>
  //           <div className={profileStyles.statValue}>
  //             {userMangaList.length || 0} Total
  //           </div>
  //           <div className={profileStyles.statBreakdown}>
  //             <div>{mangaStatusCounts.planning} Planning</div>
  //             <div>{mangaStatusCounts.reading} Reading</div>
  //             <div>{mangaStatusCounts.completed} Completed</div>
  //             <div className={profileStyles.statCard}>
  //               <div>Manga: {mangaFormatCounts.manga}</div>
  //               <div>Light Novel: {mangaFormatCounts.light_novel}</div>
  //               <div>One Shot: {mangaFormatCounts.oneShot}</div>
  //               <div>Other: {mangaFormatCounts.other}</div>
  //             </div>
  //             <div>Completed Series: {mangaProgressStats.completedSeries} / {mangaProgressStats.seriesWithProgress}</div>
  //             <div>Completion Rate: {mangaProgressStats.completionPercentage}%</div>
  //             <div>Total Chapters Read: {mangaProgressStats.chaptersRead}</div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>

  //     <div className={profileStyles.contentSection}>
  //       <div className={profileStyles.controls}>
  //         <div className={profileStyles.tabContainer}>
  //           <button
  //             className={`${profileStyles.tabButton} ${mediaType === MEDIA_TYPES.ANIME ? profileStyles.activeTab : ''}`}
  //             onClick={() => setMediaType(MEDIA_TYPES.ANIME)}
  //           >
  //             Anime
  //           </button>
  //           <button
  //             className={`${profileStyles.tabButton} ${mediaType === MEDIA_TYPES.MANGA ? profileStyles.activeTab : ''}`}
  //             onClick={() => setMediaType(MEDIA_TYPES.MANGA)}
  //           >
  //             Manga
  //           </button>
  //         </div>

  //         <div className={profileStyles.layoutControls}>
  //           {Object.values(LAYOUTS).map((layout) => (
  //             <button
  //               key={layout}
  //               onClick={() => setGridLayout(layout)}
  //               className={`${profileStyles.layoutButton} ${
  //                 gridLayout === layout ? profileStyles.activeLayout : ''
  //               }`}
  //             >
  //               {layout.charAt(0).toUpperCase() + layout.slice(1)}
  //             </button>
  //           ))}
  //         </div>
  //       </div>

  //       <div className={profileStyles.statusTabs}>
  //         {Object.values(STATUS_TYPES).map((status) => (
  //           <button
  //             key={status}
  //             onClick={() => setStatusType(status)}
  //             className={`${profileStyles.statusTab} ${
  //               statusType === status ? profileStyles.activeStatus : ''
  //             }`}
  //           >
  //             {mediaType === MEDIA_TYPES.ANIME && status === STATUS_TYPES.WATCHING
  //               ? 'Watching'
  //               : mediaType === MEDIA_TYPES.MANGA && status === STATUS_TYPES.WATCHING
  //               ? 'Reading'
  //               : status.charAt(0).toUpperCase() + status.slice(1)}
  //           </button>
  //         ))}
  //       </div>

  //       {error && (
  //         <div className={profileStyles.error}>
  //           {error}
  //         </div>
  //       )}

  //       {isLoading ? (
  //         <div className={profileStyles.loading}>Loading...</div>
  //       ) : (
  //         <div className={profileStyles.listContainer}>
  //           {gridLayout === LAYOUTS.COMPACT && renderColumnHeaders()}
  //           <div className={`${profileStyles.contentGrid} ${profileStyles[gridLayout]}`}>
  //             {filteredMediaList.map((item) => (
  //               mediaType === MEDIA_TYPES.ANIME ? (
  //                 <UserAnimeCard
  //                   key={item.animeId}
  //                   anime={item.mediaDetails}
  //                   name={getTitle(item.mediaDetails.titles)}
  //                   layout={gridLayout}
  //                   onTopRightButtonClick={handleTopRightButtonClick}
  //                   userProgress={item.currentEpisode}
  //                   userStatus={item.status}
  //                   onProgressUpdate={(newProgress) => 
  //                     handleProgressUpdate(item.animeId, newProgress)
  //                   }
  //                 />
  //               ) : (
  //                 <UserMangaCard
  //                   key={item.mangaId}
  //                   manga={item.mediaDetails}
  //                   name={getTitle(item.mediaDetails.titles)}
  //                   layout={gridLayout}
  //                   onTopRightButtonClick={handleTopRightButtonClick}
  //                   userProgress={item.currentChapter}
  //                   userStatus={item.status}
  //                   onProgressUpdate={(newProgress) => 
  //                     handleProgressUpdate(item.mangaId, newProgress)
  //                   }
  //                 />
  //               )
  //             ))}
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //     {isAnimeEditorOpen && (
  //       <div className={modalStyles.modalOverlay} onClick={handleAnimeModalClose}>
  //         <div className={modalStyles.characterModal} onClick={(e) => e.stopPropagation()}>
  //           <AnimeEditor
  //             anime={selectedAnimeForEdit}
  //             userId={userData._id}
  //             closeModal={handleAnimeModalClose}
  //             onAnimeDelete={onAnimeDelete}
  //             onAnimeUpdate={onAnimeUpdate}
  //             setUserData={setUserData}
  //           />
  //         </div>
  //       </div>
  //     )}
  //     {isMangaEditorOpen && (
  //       <div className={modalStyles.modalOverlay} onClick={handleMangaModalClose}>
  //         <div className={modalStyles.characterModal} onClick={(e) => e.stopPropagation()}>
  //           <MangaEditor
  //             manga={selectedMangaForEdit}
  //             userId={userData._id}
  //             closeModal={handleMangaModalClose}
  //             onMangaDelete={onMangaDelete}
  //             onMangaUpdate={onMangaUpdate}
  //             setUserData={setUserData}
  //           />
  //         </div>
  //       </div>
  //     )}
  //   </div>
  // );
};

export default Profile;