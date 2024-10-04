import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';
import data from '../Context/ContextApi';
import { useMangaContext } from '../Context/MangaContext';

const Home = () => {
  const { animeList } = useAnimeContext();
  const { mangaList } = useMangaContext();
  const { userData } = useContext(data)
  const [latestActivities, setLatestActivities] = useState([]);
  const [userAnimeList, setUserAnimeList] = useState([]);
  const [userMangaList, setUserMangaList] = useState([]);

  useEffect(() => {
    const fetchLatestActivities = async () => {
      try {
        const response = await axios.get(
          `http://localhost:8080/latest-activities/${userData._id}`
        );
        const sortedActivities = response.data.sort((a, b) => 
          new Date(b.activityTimestamp) - new Date(a.activityTimestamp));
        setLatestActivities(sortedActivities);
      } catch (error) {
        console.error('Error fetching latest activities:', error);
      }
    };

    const fetchUserList = async () => {
      // Fetch user information including anime list
      // Replace 'userId' with the actual user ID or fetch it from your 
      // authentication context
      const userId = userData._id; // Replace with the actual user ID
      try {
        const response = await axios.get(
          `http://localhost:8080/users/${userId}/current`
        );
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
          userAnime.status === 'Watching' && 
          userAnime.animeId === activity.animeDetails?._id
      )
    );
  };
  
  const filterMangaByReading = () => {
    return latestActivities.filter((activity) =>
      userMangaList.some(
        (userManga) => 
          userManga.status === 'Reading' && 
          userManga.mangaId === activity.mangaDetails?._id
      )
    );
  };

  const getAnimeTitle = (activity) => activity.animeDetails?.titles?.english;
  const getMangaTitle = (activity) => activity.mangaDetails?.titles?.english;

  const renderAnimeActivityMessage = (activity) => {
    const title = getAnimeTitle(activity);
    
    if (activity.status === 'Completed') {
      return `Completed ${title}`;
    } else if (
      activity.currentEpisode === 0 && 
      activity.status === 'Watching'
    ) {
      return `Started watching ${title}`;
    } else if (
      activity.currentEpisode > 0 && 
      activity.status === 'Watching'
    ) {
      return `Watched episode ${activity.currentEpisode} of ${title}`;
    } else {
      return `Planned to watch ${title}`;
    }
  };

  const renderMangaActivityMessage = (activity) => {
    const title = getMangaTitle(activity);
    
    if (activity.status === 'Completed') {
      return `Completed ${title}`;
    } else if (
      activity.currentChapter === 0 && 
      activity.status === 'Reading'
    ) {
      return `Started reading ${title}`;
    } else if (
      activity.currentChapter > 0 && 
      activity.status === 'Reading'
    ) {
      return `Read chapter ${activity.currentChapter} of ${title}`;
    } else {
      return `Planned to read ${title}`;
    }
  };

  
  console.log(userAnimeList, filterAnimeByWatching);

  return (
      <div className='activity-page'>
        <div className='header-container'>
          <h1>Anime Activities</h1>
        </div>
        <div className='prog-header'>
          <h3>Anime in Progress</h3>
        </div>
        <div>
          {latestActivities.map((activity) => (
            <div key={activity._id} className='activity-container'>
              <div className='container-img'>
                {activity.animeDetails && (
                  <>
                    <Link to={`/anime/${activity.animeDetails._id}`}>
                      <img 
                        src={activity.animeDetails.images.image} 
                        alt={activity.animeDetails.titles.english}>
                      </img>
                    </Link>
                    <span>
                      {renderAnimeActivityMessage(activity)}
                      {/* - {activity.activityTimestamp} */}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='activity-progress-container-bk'>
          <ul className='activity-progress-container'>
            {filterAnimeByWatching().map((activity) => (
              <li key={activity.animeId}>
                <div className='activity-progress-container-img'>
                  <Link to={`/anime/${activity.animeId}`}>
                    <img 
                      src={getAnimeById(activity.animeId)?.images.image} 
                      alt={getAnimeById(activity.animeId)?.titles.english}>
                    </img>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className='second-header'>
          <h1>Manga Activities</h1>
        </div>

        <div className='manga-header'>
          <h3>Manga in Progress</h3>
        </div>

        <div>
          {latestActivities.map((activity) => (
            <div key={activity._id} className='manga-activity-container'>
              <div className='container-img'>
                {activity.mangaDetails && (
                  <>
                    <Link to={`/manga/${activity.mangaDetails._id}`}>
                      <img 
                        src={activity.mangaDetails.images.image} 
                        alt={activity.mangaDetails.titles.english}>
                      </img>
                    </Link>
                    <span>
                      {renderMangaActivityMessage(activity)}
                      {/* - {activity.activityTimestamp} */}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className='manga-activity-progress-container-bk'>
          <ul className='activity-manga-progress-container'>
            {filterMangaByReading().map((activity) => (
              <li key={activity.mangaId}>
                <div className='activity-progress-container-img'>
                  <Link to={`/manga/${activity.mangaId}`}>
                    <img 
                      src={getMangaById(activity.mangaId)?.images.image} 
                      alt={getMangaById(activity.mangaId)?.titles.english}>
                    </img>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
  );
};

export default Home;