/**
 * src/Components/Details/AnimeDetails.js
 * Description: React component for rendering details of an anime.
 */

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import data from '../../Context/ContextApi';
import AnimeEditor from '../ListEditors/AnimeEditor';
import animeDetailsStyles from '../../styles/pages/anime_details.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import { MONTHS } from '../../constants/filterOptions';
import axiosInstance from '../../utils/axiosConfig';
import Loader from '../../constants/Loader.js';
import SkeletonDetails from './SkeletonDetails';

/**
 * Functional component representing details of an anime.
 * @returns {JSX.Element} - Rendered anime details component.
 */
const AnimeDetails = () => {
  const { id } = useParams();
  const { userData, setUserData } = useContext(data);
  const [animeDetails, setAnimeDetails] = useState(null);
  const [isAnimeAdded, setIsAnimeAdded] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentEpisode: 0,
  });

  const [activeTab, setActiveTab] = useState('about');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        // Fetch anime details
        const animeResponse = await axiosInstance.get(
          `/animes/anime/${id}`
        );
        setAnimeDetails(animeResponse.data);

        // Only fetch user details if user is logged in
        if (userData?._id) {
          const userResponse = await axiosInstance.get(
            `/users/${userData._id}/current`
          );
          const currentUser = userResponse.data;

          setUserData(currentUser);

          const animeAdded = currentUser?.animes?.some(
            (anime) => anime.animeId === id
          );
          setIsAnimeAdded(animeAdded);

          const existingAnimeIndex = currentUser?.animes?.findIndex(
            (anime) => anime.animeId.toString() === id.toString()
          );

          setAnimeDetails(animeResponse.data);

          if (currentUser && existingAnimeIndex !== -1) {
            setUserProgress({
              status:
                currentUser.animes[existingAnimeIndex].status,
              currentEpisode:
                currentUser.animes[existingAnimeIndex].currentEpisode,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };

    fetchAnimeDetails();
  }, [id, userData, setUserData]);

  const fetchCharacterDetails = async () => {
    setLoading(true);
    setCharactersDetails([]); // Clear previous characters

    try {
      await Promise.all(
        (animeDetails?.characters || []).map(async (character) => {
          try {
            const response = await axiosInstance.get(
              `/characters/character/${character.characterId}`,
            );

            // Immediately update state with the new character
            setCharactersDetails(prev => {
              // Check if character already exists to prevent duplicates
              const existingCharacter = prev.find(
                c => c.characterDetails._id === response.data._id
              );

              if (!existingCharacter) {
                const newCharacter = {
                  ...character,
                  characterDetails: response.data,
                };

                // Sort the characters as they are added
                const updatedCharacters = [...prev, newCharacter]
                  .sort((a, b) => {
                    const rolePriority = ['Main', 'Supporting', 'Background'];
                    const priorityA = rolePriority.indexOf(a.role);
                    const priorityB = rolePriority.indexOf(b.role);

                    if (priorityA === priorityB) {
                      // Sort by anilistId as secondary criteria
                      return (a.characterDetails.anilistId || 0) - (b.characterDetails.anilistId || 0);
                    }

                    return priorityA - priorityB;
                  });

                return updatedCharacters;
              }

              return prev;
            });

            return {
              ...character,
              characterDetails: response.data,
            };
          } catch (error) {
            console.error(
              `Error fetching details for character ${character.characterId}:`,
              error.message
            );
            return null;
          }
        }) || []
      );

    } catch (error) {
      console.error('Error fetching characters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelationDetails = async () => {
    setLoading(true);
    try {
      const relationsWithDetails = await Promise.all([
        ...(animeDetails?.mangaRelations.map(async (relation) => {
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
            if (error.name === 'CanceledError') return null;
            console.error(
              `Error fetching manga relation ${relation.relationId}`,
              error.message
            );
            return null;
          }
        }) || []),
        ...(animeDetails?.animeRelations.map(async (relation) => {
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

      setRelationsDetails(relationsWithDetails);
    } catch (error) {
      console.error('Error fetching relations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'characters') {
      fetchCharacterDetails(); // Fetch characters only when the tab is 'characters'
    }
    if (tab === 'relations') {
      fetchRelationDetails();
    }
  };

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchRelationDetails = async () => {
      try {
        const relationsWithDetails = await Promise.all([
          ...(animeDetails?.mangaRelations?.map(async (relation) => {
            if (!relation?.relationId) return null; // Skip if no relationId
            try {
              const response = await axiosInstance.get(
                `/mangas/manga/${relation.relationId}`,
                { signal: controller.signal }
              );
              if (!isMounted) return null;
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
          ...(animeDetails?.animeRelations?.map(async (relation) => {
            if (!relation?.relationId) return null; // Skip if no relationId
            try {
              const response = await axiosInstance.get(
                `/animes/anime/${relation.relationId}`,
                { signal: controller.signal }
              );
              if (!isMounted) return null;
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

        if (isMounted) {
          setRelationsDetails(
            relationsWithDetails.filter((relation) => relation !== null)
          );
        }
      } catch (error) {
        if (!isMounted || error.name === 'CanceledError') return;
        console.error('Error fetching relation details:', error.message);
      }
    };

    if (animeDetails && (animeDetails.mangaRelations?.length > 0 || animeDetails.animeRelations?.length > 0)) {
      fetchRelationDetails();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [animeDetails]);

  useEffect(() => {
    if (userData?._id && animeDetails?._id) {
      const isAdded = userData.animes?.some(
        (anime) => anime.animeId === animeDetails._id
      );
      setIsAnimeAdded(isAdded);
    }
  }, [userData, animeDetails]);

  if (!animeDetails) {
    return <SkeletonDetails/>;
  }

  const onAnimeDelete = (animeId) => {
    // Implement logic to update the user's anime list after deletion
    setUserData((prevUserData) => {
      const updatedUser = { ...prevUserData };
      const updatedAnimes = updatedUser.animes.filter(
        (anime) => anime.animeId !== animeId
      );
      updatedUser.animes = updatedAnimes;
      return updatedUser;
    });
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

  // Add this helper function to format the date
  const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    const { year, month, day } = dateObj;
    if (!year && !month && !day) return 'TBA';

    // If we have a month, subtract 1 as array is 0-based
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

  const { season, year } = determineSeason(animeDetails.releaseData.startDate);

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
    // Alternative approach using navigate:
    // navigate(`/${contentType}/${relationId}`, { replace: true });
  };

  return (
    <div className={animeDetailsStyles.animeDetailsPage}>
      <div className={animeDetailsStyles.animeHeader}>
        <div className={animeDetailsStyles.bannerSection}>
          <img
            src={animeDetails?.images?.border || animeDetails?.images?.image || ''}
            alt={animeDetails?.titles?.english || 'Anime'}
            className={animeDetailsStyles.bannerImage}
          />
          <div className={animeDetailsStyles.bannerOverlay} />
        </div>

        <div className={animeDetailsStyles.contentWrapper}>
          <div className={animeDetailsStyles.posterContainer}>
            <img
              src={animeDetails?.images?.image || ''}
              alt={animeDetails?.titles?.english || 'Anime'}
            />
            <div className={animeDetailsStyles.actionButtons}>
              {userData && (userData.role === 'admin' || userData.role === 'user') && (
                <>
                  {isAnimeAdded ? (
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
                to={`/anime/${animeDetails._id}/update`}
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
              {seriesTitle(animeDetails?.titles)}
            </h1>

            <div className={animeDetailsStyles.quickInfo}>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Status:</span> {animeDetails?.releaseData?.releaseStatus || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Format:</span> {animeDetails?.typings?.Format || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Episodes:</span> {animeDetails?.lengths?.Episodes || 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Duration:</span> {animeDetails?.lengths?.EpisodeDuration ? `${animeDetails.lengths.EpisodeDuration} mins` : 'TBA'}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Season:</span> {season} {year}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Start Date:</span>{' '}
                {formatDate(animeDetails?.releaseData?.startDate)}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>End Date:</span>{' '}
                {formatDate(animeDetails?.releaseData?.endDate)}
              </div>
            </div>

            <div className={animeDetailsStyles.animeTabs}>
              <button
                className={`${animeDetailsStyles.tabButton} ${activeTab === 'about' ? animeDetailsStyles.active : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About
              </button>
              <button
                className={`${animeDetailsStyles.tabButton} ${activeTab === 'characters' ? animeDetailsStyles.active : ''}`}
                onClick={() => handleTabChange('characters')}
              >
                Characters
              </button>
              <button
                className={`${animeDetailsStyles.tabButton} ${activeTab === 'relations' ? animeDetailsStyles.active : ''}`}
                onClick={() => setActiveTab('relations')}
              >
                Relations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={animeDetailsStyles.animeContent}>
        {activeTab === 'about' && (
          <div className={animeDetailsStyles.aboutContainer}>
            <div className={animeDetailsStyles.metadataGrid}>
              {/* Metadata items */}
            </div>
            <div className={animeDetailsStyles.descriptionSection}>
              {parseDescription(animeDetails.description).map((paragraph, index) => {
                return (
                  <p key={index} className={animeDetailsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className={animeDetailsStyles.charactersContainer}>
            <div className={animeDetailsStyles.charactersGrid}>
              {loading ? (
                <Loader />
              ) : (
                charactersDetails.map((character) => (
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
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className={animeDetailsStyles.relationsContainer}>
            <div className={animeDetailsStyles.relationsGrid}>
              {relationsDetails.map((relation) => (
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
              ))}
            </div>
          </div>
        )}
      </div>

      {isAnimeEditorOpen && userProgress && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <AnimeEditor
              anime={animeDetails}
              userId={userData._id}
              closeModal={handleModalClose}
              onAnimeDelete={onAnimeDelete}
              setUserData={setUserData}
            />
          </div>
        </div>
)}
    </div>
  );
};

export default AnimeDetails;
