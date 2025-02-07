import React from 'react';
import characterDetailsStyles from '../../styles/pages/character_details.module.css';

const CharacterDetailsSkeleton = () => {
  return (
    <div className={characterDetailsStyles.characterDetailsPage}>
      <div className={characterDetailsStyles.characterHeader}>
        <div className={characterDetailsStyles.characterImageSection}>
          {/* Character Image Skeleton */}
          <div
            className={`${characterDetailsStyles.characterMainImage} bg-gray-200 animate-pulse`}
            style={{ aspectRatio: '2/3' }}
          />
        </div>

        <div className={characterDetailsStyles.characterInfoSection}>
          {/* Character Name Skeleton */}
          <div className={`${characterDetailsStyles.characterName} bg-gray-200 animate-pulse h-8 w-64 mb-4`} />

          {/* Alternative Names Skeleton */}
          <div className={`${characterDetailsStyles.characterAltNames} bg-gray-200 animate-pulse h-4 w-96 mb-6`} />

          {/* Tabs Skeleton */}
          <div className={characterDetailsStyles.characterTabs}>
            {['About', 'Appearances'].map((tab) => (
              <div
                key={tab}
                className={`${characterDetailsStyles.tabButton} bg-gray-200 animate-pulse`}
                style={{ color: 'transparent' }}
              >
                {tab}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={characterDetailsStyles.characterContent}>
        {/* About Section Skeleton */}
        <div className={characterDetailsStyles.characterMetadata}>
          {/* Metadata Items */}
          {[...Array(5)].map((_, index) => (
            <div key={index} className={characterDetailsStyles.metadataItem}>
              <span className={`${characterDetailsStyles.metadataLabel} bg-gray-200 animate-pulse h-4 w-20`} />
              <span className={`${characterDetailsStyles.metadataValue} bg-gray-200 animate-pulse h-4 w-32 ml-2`} />
            </div>
          ))}
        </div>

        {/* Description Paragraphs Skeleton */}
        <div className={characterDetailsStyles.characterDescription}>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-200 animate-pulse h-4 mb-4"
              style={{ width: `${Math.random() * 30 + 70}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CharacterDetailsSkeleton;
