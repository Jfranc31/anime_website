/**
 * src/Components/ListEditors/AnimeEditor.js
 * Description: React component for editing details of an anime.
*/

import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Functional component for editing details of an anime.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.anime - Anime object containing details like name, etc
 * @param {string} props.userId - User ID associated with the anime.
 * @param {function} props.closeModal - Function to close the modal.
 * @param {function} props.onAnimeDelete - Function to handle anime deletion.
 * @returns {JSX.Element} - Rendered anime editor component.
 */
const AnimeEditor = ({ anime, userId, closeModal, onAnimeDelete }) => {
  const [animeDetails, setAnimeDetails] = useState(null);
  const [userProgress, setUserProgress] = useState({
    status: '',
    currentEpisode: 0,
  });
  const [isInUserList, setIsInUserList] = useState(false);

  console.log(anime);

  const availableStatus = ["Planning", "Watching", "Completed"];

  useEffect(() => {
    const fetchAnimeDetails = async () => {
        console.log("isInUserList:", isInUserList);
      try {
        // Fetch anime details
        const animeResponse = await axios.get(
          `http://localhost:8080/animes/anime/${anime._id}`
        );

        // Fetch user details
        const userResponse = await axios.get(
          `http://localhost:8080/users/${userId}/current`
        );

        const currentUser = userResponse.data;

        // Check if the anime is on the user's list
        const existingAnimeIndex = currentUser?.animes?.findIndex(
          (userAnime) => userAnime.animeId === anime._id
        );

        if(existingAnimeIndex !== -1) {
            setIsInUserList(true);
        }

        // Update component state based on fetched data
        setAnimeDetails(animeResponse.data);

        // Set initial userProgress when animeDetails is not null
        if (currentUser) {
          setUserProgress({
            status: 
              existingAnimeIndex !== -1 ? 
              currentUser.animes[existingAnimeIndex].status : 
              '',
            currentEpisode: 
              existingAnimeIndex !== -1 ? 
              currentUser.animes[existingAnimeIndex].currentEpisode 
              : 0,
          });
        }
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };

    fetchAnimeDetails();
  }, [anime._id, isInUserList, userId]);

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

  const handleSave = async () => {
    try {
        var response;
      if(isInUserList){
        response = await axios.post(
          `http://localhost:8080/users/${userId}/updateAnime`, 
          {
            animeId: anime._id,
            status: userProgress.status,
            currentEpisode: userProgress.currentEpisode,
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:8080/users/${userId}/addAnime`, 
          {
            animeId: animeDetails._id,
            status: userProgress.status || "Planning",
            currentEpisode: userProgress.currentEpisode || 0,
          }
        );
      }
  
      // Check the response for success or handle accordingly
      if (response.data.success) {
        // Close the modal after saving
        closeModal();
      } else {
        console.error('Error updating user progress:', response.data.message);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };
  

  const handleDelete = async () => {
    try {
      // Make a request to remove the anime from the user's list
      await axios.post(`http://localhost:8080/users/${userId}/removeAnime`, {
        animeId: anime._id,
      });

      // Call the parent component's function to update the UI
      onAnimeDelete(anime._id);

      // Close the modal after deleting
      closeModal();
    } catch (error) {
      console.error('Error removing anime from user list:', error);
    }
  };

  return (
    <div className='character-modal' onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
            <h2>{animeDetails?.titles?.english || ''}</h2>
            <img src={anime?.images?.border} alt={anime?.titles?.english} />
            <button className="character-modal-close" onClick={closeModal}>
                &times;
            </button>
            <button type="submit" className='modal-save-btn' form="submit">
              Save
            </button>
        </div>
        <div className='modal-body'>
            {/* Modal Body */}

            <form onSubmit={handleSave} id="submit">
                <div className='grid'>
                <label htmlFor="userProgress.status">Status:</label>
                <select
                    id="userProgress.status"
                    name="userProgress.status"
                    value={userProgress.status}
                    onChange={handleStatusChange}
                >
                    <option value="" disabled>Select Status</option>
                    {availableStatus.map((status) => (
                    <option key={status} value={status}>
                        {status}
                    </option>
                    ))}
                </select>
                </div>
                <div className='grid'>
                <label htmlFor="userProgress.currentEpisode">
                  Current Episode:
                </label>
                <input
                    type="number"
                    id="userProgress.currentEpisode"
                    name="userProgress.currentEpisode"
                    value={userProgress.currentEpisode}
                    onChange={handleEpisodeChange}
                />
                </div>
                {isInUserList && (
                    <button 
                      className='modal-delete-btn' 
                      onClick={handleDelete}
                    >
                      Delete
                    </button>
                )}
                
            </form>

        </div>
    </div>
  );
};

export default AnimeEditor;

