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

  console.log("CH: ", isAnimeAdded, userProgress);

  // Add this helper function to format the date
  const formatDate = (dateObj) => {
    if (!dateObj) return 'TBA';
    const { year, month, day } = dateObj;
    if (!year && !month && !day) return 'TBA';
    
    const formattedMonth = month ? month.toString().padStart(2, '0') : '01';
    const formattedDay = day ? day.toString().padStart(2, '0') : '01';
    
    return `${year || 'TBA'}-${formattedMonth}-${formattedDay}`;
  };

  const getFullName = (names) => {
    const nameParts = [];
    if (names.givenName) nameParts.push(names.givenName);
    if (names.middleName) nameParts.push(names.middleName);
    if (names.surName) nameParts.push(names.surName);
    return nameParts.join(' ');
  };

  return (
    <div className="anime-details-page">
      <div className="anime-header">
        <div className="banner-wrapper">
          <img 
            src={animeDetails.images.border || animeDetails.images.image} 
            alt={animeDetails.titles.english} 
            className="banner-image"
          />
          <div className="banner-gradient" />
        </div>
        
        <div className="content-wrapper">
          <div className="poster-container">
            <img 
              src={animeDetails.images.image} 
              alt={animeDetails.titles.english} 
              className="poster-image"
            />
          </div>
          
          <div className="title-section">
            <h1>{animeDetails.titles.english}</h1>
            {animeDetails.titles.native && (
              <h2>{animeDetails.titles.native}</h2>
            )}
          </div>
        </div>
      </div>

      <div className="content-container">
        <div className="tabs-section">
          <button 
            className={`tab-button ${activeTab === 'about' ? 'active' : ''}`}
            onClick={() => setActiveTab('about')}
          >
            About
          </button>
          <button 
            className={`tab-button ${activeTab === 'characters' ? 'active' : ''}`}
            onClick={() => setActiveTab('characters')}
          >
            Characters
          </button>
          <button 
            className={`tab-button ${activeTab === 'relations' ? 'active' : ''}`}
            onClick={() => setActiveTab('relations')}
          >
            Relations
          </button>
        </div>

        {activeTab === 'about' && (
          <div className="about-container">
            <div className="metadata-grid">
              {/* Metadata items */}
            </div>
            <div className="description-section">
              <p>{animeDetails.description}</p>
            </div>
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="characters-container">
            <div className="characters-grid">
              {charactersDetails.map((character) => (
                <Link 
                  to={`/characters/${character.characterDetails._id}`} 
                  key={character.characterDetails._id}
                  className="character-card"
                >
                  <div className="character-image-container">
                    <img 
                      src={character.characterDetails.characterImage} 
                      alt={character.characterDetails.names.givenName}
                    />
                    <div className="character-role">
                      {character.role}
                    </div>
                  </div>
                  <div className="character-info">
                    <h4>{getFullName(character.characterDetails.names)}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'relations' && (
          <div className="relations-container">
            <div className="relations-grid">
              {relationsDetails
                .filter(relation => relation?.relationDetails) // Add this filter
                .map((relation) => (
                  <Link 
                    to={`/${relation.contentType}/${relation.relationDetails?._id}`} 
                    key={`${relation.contentType}-${relation.relationDetails?._id}`}
                    className="relation-card"
                  >
                    <div className="relation-image-container">
                      <img 
                        src={relation.relationDetails?.images.image} 
                        alt={relation.relationDetails?.titles.english || 'Unknown'} 
                      />
                      <div className="relation-type">
                        {relation.typeofRelation}
                      </div>
                    </div>
                    <div className="relation-info">
                      <h4>{relation.relationDetails?.titles.english}</h4>
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