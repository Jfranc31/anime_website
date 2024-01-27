/**
 * src/Components/Details/AnimeDetails.js
 * Description: React component for rendering details of an anime.
*/

import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';

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
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentEpisode: 0,
  });

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
  
console.log("CH: ", isAnimeAdded, userProgress);
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
        <button className='update-anime-button'>Edit Anime</button>
      </Link>

      <AnimeNavbar showRelations={showRelations} showCharacters={showCharacters} />

      {/* Series Data */}
      <div className='series-data'>
        <h3>Format</h3>
        <div>{animeDetails.typings.Format}</div>
        <h3>Source</h3>
        <div>{animeDetails.typings.Source}</div>
        <h3>Start Date</h3>
        <div>{animeDetails.releaseData.startDate.month}/{animeDetails.releaseData.startDate.day}/{animeDetails.releaseData.startDate.year}</div>
        {animeDetails.releaseData.endDate.year && (
          <>
            <h3>End Date</h3>
            <div>{animeDetails.releaseData.endDate.month}/{animeDetails.releaseData.endDate.day}/{animeDetails.releaseData.endDate.year}</div>
          </>
        )}
        {animeDetails.lengths.Episodes && (
          <>
            <h3>Episodes</h3>
            <div>{animeDetails.lengths.Episodes}</div>
          </>
        )}
        <h3>Episode Duration</h3>
        <div>{animeDetails.lengths.EpisodeDuration}{" mins"}</div>
        <h3>Genres</h3>
        <div className='genres'>
          {animeDetails.genres.map((genre, index) => (
            <div key={index}>{genre}</div>
          ))}
        </div>
      </div>

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
                    {/* <div className='anime-title'>{relation.relationDetails?.titles.english}</div> */}
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
    </div>
  );
};

export default AnimeDetails;