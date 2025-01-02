/**
 * src/Components/Details/MangaDetails.js
 * Description: React component for rendering details of a manga.
 */

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import data from '../../Context/ContextApi';
import MangaEditor from '../ListEditors/MangaEditor';
import mangaDetailsStyles from '../../styles/pages/manga_details.module.css';
import modalStyles from '../../styles/components/Modal.module.css';
import { MONTHS } from '../../constants/filterOptions';
import axiosInstance from '../../utils/axiosConfig';

/**
 * Functional component representing details of a manga.
 * @returns {JSX.Element} - Rendered manga details component.
 */
const MangaDetails = () => {
  const { id } = useParams();
  const { userData, setUserData } = useContext(data);
  const [mangaDetails, setMangaDetails] = useState(null);
  const [isMangaAdded, setIsMangaAdded] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);
  const [isMangaEditorOpen, setIsMangaEditorOpen] = useState(false);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentChapter: 0,
    currentVolume: 0,
  });

  const [activeTab, setActiveTab] = useState('about');

  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  const navigate = useNavigate();

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        // Fetch manga details
        const mangaResponse = await axiosInstance.get(
          `/mangas/manga/${id}`
        );
        setMangaDetails(mangaResponse.data);

        if (userData?.id) {
          const userResponse = await axiosInstance.get(
            `/users/${userData._id}/current`
          );
          const currentUser = userResponse.data;

          setUserData(currentUser);

          const mangaAdded = currentUser?.mangas?.some(
            (manga) => manga.mangaId === id
          );
          setIsMangaAdded(mangaAdded);

          const existingMangaIndex = currentUser?.mangas?.findIndex(
            (manga) => manga.mangaId.toString() === id.toString()
          );

          setMangaDetails(mangaResponse.data);

          if (currentUser && existingMangaIndex !== -1) {
            setUserProgress({
              status:
                currentUser.mangas[existingMangaIndex].status,
              currentChapter:
                currentUser.mangas[existingMangaIndex].currentChapter,
              currentVolume:
                currentUser.mangas[existingMangaIndex].currentVolume,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching manga details:', error);
      }
    };

    fetchMangaDetails();
  }, [id, setUserData, userData._id, setIsMangaAdded]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchCharacterDetails = async () => {
      try {
        const charactersWithDetails = await Promise.all(
          mangaDetails?.characters.map(async (character) => {
            if (!character?.characterId) return null; // Skip if no characterId
            try {
              const response = await axiosInstance.get(
                `/characters/character/${character.characterId}`,
                { signal: controller.signal }
              );
              if (!isMounted) return null;
              return {
                ...character,
                characterDetails: response.data,
              };
            } catch (error) {
              if (error.name === 'CanceledError') return null; // Silently handle canceled requests
              console.error(
                `Error fetching details for character ${character.characterId}:`,
                error.message
              );
              return null;
            }
          }) || []
        );

        if (isMounted) {
          setCharactersDetails(charactersWithDetails.filter(Boolean));
        }
      } catch (error) {
        if (!isMounted || error.name === 'CanceledError') return;
        console.error('Error fetching character details:', error.message);
      }
    };

    if (mangaDetails?.characters?.length > 0) {
      fetchCharacterDetails();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [mangaDetails]);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchRelationDetails = async () => {
      try {
        const relationsWithDetails = await Promise.all([
          ...(mangaDetails?.mangaRelations?.map(async (relation) => {
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
          ...(mangaDetails?.animeRelations?.map(async (relation) => {
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

    if (mangaDetails && (mangaDetails.mangaRelations?.length > 0 || mangaDetails.animeRelations?.length > 0)) {
      fetchRelationDetails();
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [mangaDetails]);

  useEffect(() => {
    if (userData?._id && mangaDetails?._id) {
      const isAdded = userData.mangas?.some(
        (manga) => manga.mangaId === mangaDetails._id
      );
      setIsMangaAdded(isAdded);
    }
  }, [userData, mangaDetails]);

  if (!mangaDetails) {
    return <div>Loading...</div>;
  }

  const onMangaDelete = (mangaId) => {
    // Implement logic to update the user's anime list after deletion
    setUserData((prevUserData) => {
      const updatedUser = { ...prevUserData };
      const updatedMangas = updatedUser.mangas.filter(
        (manga) => manga.mangaId !== mangaId
      );
      updatedUser.mangas = updatedMangas;
      return updatedUser;
    });
  };

  const handleModalClose = () => {
    setIsMangaEditorOpen(false);
  };

  const openEditor = () => {
    setIsMangaEditorOpen(true);
  };

  const getFullName = (names) => {
    const nameParts = [];
    if (names.givenName) nameParts.push(names.givenName);
    if (names.middleName) nameParts.push(names.middleName);
    if (names.surName) nameParts.push(names.surName);
    return nameParts.join(' ');
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

  const { season, year } = determineSeason(mangaDetails.releaseData.startDate);

  const toggleSpoiler = (index) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderSpoilerText = (text, index) => {
    if (typeof text !== 'string') {
      text = String(text);
    }

    const parts = text.split(/~!(.+?)!~/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is spoiler content
        return (
          <span
            key={i}
            className={`${mangaDetailsStyles.spoilerText} ${
              revealedSpoilers[`${index}-${i}`] ? mangaDetailsStyles.revealed : ''
            }`}
            onClick={() => toggleSpoiler(`${index}-${i}`)}
          >
            {revealedSpoilers[`${index}-${i}`] ? part : 'Spoiler'}
          </span>
        );
      }
      return part;
    });
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
            src={mangaDetails?.images?.border || mangaDetails?.images?.image || ''}
            alt={mangaDetails?.titles?.english || 'Manga'}
            className={mangaDetailsStyles.bannerImage}
          />
          <div className={mangaDetailsStyles.bannerOverlay} />
        </div>

        <div className={mangaDetailsStyles.contentWrapper}>
          <div className={mangaDetailsStyles.posterContainer}>
            <img
              src={mangaDetails.images.image}
              alt={mangaDetails.titles.english}
            />
            <div className={mangaDetailsStyles.actionButtons}>
              {userData && (userData.role === 'admin' || userData.role === 'user') && (
                <>
                  {isMangaAdded ? (
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
                to={`/manga/${mangaDetails._id}/update`}
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
              {mangaDetails.titles.english}
            </h1>
            {mangaDetails.titles.native && (
              <div className={mangaDetailsStyles.nativeTitle}>
                {mangaDetails.titles.native}
              </div>
            )}

            <div className={mangaDetailsStyles.quickInfo}>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Status:</span> {mangaDetails?.releaseData?.releaseStatus || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Format:</span> {mangaDetails?.typings?.Format || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Chapters:</span> {mangaDetails?.lengths?.chapters || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Volumes:</span> {mangaDetails?.lengths?.volumes || 'TBA'}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Season:</span> {season} {year}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Start Date:</span>{' '}
                {formatDate(mangaDetails?.releaseData?.startDate)}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>End Date:</span>{' '}
                {formatDate(mangaDetails?.releaseData?.endDate)}
              </div>
            </div>

            <div className={mangaDetailsStyles.mangaTabs}>
              <button
                className={`${mangaDetailsStyles.tabButton} ${activeTab === 'about' ? mangaDetailsStyles.active : ''}`}
                onClick={() => setActiveTab('about')}
              >
                About
              </button>
              <button
                className={`${mangaDetailsStyles.tabButton} ${activeTab === 'characters' ? mangaDetailsStyles.active : ''}`}
                onClick={() => setActiveTab('characters')}
              >
                Characters
              </button>
              <button
                className={`${mangaDetailsStyles.tabButton} ${activeTab === 'relations' ? mangaDetailsStyles.active : ''}`}
                onClick={() => setActiveTab('relations')}
              >
                Relations
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={mangaDetailsStyles.mangaContent}>
        {activeTab === 'about' && (
          <div className={mangaDetailsStyles.aboutContainer}>
            <div className={mangaDetailsStyles.metadataGrid}>
              {/* Metadata items */}
            </div>
            <div className={mangaDetailsStyles.descriptionSection}>
              {parseDescription(mangaDetails.description).map((paragraph, index) => {
                return (
                  <p key={index} className={mangaDetailsStyles.paragraph} dangerouslySetInnerHTML={{ __html: paragraph }} />
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className={mangaDetailsStyles.charactersContainer}>
            <div className={mangaDetailsStyles.charactersGrid}>
              {charactersDetails.map((character) => (
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
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className={mangaDetailsStyles.relationsContainer}>
            <div className={mangaDetailsStyles.relationsGrid}>
              {relationsDetails.map((relation) => (
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
                      <h4>{relation.relationDetails.titles.english}</h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {isMangaEditorOpen && userProgress && (
        <div className={modalStyles.modalOverlay} onClick={handleModalClose}>
          <div
            className={modalStyles.characterModal}
            onClick={(e) => e.stopPropagation()}
          >
            <MangaEditor
              manga={mangaDetails}
              userId={userData._id}
              closeModal={handleModalClose}
              onMangaDelete={onMangaDelete}
              setUserData={setUserData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MangaDetails;
