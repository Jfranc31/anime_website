/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../context/ContextApi';
import axios from 'axios';
import styles from '../../styles/pages/character_details.module.css';

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const { user, setUser } = useUser();
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [activeAppearanceTab, setActiveAppearanceTab] = useState('anime');

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/characters/characters/${id}`);
        setCharacter(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch character details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  const getFullName = () => {
    if (!character?.names) return '';
    const { givenName, middleName, surName } = character.names;
    return [givenName, middleName, surName].filter(Boolean).join(' ');
  };

  const seriesTitle = (media) => {
    if (!media) return '';
    if (user?.preferences?.titleLanguage === 'romaji') return media.title.romaji;
    if (user?.preferences?.titleLanguage === 'english') return media.title.english;
    return media.title.native;
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!character) return <div>Character not found</div>;

  return (
    <div className={styles.characterDetailsPage}>
      <div className={styles.contentWrapper}>
        <div className={styles.posterContainer}>
          <img
            src={character.characterImage}
            alt={getFullName()}
          />
          {user?.isAdmin && (
            <Link to={`/characters/edit/${id}`} className={styles.editButton}>
              Edit Character
            </Link>
          )}
        </div>

        <div className={styles.characterInfo}>
          <h1 className={styles.characterTitle}>{getFullName()}</h1>
          <h2 className={styles.nativeName}>{character.names.nativeName}</h2>

          <div className={styles.quickInfo}>
            <div className={styles.quickInfoItem}>
              <span>Gender</span>
              <span>{character.gender}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <span>Age</span>
              <span>{character.age}</span>
            </div>
            <div className={styles.quickInfoItem}>
              <span>Birthday</span>
              <span>{character.DOB}</span>
            </div>
          </div>

          <div className={styles.altNames}>
            <h3>Alternative Names</h3>
            <div className={styles.altNamesList}>
              {character.names.alterNames?.map((name, index) => (
                <span key={index} className={styles.altName}>
                  {name}
                </span>
              ))}
              {character.names.alterSpoiler?.map((name, index) => (
                <span key={`spoiler-${index}`} className={styles.spoilerText}>
                  {name}
                </span>
              ))}
            </div>
          </div>

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
              <p className={styles.characterDescription}>{character.about}</p>
            </div>
          )}

          {activeTab === 'appearances' && (
            <div className={styles.appearancesContainer}>
              <div className={styles.appearanceTabs}>
                <button
                  className={`${styles.appearanceTab} ${activeAppearanceTab === 'anime' ? styles.active : ''}`}
                  onClick={() => setActiveAppearanceTab('anime')}
                >
                  Anime
                </button>
                <button
                  className={`${styles.appearanceTab} ${activeAppearanceTab === 'manga' ? styles.active : ''}`}
                  onClick={() => setActiveAppearanceTab('manga')}
                >
                  Manga
                </button>
              </div>

              <div className={styles.appearancesGrid}>
                {activeAppearanceTab === 'anime' &&
                  character.animes?.map((anime) => (
                    <Link
                      key={anime.animeId}
                      to={`/anime/${anime.animeId}`}
                      className={styles.mediaCard}
                    >
                      <div className={styles.card2}>
                        <div className={styles.mediaImageContainer}>
                          <img src={anime.animeImage} alt={seriesTitle(anime)} />
                          <span className={styles.mediaRole}>{anime.role}</span>
                        </div>
                        <div className={styles.mediaInfo}>
                          <h4>{seriesTitle(anime)}</h4>
                        </div>
                      </div>
                    </Link>
                  ))}

                {activeAppearanceTab === 'manga' &&
                  character.mangas?.map((manga) => (
                    <Link
                      key={manga.mangaId}
                      to={`/manga/${manga.mangaId}`}
                      className={styles.mediaCard}
                    >
                      <div className={styles.card2}>
                        <div className={styles.mediaImageContainer}>
                          <img src={manga.mangaImage} alt={seriesTitle(manga)} />
                          <span className={styles.mediaRole}>{manga.role}</span>
                        </div>
                        <div className={styles.mediaInfo}>
                          <h4>{seriesTitle(manga)}</h4>
                        </div>
                      </div>
                    </Link>
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
