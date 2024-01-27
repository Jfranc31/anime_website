/**  
 * src/Components/Details/MangaDetails.js 
 * Description: React component for rendering details of a manga.
*/
import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';
import data from '../../Context/ContextApi';

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
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentChapter: 0,
    currentVolume: 0,
  });

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

  console.log("CH: ", userProgress, isMangaAdded);
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
          <button className='update-anime-button'>Edit Manga</button>
      </Link>

      <AnimeNavbar showRelations={showRelations} showCharacters={showCharacters} />

      {/* Series Data */}
      <div className='series-data'>
        <h3>Format</h3>
        <div>{mangaDetails.typings.Format}</div>
        <h3>Source</h3>
        <div>{mangaDetails.typings.Source}</div>
        <h3>Start Date</h3>
        <div>{mangaDetails.releaseData.startDate.month}/{mangaDetails.releaseData.startDate.day}/{mangaDetails.releaseData.startDate.year}</div>
        {mangaDetails.releaseData.endDate.year && (
          <>
            <h3>End Date</h3>
            <div>{mangaDetails.releaseData.endDate.month}/{mangaDetails.releaseData.endDate.day}/{mangaDetails.releaseData.endDate.year}</div>
          </>
        )}
        <h3>Genres</h3>
        <div className='genres'>
          {mangaDetails.genres.map((genre, index) => (
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

export default MangaDetails;