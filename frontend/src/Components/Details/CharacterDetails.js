/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import characterDetailsStyles from '../../styles/pages/character_details.module.css';
/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const [characterDetails, setCharacterDetails] = useState(null);
  const [referencesDetails, setReferencesDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [activeAppearanceType, setActiveAppearanceType] = useState('anime');
  const [revealedSpoilers, setRevealedSpoilers] = useState({});

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/characters/character/${id}`
        );
        setCharacterDetails(response.data);
      } catch (error) {
        console.error('Error fetching character details:', error);
      }
    };

    fetchCharacterDetails();
  }, [id]);

  useEffect(() => {
    const fetchReferenceDetails = async () => {
      try {
        const animeReferences = await Promise.all(
          (characterDetails?.animes || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(
                `/animes/anime/${reference.animeId}`
              );
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'anime',
              };
            } catch (error) {
              console.error(
                `Error fetching details for anime reference ${reference.animeId}:`,
                error
              );
              return reference;
            }
          })
        );

        const mangaReferences = await Promise.all(
          (characterDetails?.mangas || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(
                `/mangas/manga/${reference.mangaId}`
              );
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'manga',
              };
            } catch (error) {
              console.error(
                `Error fetching details for manga reference ${reference.mangaId}:`,
                error
              );
              return reference;
            }
          })
        );

        setReferencesDetails([...animeReferences, ...mangaReferences]);
      } catch (error) {
        console.error('Error fetching references details:', error);
      }
    };

    if (characterDetails) {
      fetchReferenceDetails();
    }
  }, [characterDetails]);

  if (!characterDetails) {
    return (
      <div className="character-loading">
        <div className="loading-spinner"></div>
        <p>Loading character details...</p>
      </div>
    );
  }

  const formatDOB = (dob) => {
    if (!dob) return null;

    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    let dateString = '';

    if (dob.month && dob.day) {
      const monthName = months[parseInt(dob.month) - 1];
      dateString = `${monthName} ${dob.day}`;
      if (dob.year) {
        dateString += `, ${dob.year}`;
      }
    }

    return dateString || null;
  };

  const parseDescription = (description) => {
    const metadata = [];
    const paragraphs = [];
    let currentParagraph = '';

    const lines = description.split('\n');

    lines.forEach((line) => {
      const metadataMatch = line.match(/^__(.+?):__ (.+)$/);
      if (metadataMatch) {
        metadata.push({
          label: metadataMatch[1],
          value: metadataMatch[2],
        });
      } else if (line.trim()) {
        currentParagraph += line + ' ';
      } else if (currentParagraph) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
    });

    if (currentParagraph) {
      paragraphs.push(currentParagraph.trim());
    }

    return { metadata, paragraphs };
  };

  const toggleSpoiler = (index) => {
    setRevealedSpoilers((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const renderSpoilerText = (text, index) => {
    const parts = text.split(/~!(.+?)!~/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is spoiler content
        return (
          <span
            key={i}
            className={`${characterDetailsStyles.spoilerText} ${revealedSpoilers[`${index}-${i}`] ? characterDetailsStyles.revealed : ''}`}
            onClick={() => toggleSpoiler(`${index}-${i}`)}
          >
            {revealedSpoilers[`${index}-${i}`] ? part : 'Spoiler'}
          </span>
        );
      }
      return part;
    });
  };

  const renderMetadataValue = (value, index) => {
    if (value.includes('~!')) {
      return renderSpoilerText(value, index);
    }
    return value;
  };

  const renderAboutSection = () => {
    const { metadata, paragraphs } = parseDescription(
      characterDetails.about || ''
    );

    return (
      <div className={'character-about'}>
        <div className={characterDetailsStyles.characterMetadata}>
          {characterDetails.age && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>Age</span>
              <span className={characterDetailsStyles.metadataValue}>
                : {characterDetails.age}
              </span>
            </div>
          )}
          {characterDetails.gender && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Gender
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                : {characterDetails.gender}
              </span>
            </div>
          )}
          {characterDetails.DOB && formatDOB(characterDetails.DOB) && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Date of Birth
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                : {formatDOB(characterDetails.DOB)}
              </span>
            </div>
          )}

          {metadata.map((item, index) => (
            <div key={index} className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                {item.label}
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                : {renderMetadataValue(item.value, index)}
              </span>
            </div>
          ))}
        </div>

        <div className="character-description">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{renderSpoilerText(paragraph, `p-${index}`)}</p>
          ))}
        </div>
      </div>
    );
  };

  const renderAppearancesSection = () => (
    <div className={characterDetailsStyles.characterAppearances}>
      <div className={characterDetailsStyles.appearanceTabs}>
        <button
          className={`${characterDetailsStyles.appearanceTab} ${activeAppearanceType === 'anime' ? characterDetailsStyles.active : ''}`}
          onClick={() => setActiveAppearanceType('anime')}
        >
          Anime
        </button>
        <button
          className={`${characterDetailsStyles.appearanceTab} ${activeAppearanceType === 'manga' ? characterDetailsStyles.active : ''}`}
          onClick={() => setActiveAppearanceType('manga')}
        >
          Manga
        </button>
      </div>

      <div className={characterDetailsStyles.referencesGrid}>
        {referencesDetails
          .filter((ref) => ref.contentType === activeAppearanceType)
          .map((reference) => (
            <Link
              key={reference.referenceDetails?._id}
              to={`/${activeAppearanceType}/${reference.referenceDetails?._id}`}
              className={characterDetailsStyles.referenceCard}
            >
              <div className={characterDetailsStyles.referenceImageContainer}>
                <img
                  src={reference.referenceDetails?.images.image}
                  alt={reference.referenceDetails?.titles.english}
                />
                <div className={characterDetailsStyles.referenceRole}>
                  {reference.role}
                </div>
              </div>
              <div className={characterDetailsStyles.referenceInfo}>
                <h4>{reference.referenceDetails?.titles.english}</h4>
              </div>
            </Link>
          ))}
      </div>
    </div>
  );

  return (
    <div className={characterDetailsStyles.characterDetailsPage}>
      <div className={characterDetailsStyles.characterHeader}>
        <div className={characterDetailsStyles.characterImageSection}>
          <img
            src={characterDetails.characterImage}
            alt={characterDetails.names.givenName}
            className={characterDetailsStyles.characterMainImage}
          />
          <Link
            to={`/characters/${characterDetails._id}/update`}
            className={characterDetailsStyles.editCharacterLink}
          >
            <button className={characterDetailsStyles.editCharacterButton}>
              Edit Character
            </button>
          </Link>
        </div>
        <div className={characterDetailsStyles.characterInfoSection}>
          <h1 className={characterDetailsStyles.characterName}>
            {characterDetails.names.givenName}{' '}
            {characterDetails.names.middleName} {characterDetails.names.surName}
          </h1>
          {characterDetails.names.alterNames && (
            <div className={characterDetailsStyles.characterAltNames}>
              <span>Alternative Names:</span>{' '}
              {characterDetails.names.alterNames}
            </div>
          )}
          <div className={characterDetailsStyles.characterTabs}>
            <button
              className={`${characterDetailsStyles.tabButton} ${activeTab === 'about' ? characterDetailsStyles.active : ''}`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className={`${characterDetailsStyles.tabButton} ${activeTab === 'appearances' ? characterDetailsStyles.active : ''}`}
              onClick={() => setActiveTab('appearances')}
            >
              Appearances
            </button>
          </div>
        </div>
      </div>

      <div className={characterDetailsStyles.characterContent}>
        {activeTab === 'about'
          ? renderAboutSection()
          : renderAppearancesSection()}
      </div>
    </div>
  );
};

export default CharacterDetails;
