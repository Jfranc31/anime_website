import React from 'react';
import mangaDetailsStyles from '../../styles/pages/manga_details.module.css';

const SkeletonDetails = () => {
  return (
    <div className={mangaDetailsStyles.mangaDetailsPage}>
      <div className={mangaDetailsStyles.mangaHeader}>
        <div className={mangaDetailsStyles.bannerSection}>
          <div className={`${mangaDetailsStyles.bannerImage} bg-gray-200 animate-pulse`} />
          <div className={mangaDetailsStyles.bannerOverlay} />
        </div>

        <div className={mangaDetailsStyles.contentWrapper}>
          <div className={mangaDetailsStyles.posterContainer}>
            {/* Poster Skeleton */}
            <div className="w-full aspect-[2/3] bg-gray-200 animate-pulse" />

            <div className={mangaDetailsStyles.actionButtons}>
              <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />
            </div>
          </div>

          <div className={mangaDetailsStyles.mangaInfo}>
            {/* Title Skeleton */}
            <div className={`${mangaDetailsStyles.mangaTitle} h-8 bg-gray-200 animate-pulse w-3/4 mb-6`} />

            <div className={mangaDetailsStyles.quickInfo}>
              {/* Quick Info Skeletons */}
              {[...Array(7)].map((_, index) => (
                <div key={index} className={mangaDetailsStyles.quickInfoItem}>
                  <div className="h-4 bg-gray-200 animate-pulse w-20" />
                  <div className="h-4 bg-gray-200 animate-pulse w-24 ml-2" />
                </div>
              ))}
            </div>

            <div className={mangaDetailsStyles.mangaTabs}>
              {['About', 'Characters', 'Relations'].map((tab) => (
                <div
                  key={tab}
                  className={`${mangaDetailsStyles.tabButton} bg-gray-200 animate-pulse`}
                  style={{ color: 'transparent' }}
                >
                  {tab}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={mangaDetailsStyles.mangaContent}>
        <div className={mangaDetailsStyles.aboutContainer}>
          {/* Description Skeleton */}
          <div className={mangaDetailsStyles.descriptionSection}>
            {[...Array(4)].map((_, index) => (
              <div
                key={index}
                className={`${mangaDetailsStyles.paragraph} h-4 bg-gray-200 animate-pulse mb-4`}
                style={{ width: `${Math.random() * 30 + 70}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkeletonDetails;
