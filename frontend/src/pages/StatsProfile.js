import React, { useMemo, useState, useCallback, useEffect } from 'react';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import { useUser } from '../Context/ContextApi';

const Stats = () => {
  const { userData } = useUser();
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const fetchUserList = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchWithErrorHandling(`/users/${userData._id}/current`);
      // Combine all anime and manga lists from UserList
      const lists = data.lists || {};
      const combinedAnime = [
        ...(lists.watchingAnime || []).map(item => ({...item, status: 'Watching'})),
        ...(lists.completedAnime || []).map(item => ({...item, status: 'Completed'})),
        ...(lists.planningAnime || []).map(item => ({...item, status: 'Planning'})),
      ];
      const combinedManga = [
        ...(lists.readingManga || []).map(item => ({...item, status: 'Reading'})),
        ...(lists.completedManga || []).map(item => ({...item, status: 'Completed'})),
        ...(lists.planningManga || []).map(item => ({...item, status: 'Planning'})),
      ];
      setUserAnimeList(combinedAnime);
      setUserMangaList(combinedManga);
    } catch (error) {
      console.error('Error fetching user list:', error);
      setError('Failed to load user data');
      setUserAnimeList([]);
      setUserMangaList([]);
    } finally {
      setLoading(false);
    }
  }, [userData._id]);
  
  useEffect(() => {
    if (userData?._id) {
      fetchUserList();
    }
  }, [userData?._id, fetchUserList]);
  
  // Anime stats calculations
  const animeStatusCounts = useMemo(() => {
    return (userAnimeList || []).reduce((acc, item) => {
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
  
  const animeProgressStats = useMemo(() => {
    const useAnimeList = userAnimeList || [];
    const completedSeries = useAnimeList.filter(item => 
      item.status === 'Completed'
    ).length;
  
    const seriesWithProgress = useAnimeList.filter(item => 
      item.currentEpisode > 0
    ).length;
  
    const episodesWatched = useAnimeList.reduce((sum, item) => 
      sum + (item.currentEpisode || 0), 0);
    
    const totalPossibleEpisodes = useAnimeList.reduce((sum, item) => {
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
      completionPercentage,
      totalPossibleEpisodes
    };
  }, [userAnimeList, animeList]);
  
  const animeFormatCounts = useMemo(() => {
    return (userAnimeList || []).reduce((acc, item) => {
      const anime = animeList?.find(a => a._id === item.animeId);
      const format = anime?.typings?.Format?.toLowerCase() || 'other';
      
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
  
  // Manga stats calculations
  const mangaStatusCounts = useMemo(() => {
    return (userMangaList || []).reduce((acc, item) => {
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
  
  const mangaProgressStats = useMemo(() => {
    const useMangaList = userMangaList || [];
    const completedSeries = useMangaList.filter(item => 
      item.status === 'Completed'
    ).length;
  
    const seriesWithProgress = useMangaList.filter(item => 
      item.currentChapter > 0
    ).length;
  
    const chaptersRead = useMangaList.reduce((sum, item) => 
      sum + (item.currentChapter || 0), 0);
    
    const volumesRead = useMangaList.reduce((sum, item) => 
      sum + (item.currentVolume || 0), 0);
    
    const totalPossibleChapters = useMangaList.reduce((sum, item) => {
      const manga = mangaList?.find(m => m._id === item.mangaId);
      const maxChapters = parseInt(manga?.lengths?.chapters || 0);
      
      // If series is ongoing or max chapters unknown, use current progress
      return sum + (maxChapters > 0 ? maxChapters : item.currentChapter);
    }, 0);

    const totalPossibleVolumes = useMangaList.reduce((sum, item) => {
        const manga = mangaList?.find(m => m._id === item.mangaId);
        const maxVolumes = parseInt(manga?.lengths?.volumes || 0);

        return sum + (maxVolumes > 0 ? maxVolumes : item.currentVolume);
    }, 0);
  
    const completionPercentage = seriesWithProgress > 0
      ? Math.round((completedSeries / seriesWithProgress) * 100)
      : 0;
  
    return { 
      chaptersRead, 
      volumesRead,
      completedSeries,
      seriesWithProgress,
      completionPercentage,
      totalPossibleChapters,
      totalPossibleVolumes,
    };
  }, [userMangaList, mangaList]);
  
  const mangaFormatCounts = useMemo(() => {
    return (userMangaList || []).reduce((acc, item) => {
      const manga = mangaList?.find(m => m._id === item.mangaId);
      const format = manga?.typings?.Format?.toLowerCase() || 'other';
      
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

  // Function to render a progress bar
  const renderProgressBar = (current, total, label) => {
    const percentage = total > 0 ? Math.min(100, Math.floor((current / total) * 100)) : 0;
    
    return (
      <div className={profileStyles.progressBarContainer}>
        <div className={profileStyles.progressBarLabel}>
          <span>{label}</span>
          <span>{current} / {total} ({percentage}%)</span>
        </div>
        <div className={profileStyles.progressBarTrack}>
          <div 
            className={profileStyles.progressBarFill} 
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const renderStatCard = (title, value, className) => (
    <div className={`${profileStyles.statCard} ${className || ''}`}>
      <h3>{title}</h3>
      <p>{value}</p>
    </div>
  );

  if (!userData) {
    return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
  }

  if (loading) {
    return <div className={profileStyles.loading}>Loading...</div>;
  }

  if (error) {
    return <div className={profileStyles.error}>{error}</div>;
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
          <div className={profileStyles.statsSection}>
            <h2>Anime Statistics</h2>
            <div className={profileStyles.statsGrid}>
              {renderStatCard('Watching', animeStatusCounts.watching)}
              {renderStatCard('Completed', animeStatusCounts.completed)}
              {renderStatCard('Planning', animeStatusCounts.planning)}
            </div>
            <div className={profileStyles.progressSection}>
              {renderProgressBar(
                animeProgressStats.episodesWatched,
                animeProgressStats.totalPossibleEpisodes,
                'Episodes Watched'
              )}
              {renderProgressBar(
                animeProgressStats.completedSeries,
                animeProgressStats.seriesWithProgress,
                'Series Completed'
              )}
            </div>
            <div className={profileStyles.formatStats}>
              <h3>Format Distribution</h3>
              <div className={profileStyles.formatGrid}>
                {Object.entries(animeFormatCounts).map(([format, count]) => (
                  count > 0 && (
                    <div key={format} className={profileStyles.formatItem}>
                      <span>{format.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>

          <div className={profileStyles.statsSection}>
            <h2>Manga Statistics</h2>
            <div className={profileStyles.statsGrid}>
              {renderStatCard('Reading', mangaStatusCounts.reading)}
              {renderStatCard('Completed', mangaStatusCounts.completed)}
              {renderStatCard('Planning', mangaStatusCounts.planning)}
            </div>
            <div className={profileStyles.progressSection}>
              {renderProgressBar(
                mangaProgressStats.chaptersRead,
                mangaProgressStats.totalPossibleChapters,
                'Chapters Read'
              )}
              {renderProgressBar(
                mangaProgressStats.volumesRead,
                mangaProgressStats.totalPossibleVolumes,
                'Volumes Read'
              )}
              {renderProgressBar(
                mangaProgressStats.completedSeries,
                mangaProgressStats.seriesWithProgress,
                'Series Completed'
              )}
            </div>
            <div className={profileStyles.formatStats}>
              <h3>Format Distribution</h3>
              <div className={profileStyles.formatGrid}>
                {Object.entries(mangaFormatCounts).map(([format, count]) => (
                  count > 0 && (
                    <div key={format} className={profileStyles.formatItem}>
                      <span>{format.replace('_', ' ')}</span>
                      <span>{count}</span>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;