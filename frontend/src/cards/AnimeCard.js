/**
 * src/cards/AnimeCard.js
 * Description: React component for rendering an anime card.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cardsStyles from '../styles/components/cards.module.css';

/**
 * Functional component representing an anime card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.anime - Anime object containing details like titles, images, etc.
 * @param {Function} props.onTopRightButtonClick - Callback function for top-right button click.
 * @returns {JSX.Element} - Rendered anime card component.
 */
function AnimeCard({
  anime,
  onTopRightButtonClick,
  hideTopRightButton = false,
  layout
}) {
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);
  const [titleHeight, setTitleHeight] = useState('auto');
  const titleRef = useRef(null);

  // Use useEffect to measure and set the title height after render
  useEffect(() => {
    if (titleRef.current) {
      const height = titleRef.current.scrollHeight;
      setTitleHeight(height);
    }
  }, [anime.titles.english]); // Re-measure if title changes

  const formatTimeUntilNextEpisode = (timeUntilAiring, episode) => {
    const days = Math.floor(timeUntilAiring / (3600 * 24));
    const hours = Math.floor((timeUntilAiring % (3600 * 24)) / 3600);

    return `Ep ${episode} airing in
            ${days} days, ${hours} hours`;
  };

  const getHeaderInfo = () => {
    const currentYear = new Date().getFullYear();
    const startYear = anime.releaseData.startDate.year;
    const endYear = anime.releaseData.endDate.year;
    const nextEpisode = anime.nextAiringEpisode;

    if (anime.releaseData.releaseStatus === 'Finished Releasing') {
      if (startYear !== endYear) {
        return `${startYear}-${endYear}`;
      }
      return `${startYear}`;
    }

    if (nextEpisode !== null) {
      if (nextEpisode.episode !== null) {
        return formatTimeUntilNextEpisode(nextEpisode.timeUntilAiring, nextEpisode.episode);
      }
    }

    if (startYear !== currentYear) {
      return `Airing Since ${startYear}`;
    }

    return 'Airing';
  };

  const parseDescription = (description) => {
    if (!description) return [];

    // First handle <b> tags by preserving them
    const preserveBoldTags = description.replace(/<b>/g, '###BOLDSTART###')
                                      .replace(/<\/b>/g, '###BOLDEND###');

    // Handle <i> tags by preserving them
    const preserveItalicTags = preserveBoldTags.replace(/<i>/g, '###ITALICSTART###')
                                              .replace(/<\/i>/g, '###ITALICEND###')

    // Split by <br> tags
    const paragraphs = preserveItalicTags.split(/<br>/);

    return paragraphs.map(paragraph => {
      // Remove closing br tags and trim whitespace
      const cleanParagraph = paragraph.replace(/<\/br>/g, '').trim();

      // Restore <b> tags
      return cleanParagraph.replace(/###BOLDSTART###/g, '<b>')
                          .replace(/###BOLDEND###/g, '</b>')
                          .replace(/###ITALICSTART###/g, '<i>')
                          .replace(/###ITALICEND###/g, '</i>');
    }).filter(p => p);
  };

  const formatLength = (anime) => {
    if (anime.typings.Format === 'Movie') {
      const duration = parseInt(anime.lengths.EpisodeDuration);
      if (!duration) return 'Movie';
      
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      
      if (hours > 0) {
        return `${hours}h ${minutes}m`;
      }
      return `${minutes}m`;
    }

    const episodes = anime.lengths.Episodes;
    if (!episodes) return '';
    
    return episodes === '1' ? '1 episode' : `${episodes} episodes`;
  };

  return (
    <div
      className={`${cardsStyles.card} ${layout === 'wide' ? cardsStyles.wide : ''} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.animeCard}>
        <div className={cardsStyles.card2}>
          <div className={cardsStyles.imgContainer}>
            <img src={anime.images.image} alt={anime.titles.english} />
            <div className={cardsStyles.titleAndProgress} style={{ height: titleHeight }}>
              <Link className={cardsStyles.navLink} to={`/anime/${anime._id}`}>
                <div className={cardsStyles.animeTitle} ref={titleRef}>
                  {anime.titles.english}
                </div>
              </Link>
            </div>
          </div>
        </div>
        {layout === 'wide' && (
        <div className={cardsStyles.extendedInfo}>
          <div className={cardsStyles.header}>
            <div className={cardsStyles.date}>
              {getHeaderInfo()}
            </div>
            <div className={cardsStyles.typings}>
              <span>{anime.typings.Format}</span>
              <span className={cardsStyles.separator}>•</span>
              <span>{formatLength(anime)}</span>
            </div>
          </div>
          <div className={cardsStyles.scrollWrap}>
            <div className={cardsStyles.description}>
              {parseDescription(anime.description).map((paragraph, index) => (
                <p key={index} className={cardsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
              ))}
            </div>
          </div>
          <div className={cardsStyles.footer}>
            <div className={cardsStyles.genres}>
              {anime.genres.map((genre) => (
                <div key={genre} className={cardsStyles.genre}>
                  {genre}
                </div>
              ))}
            </div>
          </div>
        </div>
        )}
        {/* Button for top-right action (Edit) */}
        {isHovered && !hideTopRightButton && (
          <button
            className={cardsStyles.topRightButton}
            onClick={() => onTopRightButtonClick(anime)}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// Exporting the AnimeCard component as the default export
export default AnimeCard;
