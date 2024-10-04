// /components/AnimeTracking.js
import React, { useState } from 'react';
import axios from 'axios';

const AnimeTracking = ({ animeId, userId }) => {
    const [status, setStatus] = useState('');
    const [currentEpisode, setCurrentEpisode] = useState('');

    const handleUpdateShow = () => {
        // Make a request to update the show for the user
        axios.post(`http://localhost:8080/users/${userId}/updateAnime`, {
            animeId,
            status,
            currentEpisode: parseInt(currentEpisode),
        })
        .then(response => {
            alert(response.data.message);
        })
        .catch(error => {
            console.error("Update Show Error:", error);
            // Handle error if needed
        });
    };

    return (
        <div>
            <label>Status:</label>
            <input 
                type="text" 
                value={status} 
                onChange={(e) => setStatus(e.target.value)} 
            />

            <label>Current Episode:</label>
            <input 
                type="text" 
                value={currentEpisode} 
                onChange={(e) => setCurrentEpisode(e.target.value)} 
            />

            <button onClick={handleUpdateShow}>Update Show</button>
        </div>
    );
};

export default AnimeTracking;
