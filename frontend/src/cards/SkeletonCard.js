import React from 'react';
import cardsStyles from '../styles/components/cards.module.css';

const SkeletonCard = ({ layout }) => {
  return (
    <div className={`${cardsStyles.card} ${layout === 'wide' ? cardsStyles.wide : ''} ${layout === 'compact' ? cardsStyles.compact : ''}`}>
      {layout === 'compact' ? (
        <>
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <div className="bg-gray-200 w-full h-full animate-pulse" />
            </div>
          </div>
          <div className={cardsStyles.titleAndProgress}>
            <div className={cardsStyles.mangaTitle}>
              <div className="h-4 bg-gray-200 w-3/4 mb-2 animate-pulse rounded" />
            </div>
            <div className={cardsStyles.genres}>
              <div className="flex flex-wrap gap-1">
                <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
              </div>
            </div>
          </div>
          <div className={cardsStyles.formatInfo}>
            <div className={cardsStyles.format}>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className={cardsStyles.episodes}>
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className={cardsStyles.airingInfo}>
            <div className={cardsStyles.airingDate}>
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className={cardsStyles.releaseStatus}>
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        </>
      ) : (
        <div className={cardsStyles.mangaCard}>
          <div className={cardsStyles.card2}>
            <div className={cardsStyles.imgContainer}>
              <div className="bg-gray-200 w-full h-full animate-pulse" />
              <div className={cardsStyles.titleAndProgress}>
                <div className={cardsStyles.mangaTitle}>
                  <div className="h-4 bg-gray-200 w-3/4 mb-2 animate-pulse rounded" />
                </div>
              </div>
            </div>
          </div>
          {layout === 'wide' && (
            <div className={cardsStyles.extendedInfo}>
              <div className={cardsStyles.header}>
                <div className={cardsStyles.date}>
                  <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className={cardsStyles.typings}>
                  <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
              <div className={cardsStyles.scrollWrap}>
                <div className={cardsStyles.description}>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-11/12 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className={cardsStyles.footer}>
                <div className={cardsStyles.genres}>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                    <div className="h-6 w-14 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkeletonCard;
