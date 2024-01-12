// src/Components/Details/AnimeDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import AnimeNavbar from '../Navbars/AnimePageNavbar';

const AnimeDetails = () => {
  const { id } = useParams();
  const [animeDetails, setAnimeDetails] = useState(null);
  const [charactersDetails, setCharactersDetails] = useState([]);
  const [relationsDetails, setRelationsDetails] = useState([]);

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
        const response = await axios.get(`http://localhost:8080/animes/anime/${id}`);
        setAnimeDetails(response.data);
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };

    fetchAnimeDetails();
  }, [id]);

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
  
console.log("CH: ", charactersDetails);
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

    </div>
  );
};

export default AnimeDetails;





