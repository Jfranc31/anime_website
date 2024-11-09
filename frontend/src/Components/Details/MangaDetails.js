/**  
 * src/Components/Details/MangaDetails.js 
 * Description: React component for rendering details of a manga.
*/
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';
import MangaEditor from '../ListEditors/MangaEditor';
import mangaDetailsStyles from '../../styles/pages/manga_details.module.css';

/**
 * Functional component representing details of a manga.
 * @returns {JSX.Element} - Rendered manga details component.
*/
const MangaDetails = () => {
  const { id } = useParams();
  const {userData,setUserData} = useContext(data)
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

  const [activeSection, setActiveSection] = useState('relations');
  const [activeTab, setActiveTab] = useState('about');

  const showRelations = () => {
      setActiveSection('relations');
  };
  
  const showCharacters = () => {
      setActiveSection('characters');
  };

  useEffect(() => {
      const fetchMangaDetails = async () => {
          try {
              // Fetch manga details
              const mangaResponse = await axios.get(`http://localhost:8080/mangas/manga/${id}`);

              // Fetch user details (assuming authentication token is stored in context)
              const userResponse = await axios.get(`http://localhost:8080/users/${userData._id}/current`);
              
              const currentUser = userResponse.data;

              // check if the manga is on the user's list
              const isMangaAdded = currentUser?.mangas?.some((manga) => manga.mangaId === id);
              const existingMangaIndex = currentUser?.mangas?.findIndex(manga => manga.mangaId.toString() === id.toString());

              // Update component state or context based on fetched data
              setMangaDetails(mangaResponse.data);
              setIsMangaAdded(isMangaAdded);

              // Set initial userResponse when mangaDetails is not null
              if(currentUser && existingMangaIndex !== -1) {
                setUserProgress({
                  status: currentUser.mangas[existingMangaIndex].status,
                  currentChapter: currentUser.mangas[existingMangaIndex].currentChapter,
                  currentVolume: currentUser.mangas[existingMangaIndex].currentVolume,
                });
              }
          } catch (error) {
              console.error('Error fetching manga details:', error);
          }
      };

      fetchMangaDetails();
  }, [id, setUserData, userData._id, setIsMangaAdded]);

useEffect(() => {
    const fetchCharacterDetails = async () => {
      const charactersWithDetails = await Promise.all(
        mangaDetails?.characters.map(async (character) => {
          try {
            const response = await axios.get(`http://localhost:8080/characters/character/${character.characterId}`);
            return {
              ...character,
              characterDetails: response.data
            };
          } catch (error) {
            console.error(`Error fetching details for character ${character.character}:`, error);
            return character; // Return the character without details in case of an error
          }
        }) || []
      );

      setCharactersDetails(charactersWithDetails);
    };

    if (mangaDetails) {
      fetchCharacterDetails();
    }
  }, [mangaDetails]);

  useEffect(() => {
    const fetchRelationDetails = async () => {
      const relationsWithDetails = await Promise.all(
        [
          ...mangaDetails?.mangaRelations.map(async (relation) => {
            try {
              const response = await axios.get(`http://localhost:8080/mangas/manga/${relation.relationId}`);
              return {
                ...relation,
                relationDetails: response.data,
                contentType: 'manga'
              };
            } catch (error) {
              console.error(`Error fetching details for manga relation ${relation.relationId}`, error);
              return relation;
            }
          }) || [],
          ...mangaDetails?.animeRelations.map(async (relation) => {
            try {
              const response = await axios.get(`http://localhost:8080/animes/anime/${relation.relationId}`);
              return {
                ...relation,
                relationDetails: response.data,
                contentType: 'anime'
              };
            } catch (error) {
              console.error(`Error fetching details for anime relation ${relation.relationId}`, error);
              return relation;
            }
          }) || [],
        ]
      );
      setRelationsDetails(relationsWithDetails);
    };
  
    if (mangaDetails) {
      fetchRelationDetails();
    }
  }, [mangaDetails]);
  
  if (!mangaDetails) {
    return <div>Loading...</div>;
  }

  const onMangaDelete = (mangaId) => {
    // Implement logic to update the user's anime list after deletion
    setUserData((prevUserData) => {
      const updatedUser = { ...prevUserData };
      const updatedMangas = updatedUser.mangas.filter((manga) => manga.mangaId !== mangaId);
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

  console.log("CH: ", userProgress, isMangaAdded, mangaDetails);

  const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    const { year, month, day } = dateObj;
    if (!year && !month && !day) return 'TBA';
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    const monthName = month ? months[month - 1] : '';
    const formattedDay = day ? day : '';
    
    if (!monthName && !formattedDay) return year || 'TBA';
    if (!formattedDay) return `${monthName} ${year || 'TBA'}`;
    
    return `${monthName} ${formattedDay}, ${year || 'TBA'}`;
  };

  const determineSeason = (startDate) => {
    if (!startDate || !startDate.month) return { season: 'TBA', year: startDate?.year || 'TBA' };

    const month = startDate.month;
    let season;

    if (month >= 3 && month <= 5) season = 'Spring';
    else if (month >= 6 && month <= 8) season = 'Summer';
    else if (month >= 9 && month <= 11) season = 'Fall';
    else season = 'Winter';

    return { 
      season, 
      year: startDate.year || 'TBA' 
    };
  };

  const { season, year } = determineSeason(mangaDetails.releaseData.startDate);

  return (
    <div className={mangaDetailsStyles.mangaDetailsPage}>
      <div className={mangaDetailsStyles.mangaHeader}>
        <div className={mangaDetailsStyles.bannerSection}>
          <img 
            src={mangaDetails.images.border || mangaDetails.images.image} 
            alt={mangaDetails.titles.english} 
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
            {userData.role === "admin" && (
              <Link to={`/manga/${mangaDetails._id}/update`} className={mangaDetailsStyles.editMangaLink}>
                <button className={mangaDetailsStyles.editMangaButton}>
                  Edit Manga
                </button>
              </Link>
            )}
          </div>

          <div className={mangaDetailsStyles.mangaInfo}>
            <h1 className={mangaDetailsStyles.mangaTitle}>{mangaDetails.titles.english}</h1>
            {mangaDetails.titles.native && (
              <div className={mangaDetailsStyles.mangaNativeTitle}>
                {mangaDetails.titles.native}
              </div>
            )}

            <div className={mangaDetailsStyles.quickInfo}>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Status:</span> {mangaDetails.releaseData.releaseStatus}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Format:</span> {mangaDetails.typings.Format}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Chapters:</span> {mangaDetails.lengths.chapters}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Volumes:</span> {mangaDetails.lengths.volumes}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Season:</span> {season} {year}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>Start Date:</span> {formatDate(mangaDetails.releaseData.startDate)}
              </div>
              <div className={mangaDetailsStyles.quickInfoItem}>
                <span>End Date:</span> {formatDate(mangaDetails.releaseData.endDate)}
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
              <p>{mangaDetails.description}</p>
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className={mangaDetailsStyles.relationsContainer}>
            <div className={mangaDetailsStyles.relationsGrid}>
              {relationsDetails.map((relation) => (
                <Link 
                  key={relation.relationDetails._id} 
                  to={`/${relation.contentType}/${relation.relationDetails._id}`}
                  className={mangaDetailsStyles.relationCard}
                >
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
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      {isMangaEditorOpen && (
        <MangaEditor
          manga={mangaDetails}
          isOpen={isMangaEditorOpen}
          onClose={handleModalClose}
          userProgress={userProgress}
          setUserProgress={setUserProgress}
        />
      )}
    </div>
  );
};

export default MangaDetails;