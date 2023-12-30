import React, { useContext, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAnimeContext } from '../Context/AnimeContext'
import axios from 'axios'

const Home = () => {
    const { animeList, setAnimeList, selectedAnimeId, setSelectedAnimeId } = useAnimeContext();
    const selectedStatus = 'Watching';
    const [latestActivities, setLatestActivities] = useState([]);

    const filteredAnime = Array.isArray(animeList) ? animeList.filter(anime => {
        const matchesStatus = !selectedStatus || selectedStatus.toLowerCase() === 'all' || anime.status.toLowerCase() === selectedStatus.toLowerCase();
      
        return matchesStatus;
    }) : [];

    const sortedAnime = [...filteredAnime].sort((a, b) => a.title.localeCompare(b.title));


    useEffect(() => {
      const fetchLatestActivities = async () => {
          try {
              const response = await axios.get('http://localhost:8080/latest-activities');
              setLatestActivities(response.data);
          } catch (error) {
              console.error('Error fetching latest activities:', error);
          }
      };
  
      fetchLatestActivities();
    }, []);

  return (
    <div>
      <div className='activity-page'>
        <div className='header-container'>
          <h1>Activities</h1>
        </div>
        <div className='prog-header'>
          <h3>Anime in Progress</h3>
        </div>
        <div>
            {latestActivities.map(activity => (
                <div key={activity._id} className='activity-container'>
                  
                    {/* Display activity details, e.g., title, action, timestamp */}
                    <div className='container-img'>
                    <Link to={`/anime/${activity._id}`}>
                      <img src={activity.image} alt={activity.title}></img>
                    </Link>
                      
                      <span>
                      {activity.status === 'Completed'
                        ? `Completed ${activity.title}`
                        : activity.currentEpisode === 0 && activity.status === 'Watching'
                        ? `Started watching ${activity.title}`
                        : activity.currentEpisode > 0 && activity.status === 'Watching'
                        ? `Watched episode ${activity.currentEpisode} of ${activity.title}`
                        : `Planned to watch ${activity.title}`}
                      - {activity.activityTimestamp}
                      </span>
                    </div>
                </div>
            ))}
        </div>
        
        <div className='activity-progress-container-bk'>
          <ul className='activity-progress-container'>
          
            
            {sortedAnime.map(anime => (
              <li key={anime._id}>
                <div className='activity-progress-container-img'>
                <Link to={`/anime/${anime._id}`}>
                  <img src={anime.image} alt={anime.title}></img>
                </Link>
                </div>
              </li>
            ) )}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Home