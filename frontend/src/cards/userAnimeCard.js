import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userCardStyles from '../styles/components/userCards.module.css';
import cardStyles from '../styles/components/cards.module.css';

function UserAnimeCard({
  anime,
  name,
  layout = 'grid', // 'grid' or 'compact'
  onTopRightButtonClick,
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

  return (
    <div
      className={`${cardStyles.card} ${layout === 'compact' ? cardStyles.compact : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {layout === 'compact' ? (
        <>
          <div className={cardStyles.card2}>
            <div className={cardStyles.imgContainer}>
              <img src={anime.images.image} alt={anime.titles.english} />
            </div>
          </div>
          <div className={cardStyles.titleAndProgress}>
            <div className={cardStyles.titleWrapper}>
              {renderStatusDot()}
              <Link to={`/anime/${anime._id}`} className={userCardStyles.compactLink}>
                <div className={cardStyles.animeTitle} ref={titleRef}>
                  <h3>
                    {name}
                  </h3>
                </div>
              </Link>
            </div>
          </div>
          {/* New editor button between title and progress */}
          {isHovered && (
            <button
              className={userCardStyles.compactEditorButton}
              onClick={() => onTopRightButtonClick('anime', anime)}
            >
              •••
            </button>
          )}
          <div className={cardStyles.formatInfo}>
            <div className={cardStyles.format}>
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
          </div>
          <div className={userCardStyles.compactType}>
            {anime.typings.Format}
          </div>
          
        </>
      ) : (
        // renderStatusDot()
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
          {isHovered && (
            <button
              className={cardStyles.incrementButton}
              onClick={() => onTopRightButtonClick('anime', anime)}
            >
              •••
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default UserAnimeCard;