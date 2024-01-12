// src/CharacterCard.js

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function CharacterCard({ character }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div 
        className={`anime-card ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className='img-container'>
                <img src={character.characterImage} alt={character.names.givenName} />
                <div className='title-and-progress'>
                    <Link to={`/characters/${character._id}`}>
                        <div className='anime-title'>{character.names.givenName} {character.names.middleName} {character.names.surName}</div>
                    </Link>
                </div>
            </div>
            {isHovered && (
                <>Hello</>
            )}
        </div>
    )
}

export default CharacterCard;