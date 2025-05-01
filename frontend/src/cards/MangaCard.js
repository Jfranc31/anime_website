/**
 * src/cards/MangaCard.js
 * Description: React component for rendering a manga card.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import cardsStyles from '../styles/components/cards.module.css';
import { useUser } from '../Context/ContextApi';

/**
 * Functional component representing a manga card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.manga - Manga object containing details like titles, images, etc.
 * @param {string} props.title - The title of the manga.
 * @param {Function} props.onTopRightButtonClick - Callback function for top-right button click.
 * @param {Function} props.onAddToLibrary - Callback function for adding manga to library.
 * @param {Function} props.handleGenreClick - Callback function for genre click.
 * @returns {JSX.Element} - Rendered manga card component.
 */
function MangaCard({
  manga,
  title,
  onTopRightButtonClick,
  onAddToLibrary,
  hideTopRightButton = false,
  layout,
  handleGenreClick,
  status
}) {
  const { userData } = useUser();
  const [isHovered, setIsHovered] = useState(false);
  const [titleHeight, setTitleHeight] = useState('auto');
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      const height = titleRef.current.scrollHeight;
      setTitleHeight(height);
    }
  }, [title]);

  const renderStatusIndicator = () => {
    if (!status) return null;

    return (
      <div
        className={`${cardsStyles.statusIndicator} ${cardsStyles[status.toLowerCase()]}`}
        title={`Status: ${status}`}
      />
    );
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

  const getHeaderInfo = () => {
    const currentYear = new Date().getFullYear();
    const startYear = manga.releaseData.startDate.year;
    const startMonth = manga.releaseData.startDate.month;
    const endYear = manga.releaseData.endDate.year;
    const season = getSeason(startMonth);

    if (manga.releaseData.releaseStatus === 'Finished Releasing') {
      if (startYear !== endYear) {
        return `${startYear}-${endYear}`;
      }
      return `${season} ${startYear}`;
    }

    if (startYear < currentYear && manga.releaseData.releaseStatus === 'Currently Releasing') {
      return `Publishing Since ${startYear}`;
    }

    if ( manga.releaseData.releaseStatus === 'Not Yet Released') {
      return `${season} ${startYear}`
    }

    return 'Publishing';
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

  const formatLength = (manga) => {
    const chapters = manga.lengths.chapters;
    if (!chapters) return '';

    return chapters === '1' ? '1 chapter' : `${chapters} chapters`;
  };

  return (
    <div
      className={`${cardsStyles.card} ${layout === 'wide' ? cardsStyles.wide : ''} ${layout === 'compact' ? cardsStyles.compact : ''}`}
    >
      {layout === 'compact' ? (
        <>
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <img src={manga.images.image} alt={manga.titles.english} />
            </div>
          </div>
          <div className={cardsStyles.titleAndProgress}>
            <Link className={cardsStyles.navLink} to={`/manga/${manga._id}`}>
              <div className={cardsStyles.titleWrapper}>
                {renderStatusIndicator()}
                <div className={cardsStyles.mangaTitle} ref={titleRef}>
                  {title}
                </div>
              </div>
            </Link>
            <div className={cardsStyles.genres}>
              {manga.genres.map((genre) => (
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
              {manga.typings.Format}
            </div>
            {formatLength(manga) && (
              <div className={cardsStyles.episodes}>
                {formatLength(manga)}
              </div>
            )}
          </div>
          <div className={cardsStyles.airingInfo}>
            <div className={cardsStyles.airingDate}>{getHeaderInfo()}</div>
            <div className={cardsStyles.releaseStatus}>
              {manga.releaseData.releaseStatus === 'Currently Releasing'
                ? 'Releasing'
                : manga.releaseData.releaseStatus}
            </div>
          </div>
        </>
      ): (
        <div className={`${cardsStyles.mangaCard} ${isHovered ? cardsStyles.hovered : ''}`}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <img src={manga.images.image} alt={manga.titles.english} />
              <div className={cardsStyles.titleAndProgress} style={{ height: titleHeight }}>
                <Link className={cardsStyles.navLink} to={`/manga/${manga._id}`}>
                  <div className={cardsStyles.titleWrapper}>
                    {renderStatusIndicator()}
                    <div className={cardsStyles.mangaTitle} ref={titleRef}>
                      {title}
                    </div>
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
                  <span>{manga.typings.Format}</span>
                  {manga?.lengths?.chapters !== '' && (
                    <><span className={cardsStyles.separator}>•</span><span>{manga?.lengths?.chapters} chapters</span></>
                  )}
                </div>
              </div>
              <div className={cardsStyles.scrollWrap}>
                <div className={cardsStyles.description}>
                  {parseDescription(manga.description).map((paragraph, index) => (
                    <p key={index} className={cardsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                  ))}
                </div>
              </div>
              <div className={cardsStyles.footer}>
                <div className={cardsStyles.genres}>
                  {manga.genres.map((genre) => (
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
          {/* Button for top-right action (Edit or Add to Library) */}
          {isHovered && !hideTopRightButton && userData && (
            <button
              className={cardsStyles.topRightButton}
              onClick={() => onTopRightButtonClick ? onTopRightButtonClick(manga) : onAddToLibrary(manga._id)}
            >
              {onTopRightButtonClick ? 'Edit' : 'Add to Library'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Exporting the MangaCard component as the default export
export default MangaCard;
