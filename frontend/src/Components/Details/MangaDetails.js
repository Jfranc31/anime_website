/**
 * src/Components/Details/MangaDetails.js
 * Description: React component for rendering details of a manga.
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../Context/ContextApi';
import MangaEditor from '../ListEditors/MangaEditor';
import mangaDetailsStyles from '../../styles/pages/manga_details.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import { MONTHS } from '../../constants/filterOptions';
import axiosInstance from '../../utils/axiosConfig';
import Loader from '../../constants/Loader.js';
import SkeletonDetails from './SkeletonDetails';

// First, move CharacterCard outside of MangaDetails
const CharacterCard = React.memo(({ character, getFullName }) => {
  return (
    <Link
      to={`/characters/${character.characterDetails._id}`}
      key={character.characterDetails._id}
      className={mangaDetailsStyles.characterCard}
    >
      <div className={mangaDetailsStyles.card2}>
        <div className={mangaDetailsStyles.characterImageContainer}>
          <img
            src={character.characterDetails.characterImage}
            alt={character.characterDetails.names.givenName}
          />
          <div className={mangaDetailsStyles.characterRole}>
            {character.role}
          </div>
        </div>
        <div className={mangaDetailsStyles.characterInfo}>
          <h4>{getFullName(character.characterDetails.names)}</h4>
        </div>
      </div>
    </Link>
  );
});

/**
 * Functional component representing details of a manga.
 * @returns {JSX.Element} - Rendered manga details component.
 */
