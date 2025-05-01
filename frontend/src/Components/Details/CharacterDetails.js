/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../Context/ContextApi';
import characterDetailsStyles from '../../styles/pages/character_details.module.css';
import { MONTHS } from '../../constants/filterOptions';
import axiosInstance from '../../utils/axiosConfig';
import Loader from '../../constants/Loader.js';
import SkeletonDetails from './SkeletonDetails';

// Move MediaCard outside of CharacterDetails
const MediaCard = React.memo(({ media, contentType, seriesTitle }) => {
  return (
    <Link
      to={`/${contentType}/${media.mediaId}`}
      key={media.mediaId}
      className={characterDetailsStyles.mediaCard}
    >
      <div className={characterDetailsStyles.card2}>
        <div className={characterDetailsStyles.mediaImageContainer}>
          <img
            src={media.mediaDetails.images.image}
            alt={media.mediaDetails.titles.english}
          />
          <div className={characterDetailsStyles.mediaRole}>
            {media.role}
          </div>
        </div>
        <div className={characterDetailsStyles.mediaInfo}>
          <h4>{seriesTitle(media.mediaDetails.titles)}</h4>
        </div>
      </div>
    </Link>
  );
});

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const { userData } = useUser();
  const [pageData, setPageData] = useState({
    characterDetails: null,
    animeAppearances: [],
    mangaAppearances: [],
    loading: false,
    activeTab: 'about'
  });

  const updatePageData = (updates) => {
    setPageData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Fetch initial data only when component mounts or ID changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const characterResponse = await axiosInstance.get(`/characters/character/${id}`);
        updatePageData({
          characterDetails: characterResponse.data
        });
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]); // Only depend on id changes

  const fetchMediaAppearances = async () => {
    updatePageData({ loading: true });
    try {
      const [animeAppearances, mangaAppearances] = await Promise.all([
        Promise.all(
          (pageData.characterDetails?.animeAppearances || []).map(async (appearance) => {
            try {
              const response = await axiosInstance.get(`/animes/anime/${appearance.mediaId}`);
              return {
                ...appearance,
                mediaDetails: response.data,
                contentType: 'anime'
              };
            } catch (error) {
              if (error.name === 'CanceledError') return null;
              console.error(`Error fetching anime ${appearance.mediaId}:`, error.message);
              return null;
            }
          })
        ),
        Promise.all(
          (pageData.characterDetails?.mangaAppearances || []).map(async (appearance) => {
            try {
              const response = await axiosInstance.get(`/mangas/manga/${appearance.mediaId}`);
              return {
                ...appearance,
                mediaDetails: response.data,
                contentType: 'manga'
              };
            } catch (error) {
              if (error.name === 'CanceledError') return null;
              console.error(`Error fetching manga ${appearance.mediaId}:`, error.message);
              return null;
            }
          })
        )
      ]);

      updatePageData({
        animeAppearances: animeAppearances.filter(Boolean),
        mangaAppearances: mangaAppearances.filter(Boolean),
        loading: false
      });
    } catch (error) {
      console.error('Error fetching media appearances:', error);
      updatePageData({ loading: false });
    }
  };

  const handleTabChange = (tab) => {
    updatePageData({ activeTab: tab });
    if (tab === 'appearances' && pageData.animeAppearances.length === 0 && pageData.mangaAppearances.length === 0) {
      fetchMediaAppearances();
    }
  };

  if (!pageData.characterDetails) {
    return <SkeletonDetails/>;
  }

  const getFullName = (names) => {
    const givenName = names.givenName || '';
    const middleName = names.middleName || '';
    const surName = names.surName || '';
    const nativeName = names.nativeName || '';

    switch (userData.characterName) {
      case 'romaji':
        return [surName, middleName, givenName].filter(Boolean).join(' ') || nativeName;
      case 'romaji-western':
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
      case 'native':
        return nativeName || [givenName, middleName, surName].filter(Boolean).join(' ');
      default:
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
    }
  };

  const seriesTitle = (titles) => {
    switch (userData.title) {
      case 'english':
        return titles.english || titles.romaji
      case 'romaji':
        return titles.romaji || titles.english
      case 'native':
        return titles.native
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  };

  const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    const { year, month, day } = dateObj;
    if (!year && !month && !day) return 'TBA';

    const monthName = month ? MONTHS[month - 1] : '';
    const formattedDay = day ? day : '';

    if (!monthName && !formattedDay) return year || 'TBA';
    if (!formattedDay) return `${monthName} ${year || 'TBA'}`;

    return `${monthName} ${formattedDay}, ${year || 'TBA'}`;
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
    <div className={characterDetailsStyles.characterDetailsPage}>
      <div className={characterDetailsStyles.characterHeader}>
        <div className={characterDetailsStyles.bannerSection}>
          <img
            src={pageData.characterDetails?.images?.border || pageData.characterDetails?.images?.characterImage || ''}
            alt={getFullName(pageData.characterDetails.names)}
            className={characterDetailsStyles.bannerImage}
          />
          <div className={characterDetailsStyles.bannerOverlay} />
        </div>

        <div className={characterDetailsStyles.contentWrapper}>
          <div className={characterDetailsStyles.posterContainer}>
            <img
              src={pageData.characterDetails.images.characterImage}
              alt={getFullName(pageData.characterDetails.names)}
            />
          </div>

          <div className={characterDetailsStyles.characterInfo}>
            <h1 className={characterDetailsStyles.characterTitle}>
              {getFullName(pageData.characterDetails.names)}
            </h1>

            <div className={characterDetailsStyles.quickInfo}>
              <div className={characterDetailsStyles.quickInfoItem}>
                <span>Gender:</span> {pageData.characterDetails?.gender || 'TBA'}
              </div>
              <div className={characterDetailsStyles.quickInfoItem}>
                <span>Age:</span> {pageData.characterDetails?.age || 'TBA'}
              </div>
              <div className={characterDetailsStyles.quickInfoItem}>
                <span>Birthday:</span> {formatDate(pageData.characterDetails?.birthday)}
              </div>
              <div className={characterDetailsStyles.quickInfoItem}>
                <span>Blood Type:</span> {pageData.characterDetails?.bloodType || 'TBA'}
              </div>
            </div>

            <div className={characterDetailsStyles.characterTabs}>
              <button
                className={`${characterDetailsStyles.tabButton} ${pageData.activeTab === 'about' ? characterDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('about')}
              >
                About
              </button>
              <button
                className={`${characterDetailsStyles.tabButton} ${pageData.activeTab === 'appearances' ? characterDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('appearances')}
              >
                Appearances
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={characterDetailsStyles.characterContent}>
        {pageData.activeTab === 'about' && (
          <div className={characterDetailsStyles.aboutContainer}>
            <div className={characterDetailsStyles.descriptionSection}>
              {parseDescription(pageData.characterDetails.description).map((paragraph, index) => {
                return (
                  <p key={index} className={characterDetailsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                );
              })}
            </div>
          </div>
        )}

        {pageData.activeTab === 'appearances' && (
          <div className={characterDetailsStyles.appearancesContainer}>
            <div className={characterDetailsStyles.appearancesGrid}>
              {pageData.loading ? (
                <Loader />
              ) : (
                <>
                  {pageData.animeAppearances.map((appearance) => (
                    <MediaCard
                      key={appearance.mediaId}
                      media={appearance}
                      contentType="anime"
                      seriesTitle={seriesTitle}
                    />
                  ))}
                  {pageData.mangaAppearances.map((appearance) => (
                    <MediaCard
                      key={appearance.mediaId}
                      media={appearance}
                      contentType="manga"
                      seriesTitle={seriesTitle}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterDetails;
