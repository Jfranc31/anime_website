import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userCardStyles from '../styles/components/userCards.module.css';
import cardStyles from '../styles/components/cards.module.css';

function UserAnimeCard({
  anime,
  name,
  layout = 'grid', // 'grid', 'list', or 'compact'
  userProgress,
  userStatus, // 'Watching', 'Planning', or 'Completed
  onProgressUpdate,
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [titleHeight, setTitleHeight] = useState('auto');
  const titleRef = useRef(null);

  useEffect(() => {
    if (titleRef.current) {
      const height = titleRef.current.scrollHeight;
      setTitleHeight(height + 55);
    }
  }, [anime.titles.english]);

  const renderStatusDot = () => {
    if (anime.releaseData.releaseStatus === 'Currently Releasing') {
      return (<div className={userCardStyles.airingDot} />);
    } else if (anime.releaseData.releaseStatus === 'Not Yet Released') {
      return (<div className={userCardStyles.notAiringDot} />)
    }
  };

  const renderProgress = () => {
    const total = anime.lengths.Episodes || '';
    if (userStatus === 'Watching' || userStatus === 'Planning') {
      if (total === '') {
        return `${userProgress}`;
      }
      return `${userProgress}/${total}`;
    }
    return `${total}`;
  };

  if (layout === 'compact') {
    return (
      <div className={userCardStyles.compactWrapper}>
        <div 
          className={`${cardStyles.wide}`} 
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <img 
            src={anime.images.image} 
            alt={name}
            className={userCardStyles.compactHoverImage}
          />
          <div className={userCardStyles.compactContent}>
            <div className={userCardStyles.compactTitleSection}>
              {renderStatusDot()}
              <Link to={`/anime/${anime._id}`} className={userCardStyles.compactLink}>
                <div className={userCardStyles.compactTitle}>
                  <h3>
                    {name}
                  </h3>
                </div>
              </Link>
            </div>
            <div className={userCardStyles.compactProgress}>
              <span>{renderProgress()}</span>
              {isHovered && onProgressUpdate && userStatus !== 'Completed' && (
                <button
                  className={userCardStyles.compactIncreaseButton}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onProgressUpdate(userProgress + 1);
                  }}
                >
                  +
                </button>
              )}
            </div>
            <div className={userCardStyles.compactType}>
              {anime.typings.Format}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid layout (default)
  return (
    <div
      className={`${cardStyles.card} ${layout === 'wide' ? cardStyles.wide : ''} ${layout === 'compact' ? cardStyles.compact : ''}`}
    >
      {renderStatusDot()}
      <div 
        className={`${cardStyles.animeCard} ${isHovered ? cardStyles.hovered : ''}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        
        
          <div className={cardStyles.imgContainer}>
            <img src={anime.images.image} alt={name} />
            <div className={cardStyles.titleAndProgress} style={{ height: titleHeight}}>
              <Link className={cardStyles.navLink} to={`/anime/${anime._id}`}>
                <div className={cardStyles.titleWrapper}>
                  <div className={cardStyles.animeTitle} ref={titleRef}>
                    {name}
                  </div>
                  
                </div>
              </Link>
              <div className={userCardStyles.cardMeta}>
                {renderProgress()}
                {isHovered && onProgressUpdate && userStatus !== 'Completed' && (
                  <button
                    className={userCardStyles.increaseButton}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onProgressUpdate(userProgress + 1);
                    }}
                  >
                    +
                  </button>
                )}
              </div>
            </div>
          </div>
        {isHovered && onProgressUpdate && (
          <button
            className={cardStyles.incrementButton}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onProgressUpdate(userProgress + 1);
            }}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export default UserAnimeCard;