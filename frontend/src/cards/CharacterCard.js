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
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
    className={`${cardsStyles.card} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.characterCard}>
        <div className={cardsStyles.card2}>
          <div className={cardsStyles.imgContainer}>
            <img src={character.characterImage} alt={character.names.givenName} />
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
