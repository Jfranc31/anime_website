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
 * @param {Function} props.handleGenreClick - Callback function for genre click.
 * @returns {JSX.Element} - Rendered anime card component.
 */
function AnimeCard({
  anime,
  name,
  onTopRightButtonClick,
  hideTopRightButton = false,
  layout,
  handleGenreClick
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

  // Add this helper function to determine season
  const getSeason = (month) => {
    if (!month) return '';
    const monthNum = parseInt(month);
    if (monthNum >= 3 && monthNum <= 5) return 'Spring';
    if (monthNum >= 6 && monthNum <= 8) return 'Summer';
    if (monthNum >= 9 && monthNum <= 11) return 'Fall';
    return 'Winter';
  };

  // Update the getHeaderInfo function
  const getHeaderInfo = () => {
    const currentYear = new Date().getFullYear();
    const startYear = anime.releaseData.startDate.year;
    const startMonth = anime.releaseData.startDate.month;
    const endYear = anime.releaseData.endDate.year;
    const nextEpisode = anime.nextAiringEpisode;
    const season = getSeason(startMonth);

    if (anime.releaseData.releaseStatus === 'Finished Releasing') {
      if (startYear !== endYear) {
        return `${startYear}-${endYear}`;
      }
      return `${season} ${startYear}`;
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
      className={`${cardsStyles.card} ${layout === 'wide' ? cardsStyles.wide : ''} ${layout === 'compact' ? cardsStyles.compact : ''} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {layout === 'compact' ? (
        <>
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <img src={anime.images.image} alt={anime.titles.english} />
            </div>
          </div>
          <div className={cardsStyles.titleAndProgress} style={{ minHeight: titleHeight }}>
            <Link className={cardsStyles.navLink} to={`/anime/${anime._id}`}>
              <div className={cardsStyles.animeTitle} ref={titleRef}>
                {name}
              </div>
            </Link>
            <div className={cardsStyles.genres}>
              {anime.genres.map((genre) => (
                <button
                  key={genre}
                  className={cardsStyles.genre}
                  onClick={() => handleGenreClick(genre)}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>
          <div className={cardsStyles.formatInfo}>
            <div className={cardsStyles.format}>
              {anime.typings.Format}
            </div>
            {formatLength(anime) && (
              <div className={cardsStyles.episodes}>
                {formatLength(anime)}
              </div>
            )}
          </div>
          <div className={cardsStyles.airingInfo}>
            <div className={cardsStyles.airingDate}>{getHeaderInfo()}</div>
            <div className={cardsStyles.releaseStatus}>
              {anime.releaseData.releaseStatus === 'Currently Releasing' && !anime.nextAiringEpisode
                ? 'Releasing'
                : anime.releaseData.releaseStatus}
            </div>
          </div>
        </>
      ) : (
        // Default and Wide layouts
        <div className={cardsStyles.animeCard}>
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <img src={anime.images.image} alt={anime.titles.english} />
              <div className={cardsStyles.titleAndProgress} style={{ height: titleHeight }}>
                <Link className={cardsStyles.navLink} to={`/anime/${anime._id}`}>
                  <div className={cardsStyles.animeTitle} ref={titleRef}>
                    {name}
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
                  {formatLength(anime) && (
                    <>
                      <span className={cardsStyles.separator}>•</span>
                      <span>{formatLength(anime)}</span>
                    </>
                  )}
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
                    <button
                      key={genre}
                      className={cardsStyles.genre}
                      onClick={() => handleGenreClick(genre)}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
          {isHovered && !hideTopRightButton && (
            <button
              className={cardsStyles.topRightButton}
              onClick={() => onTopRightButtonClick(anime)}
            >
              Edit
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Exporting the AnimeCard component as the default export
export default AnimeCard;
