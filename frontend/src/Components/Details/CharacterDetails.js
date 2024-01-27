/**  
 * src/Components/Details/CharacterDetails.js
 * Description: React component for rendering details of a character.
*/
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

/**
 * Functional component representing details of a character.
 * @returns {JSX.Element} - Rendered character details component.
*/
const CharacterDetails = () => {
  const { id } = useParams();
  const [characterDetails, setCharacterDetails] = useState(null);
  const [referencesDetails, setReferencesDetails] = useState([]);

  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/characters/character/${id}`);
        setCharacterDetails(response.data);
      } catch (error) {
        console.error('Error fetching character details:', error);
      }
    };

    fetchCharacterDetails();
  }, [id]);

  useEffect(() => {
    const fetchReferenceDetails = async () => {
      try {
        const animeReferences = await Promise.all(
          (characterDetails?.animes || []).map(async (reference) => {
            try {
              const response = await axios.get(`http://localhost:8080/animes/anime/${reference.animeId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'anime'
              };
            } catch (error) {
              console.error(`Error fetching details for anime reference ${reference.animeId}:`, error);
              return reference;
            }
          })
        );
  
        const mangaReferences = await Promise.all(
          (characterDetails?.mangas || []).map(async (reference) => {
            try {
              const response = await axios.get(`http://localhost:8080/mangas/manga/${reference.mangaId}`);
              return {
                ...reference,
                referenceDetails: response.data,
                contentType: 'manga'
              };
            } catch (error) {
              console.error(`Error fetching details for manga reference ${reference.mangaId}:`, error);
              return reference;
            }
          })
        );
  
        const referencesWithDetails = [...animeReferences, ...mangaReferences];
        setReferencesDetails(referencesWithDetails);
      } catch (error) {
        console.error('Error fetching references details:', error);
      }
    };
  
    if (characterDetails) {
      fetchReferenceDetails();
    }
  }, [characterDetails]);
  
  

  if (!characterDetails) {
    return <div>Loading...</div>;
  }
  console.log("Character: ", referencesDetails);

  return (
    <div>
      <div className='character-page'>
        <h1>{characterDetails.names.givenName} {characterDetails.names.middleName} {characterDetails.names.surName}</h1>
        <h3>{characterDetails.names.alterNames}</h3>
      </div>

      <div className='character-page-img'>
        <img src={characterDetails.characterImage} alt={characterDetails.characterImage} />
      </div>

      <div className='character-page-info-bk'>
        <div className='character-page-info'>
          <p>Age: {characterDetails.age}</p>
          <p>Gender: {characterDetails.gender}</p>
          <p>Description: {characterDetails.about}</p>
        </div>
      </div>

      {/* Add an Update button */}
      <Link to={`/characters/${characterDetails._id}/update`}>
        <button className='update-character-button'>Update Character</button>
      </Link>

      <div className='character-page-references'>
        <h2>References</h2>
        <div className='anime-list'>
          {referencesDetails.map((reference) => (
            <div key={reference.referenceDetails?._id} className="anime-card">
              <div className='img-container'>
                <img src={reference.referenceDetails?.images.image} alt={reference.referenceDetails?.titles.english} />
                <div className='title-progress'>
                  <Link to={`/${reference.contentType}/${reference.referenceDetails?._id}`}>
                    <div className='anime-title'>{reference.referenceDetails?.titles.english}</div>
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

export default CharacterDetails;
