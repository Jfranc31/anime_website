/**
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
 */
import React, { useEffect, useState, useContext, useMemo, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import data from '../../Context/ContextApi';
import axiosInstance from '../../utils/axiosConfig';
import characterDetailsStyles from '../../styles/pages/character_details.module.css';
import CharacterDetailsSkeleton from './CharacterSkeleton';

// Move any reusable components outside
const ReferenceCard = React.memo(({ reference, seriesTitle }) => {
  return (
    <Link
      to={`/${reference.contentType}/${reference.referenceDetails?._id}`}
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
  );
});

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
 */
const CharacterDetails = () => {
  const { id } = useParams();
  const { userData, setUserData } = useContext(data);
  const [pageData, setPageData] = useState({
    characterDetails: null,
    references: [],
    activeTab: 'about',
    activeAppearanceType: 'anime',
    loading: false
  });
  const [revealedSpoilers, setRevealedSpoilers] = useState({});
  const [revealName, setRevealName] = useState(new Set());

  // Move useMemo hooks before any conditional returns
  const filteredReferences = useMemo(() => {
    return pageData.references.filter(
      (ref) => ref.contentType === pageData.activeAppearanceType
    );
  }, [pageData.references, pageData.activeAppearanceType]);

  const updatePageData = (updates) => {
    setPageData(prev => ({
      ...prev,
      ...updates
    }));
  };

  // Fetch initial data only when component mounts or ID changes
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [characterResponse, userResponse] = await Promise.all([
          axiosInstance.get(`/characters/character/${id}`),
          userData?._id ? axiosInstance.get(`/users/${userData._id}/current`) : null
        ]);
        
        updatePageData({
          characterDetails: characterResponse.data
        });

        if (userResponse) {
          setUserData(userResponse.data);
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [id]); // Only depend on id changes

  // Fetch references when character details change
  useEffect(() => {
    const fetchReferenceDetails = async () => {
      if (!pageData.characterDetails) return;
      
      updatePageData({ loading: true });
      try {
        const [animeReferences, mangaReferences] = await Promise.all([
          Promise.all((pageData.characterDetails?.animes || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(`/animes/anime/${reference.animeId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'anime',
              };
            } catch (error) {
              console.error(`Error fetching anime reference: ${error}`);
              return null;
            }
          })),
          Promise.all((pageData.characterDetails?.mangas || []).map(async (reference) => {
            try {
              const response = await axiosInstance.get(`/mangas/manga/${reference.mangaId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'manga',
              };
            } catch (error) {
              console.error(`Error fetching manga reference: ${error}`);
              return null;
            }
          }))
        ]);

        updatePageData({
          references: [...animeReferences, ...mangaReferences].filter(Boolean),
          loading: false
        });
      } catch (error) {
        console.error('Error fetching references:', error);
        updatePageData({ loading: false });
      }
    };

    fetchReferenceDetails();
  }, [pageData.characterDetails]);

  if (!pageData.characterDetails) {
    return <CharacterDetailsSkeleton/>
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
    const givenName = names.givenName || '';
    const middleName = names.middleName || '';
    const surName = names.surName || '';
    const nativeName = names.nativeName || '';

    switch (type) {
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
      pageData.characterDetails.about || ''
    );

    return (
      <div className={'character-about'}>
        <div className={characterDetailsStyles.characterMetadata}>
          {pageData.characterDetails.age && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>Age</span>
              <span className={characterDetailsStyles.metadataValue}>
                {pageData.characterDetails.age}
              </span>
            </div>
          )}
          {pageData.characterDetails.gender && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Gender
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                {pageData.characterDetails.gender}
              </span>
            </div>
          )}
          {pageData.characterDetails.DOB && formatDOB(pageData.characterDetails.DOB) && (
            <div className={characterDetailsStyles.metadataItem}>
              <span className={characterDetailsStyles.metadataLabel}>
                Date of Birth
              </span>
              <span className={characterDetailsStyles.metadataValue}>
                {formatDOB(pageData.characterDetails.DOB)}
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
          className={`${characterDetailsStyles.appearanceTab} ${pageData.activeAppearanceType === 'anime' ? characterDetailsStyles.active : ''}`}
          onClick={() => updatePageData({ activeAppearanceType: 'anime' })}
        >
          Anime
        </button>
        <button
          className={`${characterDetailsStyles.appearanceTab} ${pageData.activeAppearanceType === 'manga' ? characterDetailsStyles.active : ''}`}
          onClick={() => updatePageData({ activeAppearanceType: 'manga' })}
        >
          Manga
        </button>
      </div>

      <div className={characterDetailsStyles.referencesGrid}>
        {filteredReferences.map((reference) => (
          <ReferenceCard
            key={reference.referenceDetails?._id}
            reference={reference}
            seriesTitle={seriesTitle}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className={characterDetailsStyles.characterDetailsPage}>
      <div className={characterDetailsStyles.characterHeader}>
        <div className={characterDetailsStyles.characterImageSection}>
          <img
            src={pageData.characterDetails.characterImage}
            alt={pageData.characterDetails.names.givenName}
            className={characterDetailsStyles.characterMainImage}
          />
          {userData.role === 'admin' && (
            <Link
              to={`/characters/${pageData.characterDetails._id}/update`}
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
            {getFullName(pageData.characterDetails.names, userData.characterName)}
          </h1>

            <div className={characterDetailsStyles.characterAltNames}>
              {[
                userData.characterName === 'native'
                  ? getFullName(pageData.characterDetails.names, 'romaji-western')
                  : getFullName(pageData.characterDetails.names, 'native'),

                ...(pageData.characterDetails.names.alterNames || []),

                ...(pageData.characterDetails.names.alterSpoiler || []).map((name) => (
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
                .reduce((acc, name, index, arr) => acc.concat(name, index < arr.length - 1 ? ', ' : ''), [])
              }
            </div>

          <div className={characterDetailsStyles.characterTabs}>
            <button
              className={`${characterDetailsStyles.tabButton} ${pageData.activeTab === 'about' ? characterDetailsStyles.active : ''}`}
              onClick={() => updatePageData({ activeTab: 'about' })}
            >
              About
            </button>
            <button
              className={`${characterDetailsStyles.tabButton} ${pageData.activeTab === 'appearances' ? characterDetailsStyles.active : ''}`}
              onClick={() => updatePageData({ activeTab: 'appearances' })}
            >
              Appearances
            </button>
          </div>
        </div>
      </div>

      <div className={characterDetailsStyles.characterContent}>
        {pageData.activeTab === 'about'
          ? renderAboutSection()
          : renderAppearancesSection()}
      </div>
    </div>
  );
};

export default CharacterDetails;
