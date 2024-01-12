// src/cards/AnimeCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom'

function AnimeCard({ anime, onTopRightButtonClick }) {
    const [isHovered, setIsHovered] = useState(false);
  
      return (
        <div
          className={`anime-card ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="img-container">
            <img src={anime.images.image} alt={anime.titles.english} />
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