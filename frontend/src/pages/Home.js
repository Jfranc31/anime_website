import React, { useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from './../utils/axiosConfig';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import data from '../Context/ContextApi';
import homeStyles from '../styles/pages/Home.module.css';
import { fetchWithErrorHandling } from '../utils/apiUtils';

const Home = () => {
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const { userData } = useContext(data);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ left: '100%', top: '0' });
  const [activeTab, setActiveTab] = useState('anime');
  const [airingTimes, setAiringTimes] = useState({});

  const [animeActivitiesPage, setAnimeActivitiesPage] = useState(1);
  const [mangaActivitiesPage, setMangaActivitiesPage] = useState(1);
  const [hasMoreAnime, setHasMoreAnime] = useState(true);
  const [hasMoreManga, setHasMoreManga] = useState(true);
  const [loadingAnime, setLoadingAnime] = useState(false);
  const [loadingManga, setLoadingManga] = useState(false);
  const [animeActivities, setAnimeActivities] = useState([]);
  const [mangaActivities, setMangaActivities] = useState([]);

  const calculateTimeUntilAiring = useCallback((airingAt) => {
    const now = Math.floor(Date.now() / 1000);
    return airingAt - now;
  }, []);

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

  const handleLoadMoreAnime = async () => {
    const nextPage = animeActivitiesPage + 1;
    setAnimeActivitiesPage(nextPage);
    await fetchActivities('anime', nextPage, true);
  };

  const handleLoadMoreManga = async () => {
    const nextPage = mangaActivitiesPage + 1;
    setMangaActivitiesPage(nextPage);
    await fetchActivities('manga', nextPage, true);
  };

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

  const getAnimeById = useCallback((animeId) => {
    return animeList?.find((anime) => anime._id === animeId);
  }, [animeList]);

  const getMangaById = useCallback((mangaId) => {
    return mangaList?.find((manga) => manga._id === mangaId);
  }, [mangaList]);

  const getTitle = useCallback((titles) => {
    const preference = userData?.title || 'english';
    return titles[preference] || titles.english || titles.romaji || titles.native;
  }, [userData?.title]);

  const watchingAnime = useMemo(() => 
    userAnimeList
      .filter((userAnime) => userAnime.status === 'Watching')
      .map((userAnime) => {
        const animeDetails = getAnimeById(userAnime.animeId);
        return {
          animeId: userAnime.animeId,
          currentEpisode: userAnime.currentEpisode,
          status: userAnime.status,
          animeDetails
        };
      })
      // Filter out items where animeDetails is undefined
      .filter(item => item.animeDetails)
      .sort((a, b) => {
        const titleA = getTitle(a.animeDetails.titles) || '';
        const titleB = getTitle(b.animeDetails.titles) || '';
  
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      }),
    [userAnimeList, getAnimeById, getTitle]
  );

  const readingManga = useMemo(() => 
    userMangaList
      .filter((userManga) => userManga.status === 'Reading')
      .map((userManga) => {
        const mangaDetails = getMangaById(userManga.mangaId);
        return {
          mangaId: userManga.mangaId,
          currentChapter: userManga.currentChapter,
          currentVolume: userManga.currentVolume,
          status: userManga.status,
          mangaDetails
        };
      })
      .filter(item => item.mangaDetails)
      .sort((a, b) => {
        const titleA = getTitle(a.mangaDetails.titles) || '';
        const titleB = getTitle(b.mangaDetails.titles) || '';
  
        return titleA.localeCompare(titleB, undefined, { sensitivity: 'base' });
      }),
    [userMangaList, getMangaById, getTitle]
  );

  const updateAiringTimes = useCallback(() => {
    const updatedTimes = {};
    
    watchingAnime.forEach((activity) => {
      const anime = activity.animeDetails;
      if (anime?.nextAiringEpisode?.airingAt) {
        const timeUntilAiring = calculateTimeUntilAiring(anime.nextAiringEpisode.airingAt);
        const maxEpisodes = parseInt(anime.lengths.Episodes) || Infinity;
        
        if (timeUntilAiring <= 0) {
          const WEEK_IN_SECONDS = 7 * 24 * 60 * 60;
          const weeksSinceAiring = Math.floor(Math.abs(timeUntilAiring) / WEEK_IN_SECONDS) + 1;
          const newEpisode = Math.min(
            anime.nextAiringEpisode.episode + weeksSinceAiring,
            maxEpisodes
          );
          
          // Only update if we haven't reached the max episodes
          if (newEpisode <= maxEpisodes) {
            const newAiringAt = anime.nextAiringEpisode.airingAt + (weeksSinceAiring * WEEK_IN_SECONDS);
            
            updatedTimes[activity.animeId] = {
              airingAt: newAiringAt,
              episode: newEpisode,
              timeUntilAiring: calculateTimeUntilAiring(newAiringAt)
            };
          }
        } else {
          // Only show next episode if it's not beyond the max episodes
          if (anime.nextAiringEpisode.episode <= maxEpisodes) {
            updatedTimes[activity.animeId] = {
              airingAt: anime.nextAiringEpisode.airingAt,
              episode: anime.nextAiringEpisode.episode,
              timeUntilAiring
            };
          }
        }
      }
    });
    
    setAiringTimes(updatedTimes);
  }, [watchingAnime, calculateTimeUntilAiring]);

  const handleIncrementWatchCount = async (id, type) => {
    if (type === 'anime') {
      const currentAnime = userAnimeList.find(anime => anime.animeId === id);

      if (currentAnime) {
        const newEpisodeCount = currentAnime.currentEpisode + 1;

        setUserAnimeList((prevList) =>
          prevList.map((anime) =>
            anime.animeId === id
              ? { ...anime, currentEpisode: newEpisodeCount }
              : anime
          )
        );

        try {
          const response = await axiosInstance.post(`/users/${userData._id}/updateAnime`, {
            animeId: id,
            status: userData.status || 'Watching',
            currentEpisode: newEpisodeCount,
          });

          if (response.data) {
            // Reset to page 1 and fetch fresh data
            setAnimeActivitiesPage(1);
            await fetchActivities('anime', 1, false);
          }
        } catch (error) {
          console.error('Error updating user progress:', error);
        }
      }
    }
    
    if (type === 'manga') {
      const currentManga = userMangaList.find(manga => manga.mangaId === id);

      if (currentManga) {
        const newChapterCount = currentManga.currentChapter + 1;
        const volumeCount = currentManga.currentVolume;

        setUserMangaList((prevList) =>
          prevList.map((manga) =>
            manga.mangaId === id
              ? { ...manga, currentChapter: newChapterCount, currentVolume: volumeCount }
              : manga
          )
        );

        try {
          const response = await axiosInstance.post(`/users/${userData._id}/updateManga`, {
            mangaId: id,
            status: userData.status || 'Reading',
            currentChapter: newChapterCount,
            currentVolume: volumeCount
          });

          if (response.data) {
            // Reset to page 1 and fetch fresh data
            setMangaActivitiesPage(1);
            await fetchActivities('manga', 1, false);
          }
        } catch (error) {
          console.error('Error updating user progress:', error);
        }
      }
    }
  };

  useEffect(() => {
    updateAiringTimes();
    const interval = setInterval(updateAiringTimes, 60000);
    return () => clearInterval(interval);
  }, [updateAiringTimes])

  const formatTimeUntilNextEpisode = (timeUntilAiring) => {
    const days = Math.floor(timeUntilAiring / (3600 * 24));
    const hours = Math.floor((timeUntilAiring % (3600 * 24)) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);
  
    const timeParts = [];
  
    if (days > 0) timeParts.push(`${days}d`);
    if (hours > 0) timeParts.push(`${hours}h`);
    if (minutes > 0) timeParts.push(`${minutes}m`);
  
    return timeParts.length > 0 ? timeParts.join(" ") : "0d 0h 0m";
  };

  const handleMouseEnter = (animeId, event) => {
    const popupWidth = 300; // Set this to the width of your popup
    const cardElement = event.currentTarget; // Get the card element

    const cardRect = cardElement.getBoundingClientRect(); // Get the card's position

    // Get the activity page width
    const activityPage = document.querySelector(`.${homeStyles.activityPage}`);
    const activityPageRect = activityPage.getBoundingClientRect();
    const activityPageRightEdge = activityPageRect.right;

    // Calculate the right edge of the popup
    const rightEdge = cardRect.right + popupWidth;

    if (rightEdge > activityPageRightEdge) {
      // If it overflows, position it to the left of the card
      setPopupPosition({
        left: `-215%`, // Position to the left
        top: `0`, // Align with the card's top
      });
    } else {
      // Otherwise, position it to the right of the card
      setPopupPosition({
        left: `100%`, // Position to the right
        top: `0`, // Align with the card's top
      });
    }

    setHoveredCard(animeId);
  };

  const renderProgressSection = () => (
    <div className={homeStyles.progressSection}>
      <h2>Currently Watching</h2>
      <div className={homeStyles.progressGrid}>
        {watchingAnime.map((activity) => (
          <div
            key={activity.animeId}
            className={homeStyles.progressCard}
            onMouseEnter={(event) => handleMouseEnter(activity.animeId, event)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Link to={`/anime/${activity.animeId}`}>
              <img
                src={getAnimeById(activity.animeId)?.images.image}
                alt={getAnimeById(activity.animeId)?.titles.english}
              />
            </Link>
            <div className={homeStyles.progressInfo}>
              {hoveredCard === activity.animeId ? (
                <div className={homeStyles.episodeInfo}>
                  <span
                    onClick={() => handleIncrementWatchCount(activity.animeId, 'anime')}
                  >
                    {activity.currentEpisode}+
                  </span>
                </div>
              ) : (
                airingTimes[activity.animeId] && (
                  <div className={homeStyles.episodeInfo}>
                    <span>
                      {airingTimes[activity.animeId].episode}
                    </span>
                    <span>
                      {formatTimeUntilNextEpisode(airingTimes[activity.animeId].timeUntilAiring)}
                    </span>
                  </div>
                )
              )}
            </div>
            {hoveredCard === activity.animeId && (
              <div className={homeStyles.popup} style={{ left: popupPosition.left, top: popupPosition.top }}>
                {getAnimeById(activity.animeId)?.releaseData.releaseStatus === 'Currently Releasing' && (
                  (() => {
                    const anime = getAnimeById(activity.animeId);
                    const maxEpisodes = parseInt(anime?.lengths.Episodes) || Infinity;
                    const latestAiredEpisode = Math.min(
                      (anime?.nextAiringEpisode?.episode || 1) - 1,
                      maxEpisodes
                    );
                    const episodesBehind = Math.max(0, latestAiredEpisode - activity.currentEpisode);
                    
                    return episodesBehind > 0 ? (
                      <h3>{episodesBehind} Episodes Behind</h3>
                    ) : null;
                  })()
                )}
                <h4>{getTitle(getAnimeById(activity.animeId)?.titles)}</h4>
                <p>Progress: {activity.currentEpisode}/{getAnimeById(activity.animeId)?.lengths.Episodes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderReadingSection = () => (
    <div className={homeStyles.progressSection}>
      <h2>Currently Reading</h2>
      <div className={homeStyles.progressGrid}>
        {readingManga.map((activity) => (
          <div
            key={activity.mangaId}
            className={homeStyles.progressCard}
            onMouseEnter={(event) => handleMouseEnter(activity.mangaId, event)}
            onMouseLeave={() => setHoveredCard(null)}
          >
            <Link
              to={`/manga/${activity.mangaId}`}
            >
              <img
                src={getMangaById(activity.mangaId)?.images.image}
                alt={getMangaById(activity.mangaId)?.titles.english}
              />
            </Link>
            <div className={homeStyles.progressInfo}>
              {hoveredCard === activity.mangaId && (
                <div className={homeStyles.episodeInfo}>
                  <span
                    onClick={() => handleIncrementWatchCount(activity.mangaId, 'manga')}
                  >
                    {activity.currentChapter}+
                  </span>
                </div>
              )}
            </div>
            {hoveredCard === activity.mangaId && (
              <div className={homeStyles.popup} style={{ left: popupPosition.left, top: popupPosition.top }}>
                <h4>{getTitle(getMangaById(activity.mangaId)?.titles)}</h4>
                <p>Progress: {activity.currentChapter}/{getMangaById(activity.mangaId)?.lengths.chapters}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className={homeStyles.activityPage}>
      <div className={homeStyles.tabContainer}>
        <button 
          className={`${homeStyles.tabButton} ${activeTab === 'anime' ? homeStyles.activeTab : ''}`}
          onClick={() => setActiveTab('anime')}
        >
          Anime
        </button>
        <button 
          className={`${homeStyles.tabButton} ${activeTab === 'manga' ? homeStyles.activeTab : ''}`}
          onClick={() => setActiveTab('manga')}
        >
          Manga
        </button>
      </div>

      {activeTab === 'anime' && animeActivities.length > 0 && (
        <>
          <div className={homeStyles.sectionContainer}>
            <div className={homeStyles.headerContainer}>
              <h1>Anime Activities</h1>
            </div>
            <div className={homeStyles.activitiesGrid}>
              {animeActivities.map((activity) => (
                <div key={activity._id} className={homeStyles.activityCard}>
                  <Link to={`/anime/${activity.animeDetails._id}`}>
                    <div className={homeStyles.activityImage}>
                      <img
                        src={activity.animeDetails.images.image}
                        alt={activity.animeDetails.titles.english}
                      />
                    </div>
                  </Link>
                  <div className={homeStyles.activityInfo}>
                    <h3>{getTitle(activity.animeDetails.titles)}</h3>
                    <p className={homeStyles.activityStatus}>
                      {activity.status === 'Completed'
                        ? 'Completed'
                        : activity.status === 'Planning'
                        ? `Planning to watch`
                        : activity.currentEpisode === 0 &&
                            activity.status === 'Watching'
                          ? 'Started watching'
                          : `Episode ${activity.currentEpisode}`}
                    </p>
                    <span className={homeStyles.activityTimestamp}>
                      {new Date(
                        activity.activityTimestamp
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreAnime && (
              <div className={homeStyles.loadMoreContainer}>
                <button
                  className={homeStyles.loadMoreButton}
                  onClick={handleLoadMoreAnime}
                  disabled={loadingAnime}
                >
                  {loadingAnime ? 'Loading...' : 'Load More Anime'}
                </button>
              </div>
            )}
          </div>

          {watchingAnime.length > 0 && renderProgressSection()}
        </>
      )}

      {activeTab === 'manga' && mangaActivities.length > 0 && (
        <>
          <div className={homeStyles.sectionContainer}>
            <div className={homeStyles.headerContainer}>
              <h1>Manga Activities</h1>
            </div>
            <div className={homeStyles.activitiesGrid}>
              {mangaActivities.map((activity) => (
                <div key={activity._id} className={homeStyles.activityCard}>
                  <Link to={`/manga/${activity.mangaDetails._id}`}>
                    <div className={homeStyles.activityImage}>
                      <img
                        src={activity.mangaDetails.images.image}
                        alt={activity.mangaDetails.titles.english}
                      />
                    </div>
                  </Link>
                  <div className={homeStyles.activityInfo}>
                    <h3>{getTitle(activity.mangaDetails.titles)}</h3>
                    <p className={homeStyles.activityStatus}>
                      {activity.status === 'Completed'
                        ? 'Completed'
                        : activity.status === 'Planning'
                        ? 'Planning to read'
                        : activity.currentChapter === 0 &&
                            activity.status === 'Reading'
                          ? 'Started reading'
                          : `Chapter ${activity.currentChapter}`}
                    </p>
                    <span className={homeStyles.activityTimestamp}>
                      {new Date(
                        activity.activityTimestamp
                      ).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {hasMoreManga && (
              <div className={homeStyles.loadMoreContainer}>
                <button
                  className={homeStyles.loadMoreButton}
                  onClick={handleLoadMoreManga}
                  disabled={loadingManga}
                >
                  {loadingManga ? 'Loading...' : 'Load More Manga'}
                </button>
              </div>
            )}
          </div>

          {readingManga.length > 0 && (
            renderReadingSection()
          )}
        </>
      )}

      {((activeTab === 'anime' && animeActivities.length === 0) || 
        (activeTab === 'manga' && mangaActivities.length === 0)) && (
        <div className={homeStyles.emptyState}>
          <h2>No Recent Activities</h2>
          <p>
            Start {activeTab === 'anime' ? 'watching anime' : 'reading manga'} to see your activities here!
          </p>
        </div>
      )}
    </div>
  );
};

export default Home;
