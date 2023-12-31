// src/Components/AnimeDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import AnimeNotes from '../AnimeNotes';

const AnimeDetails = ({anime}) => {
  const { id } = useParams();
  console.log("ID: ", id);
  const [animeDetails, setAnimeDetails] = useState(null);

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      try {
        const response = await axios.get(`http://localhost:8080/anime/${id}`);
        console.log("RESPONSE DATA: ", response.data);
        setAnimeDetails(response.data);
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };

    fetchAnimeDetails();
  }, [id]);

  if (!animeDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
        <div className='anime-page'>
          <img src={animeDetails.border} alt={animeDetails.title}></img>
        </div>
        {/* Display other details about the anime */}
        <div className='anime-page-img'>
          <img src={animeDetails.image} alt={animeDetails.title} />
        </div>
        <div className='anime-page-info-bk'>
          <div className='anime-page-info'>
            <p>{animeDetails.title}</p>
            <div className='mydiv'></div>
            <p>Description: {animeDetails.description}</p>
            {/* Add more details as needed */}
          </div>
        </div>
        <div className='anime-page-notes'>
          <AnimeNotes animeId={animeDetails._id}/>
        </div>
    </div>
  );
};

export default AnimeDetails;
