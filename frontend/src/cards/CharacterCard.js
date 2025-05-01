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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Extract image ID from the characterImage URL
  const getImageId = (url) => {
    if (!url) return '';
    // Try to match both URL patterns
    const match = url.match(/\/(?:large|medium)\/([^\/]+)\./) || 
                 url.match(/\/character\/([^\/]+)\./) || 
                 url.match(/([^\/]+)\./);
    return match ? match[1] : '';
  };

  // Set up the image URL when the component mounts or character changes
  React.useEffect(() => {
    const loadImage = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const imageId = getImageId(character.characterImage);
        if (imageId) {
          const response = await axiosInstance.get(`/characters/image/${imageId}`);
          if (response.data?.dataUrl) {
            setImageUrl(response.data.dataUrl);
          } else {
            throw new Error('No data URL received');
          }
        } else {
          setImageUrl(character.characterImage);
        }
      } catch (err) {
        console.error('Error loading image:', err);
        setError('Failed to load image');
        setImageUrl(character.characterImage);
      } finally {
        setIsLoading(false);
      }
    };

    loadImage();
  }, [character.characterImage]);

  // Handle image loading errors
  const handleImageError = (e) => {
    console.error('Error loading character image:', e);
    setError('Failed to load image');
    setImageUrl(character.characterImage);
  };

  // Get the display name based on user preferences
  const getDisplayName = (title) => {
    if (!title) return '';
    const { romaji, english, native } = title;
    return english || romaji || native || '';
  };

  return (
    <div className={cardsStyles.card}>
      <div className={cardsStyles.characterCard}>
        <div className={cardsStyles.card2}>
          <div className={cardsStyles.imgContainer}>
            {isLoading && <div className={cardsStyles.imageLoading}>Loading...</div>}
            {error && <div className={cardsStyles.imageError}>Image unavailable</div>}
            <img 
              src={imageUrl} 
              alt={character.names.givenName} 
              onError={handleImageError}
              onLoad={() => setIsLoading(false)}
              style={{ display: isLoading || error ? 'none' : 'block' }}
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
        {/* Show anime and manga details directly */}
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
    </div>
  );
}

// Exporting the CharacterCard component as the default export
export default CharacterCard;
