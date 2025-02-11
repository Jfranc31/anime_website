import React, { useState, useEffect, useContext, useCallback } from 'react';
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
  const [latestActivities, setLatestActivities] = useState([]);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);
  const [hoveredCard, setHoveredCard] = useState(null);
  const [popupPosition, setPopupPosition] = useState({ left: '100%', top: '0' });
  const [activeTab, setActiveTab] = useState('anime');

  const fetchLatestActivities = useCallback(async () => {
    try {
      const data = await fetchWithErrorHandling(`/latest-activities/${userData._id}`);
      const sortedActivities = data.sort(
        (a, b) => new Date(b.activityTimestamp) - new Date(a.activityTimestamp)
      );
      setLatestActivities(sortedActivities);
    } catch (error) {
      setLatestActivities([]);
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
    fetchLatestActivities();
    fetchUserList();
  }, [userData._id, fetchLatestActivities, fetchUserList]);

  const getAnimeById = (animeId) => {
    return animeList.find((anime) => anime._id === animeId);
  };

  const getMangaById = (mangaId) => {
    return mangaList.find((manga) => manga._id === mangaId);
  };

  const filterAnimeByWatching = () => {
    return userAnimeList
      .filter((userAnime) => userAnime.status === 'Watching')
      .map((userAnime) => ({
        animeId: userAnime.animeId,
        currentEpisode: userAnime.currentEpisode,
        status: userAnime.status,
        animeDetails: getAnimeById(userAnime.animeId),
      }));
  };

  const filterMangaByReading = () => {
    return userMangaList
      .filter((userManga) => userManga.status === 'Reading')
      .map((userManga) => ({
        mangaId: userManga.mangaId,
        currentChapter: userManga.currentChapter,
        currentVolume: userManga.currentVolume,
        status: userManga.status,
        mangaDetails: getMangaById(userManga.mangaId),
      }));
  };

  const handleIncrementWatchCount = async (id, type) => {
    console.log('Incrementing count:', { id, type });

    if (type === 'anime') {
      const currentAnime = userAnimeList.find(anime => anime.animeId === id);
      console.log('Current anime:', currentAnime);

      if (currentAnime) {
        const newEpisodeCount = currentAnime.currentEpisode + 1;

        // Update the local state immediately
        setUserAnimeList((prevList) =>
          prevList.map((anime) =>
            anime.animeId === id
              ? { ...anime, currentEpisode: newEpisodeCount }
              : anime
          )
        );

        try {
          // Make an API call to update the current episode on the backend
          const response = await axiosInstance.post(`/users/${userData._id}/updateAnime`, {
            animeId: id,
            status: userData.status || 'Watching',
            currentEpisode: newEpisodeCount,
          });

          if (!response.data) {
            console.error('Failed to update on the server');
          } else {
            fetchLatestActivities();
          }
        } catch (error) {
          console.error('Error updating user progress:', error);
        }
      }
    }
    if (type === 'manga') {
      const currentManga = userMangaList.find(manga => manga.mangaId === id);
      console.log('Current manga:', currentManga);

      if (currentManga) {
        const newChapterCount = currentManga.currentChapter + 1;
        const volumeCount = currentManga.currentVolume;

        // Update the local state immediately
        setUserMangaList((prevList) =>
          prevList.map((manga) =>
            manga.mangaId === id
              ? { ...manga, currentChapter: newChapterCount, currentVolume: volumeCount }
              : manga
          )
        );

        console.log('UserMangaList: ', userMangaList);

        try {
          // Make an API call to update the current chapter on the backend
          const response = await axiosInstance.post(`/users/${userData._id}/updateManga`, {
            mangaId: id,
            status: userData.status || 'Reading',
            currentChapter: newChapterCount,
            currentVolume: volumeCount
          });

          if (!response.data) {
            console.log('Failed to update on the server');
          } else {
            fetchLatestActivities();
          }
        } catch (error) {
          console.error('Error updating user progress:', error);
        }
      }
    }
  };

  const animeActivities = latestActivities.filter(
    (activity) => activity.animeDetails
  );
  const mangaActivities = latestActivities.filter(
    (activity) => activity.mangaDetails
  );
  const watchingAnime = filterAnimeByWatching();
  const readingManga = filterMangaByReading();

  const formatTimeUntilNextEpisode = (timeUntilAiring) => {
    const days = Math.floor(timeUntilAiring / (3600 * 24));
    const hours = Math.floor((timeUntilAiring % (3600 * 24)) / 3600);
    const minutes = Math.floor((timeUntilAiring % 3600) / 60);

    return `${days}d ${hours}h ${minutes}m`;
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

  return (
    <div className={homeStyles.activityPage}>
      <div classNAme={homeStyles.tabContainer}>
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
              {animeActivities.slice(0, 15).map((activity) => (
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
                    <h3>{activity.animeDetails.titles.english || activity.animeDetails.titles.romaji}</h3>
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
          </div>

          {watchingAnime.length > 0 && (
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
                    <Link
                      to={`/anime/${activity.animeId}`}
                    >
                      <img
                        src={getAnimeById(activity.animeId)?.images.image}
                        alt={getAnimeById(activity.animeId)?.titles.english}
                      />
                    </Link>
                    <div className={homeStyles.progressInfo}>
                      {hoveredCard === activity.animeId ? (
                        <div className={homeStyles.episodeInfo}>
                          <span>
                            {activity.currentEpisode} {/* Show the current episode */}
                          </span>
                          <span
                            className={homeStyles.incrementWatchCount}
                            onClick={() => handleIncrementWatchCount(activity.animeId, 'anime')} // Increment function
                          >
                            +
                          </span>
                        </div>
                      ) : (
                        getAnimeById(activity.animeId)?.nextAiringEpisode?.airingAt && (
                          <div className={homeStyles.episodeInfo}>
                            <span>
                              {getAnimeById(activity.animeId)?.nextAiringEpisode?.episode}
                            </span>
                            <span>
                              {formatTimeUntilNextEpisode(getAnimeById(activity.animeId)?.nextAiringEpisode?.timeUntilAiring)}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                    {hoveredCard === activity.animeId && (
                      <div className={homeStyles.popup} style={{ left: popupPosition.left, top: popupPosition.top }}>
                        <h4>{getAnimeById(activity.animeId)?.titles.english || getAnimeById(activity.animeId)?.titles.romaji}</h4>
                        <p>Progress: {activity.currentEpisode}/{getAnimeById(activity.animeId)?.lengths.Episodes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'manga' && mangaActivities.length > 0 && (
        <>
          <div className={homeStyles.sectionContainer}>
            <div className={homeStyles.headerContainer}>
              <h1>Manga Activities</h1>
            </div>
            <div className={homeStyles.activitiesGrid}>
              {mangaActivities.slice(0, 15).map((activity) => (
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
                    <h3>{activity.mangaDetails.titles.english || activity.mangaDetails.titles.romaji}</h3>
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
          </div>

          {readingManga.length > 0 && (
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
                          <span>
                            {activity.currentChapter}
                          </span>
                          <span
                            className={homeStyles.incrementWatchCount}
                            onClick={() => handleIncrementWatchCount(activity.mangaId, 'manga')}
                          >
                            +
                          </span>
                        </div>
                      )}
                    </div>
                    {hoveredCard === activity.mangaId && (
                      <div className={homeStyles.popup} style={{ left: popupPosition.left, top: popupPosition.top }}>
                        <h4>{getMangaById(activity.mangaId)?.titles.english || getMangaById(activity.mangaId)?.titles.romaji}</h4>
                        <p>Progress: {activity.currentChapter}/{getMangaById(activity.mangaId)?.lengths.chapters}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
