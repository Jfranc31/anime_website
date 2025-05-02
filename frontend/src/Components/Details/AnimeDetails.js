/**
 * src/Components/Details/AnimeDetails.js
 * Description: React component for rendering details of an anime.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../Context/ContextApi';
import AnimeEditor from '../ListEditors/AnimeEditor';
import animeDetailsStyles from '../../styles/pages/anime_details.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import { MONTHS } from '../../constants/filterOptions';
import axiosInstance from '../../utils/axiosConfig';
import Loader from '../../constants/Loader.js';
import SkeletonDetails from './SkeletonDetails';

// First, move CharacterCard outside of AnimeDetails
const CharacterCard = React.memo(({ character, getFullName }) => {
  return (
    <Link
      to={`/characters/${character.characterDetails._id}`}
      key={character.characterDetails._id}
      className={animeDetailsStyles.characterCard}
    >
      <div className={animeDetailsStyles.card2}>
        <div className={animeDetailsStyles.characterImageContainer}>
          <img
            src={character.characterDetails.characterImage}
            alt={character.characterDetails.names.givenName}
          />
          <div className={animeDetailsStyles.characterRole}>
            {character.role}
          </div>
        </div>
        <div className={animeDetailsStyles.characterInfo}>
          <h4>{getFullName(character.characterDetails.names)}</h4>
        </div>
      </div>
    </Link>
  );
});

/**
 * Functional component representing details of an anime.
 * @returns {JSX.Element} - Rendered anime details component.
 */
