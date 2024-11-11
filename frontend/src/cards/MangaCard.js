/**
 * src/cards/MangaCard.js
 * Description: React component for rendering a manga card.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import cardsStyles from '../styles/components/cards.module.css';

/**
 * Functional component representing a manga card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.manga - Manga object containing details like titles, images, etc.
 * @param {Function} props.onTopRightButtonClick - Callback function for top-right button click.
 * @returns {JSX.Element} - Rendered manga card component.
 */
function MangaCard({ manga, onTopRightButtonClick }) {
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${cardsStyles.mangaCard} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.imgContainer}>
        {/* Manga image */}
        <img src={manga.images.image} alt={manga.titles.english} />
        <div className={cardsStyles.titleAndProgress}>
          {/* Link to manga details page */}
          <Link to={`/manga/${manga._id}`}>
            {/* Manga title */}
            <div className={cardsStyles.animeTitle}>{manga.titles.english}</div>
          </Link>
        </div>
      </div>
      {/* Conditional rendering when hovered */}
      {isHovered && (
        <button
          className={cardsStyles.topRightButton}
          onClick={() => onTopRightButtonClick(manga)}
        >
          Edit
        </button>
      )}
    </div>
  );
}

// Exporting the MangaCard component as the default export
export default MangaCard;
