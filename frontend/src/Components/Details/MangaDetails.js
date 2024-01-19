// src/Components/Details/MangaDetails.js
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';

const MangaDetails = () => {
  const { id } = useParams();
  const {userData,setUserData} = useContext(data)
  const [mangaDetails, setMangaDetails] = useState(null);
  const [isMangaAdded, setIsMangaAdded] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentChapter: 0,
    currentVolume: 0,
  });
  const [activeModal, setActiveModal] = useState(false);

  const availableStatus = ["Planning", "Reading", "Completed"];

  const handleModalClose = () => {
    setActiveModal(false);
  };

  const handleUpdate = () => {
    setActiveModal(true);
  };

  const handleAddToMyList = async () => {
    // Make a request to add the manga to the user's list
    try {
      const response = await axios.post(`http://localhost:8080/users/${userData._id}/addManga`, {
        mangaId: mangaDetails._id,
        status: "Planning",
        currentChapter: 0,
        currentVolume: 0,
      });

      // Assume the response includes updated user data
      console.log(response.data.message);

      setIsMangaAdded(true);

    } catch (error) {
      console.error('Error adding manga to user list:', error);
    }
  };

  const handleStatusChange = (e) => {
    setUserProgress({
      ...userProgress,
      status: e.target.value,
    });
  };

  const handleChapterChange = (e) => {
    setUserProgress({
      ...userProgress,
      currentChapter: e.target.value,
    });
  };

  const handleVolumeChange = (e) => {
    setUserProgress({
      ...userProgress,
      currentVolume: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // Make a request to update user progress
    try {
      const response = await axios.post(`http://localhost:8080/users/${userData._id}/updateManga`, {
        mangaId: mangaDetails._id,
        status: userProgress.status,
        currentChapter: userProgress.currentChapter,
        currentVolume: userProgress.currentVolume,
      });

      handleModalClose();
  
      // Assume the response includes updated user data
      const updatedUser = response.data.user;

      // Update the local state with the new user data
      setUserData(updatedUser); // Assuming setUserData is a function to update user data in context
      setMangaDetails(mangaDetails); // Optionally update manga details if needed
      const existingMangaIndex = updatedUser?.mangas?.findIndex(manga => manga.mangaId.toString() === id.toString());
      // Update userProgress state with the new status and current chapter and volume
      setUserProgress({
          status: updatedUser.mangas[existingMangaIndex].status,
          currentChapter: updatedUser.mangas[existingMangaIndex].currentChapter,
          currentVolume: updatedUser.mangas[existingMangaIndex].currentVolume,
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
              if(currentUser) {
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

  return (
    <div>
      <div className='anime-page'>
          <img src={mangaDetails.images.border} alt={mangaDetails.titles.english} />
      </div>

      <div className='anime-page-img'>
          <img src={mangaDetails.images.image} alt={mangaDetails.titles.english} />
      </div>

      <div className='anime-page-info-bk'>
          <div className='anime-page-info'>
          <p>{mangaDetails.titles.english}</p>
          <div className='mydiv'></div>
          <p>Description: {mangaDetails.description}</p>
          </div>
      </div>

      {/* Add an Update button */}
      <Link to={`/manga/${mangaDetails._id}/update`}>
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

              <label>Current Chapter:</label>
              <input
                type="text"
                value={userProgress.currentChapter}
                onChange={handleChapterChange}
              />

              <label>Current Volume:</label>
              <input
                type="text"
                value={userProgress.currentVolume}
                onChange={handleVolumeChange}
              />

              <button type="submit">Update Progress</button>
            </form>
          </div>
        </div>
      </div>
      )}

      {/* Add to My List button */}
      {!isMangaAdded && (
        <button onClick={handleAddToMyList} className='update'>
          Add to My List
        </button>
      )}

      {/* Update button only if the anime is added */}
      {isMangaAdded && (
        <button onClick={handleUpdate} className='update'>
          Update
        </button>
      )}
    </div>
  );
};

export default MangaDetails;