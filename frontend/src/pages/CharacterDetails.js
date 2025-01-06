import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { formatCharacterName } from '../utils/formatters';
import axiosInstance from '../utils/axiosConfig';
import styles from '../styles/pages/character_details.module.css';

function CharacterDetails() {
  const { id } = useParams();
  const { userData } = useAuth();
  const [character, setCharacter] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [isLoading, setIsLoading] = useState(true);
  const nameFormat = userData?.preferences?.characterNameFormat || 'western';

  useEffect(() => {
    const fetchCharacter = async () => {
      try {
        const response = await axiosInstance.get(`/characters/character/${id}`);
        setCharacter(response.data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching character:', error);
        setIsLoading(false);
      }
    };

    fetchCharacter();
  }, [id]);

  if (isLoading) {
    return <div className={styles.loadingState}>Loading...</div>;
  }

  if (!character) {
    return <div className={styles.errorState}>Character not found</div>;
  }

  const displayName = formatCharacterName({
    romaji: character.names.romaji,
    english: character.names.english,
    native: character.names.native
  }, nameFormat);

  return (
    <div className={styles.characterDetailsPage}>
      <div className={styles.characterHeader}>
        <div className={styles.characterImageSection}>
          <img 
            src={character.images.image} 
            alt={displayName}
            className={styles.characterMainImage}
          />
        </div>

        <div className={styles.characterInfoSection}>
          <h1 className={styles.characterName}>{displayName}</h1>
          
          <div className={styles.characterAltNames}>
            {nameFormat !== 'romaji' && character.names.romaji && (
              <div>Romaji: {character.names.romaji}</div>
            )}
            {nameFormat !== 'english' && character.names.english && (
              <div>English: {character.names.english}</div>
            )}
            {nameFormat !== 'native' && character.names.native && (
              <div>Native: {character.names.native}</div>
            )}
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

          {/* Tab content */}
          <div className={styles.characterContent}>
            {activeTab === 'about' && (
              <div className={styles.aboutSection}>
                <div className={styles.characterDescription}>
                  {character.description}
                </div>
              </div>
            )}

            {activeTab === 'appearances' && (
              <div className={styles.appearancesSection}>
                {/* Render appearances here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CharacterDetails; 