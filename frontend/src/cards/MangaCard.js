// src/cards/MangaCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom'

function MangaCard({ manga, onTopRightButtonClick }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
          className={`anime-card ${isHovered ? 'hovered' : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className='img-container'>
            <img src={manga.images.image} alt={manga.titles.english} />
            <div className='title-and-progress'>
                <Link to={`/manga/${manga._id}`}>
                    <div className='anime-title'>{manga.titles.english}</div>
                </Link>
            </div>
          </div>
          {isHovered && (
            <button className='top-right-button' onClick={() => onTopRightButtonClick(manga)}>
                Edit
            </button>
          )}
        </div>
    );
}

export default MangaCard;