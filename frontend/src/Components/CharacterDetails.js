// src/Components/CharacterDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const CharacterDetails = ({character}) => {
    const { id } = useParams();
    const [characterDetails, setCharacterDetails] = useState(null);

    useEffect(() => {
        const fetchCharacterDetails = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/characters/${id}`);
                setCharacterDetails(response.data);
            } catch (error) {
                console.error('Error fetching character details:', error);
            }
        };
        fetchCharacterDetails();
    }, [id]);

    if(!characterDetails) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className='character-page'>
                <h1>{[characterDetails.names.givenName, " ", characterDetails.names.surName]}</h1>
                <h3>{characterDetails.names.alterNames}</h3>
            </div>
            <div className='character-page-img'>
                <img src={characterDetails.characterImage} alt={characterDetails.characterImage} />
            </div>
            <div className='character-page-info-bk'>
                <div className='character-page-info'>
                    <p>Description: {characterDetails.about}</p>
                </div>
            </div>
        </div>
    )
}

export default CharacterDetails;