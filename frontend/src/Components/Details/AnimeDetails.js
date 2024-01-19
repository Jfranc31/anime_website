// src/Components/Details/AnimeDetails.js
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';

const AnimeDetails = () => {
  const { id } = useParams();
  const {userData,setUserData} = useContext(data)
  const [animeDetails, setAnimeDetails] = useState(null);
  const [isAnimeAdded, setIsAnimeAdded] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentEpisode: 0,
  });
  const [activeModal, setActiveModal] = useState(false);

  const availableStatus = ["Planning", "Watching", "Completed"];

  const handleModalClose = () => {
    setActiveModal(false);
  };

  const handleUpdate = () => {
    setActiveModal(true);
  };

  const handleAddToMyList = async () => {
    // Make a request to add the anime to the user's list
    try {
      const response = await axios.post(`http://localhost:8080/users/${userData._id}/addAnime`, {
        animeId: animeDetails._id,
        status: "Planning",
        currentEpisode: 0,
      });

      // Assume the response includes updated user data
      console.log(response.data.message);

      setIsAnimeAdded(true);

    } catch (error) {
      console.error('Error adding anime to user list:', error);
    }
  };

  const handleStatusChange = (e) => {
    setUserProgress({
      ...userProgress,
      status: e.target.value,
    });
  };
  
  const handleEpisodeChange = (e) => {
    setUserProgress({
      ...userProgress,
      currentEpisode: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Make a request to update user progress
    try {
      const response = await axios.post(`http://localhost:8080/users/${userData._id}/updateAnime`, {
        animeId: animeDetails._id,
        status: userProgress.status,
        currentEpisode: userProgress.currentEpisode,
      });

      handleModalClose();
  
      // Assume the response includes updated user data
      const updatedUser = response.data.user;

      // Update the local state with the new user data
      setUserData(updatedUser); // Assuming setUserData is a function to update user data in context
      setAnimeDetails(animeDetails); // Optionally update anime details if needed
      const existingAnimeIndex = updatedUser?.animes?.findIndex(anime => anime.animeId.toString() === id.toString());
      // Update userProgress state with the new status and current episode
      setUserProgress({
          status: updatedUser.animes[existingAnimeIndex].status,
          currentEpisode: updatedUser.animes[existingAnimeIndex].currentEpisode,
      });

      console.log(response.data.message);

    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  const [activeSection, setActiveSection] = useState('relations');

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
      const relationsWithDetails = await Promise.all(
        [
          ...animeDetails?.mangaRelations.map(async (relation) => {
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
          ...animeDetails?.animeRelations.map(async (relation) => {
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
    if (animeDetails) {
      fetchRelationDetails();
    }
  }, [animeDetails]);

  if (!animeDetails) {
    return <div>Loading...</div>;
  }
  
console.log("CH: ", userProgress, isAnimeAdded);
  return (
    <div>
      <div className='anime-page'>
        <img src={animeDetails.images.border} alt={animeDetails.titles.english} />
      </div>

      <div className='anime-page-img'>
        <img src={animeDetails.images.image} alt={animeDetails.titles.english} />
      </div>

      <div className='anime-page-info-bk'>
        <div className='anime-page-info'>
          <p>{animeDetails.titles.english}</p>
          <div className='mydiv'></div>
          <p>Description: {animeDetails.description}</p>
        </div>
      </div>

      {/* Add an Update button */}
      <Link to={`/anime/${animeDetails._id}/update`}>
        <button className='update-anime-button'>Update Anime</button>
      </Link>

      <AnimeNavbar showRelations={showRelations} showCharacters={showCharacters} />

      {/* Overview Section */}
      <div className={`anime-page-relations ${activeSection === 'relations' ? 'show' : 'hide'}`}>
        <h2>Relations</h2>
        <div className='anime-list'>
          {relationsDetails.map((relation) => (
            <div key={relation.relationDetails?._id} className='anime-card'>
              <div className='img-container'>
                <img src={relation.relationDetails?.images.image} alt={relation.relationDetails?.titles.english || 'Unknown'} />
                <div className='title-progress'>
                <Link to={`/${relation.contentType}/${relation.relationDetails?._id}`}>
                    <div className='anime-title'>{relation.relationDetails?.titles.english}</div>
                    <div className='anime-title'>{relation.typeofRelation}</div>
                </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Characters Section */}
      <div className={`anime-page-characters ${activeSection === 'characters' ? 'show' : 'hide'}`}>
        <h2>Characters</h2>
        <div className='anime-list'>
          {charactersDetails.map((character) => (
            <div key={character.characterDetails?._id} className='anime-card'>
              <div className='img-container'>
                <img src={character.characterDetails?.characterImage} alt={character.characterDetails?.names.givenName || 'Unknown'} />
                <div className='title-progress'>
                  <Link to={`/characters/${character.characterDetails?._id}`}>
                    <div className='anime-title'>{character.characterDetails?.names.givenName} {character.characterDetails?.names.middleName} {character.characterDetails?.names.surName}</div>
                    <div className='anime-title'>{character.role}</div>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Form for updating user progress */}
      {activeModal === true && (
      <div className="character-modal-overlay" onClick={handleModalClose}>
        <div className="character-modal" onClick={(e) => e.stopPropagation()}>
          {/* Modal Header */}
          <div className="character-modal-header">
            <h1>Update Status</h1>
            <button className="character-modal-close" onClick={handleModalClose}>
              &times;
            </button>
          </div>
          {/* Modal Body */}
          <div className="character-modal-body">
            <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="userProgress.status">Format:</label>
              <div></div>
              <select
                type="userProgress.status"
                id="userProgress.status"
                name="userProgress.status"
                value={userProgress.status}
                onChange={(handleStatusChange)}
              >
                <option value="" disabled>Select Status</option>
                {availableStatus.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>

              <label>Current Episode:</label>
              <input
                type="text"
                value={userProgress.currentEpisode}
                onChange={handleEpisodeChange}
              />

              <button type="submit">Update Progress</button>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Add to My List button */}
      {!isAnimeAdded && (
        <button onClick={handleAddToMyList} className='update'>
          Add to My List
        </button>
      )}

      {/* Update button only if the anime is added */}
      {isAnimeAdded && (
        <button onClick={handleUpdate} className='update'>
          Update
        </button>
      )}
    </div>
  );
};

export default AnimeDetails;