const MangaDetails = () => {
  const { id } = useParams();
  const { userData, refreshUserData } = useUser();
  const [pageData, setPageData] = useState({
    mangaDetails: null,
    isMangaAdded: false,
    characters: [],
    relations: [],
    userProgress: {
      status: 'Planning',
      currentChapter: 0
    },
    loading: false,
    activeTab: 'about'
  });
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);

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

  // Memoize the user's manga status check
  const updateUserMangaStatus = useCallback(() => {
    if (userData?._id && pageData.mangaDetails?._id) {
      const isAdded = userData.mangas?.some(
        (manga) => manga.mangaId === pageData.mangaDetails._id
      );
      const existingMangaIndex = userData.mangas?.findIndex(
        (manga) => manga.mangaId.toString() === pageData.mangaDetails._id.toString()
      );

      updatePageData({
        isMangaAdded: isAdded,
        ...(existingMangaIndex !== -1 && {
          userProgress: {
            status: userData.mangas[existingMangaIndex].status,
            currentChapter: userData.mangas[existingMangaIndex].currentChapter,
          }
        })
      });
    }
  }, [userData?._id, pageData.mangaDetails?._id, userData?.mangas]);

  // Fetch initial data only when component mounts or ID changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const mangaResponse = await axiosInstance.get(`/mangas/manga/${id}`);
        updatePageData({
          mangaDetails: mangaResponse.data
        });
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]); // Only depend on id changes

  // Separate effect for user status updates
  useEffect(() => {
    updateUserMangaStatus();
  }, [updateUserMangaStatus]);

  const fetchCharacterDetails = async () => {
    updatePageData({ loading: true });
    try {
      const characterIds = (pageData.mangaDetails?.characters || [])
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
      
      const processedCharacters = pageData.mangaDetails.characters
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
        ...(pageData.mangaDetails?.mangaRelations.map(async (relation) => {
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
        ...(pageData.mangaDetails?.animeRelations.map(async (relation) => {
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

  if (!pageData.mangaDetails) {
    return <SkeletonDetails/>;
  }

  const onMangaDelete = (mangaId) => {
    // Implement logic to update the user's manga list after deletion
    refreshUserData();
  };

  const handleModalClose = () => {
    setIsMangaEditorOpen(false);
  };

  const openEditor = () => {
    setIsMangaEditorOpen(true);
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
    <div className={mangaDetailsStyles.mangaDetailsPage}>
      <div className={mangaDetailsStyles.mangaHeader}>
        <div className={mangaDetailsStyles.bannerSection}>
          <img
            src={pageData.mangaDetails?.images?.border || pageData.mangaDetails?.images?.image || ''}
            alt={pageData.mangaDetails?.titles?.english || 'Manga'}
            className={mangaDetailsStyles.bannerImage}
          />
          <div className={mangaDetailsStyles.bannerOverlay} />
        </div>

        <div className={mangaDetailsStyles.contentWrapper}>
          <div className={mangaDetailsStyles.posterContainer}>
            <img
              src={pageData.mangaDetails.images.image}
              alt={pageData.mangaDetails.titles.english}
            />
            <div className={mangaDetailsStyles.actionButtons}>
              {userData && (userData.role === 'admin' || userData.role === 'user') && (
                <>
                  {pageData.isMangaAdded ? (
                      <button onClick={openEditor} className={mangaDetailsStyles.editButton}>
                        Edit Progress
                      </button>
                  ) : (
                    <button onClick={openEditor} className={mangaDetailsStyles.addButton}>
                      Add to List
                    </button>
                  )}
                </>
              )}
            </div>
            {userData.role === 'admin' && (
              <Link
                to={`/manga/${pageData.mangaDetails._id}/update`}
                className={mangaDetailsStyles.editMangaLink}
              >
                <button className={mangaDetailsStyles.editMangaButton}>
                  Edit Manga
                </button>
              </Link>
            )}
          </div>

          <div className={mangaDetailsStyles.mangaInfo}>
            <h1 className={mangaDetailsStyles.mangaTitle}>
              {seriesTitle(pageData.mangaDetails.titles)}
            </h1>

            <div className={mangaDetailsStyles.quickInfo}>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Status:</span> {pageData.mangaDetails?.releaseData?.releaseStatus || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Format:</span> {pageData.mangaDetails?.typings?.Format || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Chapters:</span> {pageData.mangaDetails?.lengths?.Chapters || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Volumes:</span> {pageData.mangaDetails?.lengths?.Volumes || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Start Date:</span>{' '}
                {formatDate(pageData.mangaDetails?.releaseData?.startDate)}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>End Date:</span>{' '}
                {formatDate(pageData.mangaDetails?.releaseData?.endDate)}
              </div>
            </div>

            <div className={mangaDetailsStyles.mangaTabs}>
              <button
                className={`${mangaDetailsStyles.tabButton} ${pageData.activeTab === 'about' ? mangaDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('about')}
              >
                About
              </button>
              <button
                className={`${mangaDetailsStyles.tabButton} ${pageData.activeTab === 'characters' ? mangaDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('characters')}
              >
                Characters
              </button>
              <button
                className={`${mangaDetailsStyles.tabButton} ${pageData.activeTab === 'relations' ? mangaDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('relations')}
              >
                Relations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={mangaDetailsStyles.mangaContent}>
        {pageData.activeTab === 'about' && (
          <div className={mangaDetailsStyles.aboutContainer}>
            <div className={mangaDetailsStyles.metadataGrid}>
              {/* Metadata items */}
            </div>
            <div className={mangaDetailsStyles.descriptionSection}>
              {parseDescription(pageData.mangaDetails.description).map((paragraph, index) => {
                return (
                  <p key={index} className={mangaDetailsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                );
              })}
            </div>
          </div>
        )}

        {pageData.activeTab === 'characters' && (
          <div className={mangaDetailsStyles.charactersContainer}>
            <div className={mangaDetailsStyles.charactersGrid}>
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
          <div className={mangaDetailsStyles.relationsContainer}>
            <div className={mangaDetailsStyles.relationsGrid}>
              {pageData.loading ? (
                <Loader />
              ) : (
                pageData.relations.map((relation) => (
                  <div
                    key={relation.relationDetails._id}
                    onClick={() => handleRelationClick(relation.contentType, relation.relationDetails._id)}
                    className={mangaDetailsStyles.relationCard}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className={mangaDetailsStyles.card2}>
                      <div className={mangaDetailsStyles.relationImageContainer}>
                        <img
                          src={relation.relationDetails.images.image}
                          alt={relation.relationDetails.titles.english}
                        />
                        <div className={mangaDetailsStyles.relationType}>
                          {relation.typeofRelation}
                        </div>
                      </div>
                      <div className={mangaDetailsStyles.relationInfo}>
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

      {isMangaEditorOpen && pageData.userProgress && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <MangaEditor
              manga={pageData.mangaDetails}
              userId={userData._id}
              closeModal={handleModalClose}
              onMangaDelete={onMangaDelete}
              setUserData={refreshUserData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaDetails;
