import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import { useMangaContext } from '../Context/MangaContext';
import data from '../Context/ContextApi';
import '../styles/pages/Home.css';

const Home = () => {
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const { userData } = useContext(data);
  const [latestActivities, setLatestActivities] = useState([]);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);

  useEffect(() => {
    const fetchLatestActivities = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/latest-activities/${userData._id}`);
        const sortedActivities = response.data.sort((a, b) => new Date(b.activityTimestamp) - new Date(a.activityTimestamp));
        setLatestActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching latest activities:', error);
      }
    };

    const fetchUserList = async () => {
      // Fetch user information including anime list
      // Replace 'userId' with the actual user ID or fetch it from your authentication context
      const userId = userData._id; // Replace with the actual user ID
      try {
        const response = await axios.get(`http://localhost:8080/users/${userId}/current`);
        setUserAnimeList(response.data.animes);
        setUserMangaList(response.data.mangas);
      } catch (error) {
        console.error('Error fetching user list:', error);
      }
    };

    fetchLatestActivities();
    fetchUserList();
  }, [userData._id]);

  const getAnimeById = (animeId) => {
    return animeList.find((anime) => anime._id === animeId);
  };

  const getMangaById = (mangaId) => {
    return mangaList.find((manga) => manga._id === mangaId);
  };

  const filterAnimeByWatching = () => {
    return latestActivities.filter((activity) =>
      userAnimeList.some(
        (userAnime) =>
          userAnime.status === 'Watching' && userAnime.animeId === activity.animeDetails?._id
      )
    );
  };
  
  const filterMangaByReading = () => {
    return latestActivities.filter((activity) =>
      userMangaList.some(
        (userManga) => userManga.status === 'Reading' && userManga.mangaId === activity.mangaDetails?._id
      )
    );
  };
  
  console.log(userAnimeList, filterAnimeByWatching);

  const animeActivities = latestActivities.filter(activity => activity.animeDetails);
  const mangaActivities = latestActivities.filter(activity => activity.mangaDetails);
  const watchingAnime = filterAnimeByWatching();
  const readingManga = filterMangaByReading();

  return (
    <div className='activity-page'>
      {animeActivities.length > 0 && (
        <>
          <div className='section-container anime-section'>
            <div className='header-container'>
              <h1>Anime Activities</h1>
            </div>
            <div className='activities-grid'>
              {animeActivities.slice(0, 15).map((activity) => (
                <div key={activity._id} className='activity-card'>
                  <Link to={`/anime/${activity.animeDetails._id}`}>
                    <div className='activity-image'>
                      <img 
                        src={activity.animeDetails.images.image} 
                        alt={activity.animeDetails.titles.english}
                      />
                    </div>
                  </Link>
                  <div className='activity-info'>
                    <h3>{activity.animeDetails.titles.english}</h3>
                    <p className='activity-status'>
                      {activity.status === 'Completed'
                        ? 'Completed'
                        : activity.currentEpisode === 0 && activity.status === 'Watching'
                        ? 'Started watching'
                        : `Episode ${activity.currentEpisode}`}
                    </p>
                    <span className='activity-timestamp'>
                      {new Date(activity.activityTimestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {watchingAnime.length > 0 && (
            <div className='progress-section'>
              <h2>Currently Watching</h2>
              <div className='progress-grid'>
                {watchingAnime.map((activity) => (
                  <Link 
                    key={activity.animeId} 
                    to={`/anime/${activity.animeId}`}
                    className='progress-card'
                  >
                    <img 
                      src={getAnimeById(activity.animeId)?.images.image} 
                      alt={getAnimeById(activity.animeId)?.titles.english}
                    />
                    <div className='progress-info'>
                      <span className='progress-title'>
                        {getAnimeById(activity.animeId)?.titles.english}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {mangaActivities.length > 0 && (
        <>
          <div className='section-container manga-section'>
            <div className='header-container'>
              <h1>Manga Activities</h1>
            </div>
            <div className='activities-grid'>
              {mangaActivities.slice(0, 15).map((activity) => (
                <div key={activity._id} className='activity-card'>
                  <Link to={`/manga/${activity.mangaDetails._id}`}>
                    <div className='activity-image'>
                      <img 
                        src={activity.mangaDetails.images.image} 
                        alt={activity.mangaDetails.titles.english}
                      />
                    </div>
                  </Link>
                  <div className='activity-info'>
                    <h3>{activity.mangaDetails.titles.english}</h3>
                    <p className='activity-status'>
                      {activity.status === 'Completed'
                        ? 'Completed'
                        : activity.currentChapter === 0 && activity.status === 'Reading'
                        ? 'Started reading'
                        : `Chapter ${activity.currentChapter}`}
                    </p>
                    <span className='activity-timestamp'>
                      {new Date(activity.activityTimestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {readingManga.length > 0 && (
            <div className='progress-section'>
              <h2>Currently Reading</h2>
              <div className='progress-grid'>
                {readingManga.map((activity) => (
                  <Link 
                    key={activity.mangaId} 
                    to={`/manga/${activity.mangaId}`}
                    className='progress-card'
                  >
                    <img 
                      src={getMangaById(activity.mangaId)?.images.image} 
                      alt={getMangaById(activity.mangaId)?.titles.english}
                    />
                    <div className='progress-info'>
                      <span className='progress-title'>
                        {getMangaById(activity.mangaId)?.titles.english}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {animeActivities.length === 0 && mangaActivities.length === 0 && (
        <div className='empty-state'>
          <h2>No Recent Activities</h2>
          <p>Start watching anime or reading manga to see your activities here!</p>
        </div>
      )}
    </div>
  );
};

export default Home;