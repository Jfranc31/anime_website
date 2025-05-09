/**
 * src/Components/ListEditors/AnimeEditor.js
 * Description: React component for editing details of an anime.
 */

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import editModalStyles from '../../styles/components/EditModal.module.css';

/**
 * Functional component for editing details of an anime.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.anime - Anime object containing details like titles, images, etc.
 * @param {string} props.userId - User ID associated with the anime.
 * @param {function} props.closeModal - Function to close the modal.
 * @param {function} props.onAnimeDelete - Function to handle anime deletion.
 * @param {function} props.onAnimeUpdate - Function to handle anime updates.
 * @param {function} props.setUserData - Function to update user data context.
 * @returns {JSX.Element} - Rendered anime editor component.
 */
const AnimeEditor = ({
  anime,
  userId,
  closeModal,
  onAnimeDelete,
  onAnimeUpdate,
  setUserData,
}) => {
  const [animeDetails, setAnimeDetails] = useState(null);
  const [userProgress, setUserProgress] = useState({
    status: '',
    currentEpisode: 0,
  });
  const [isInUserList, setIsInUserList] = useState(false);
  const availableStatus = ['Planning', 'Watching', 'Completed'];

  useEffect(() => {
    const fetchAnimeDetails = async () => {
      if (!anime?._id || !userId) return;
      try {
        const animeResponse = await axiosInstance.get(
          `/animes/anime/${anime._id}`
        );
        const userResponse = await axiosInstance.get(
          `/users/${userId}/current`
        );
        const currentUser = userResponse.data;
        // Use UserList structure
        const lists = currentUser.lists || {};
        const allAnime = [
          ...(lists.watchingAnime || []),
          ...(lists.completedAnime || []),
          ...(lists.planningAnime || [])
        ];
        const existingAnime = allAnime.find(
          userAnime => userAnime.animeId._id === anime._id
        );
        setIsInUserList(!!existingAnime);
        setAnimeDetails(animeResponse.data);
        if (existingAnime) {
          setUserProgress({
            status: existingAnime.status,
            currentEpisode: existingAnime.progress
          });
        } else {
          setUserProgress({ status: '', currentEpisode: 0 });
        }
      } catch (error) {
        console.error('Error fetching anime details:', error);
      }
    };
    fetchAnimeDetails();
  }, [anime?._id, userId]);

  if (!anime) {
    return null;
  }

  const handleStatusChange = (e) => {
    setUserProgress((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleEpisodeChange = (e) => {
    setUserProgress((prev) => ({
      ...prev,
      currentEpisode: parseInt(e.target.value) || 0,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isInUserList ? 'updateAnime' : 'addAnime';
      const payload = {
        animeId: anime._id,
        anilistId: anime.anilistId,
        status: userProgress.status || 'Planning',
        currentEpisode: userProgress.currentEpisode || 0,
      };

      const response = await axiosInstance.post(
        `/users/${userId}/${endpoint}`,
        payload
      );

      if (response.data) {
        const userResponse = await axiosInstance.get(
          `/users/${userId}/current`
        );
        setUserData(userResponse.data);
        
        // Notify the parent component about the update
        if (onAnimeUpdate) {
          // Create an updated anime entry object for the parent
          const updatedAnimeEntry = {
            animeId: anime._id,
            status: userProgress.status || 'Planning',
            currentEpisode: userProgress.currentEpisode || 0,
          };
          onAnimeUpdate(updatedAnimeEntry);
        } else {
          // If onAnimeUpdate is not provided, just close the modal
          closeModal();
        }
        
        setIsInUserList(true);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Starting delete process...');

      const response = await axiosInstance.post(
        `/users/${userId}/removeAnime`,
        {
          animeId: anime._id,
        }
      );

      console.log('API Response:', response);

      if (response.data && response.data.user) {
        setUserData(response.data.user);
        onAnimeDelete(anime._id);
      }
    } catch (error) {
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
    }
  };

  return (
    <div
      className={editModalStyles.characterModal}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={editModalStyles.modalHeader}>
        <img src={anime?.images?.border} alt={anime?.titles?.english} />
        <h2>{animeDetails?.titles?.english || ''}</h2>
        <button
          className={editModalStyles.characterModalClose}
          onClick={closeModal}
        >
          ×
        </button>
      </div>
      <div className={editModalStyles.modalBody}>
        <form onSubmit={handleSave}>
          <div className={editModalStyles.grid}>
            <label htmlFor="status">Status:</label>
            <select
              id="status"
              value={userProgress.status}
              onChange={handleStatusChange}
              className={editModalStyles.select}
            >
              <option value="" disabled>
                Select Status
              </option>
              {availableStatus.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className={editModalStyles.grid}>
            <label htmlFor="currentEpisode">Current Episode:</label>
            <input
              type="number"
              id="currentEpisode"
              value={userProgress.currentEpisode}
              onChange={handleEpisodeChange}
              min="0"
              max={animeDetails?.episodes || 9999}
              className={editModalStyles.input}
            />
          </div>
          <div className={editModalStyles.buttonContainer}>
            <button type="submit" className={editModalStyles.modalSaveBtn}>
              Save
            </button>
            {isInUserList && (
              <button
                type="button"
                className={editModalStyles.modalDeleteBtn}
                onClick={handleDelete}
              >
                Delete
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default AnimeEditor;
