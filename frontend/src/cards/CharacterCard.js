/**
 * src/cards/CharacterCard.js
 * Description: React component for rendering a character card.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import cardsStyles from '../styles/components/cards.module.css';

/**
 * Functional component representing a character card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.character - Character object containing details like names, images, etc.
 * @returns {JSX.Element} - Rendered character card component.
 */
function CharacterCard({ character, name }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  // Function to get a fallback image URL
  const getFallbackImage = () => {
    // You can replace this with your own fallback image
    return 'https://via.placeholder.com/300x400?text=No+Image';
  };

  return (
    <div
      className={`${cardsStyles.card} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.characterCard}>
        <div className={cardsStyles.card2}>
          <div className={cardsStyles.imgContainer}>
            {imageLoading && (
              <div className={cardsStyles.imageLoading}>
                <div className={cardsStyles.loadingSpinner}></div>
              </div>
            )}
            <img 
              src={imageError ? getFallbackImage() : character.characterImage}
              alt={character.names.givenName}
              onError={handleImageError}
              onLoad={handleImageLoad}
              crossOrigin="anonymous"
              loading="lazy"
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
            <div className={cardsStyles.titleAndProgress}>
              <Link className={cardsStyles.navLink} to={`/characters/${character._id}`}>
                <div className={cardsStyles.animeTitle}>
                  {name}
                </div>
              </Link>
            </div>
          </div>
        </div>
        {/* Conditional rendering when hovered */}
        {isHovered}
      </div>
    </div>
  );
}

// Exporting the CharacterCard component as the default export
export default CharacterCard;
