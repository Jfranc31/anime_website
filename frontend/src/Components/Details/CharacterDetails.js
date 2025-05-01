/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import styles from '../../styles/pages/character_details.module.css';
import { formatDate, formatName } from '../../utils/formatUtils';

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [showSpoilers, setShowSpoilers] = useState(false);

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await axiosInstance.get(`/characters/character/${id}`);
        setCharacter(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load character details');
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  if (loading) {
    return <div className={styles.characterDetailsPage}>Loading...</div>;
  }

  if (error) {
    return <div className={styles.characterDetailsPage}>{error}</div>;
  }

  if (!character) {
    return <div className={styles.characterDetailsPage}>Character not found</div>;
  }

  const getFullName = () => {
    const { givenName, middleName, surName, nativeName } = character.names;
    return [givenName, middleName, surName].filter(Boolean).join(' ') || nativeName;
  };

  const MediaCard = ({ media, role, type }) => {
    if (!media) return null;
    
    const imageUrl = media.images?.image || media.image || '';
    const title = media.titles?.romaji || media.title || 'Unknown Title';
    
    return (
      <a href={`/${type}/${media._id}`} className={styles.mediaCard}>
        <div className={styles.card2}>
          <div className={styles.mediaImageContainer}>
            {imageUrl && <img src={imageUrl} alt={title} />}
            {role && <div className={styles.mediaRole}>{role}</div>}
          </div>
          <div className={styles.mediaInfo}>
            <h4>{formatName(title)}</h4>
          </div>
        </div>
      </a>
    );
  };

  return (
    <div className={styles.characterDetailsPage}>
      <div className={styles.contentWrapper}>
        <div className={styles.posterContainer}>
          <img src={character.characterImage} alt={getFullName()} />
        </div>

        <div className={styles.characterInfo}>
          <h1 className={styles.characterTitle}>{getFullName()}</h1>
          
          {character.names.nativeName && (
            <p className={styles.nativeName}>{character.names.nativeName}</p>
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
              <h3>
                Spoiler Names
                <button 
                  className={styles.spoilerToggle}
                  onClick={() => setShowSpoilers(!showSpoilers)}
                >
                  {showSpoilers ? 'Hide' : 'Show'}
                </button>
              </h3>
              {showSpoilers && (
                <div className={styles.altNamesList}>
                  {character.names.alterSpoiler.map((name, index) => (
                    <span key={index} className={styles.altName}>{name}</span>
                  ))}
                </div>
              )}
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
                {character.about}
              </div>
            </div>
          )}

          {activeTab === 'appearances' && (
            <div className={styles.appearancesContainer}>
              {character.animes?.length > 0 && (
                <div className={styles.appearancesSection}>
                  <h3>Anime Appearances</h3>
                  <div className={styles.appearancesGrid}>
                    {character.animes.map((appearance) => (
                      <MediaCard 
                        key={appearance.animeId || appearance.anime?._id} 
                        media={appearance.anime} 
                        role={appearance.role}
                        type="anime"
                      />
                    ))}
                  </div>
                </div>
              )}

              {character.mangas?.length > 0 && (
                <div className={styles.appearancesSection}>
                  <h3>Manga Appearances</h3>
                  <div className={styles.appearancesGrid}>
                    {character.mangas.map((appearance) => (
                      <MediaCard 
                        key={appearance.mangaId || appearance.manga?._id} 
                        media={appearance.manga} 
                        role={appearance.role}
                        type="manga"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterDetails;
