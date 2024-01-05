// src/AnimeCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom'
import axios from 'axios';
import { useAnimeContext } from '../Context/AnimeContext';


function AnimeCard({ anime, onTopRightButtonClick }) {
    const { setAnimeList } = useAnimeContext();
    const [isHovered, setIsHovered] = useState(false);
  
      return (
        <div
          className={`anime-card ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="img-container">
            <img src={anime.images[0].image} alt={anime.titles.english} />
            <div className="title-and-progress">
            <Link to={`/anime/${anime._id}`}>
            <div className='anime-title'>{anime.titles.english}</div>
            </Link>
            </div>
          </div>
          {isHovered && (
            <>
              Hello
            </>
          )}
        </div>
      );
  }
  
  export default AnimeCard;