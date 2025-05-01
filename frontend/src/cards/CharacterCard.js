/**
 * src/cards/CharacterCard.js
 * Description: React component for rendering a character card.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import cardsStyles from '../styles/components/cards.module.css';
import axiosInstance from '../utils/axiosConfig';

/**
 * Functional component representing a character card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.character - Character object containing details like names, images, etc.
 * @returns {JSX.Element} - Rendered character card component.
 */
function CharacterCard({ character, name }) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Extract image ID from the characterImage URL
  const getImageId = (url) => {
    if (!url) return '';
    // Try to match both URL patterns
    const match = url.match(/\/(?:large|medium)\/([^\/]+)\./) || url.match(/\/character\/([^\/]+)\./);
    return match ? match[1] : '';
  };

  // Set up the image URL when the component mounts or character changes
  React.useEffect(() => {
    const imageId = getImageId(character.characterImage);
    if (imageId) {
      setImageUrl(`${axiosInstance.defaults.baseURL}/characters/image/${imageId}`);
    } else {
      setImageUrl(character.characterImage); // Fallback to original URL if no ID found
    }
  }, [character.characterImage]);

  // Handle image loading errors
  const handleImageError = (e) => {
    console.error('Error loading character image:', e);
    // Try to extract the image ID again in case the URL format is different
    const imageId = getImageId(character.characterImage);
    if (imageId) {
      // Try the alternative URL pattern
      e.target.src = `https://s4.anilist.co/file/anilistcdn/character/large/${imageId}`;
    } else {
      // If all else fails, use the original URL
      e.target.src = character.characterImage;
    }
  };

  // Get the display name based on user preferences
  const getDisplayName = (title) => {
    if (!title) return '';
    const { romaji, english, native } = title;
    return english || romaji || native || '';
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
            <img 
              src={imageUrl} 
              alt={character.names.givenName} 
              onError={handleImageError}
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
        {/* Show anime and manga details when hovered */}
        {isHovered && (
          <div className={cardsStyles.hoverDetails}>
            <div className={cardsStyles.appearances}>
              {character.animes?.length > 0 && (
                <div className={cardsStyles.appearanceSection}>
                  <h4>Appears in Anime:</h4>
                  <div className={cardsStyles.appearanceList}>
                    {character.animes.map((anime, index) => (
                      <div key={index} className={cardsStyles.appearanceItem}>
                        {anime.animeDetails && (
                          <Link to={`/animes/${anime.animeId}`} className={cardsStyles.appearanceLink}>
                            {getDisplayName(anime.animeDetails)}
                            {anime.role && <span className={cardsStyles.role}>({anime.role})</span>}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {character.mangas?.length > 0 && (
                <div className={cardsStyles.appearanceSection}>
                  <h4>Appears in Manga:</h4>
                  <div className={cardsStyles.appearanceList}>
                    {character.mangas.map((manga, index) => (
                      <div key={index} className={cardsStyles.appearanceItem}>
                        {manga.mangaDetails && (
                          <Link to={`/mangas/${manga.mangaId}`} className={cardsStyles.appearanceLink}>
                            {getDisplayName(manga.mangaDetails)}
                            {manga.role && <span className={cardsStyles.role}>({manga.role})</span>}
                          </Link>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Exporting the CharacterCard component as the default export
export default CharacterCard;
