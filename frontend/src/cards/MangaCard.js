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
function MangaCard({
  manga,
  onTopRightButtonClick,
  hideTopRightButton = false,
  layout
}) {
  // State to track hover state
  const [isHovered, setIsHovered] = useState(false);

  const getHeaderInfo = () => {
    const currentYear = new Date().getFullYear();
    const startYear = manga.releaseData.startDate.year;
    const endYear = manga.releaseData.endDate.year;

    if (manga.releaseData.releaseStatus === 'Finished Releasing') {
      if (startYear !== endYear) {
        return `${startYear}-${endYear}`;
      }
      return `${startYear}`;
    }

    if (startYear !== currentYear) {
      return `Publishing Since ${startYear}`;
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

  return (
    <div
      className={`${cardsStyles.card} ${layout === 'wide' ? cardsStyles.wide : ''} ${isHovered ? cardsStyles.hovered : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={cardsStyles.mangaCard}>
        <div className={cardsStyles.card2}>
          <div className={cardsStyles.imgContainer}>
            <img src={manga.images.image} alt={manga.titles.english} />
            <div className={cardsStyles.titleAndProgress}>
              <Link className={cardsStyles.navLink} to={`/manga/${manga._id}`}>
                <div className={cardsStyles.animeTitle}>
                  {manga.titles.english}
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
                {manga.lengths.chapters !== '' && (
                  <><span className={cardsStyles.separator}>•</span><span>{manga.lengths.chapters} chapters</span></>
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
            onClick={() => onTopRightButtonClick(manga)}
          >
            Edit
          </button>
        )}
      </div>
    </div>
  );
}

// Exporting the MangaCard component as the default export
export default MangaCard;
