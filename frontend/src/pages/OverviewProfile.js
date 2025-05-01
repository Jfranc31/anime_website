import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import profileStyles from '../styles/pages/Profile.module.css';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import { fetchWithErrorHandling } from '../utils/apiUtils';
import { useUser } from '../Context/ContextApi';
import axiosInstance from '../utils/axiosConfig';

const Overview = () => {
  const { userData } = useUser();
  const { animeList = [] } = useAnimeContext();
  const { mangaList = [] } = useMangaContext();
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [animeActivities, setAnimeActivities] = useState([]);
  const [mangaActivities, setMangaActivities] = useState([]);
  const [overview, setOverview] = useState({
    recentActivity: [],
    topAnime: [],
    topManga: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchActivities = useCallback(async (type, page, append = false) => {
    const setActivities = type === 'anime' ? setAnimeActivities : setMangaActivities;

    try {
      const response = await fetchWithErrorHandling(
        `/latest-activities/${userData._id}?page=${page}&limit=8&type=${type}`
      );
      
      const sortedActivities = response.activities.sort(
        (a, b) => new Date(b.activityTimestamp) - new Date(a.activityTimestamp)
      );

      setActivities(prev => 
        append ? [...prev, ...sortedActivities] : sortedActivities
      );
    } catch (error) {
      if (!append) {
        setActivities([]);
      }
    }
  }, [userData._id]);

  const fetchUserList = useCallback(async () => {
    try {
      const data = await fetchWithErrorHandling(`/users/${userData._id}/current`);
      setUserAnimeList(data.animes || []);
      setUserMangaList(data.mangas || []);
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
  
  useEffect(() => {
    if (userData?._id) {
      fetchOverview();
    }
  }, [userData?._id]);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`/users/${userData._id}/overview`);
      setOverview(response.data);
    } catch (err) {
      setError('Failed to load overview data');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Calculate basic stats for the overview
  const totalAnime = userAnimeList.length || 0;
  const totalManga = userMangaList.length || 0;
  
  const animeStatusCounts = userAnimeList?.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}) || {};
  
  const mangaStatusCounts = userMangaList?.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {}) || {};

  const getTitle = useCallback((titles) => {
    const preference = userData?.title || 'english';
    return titles[preference] || titles.english || titles.romaji || titles.native;
  }, [userData?.title]);
  
  const episodesWatched = userAnimeList?.reduce((sum, item) => 
    sum + (item.currentEpisode || 0), 0) || 0;
  
  const chaptersRead = userMangaList?.reduce((sum, item) => 
    sum + (item.currentChapter || 0), 0) || 0;
    
  // Get recently updated items
  const recentlyUpdatedAnime = [...(animeActivities || [])]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 4)
    .map(item => ({
      ...item,
      details: animeList.find(anime => anime._id === item.animeId)
    }));
    
  const recentlyUpdatedManga = [...(mangaActivities || [])]
    .sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0))
    .slice(0, 4)
    .map(item => ({
      ...item,
      details: mangaList.find(manga => manga._id === item.mangaId)
    }));

  if (!userData) {
    return <div className={profileStyles.noUser}>Please log in to view your profile.</div>;
  }

  return (
    <div className={profileStyles.profilePage}>
      <div className={profileStyles.overviewContainer}>
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
        </div>
      
        <div className={profileStyles.statsSummary}>
          <div className={profileStyles.statCard}>
            <h3>Anime</h3>
            <p>Total: {totalAnime}</p>
            <p>Watching: {animeStatusCounts["Watching"] || 0}</p>
            <p>Completed: {animeStatusCounts["Completed"] || 0}</p>
            <p>Planning: {animeStatusCounts["Planning"] || 0}</p>
            <p>Episodes Watched: {episodesWatched}</p>
            <Link to="/profile/animeProfile" className={profileStyles.viewMoreLink}>
              View Anime List
            </Link>
          </div>
          
          <div className={profileStyles.statCard}>
            <h3>Manga</h3>
            <p>Total: {totalManga}</p>
            <p>Reading: {mangaStatusCounts["Reading"] || 0}</p>
            <p>Completed: {mangaStatusCounts["Completed"] || 0}</p>
            <p>Planning: {mangaStatusCounts["Planning"] || 0}</p>
            <p>Chapters Read: {chaptersRead}</p>
            <Link to="/profile/mangaProfile" className={profileStyles.viewMoreLink}>
              View Manga List
            </Link>
          </div>
        </div>
        
        <div className={profileStyles.recentActivity}>
          <h2>Recent Activity</h2>
          
          <div className={profileStyles.recentSection}>
            <h3>Anime</h3>
            <div className={profileStyles.recentGrid}>
              {recentlyUpdatedAnime.length > 0 ? (
                recentlyUpdatedAnime.map(item => (
                  <div key={item.animeId} className={profileStyles.recentItem}>
                    <img 
                      src={item.details?.images?.image || '/placeholder.jpg'} 
                      alt={item.details?.titles?.english || 'Anime cover'} 
                      className={profileStyles.recentItemImage}
                    />
                    <div className={profileStyles.recentItemInfo}>
                      <p className={profileStyles.recentItemTitle}>
                        {getTitle(item.details?.titles) || 'Unknown anime'}
                      </p>
                      <p>Progress: {item.currentEpisode} eps</p>
                      <p>Status: {item.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent anime activity</p>
              )}
            </div>
          </div>
          
          <div className={profileStyles.recentSection}>
            <h3>Manga</h3>
            <div className={profileStyles.recentGrid}>
              {recentlyUpdatedManga.length > 0 ? (
                recentlyUpdatedManga.map(item => (
                  <div key={item.mangaId} className={profileStyles.recentItem}>
                    <img 
                      src={item.details?.images?.image || '/placeholder.jpg'} 
                      alt={item.details?.titles?.english || 'Manga cover'} 
                      className={profileStyles.recentItemImage}
                    />
                    <div className={profileStyles.recentItemInfo}>
                      <p className={profileStyles.recentItemTitle}>
                        {getTitle(item.details?.titles) || 'Unknown manga'}
                      </p>
                      <p>Progress: {item.currentChapter} ch, {item.currentVolume || 0} vol</p>
                      <p>Status: {item.status}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p>No recent manga activity</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;