const AnimeDetails = () => {
  const { id } = useParams();
  const { userData, refreshUserData } = useUser();
  const [pageData, setPageData] = useState({
    animeDetails: null,
    isAnimeAdded: false,
    characters: [],
    relations: [],
    userProgress: {
      status: 'Planning',
      currentEpisode: 0
    },
    loading: false,
    activeTab: 'about'
  });
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);

  // Move useMemo before any conditional returns
  const sortedCharacters = useMemo(() => {
    return pageData.characters.sort((a, b) => {
      const rolePriority = ['Main', 'Supporting', 'Background'];
      const priorityA = rolePriority.indexOf(a.role);
      const priorityB = rolePriority.indexOf(b.role);
      return priorityA - priorityB;
    });
  }, [pageData.characters]);

  const updatePageData = (updates) => {
    setPageData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Memoize the user's anime status check
  const updateUserAnimeStatus = useCallback(() => {
    if (userData?._id && pageData.animeDetails?._id) {
      const isAdded = userData.animes?.some(
        (anime) => anime.animeId === pageData.animeDetails._id
      );
      const existingAnimeIndex = userData.animes?.findIndex(
        (anime) => anime.animeId.toString() === pageData.animeDetails._id.toString()
      );

      updatePageData({
        isAnimeAdded: isAdded,
        ...(existingAnimeIndex !== -1 && {
          userProgress: {
            status: userData.animes[existingAnimeIndex].status,
            currentEpisode: userData.animes[existingAnimeIndex].currentEpisode,
          }
        })
      });
    }
  }, [userData?._id, pageData.animeDetails?._id, userData?.animes]);

  // Fetch initial data only when component mounts or ID changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const animeResponse = await axiosInstance.get(`/animes/anime/${id}`);
        updatePageData({
          animeDetails: animeResponse.data
        });
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]); // Only depend on id changes

  // Separate effect for user status updates
  useEffect(() => {
    updateUserAnimeStatus();
  }, [updateUserAnimeStatus]);

  const fetchCharacterDetails = async () => {
    updatePageData({ loading: true });
    try {
      const characterIds = (pageData.animeDetails?.characters || [])
        .map(char => char.characterId)
        .join(',');
      
      const response = await axiosInstance.get('/characters/batch', {
        params: { ids: characterIds }
      });
      
      const characterMap = response.data.reduce((acc, char) => {
        acc[char._id] = char;
        return acc;
      }, {});
      
      // Create a Set to track unique character IDs
      const uniqueCharacterIds = new Set();
      
      const processedCharacters = pageData.animeDetails.characters
        .map(char => ({
          ...char,
          characterDetails: characterMap[char.characterId]
        }))
        .filter(char => {
          // Only include characters that have details and haven't been seen before
          if (!char.characterDetails || uniqueCharacterIds.has(char.characterId)) {
            return false;
          }
          uniqueCharacterIds.add(char.characterId);
          return true;
        })
        .sort((a, b) => {
          const rolePriority = ['Main', 'Supporting', 'Background'];
          return rolePriority.indexOf(a.role) - rolePriority.indexOf(b.role);
        });
      
      updatePageData({ 
        characters: processedCharacters,
        loading: false 
      });
    } catch (error) {
      console.error('Error fetching characters:', error);
      updatePageData({ loading: false });
    }
  };

  const fetchRelationDetails = async () => {
    updatePageData({ loading: true });
    try {
      const relationsWithDetails = await Promise.all([
        ...(pageData.animeDetails?.animeRelations.map(async (relation) => {
          try {
            const response = await axiosInstance.get(
              `/animes/anime/${relation.relationId}`,
            );
            return {
              ...relation,
              relationDetails: response.data,
              contentType: 'anime',
            };
          } catch (error) {
            if (error.name === 'CanceledError') return null; // Silently handle canceled requests
            console.error(
              `Error fetching anime relation ${relation.relationId}:`,
              error.message
            );
            return null;
          }
        }) || []),
        ...(pageData.animeDetails?.mangaRelations.map(async (relation) => {
          try {
            const response = await axiosInstance.get(
              `/mangas/manga/${relation.relationId}`,
            );
            return {
              ...relation,
              relationDetails: response.data,
              contentType: 'manga',
            };
          } catch (error) {
            if (error.name === 'CanceledError') return null; // Silently handle canceled requests
            console.error(
              `Error fetching manga relation ${relation.relationId}:`,
              error.message
            );
            return null;
          }
        }) || []),
      ]);

      updatePageData({ relations: relationsWithDetails });
    } catch (error) {
      console.error('Error fetching relations:', error);
    } finally {
      updatePageData({ loading: false });
    }
  };

  const handleTabChange = (tab) => {
    updatePageData({ activeTab: tab });
    if (tab === 'characters' && pageData.characters.length === 0) {
      // Only fetch if we haven't loaded characters yet
      fetchCharacterDetails();
    }
    if (tab === 'relations' && pageData.relations.length === 0) {
      fetchRelationDetails();
    }
  };

  if (!pageData.animeDetails) {
    return <SkeletonDetails/>;
  }

  const onAnimeDelete = (animeId) => {
    // Implement logic to update the user's anime list after deletion
    refreshUserData();
  };

  const handleModalClose = () => {
    setIsAnimeEditorOpen(false);
  };

  const openEditor = () => {
    setIsAnimeEditorOpen(true);
  };

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

  const determineSeason = (startDate) => {
    if (!startDate || !startDate.month)
      return { season: 'TBA', year: startDate?.year || 'TBA' };

    const month = startDate.month;
    let season;

    if (month >= 3 && month <= 5) season = 'Spring';
    else if (month >= 6 && month <= 8) season = 'Summer';
    else if (month >= 9 && month <= 11) season = 'Fall';
    else season = 'Winter';

    return {
      season,
      year: startDate.year || 'TBA',
    };
  };

  const { season, year } = determineSeason(pageData.animeDetails.releaseData.startDate);

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

  const handleRelationClick = (contentType, relationId) => {
    // Force a full navigation to the new page
    window.location.href = `/${contentType}/${relationId}`;
  };

  return (
    <div className={animeDetailsStyles.animeDetailsPage}>
      <div className={animeDetailsStyles.animeHeader}>
        <div className={animeDetailsStyles.bannerSection}>
          <img
            src={pageData.animeDetails?.images?.border || pageData.animeDetails?.images?.image || ''}
            alt={pageData.animeDetails?.titles?.english || 'Anime'}
            className={animeDetailsStyles.bannerImage}
          />
          <div className={animeDetailsStyles.bannerOverlay} />
        </div>

        <div className={animeDetailsStyles.contentWrapper}>
          <div className={animeDetailsStyles.posterContainer}>
            <img
              src={pageData.animeDetails.images.image}
              alt={pageData.animeDetails.titles.english}
            />
            <div className={animeDetailsStyles.actionButtons}>
              {userData && (userData.role === 'admin' || userData.role === 'user') && (
                <>
                  {pageData.isAnimeAdded ? (
                      <button onClick={openEditor} className={animeDetailsStyles.editButton}>
                        Edit Progress
                      </button>
                  ) : (
                    <button onClick={openEditor} className={animeDetailsStyles.addButton}>
                      Add to List
                    </button>
                  )}
                </>
              )}
            </div>
            {userData.role === 'admin' && (
              <Link
                to={`/anime/${pageData.animeDetails._id}/update`}
                className={animeDetailsStyles.editAnimeLink}
              >
                <button className={animeDetailsStyles.editAnimeButton}>
                  Edit Anime
                </button>
              </Link>
            )}
          </div>

          <div className={animeDetailsStyles.animeInfo}>
            <h1 className={animeDetailsStyles.animeTitle}>
              {seriesTitle(pageData.animeDetails.titles)}
            </h1>

            <div className={animeDetailsStyles.quickInfo}>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Status:</span> {pageData.animeDetails?.releaseData?.releaseStatus || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Format:</span> {pageData.animeDetails?.typings?.Format || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Episodes:</span> {pageData.animeDetails?.lengths?.Episodes || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Duration:</span> {pageData.animeDetails?.lengths?.Duration || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Season:</span> {season} {year}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Start Date:</span>{' '}
                {formatDate(pageData.animeDetails?.releaseData?.startDate)}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>End Date:</span>{' '}
                {formatDate(pageData.animeDetails?.releaseData?.endDate)}
              </div>
            </div>

            <div className={animeDetailsStyles.animeTabs}>
              <button
                className={`${animeDetailsStyles.tabButton} ${pageData.activeTab === 'about' ? animeDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('about')}
              >
                About
              </button>
              <button
                className={`${animeDetailsStyles.tabButton} ${pageData.activeTab === 'characters' ? animeDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('characters')}
              >
                Characters
              </button>
              <button
                className={`${animeDetailsStyles.tabButton} ${pageData.activeTab === 'relations' ? animeDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('relations')}
              >
                Relations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={animeDetailsStyles.animeContent}>
        {pageData.activeTab === 'about' && (
          <div className={animeDetailsStyles.aboutContainer}>
            <div className={animeDetailsStyles.metadataGrid}>
              {/* Metadata items */}
            </div>
            <div className={animeDetailsStyles.descriptionSection}>
              {parseDescription(pageData.animeDetails.description).map((paragraph, index) => {
                return (
                  <p key={index} className={animeDetailsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                );
              })}
            </div>
          </div>
        )}

        {pageData.activeTab === 'characters' && (
          <div className={animeDetailsStyles.charactersContainer}>
            <div className={animeDetailsStyles.charactersGrid}>
              {pageData.loading ? (
                <Loader />
              ) : (
                sortedCharacters.map((character) => (
                  <CharacterCard 
                    key={character.characterDetails._id}
                    character={character} 
                    getFullName={getFullName}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {pageData.activeTab === 'relations' && (
          <div className={animeDetailsStyles.relationsContainer}>
            <div className={animeDetailsStyles.relationsGrid}>
              {pageData.loading ? (
                <Loader />
              ) : (
                pageData.relations.map((relation) => (
                  <div
                    key={relation.relationDetails._id}
                    onClick={() => handleRelationClick(relation.contentType, relation.relationDetails._id)}
                    className={animeDetailsStyles.relationCard}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={animeDetailsStyles.card2}>
                      <div className={animeDetailsStyles.relationImageContainer}>
                        <img
                          src={relation.relationDetails.images.image}
                          alt={relation.relationDetails.titles.english}
                        />
                        <div className={animeDetailsStyles.relationType}>
                          {relation.typeofRelation}
                        </div>
                      </div>
                      <div className={animeDetailsStyles.relationInfo}>
                        <h4>{seriesTitle(relation.relationDetails.titles)}</h4>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {isAnimeEditorOpen && pageData.userProgress && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimeEditor
              anime={pageData.animeDetails}
              userId={userData._id}
              closeModal={handleModalClose}
              onAnimeDelete={onAnimeDelete}
              setUserData={refreshUserData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimeDetails;
