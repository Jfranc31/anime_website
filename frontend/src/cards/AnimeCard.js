// src/cards/AnimeCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

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
          {/* Button for top-right action */}
          {isHovered && (
            <button className="top-right-button" onClick={() => onTopRightButtonClick(anime)}>
              Edit
            </button>
          )}
        </div>
      );
  }
  
  export default AnimeCard;