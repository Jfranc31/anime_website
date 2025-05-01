/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../Context/ContextApi';
import axiosInstance from '../../utils/axiosConfig';
import styles from '../../styles/pages/character_details.module.css';
import { formatDate, formatName } from '../../utils/formatUtils';

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const { user, setUser } = useUser();
  const [character, setCharacter] = useState(null);
  const [referencesDetails, setReferencesDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeAppearanceType, setActiveAppearanceType] = useState('anime');
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [revealName, setRevealName] = useState(new Set());

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const response = await axiosInstance.get(`/characters/character/${id}`);
        setCharacter(response.data);

        if (user?._id) {
          const userResponse = await axiosInstance.get(`/users/${user._id}/current`);
          setUser(userResponse.data);
        }
        setLoading(false);
      } catch (err) {
        setError('Failed to load character details');
        setLoading(false);
      }
    };

    fetchCharacterDetails();
  }, [id, user, setUser]);

  useEffect(() => {
    const fetchReferenceDetails = async () => {
      try {
        const animeReferences = await Promise.all(
          (character?.animes || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(`/animes/anime/${reference.animeId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'anime',
              };
            } catch (error) {
              console.error(`Error fetching details for anime reference ${reference.animeId}:`, error);
              return reference;
            }
          })
        );

        const mangaReferences = await Promise.all(
          (character?.mangas || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(`/mangas/manga/${reference.mangaId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'manga',
              };
            } catch (error) {
              console.error(`Error fetching details for manga reference ${reference.mangaId}:`, error);
              return reference;
            }
          })
        );

        setReferencesDetails([...animeReferences, ...mangaReferences]);
      } catch (error) {
        console.error('Error fetching references details:', error);
      }
    };

    if (character) {
      fetchReferenceDetails();
    }
  }, [character]);

  if (loading) {
    return <div className={styles.characterDetailsPage}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.characterDetailsPage}>{error}</div>;
  }

  if (!character) {
    return <div className={styles.characterDetailsPage}>Character not found</div>;
  }

  const getFullName = (type = user?.characterName || 'romaji-western') => {
    const { givenName, middleName, surName, nativeName } = character.names;
    
    switch (type) {
      case 'romaji':
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
      case 'romaji-western':
        return [surName, middleName, givenName].filter(Boolean).join(' ') || nativeName;
      case 'native':
        return nativeName || [givenName, middleName, surName].filter(Boolean).join(' ');
      default:
        return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
    }
  };

  const handleRevealSpoiler = (name) => {
    setRevealName((prev) => {
      const updated = new Set(prev);
      if (updated.has(name)) {
        updated.delete(name);
      } else {
        updated.add(name);
      }
      return new Set(updated);
    });
  };

  const renderSpoilerText = (text, index) => {
    const parts = text.split(/~!(.+?)!~/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        return (
          <span
            key={i}
            className={`${styles.spoilerText} ${revealedSpoilers[`${index}-${i}`] ? styles.revealed : ''}`}
            onClick={() => setRevealedSpoilers(prev => ({ ...prev, [`${index}-${i}`]: !prev[`${index}-${i}`] }))}
          >
            {revealedSpoilers[`${index}-${i}`] ? part : 'Spoiler'}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const seriesTitle = (titles) => {
    switch (user?.title) {
      case 'english':
        return titles?.english || titles?.romaji;
      case 'romaji':
        return titles?.romaji || titles?.english;
      case 'native':
        return titles?.native;
      default:
        return titles?.english || titles?.romaji || titles?.native || 'Unknown Title';
    }
  };

  const MediaCard = ({ reference }) => {
    if (!reference?.referenceDetails) return null;
    
    const { referenceDetails, role, contentType } = reference;
    const imageUrl = referenceDetails.images?.image || referenceDetails.image || '';
    const title = seriesTitle(referenceDetails.titles);
    
    return (
      <Link to={`/${contentType}/${referenceDetails._id}`} className={styles.mediaCard}>
        <div className={styles.card2}>
          <div className={styles.mediaImageContainer}>
            {imageUrl && <img src={imageUrl} alt={title} />}
            {role && <div className={styles.mediaRole}>{role}</div>}
          </div>
          <div className={styles.mediaInfo}>
            <h4>{formatName(title)}</h4>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className={styles.characterDetailsPage}>
      <div className={styles.contentWrapper}>
        <div className={styles.posterContainer}>
          <img src={character.characterImage} alt={getFullName()} />
          {user?.role === 'admin' && (
            <Link to={`/characters/${character._id}/update`} className={styles.editButton}>
              Edit Character
            </Link>
          )}
        </div>

        <div className={styles.characterInfo}>
          <h1 className={styles.characterTitle}>{getFullName()}</h1>
          
          {character.names.nativeName && (
            <p className={styles.nativeName}>{getFullName('native')}</p>
          )}
          
          <div className={styles.quickInfo}>
            {character.gender && (
              <div className={styles.quickInfoItem}>
                <span>Gender</span>
                {character.gender}
              </div>
            )}
            {character.age && (
              <div className={styles.quickInfoItem}>
                <span>Age</span>
                {character.age}
              </div>
            )}
            {(character.DOB?.year || character.DOB?.month || character.DOB?.day) && (
              <div className={styles.quickInfoItem}>
                <span>Birthday</span>
                {formatDate(character.DOB)}
              </div>
            )}
          </div>

          {character.names.alterNames?.length > 0 && (
            <div className={styles.altNames}>
              <h3>Alternative Names</h3>
              <div className={styles.altNamesList}>
                {character.names.alterNames.map((name, index) => (
                  <span key={index} className={styles.altName}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {character.names.alterSpoiler?.length > 0 && (
            <div className={styles.altNames}>
              <h3>Spoiler Names</h3>
              <div className={styles.altNamesList}>
                {character.names.alterSpoiler.map((name, index) => (
                  <span
                    key={index}
                    className={styles.altName}
                    style={{
                      filter: revealName.has(name) ? 'none' : 'blur(4px)',
                      cursor: 'pointer',
                      transition: 'filter 0.3s ease-in-out',
                    }}
                    onClick={() => handleRevealSpoiler(name)}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className={styles.characterTabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'about' ? styles.active : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'appearances' ? styles.active : ''}`}
              onClick={() => setActiveTab('appearances')}
            >
              Appearances
            </button>
          </div>

          {activeTab === 'about' && (
            <div className={styles.characterContent}>
              <div className={styles.characterDescription}>
                {renderSpoilerText(character.about || '', 'about')}
              </div>
            </div>
          )}

          {activeTab === 'appearances' && (
            <div className={styles.appearancesContainer}>
              <div className={styles.appearanceTabs}>
                <button
                  className={`${styles.appearanceTab} ${activeAppearanceType === 'anime' ? styles.active : ''}`}
                  onClick={() => setActiveAppearanceType('anime')}
                >
                  Anime
                </button>
                <button
                  className={`${styles.appearanceTab} ${activeAppearanceType === 'manga' ? styles.active : ''}`}
                  onClick={() => setActiveAppearanceType('manga')}
                >
                  Manga
                </button>
              </div>

              <div className={styles.appearancesGrid}>
                {referencesDetails
                  .filter(ref => ref.contentType === activeAppearanceType)
                  .map((reference, index) => (
                    <MediaCard key={index} reference={reference} />
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterDetails;
