import React, { useContext, useMemo, useState, useCallback, useEffect } from 'react';
import profileStyles from '../styles/pages/Profile.module.css';
import data from '../Context/ContextApi';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';

const Stats = () => {
  const { userData } = useContext(data);
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [hasMoreAnime, setHasMoreAnime] = useState(true);
  const [hasMoreManga, setHasMoreManga] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(false);
  const [loadingManga, setLoadingManga] = useState(false);
  const [animeActivities, setAnimeActivities] = useState([]);
  const [mangaActivities, setMangaActivities] = useState([]);
  
  const fetchActivities = useCallback(async (type, page, append = false) => {
    const setLoading = type === 'anime' ? setLoadingAnime : setLoadingManga;
    const setActivities = type === 'anime' ? setAnimeActivities : setMangaActivities;
    const setHasMore = type === 'anime' ? setHasMoreAnime : setHasMoreManga;
  
    try {
      setLoading(true);
      const response = await fetchWithErrorHandling(
        `/latest-activities/${userData._id}?page=${page}&limit=8&type=${type}`
      );
      
      const sortedActivities = response.activities.sort(
        (a, b) => new Date(b.activityTimestamp) - new Date(a.activityTimestamp)
      );
  
      setActivities(prev => 
        append ? [...prev, ...sortedActivities] : sortedActivities
      );
      setHasMore(response.pagination.hasMore);
    } catch (error) {
      if (!append) {
        setActivities([]);
      }
    } finally {
      setLoading(false);
    }
  }, [userData._id]);
  
  const fetchUserList = useCallback(async () => {
    try {
      const data = await fetchWithErrorHandling(`/users/${userData._id}/current`);
      setUserAnimeList(data.animes);
      setUserMangaList(data.mangas);
    } catch (error) {
      setUserAnimeList([]);
      setUserMangaList([]);
    }
  }, [userData._id]);
  
  useEffect(() => {
    fetchActivities('anime', 1, false);
    fetchActivities('manga', 1, false);
    fetchUserList();
  }, [userData._id, fetchActivities, fetchUserList]);
  
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

  // Function to render stat cards
  const renderStatCard = (title, value, className) => (
    <div className={`${profileStyles.statCard} ${className || ''}`}>
      <h3>{title}</h3>
      <div className={profileStyles.statValue}>{value}</div>
    </div>
  );

  if (!userData) {
    return <div className={profileStyles.noUser}>Please log in to view your stats.</div>;
  }

  return (
    <div className={profileStyles.profilePage}>
      <div className={profileStyles.statsContainer}>
        <h1>Your Statistics</h1>
        
        {/* Overview Stats */}
        <section className={profileStyles.statsSection}>
          <h2>Overview</h2>
          <div className={profileStyles.statsGrid}>
            {renderStatCard("Total Anime", userAnimeList.length || 0, profileStyles.animeCard)}
            {renderStatCard("Total Manga", userMangaList.length || 0, profileStyles.mangaCard)}
            {renderStatCard("Episodes Watched", animeProgressStats.episodesWatched, profileStyles.episodesCard)}
            {renderStatCard("Chapters Read", mangaProgressStats.chaptersRead, profileStyles.chaptersCard)}
          </div>
        </section>
        
        {/* Anime Stats */}
        <section className={profileStyles.statsSection}>
          <h2>Anime Statistics</h2>
          
          <div className={profileStyles.statSubsection}>
            <h3>Status Distribution</h3>
            <div className={profileStyles.statsGrid}>
              {renderStatCard("Watching", animeStatusCounts.watching, profileStyles.watchingCard)}
              {renderStatCard("Completed", animeStatusCounts.completed, profileStyles.completedCard)}
              {renderStatCard("Planning", animeStatusCounts.planning, profileStyles.planningCard)}
            </div>
          </div>
          
          <div className={profileStyles.statSubsection}>
            <h3>Format Distribution</h3>
            <div className={profileStyles.statsGrid}>
              {renderStatCard("TV", animeFormatCounts.tv, profileStyles.tvCard)}
              {renderStatCard("Movies", animeFormatCounts.movie, profileStyles.movieCard)}
              {renderStatCard("OVA/ONA", animeFormatCounts.ova + animeFormatCounts.ona, profileStyles.ovaCard)}
              {renderStatCard("Specials", animeFormatCounts.special, profileStyles.specialCard)}
            </div>
          </div>
          
          <div className={profileStyles.statSubsection}>
            <h3>Completion Progress</h3>
            {renderProgressBar(
              animeProgressStats.episodesWatched, 
              animeProgressStats.totalPossibleEpisodes,
              "Episodes Watched"
            )}
            
            {renderProgressBar(
              animeProgressStats.completedSeries,
              userAnimeList.length || 0,
              "Series Completed"
            )}
          </div>
        </section>
        
        {/* Manga Stats */}
        <section className={profileStyles.statsSection}>
          <h2>Manga Statistics</h2>
          
          <div className={profileStyles.statSubsection}>
            <h3>Status Distribution</h3>
            <div className={profileStyles.statsGrid}>
              {renderStatCard("Reading", mangaStatusCounts.reading, profileStyles.readingCard)}
              {renderStatCard("Completed", mangaStatusCounts.completed, profileStyles.completedCard)}
              {renderStatCard("Planning", mangaStatusCounts.planning, profileStyles.planningCard)}
            </div>
          </div>
          
          <div className={profileStyles.statSubsection}>
            <h3>Format Distribution</h3>
            <div className={profileStyles.statsGrid}>
              {renderStatCard("Manga", mangaFormatCounts.manga, profileStyles.mangaFormatCard)}
              {renderStatCard("Light Novels", mangaFormatCounts.light_novel, profileStyles.novelCard)}
              {renderStatCard("One-shots", mangaFormatCounts.oneShot, profileStyles.oneshotCard)}
            </div>
          </div>
          
          <div className={profileStyles.statSubsection}>
            <h3>Completion Progress</h3>
            {renderProgressBar(
              mangaProgressStats.chaptersRead,
              mangaProgressStats.totalPossibleChapters,
              "Chapters Read"
            )}
            
            {renderProgressBar(
              mangaProgressStats.completedSeries,
              userMangaList.length || 0,
              "Series Completed"
            )}
            
            {renderProgressBar(
              mangaProgressStats.volumesRead,
              mangaProgressStats.totalPossibleVolumes,
              "Volumes Read"
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Stats;