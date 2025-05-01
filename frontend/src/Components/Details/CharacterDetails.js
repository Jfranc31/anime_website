/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useUser } from '../../Context/ContextApi';
import axiosInstance from '../../utils/axiosConfig';
import characterDetailsStyles from '../../styles/pages/character_details.module.css';
import CharacterDetailsSkeleton from './CharacterSkeleton';

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const { user, setUser } = useUser();
  const [characterDetails, setCharacterDetails] = useState(null);
  const [referencesDetails, setReferencesDetails] = useState([]);
  const [activeTab, setActiveTab] = useState('about');
  const [activeAppearanceType, setActiveAppearanceType] = useState('anime');
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [revealName, setRevealName] = useState(new Set());

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/characters/character/${id}`
        );
        setCharacterDetails(response.data);

        if (user?._id) {
          const userResponse = await axiosInstance.get(
            `/users/${user._id}/current`
          );
          const currentUser = userResponse.data;

          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error fetching character details:', error);
      }
    };

    fetchCharacterDetails();
  }, [id, user, setUser]);

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
    return <CharacterDetailsSkeleton/>;
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
      const trimmedLine = line.trim();
      const metadataMatch = trimmedLine.match(
        /^(?:__|\*\*)\s*(.+?)\s*:(?:__|\*\*)?\s*(.+?)\s*$/
      );
      if (metadataMatch) {
        // Handle metadata with potential links
        const label = metadataMatch[1].trim();
        const value = metadataMatch[2].trim().replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, name, link) => {
          return `<a href="${link}" target="_blank" rel="noopener noreferrer">${name}</a>`;
        });
        metadata.push({
          label,
          value, // Store the raw value with spoiler tags intact
          hasSpoiler: value.includes('~!') // Add flag to indicate if it contains spoilers
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
    // First convert any non-spoiler links to HTML
    const textWithLinks = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      (match, name, link) => `<a href="${link}" target="_blank" rel="noopener noreferrer">${name}</a>`
    );

    // Then handle spoilers
    const parts = textWithLinks.split(/~!(.+?)!~/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        // This is spoiler content
        return (
          <span
            key={i}
            className={`${characterDetailsStyles.spoilerText} ${
              revealedSpoilers[`${index}-${i}`] ? characterDetailsStyles.revealed : ''
            }`}
            onClick={() => toggleSpoiler(`${index}-${i}`)}
          >
            {revealedSpoilers[`${index}-${i}`] ? (
              <span dangerouslySetInnerHTML={{ __html: part }} />
            ) : (
              'Spoiler'
            )}
          </span>
        );
      }
      return <span key={i} dangerouslySetInnerHTML={{ __html: part }} />;
    });
  };

  const getFullName = (names, type) => {
    if (!names) return '';
    const givenName = names.givenName || '';
    const middleName = names.middleName || '';
    const surName = names.surName || '';
    const nativeName = names.nativeName || '';

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

  const seriesTitle = (titles) => {
    if (!titles) return 'Unknown Title';
    switch (user?.preferences?.titleLanguage) {
      case 'english':
        return titles.english || titles.romaji;
      case 'romaji':
        return titles.romaji || titles.english;
      case 'native':
        return titles.native;
      default:
        return titles.english || titles.romaji || titles.native || 'Unknown Title';
    }
  };

  const handleRevealSpoiler = (name) => {
    setRevealName((prev) => {
      const updated = new Set(prev);
      if (updated.has(name)) {
        updated.delete(name); // Hide spoiler
      } else {
        updated.add(name); // Reveal spoiler
      }
      return new Set(updated);
    });
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
                {characterDetails.age}
              </span>
            </div>
          )}
          {characterDetails.gender && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Gender
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                {characterDetails.gender}
              </span>
            </div>
          )}
          {characterDetails.DOB && formatDOB(characterDetails.DOB) && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Date of Birth
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                {formatDOB(characterDetails.DOB)}
              </span>
            </div>
          )}

          {metadata.map((item, index) => (
            <div key={index} className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                {item.label}
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                {item.hasSpoiler ?
                  renderSpoilerText(item.value, `meta-${index}`) :
                  <span dangerouslySetInnerHTML={{ __html: item.value }} />
                }
              </span>
            </div>
          ))}
        </div>

        <div className={characterDetailsStyles.characterDescription}>
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
              <div className={characterDetailsStyles.card2}>
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
                  <h4>{seriesTitle(reference.referenceDetails?.titles)}</h4>
                </div>
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
            alt={characterDetails.names?.givenName}
            className={characterDetailsStyles.characterMainImage}
          />
          {user?.isAdmin && (
            <Link
              to={`/characters/${characterDetails._id}/update`}
              className={characterDetailsStyles.editCharacterLink}
            >
              <button className={characterDetailsStyles.editCharacterButton}>
                Edit Character
              </button>
            </Link>
          )}
        </div>
        <div className={characterDetailsStyles.characterInfoSection}>
          <h1 className={characterDetailsStyles.characterName}>
            {getFullName(characterDetails.names, user?.preferences?.characterName)}
          </h1>

          <div className={characterDetailsStyles.characterAltNames}>
            {[
              user?.preferences?.characterName === 'native'
                ? getFullName(characterDetails.names, 'romaji-western')
                : getFullName(characterDetails.names, 'native'),

              ...(characterDetails.names?.alterNames || []),

              ...(characterDetails.names?.alterSpoiler || []).map((name) => (
                <span
                  key={name}
                  style={{
                    filter: revealName.has(name) ? 'none' : 'blur(4px)',
                    cursor: 'pointer',
                    transition: 'filter 0.3s ease-in-out',
                  }}
                  onClick={() => handleRevealSpoiler(name)}
                >
                  {name}
                </span>
              )),
            ]
              .filter(Boolean) // Remove any null/undefined values
              .map((name, index, arr) =>
                typeof name === 'string' ? name : name // Keep spoilers as JSX
              )
              .reduce((acc, name, index, arr) => acc.concat(name, index < arr.length - 1 ? ', ' : ''), [])}
            </div>

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
