// src/AnimeCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios';
import { useAnimeContext } from './Context/AnimeContext';


function AnimeCard({ anime, onTopRightButtonClick }) {
    const { setAnimeList } = useAnimeContext();
    const [isHovered, setIsHovered] = useState(false);
  
    const setCurrentEpisode = async (newEpisode) => {
      console.log('Updating current episode:', newEpisode);
      try {
        // Update the status in MongoDB
        await axios.put(`http://localhost:8080/browse/${anime._id}/currentEpisode`, {
          currentEpisode: newEpisode
        });
  
        // Fetch the updated anime list
        const res = await axios.get('http://localhost:8080/browse');
        console.log('After updating currentEpisode: ', newEpisode);
        
        // Update the state with the new anime list
        setAnimeList(res.data);
      } catch (error) {
        console.error('Failed to update status: ', error);
      }
    };
  
    const handleIncrementEpisode = async () => {
        // Update the current episode by 1
        console.log('Incrementing episode...');
        const newCurrentEpisode = anime.currentEpisode + 1;
        console.log('New episode:', newCurrentEpisode);
    

        await setCurrentEpisode(newCurrentEpisode);
    
        // Add any additional logic you need here
      };
  
      return (
        <div
          className={`anime-card ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="img-container">
            <img src={anime.image} alt={anime.title} />
            <div className="title-and-progress">
            <Link to={`/anime/${anime._id}`}>
            <div className='anime-title'>{anime.title}</div>
            </Link>
            <div label="Progress" className="progress">
                {anime.currentEpisode}/{anime.episodes}
                {isHovered && anime.currentEpisode !== anime.episodes && (
                <span className="plus-progress" onClick={handleIncrementEpisode}>
                    +
                </span>
                )}
            </div>
            </div>
          </div>
          {isHovered && (
            <>
              <button className="top-right-button" onClick={() => onTopRightButtonClick(anime)}>
                •••
              </button>
            </>
          )}
        </div>
      );
  }
  
  export default AnimeCard;