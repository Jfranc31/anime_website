/**
 * src/cards/AnimeCard.js
 * Description: React component for rendering an anime card.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Functional component representing an anime card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.anime - Anime object containing details like titles, images, etc.
 * @param {Function} props.onTopRightButtonClick - Callback function for top-right button click.
 * @returns {JSX.Element} - Rendered anime card component.
 */
function AnimeCard({ anime, onTopRightButtonClick }) {
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`anime-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="img-container">
        {/* Anime image */}
        <img src={anime.images.image} alt={anime.titles.english} />
        <div className="title-and-progress">
          {/* Link to anime details page */}
          <Link to={`/anime/${anime._id}`}>
            <div className='anime-title'>{anime.titles.english}</div>
          </Link>
        </div>
      </div>
      {/* Button for top-right action (Edit) */}
      {isHovered && (
        <button className="top-right-button" onClick={() => onTopRightButtonClick(anime)}>
          Edit
        </button>
      )}
    </div>
  );
}

// Exporting the AnimeCard component as the default export
export default AnimeCard;
