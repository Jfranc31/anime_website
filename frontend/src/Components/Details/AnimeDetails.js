/**
 * src/Components/Details/AnimeDetails.js
 * Description: React component for rendering details of an anime.
*/

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';
import AnimeEditor from '../ListEditors/AnimeEditor';
import AnimeCard from '../../cards/AnimeCard';
import CharacterCard from '../../cards/CharacterCard';
import animeDetailsStyles from '../../styles/pages/anime_details.module.css';
/**
 * Functional component representing details of an anime.
 * @returns {JSX.Element} - Rendered anime details component.
*/
const AnimeDetails = () => {
  const { id } = useParams();
  const {userData,setUserData} = useContext(data)
  const [animeDetails, setAnimeDetails] = useState(null);
  const [isAnimeAdded, setIsAnimeAdded] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);
  const [isAnimeEditorOpen, setIsAnimeEditorOpen] = useState(false);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentEpisode: 0,
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
    const fetchAnimeDetails = async () => {
      try {
        // Fetch anime details
        const animeResponse = await axios.get(`http://localhost:8080/animes/anime/${id}`);

        // Fetch user details (assuming authentication token is stored in context)
        const userResponse = await axios.get(`http://localhost:8080/users/${userData._id}/current`);

        const currentUser = userResponse.data;

        // Check if the anime is on the user's list
        const isAnimeAdded = currentUser?.animes?.some((anime) => anime.animeId === id);
        const existingAnimeIndex = currentUser?.animes?.findIndex(anime => anime.animeId.toString() === id.toString());

        // Update component state or context based on fetched data
        setAnimeDetails(animeResponse.data);
        setIsAnimeAdded(isAnimeAdded);

        // Set initial userProgress when animeDetails is not null
        if (currentUser) {
          setUserProgress({
            status: currentUser.animes[existingAnimeIndex].status,
            currentEpisode: currentUser.animes[existingAnimeIndex].currentEpisode,
          });
        }
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };

    fetchAnimeDetails();
  }, [id, setUserData, userData._id, setIsAnimeAdded]); // Add other dependencies as needed

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      const charactersWithDetails = await Promise.all(
        animeDetails?.characters.map(async (character) => {
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

    if (animeDetails) {
      fetchCharacterDetails();
    }
  }, [animeDetails]);

  useEffect(() => {
    const fetchRelationDetails = async () => {
      try {
        const relationsWithDetails = await Promise.all([
          ...(animeDetails?.mangaRelations?.map(async (relation) => {
            try {
              const response = await axios.get(`http://localhost:8080/mangas/manga/${relation.relationId}`);
              return {
                ...relation,
                relationDetails: response.data,
                contentType: 'mangas'
              };
            } catch (error) {
              console.error(`Error fetching details for manga relation ${relation.relationId}:`, error);
              return null;  // Return null instead of relation
            }
          }) || []),
          ...(animeDetails?.animeRelations?.map(async (relation) => {
            try {
              const response = await axios.get(`http://localhost:8080/animes/anime/${relation.relationId}`);
              return {
                ...relation,
                relationDetails: response.data,
                contentType: 'animes'
              };
            } catch (error) {
              console.error(`Error fetching details for anime relation ${relation.relationId}:`, error);
              return null;  // Return null instead of relation
            }
          }) || []),
        ]);
        
        // Filter out null values before setting state
        setRelationsDetails(relationsWithDetails.filter(relation => relation !== null));
      } catch (error) {
        console.error('Error fetching relation details:', error);
        setRelationsDetails([]);  // Set empty array on error
      }
    };

    if (animeDetails) {
      fetchRelationDetails();
    }
  }, [animeDetails]);

  if (!animeDetails) {
    return <div>Loading...</div>;
  }

  const onAnimeDelete = (animeId) => {
    // Implement logic to update the user's anime list after deletion
    setUserData((prevUserData) => {
      const updatedUser = { ...prevUserData };
      const updatedAnimes = updatedUser.animes.filter((anime) => anime.animeId !== animeId);
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

  console.log("CH: ", isAnimeAdded, userProgress, animeDetails);

  // Add this helper function to format the date
  const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    const { year, month, day } = dateObj;
    if (!year && !month && !day) return 'TBA';
    
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // If we have a month, subtract 1 as array is 0-based
    const monthName = month ? months[month - 1] : '';
    const formattedDay = day ? day : '';
    
    if (!monthName && !formattedDay) return year || 'TBA';
    if (!formattedDay) return `${monthName} ${year || 'TBA'}`;
    
    return `${monthName} ${formattedDay}, ${year || 'TBA'}`;
  };

  const getFullName = (names) => {
    const nameParts = [];
    if (names.givenName) nameParts.push(names.givenName);
    if (names.middleName) nameParts.push(names.middleName);
    if (names.surName) nameParts.push(names.surName);
    return nameParts.join(' ');
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

  const { season, year } = determineSeason(animeDetails.releaseData.startDate);

  return (
    <div className={animeDetailsStyles.animeDetailsPage}>
      <div className={animeDetailsStyles.animeHeader}>
        <div className={animeDetailsStyles.bannerSection}>
          <img 
            src={animeDetails.images.border || animeDetails.images.image} 
            alt={animeDetails.titles.english} 
            className={animeDetailsStyles.bannerImage}
          />
          <div className={animeDetailsStyles.bannerOverlay} />
        </div>
        
        <div className={animeDetailsStyles.animeMainContent}>
          <div className={animeDetailsStyles.animePoster}>
            <img 
              src={animeDetails.images.image} 
              alt={animeDetails.titles.english} 
            />
            {userData.role === "admin" && (
              <Link to={`/anime/${animeDetails._id}/update`} className={animeDetailsStyles.editAnimeLink}>
                <button className={animeDetailsStyles.editAnimeButton}>
                  Edit Anime
                </button>
              </Link>
            )}
          </div>
          
          <div className={animeDetailsStyles.animeInfo}>
            <h1 className={animeDetailsStyles.animeTitle}>{animeDetails.titles.english}</h1>
            {animeDetails.titles.native && (
              <div className={animeDetailsStyles.nativeTitle}>
                {animeDetails.titles.native}
              </div>
            )}
            
            <div className={animeDetailsStyles.quickInfo}>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Status:</span> {animeDetails.releaseData.releaseStatus}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Format:</span> {animeDetails.format}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Episodes:</span> {animeDetails.lengths.Episodes}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Duration:</span> {animeDetails.lengths.EpisodeDuration}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Season:</span> {season} {year}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>Start Date:</span> {formatDate(animeDetails.releaseData.startDate)}
              </div>
              <div className={animeDetailsStyles.quickInfoItem}>
                <span>End Date:</span> {formatDate(animeDetails.releaseData.endDate)}
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
                onClick={() => setActiveTab('characters')}
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
              <p>{animeDetails.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className={animeDetailsStyles.charactersContainer}>
            <div className={animeDetailsStyles.charactersGrid}>
              {charactersDetails.map((character) => (
                <Link 
                  to={`/characters/${character.characterDetails._id}`} 
                  key={character.characterDetails._id}
                  className={animeDetailsStyles.characterCard}
                >
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
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className={animeDetailsStyles.relationsContainer}>
            <div className={animeDetailsStyles.relationsGrid}>
              {relationsDetails.map((relation) => (
                <Link 
                  key={relation.relationDetails._id} 
                  to={`/${relation.contentType}/${relation.relationDetails._id}`}
                  className={animeDetailsStyles.relationCard}
                >
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
                    <h4>{relation.relationDetails.titles.english}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnimeDetails;