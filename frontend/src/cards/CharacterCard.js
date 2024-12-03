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
function CharacterCard({ character }) {
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`${cardsStyles.characterCard} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.card2}>
        <div className={cardsStyles.imgContainer}>
          {/* Character image */}
          <img src={character.characterImage} alt={character.names.givenName} />
          <div className={cardsStyles.titleAndProgress}>
            {/* Link to character details page */}
            <Link to={`/characters/${character._id}`}>
              <div className={cardsStyles.animeTitle}>
                {character.names.givenName} {character.names.middleName}{' '}
                {character.names.surName}
              </div>
            </Link>
          </div>
        </div>
      </div>
      {/* Conditional rendering when hovered */}
      {isHovered}
    </div>
  );
}

// Exporting the CharacterCard component as the default export
export default CharacterCard;
