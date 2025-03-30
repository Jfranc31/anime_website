/**
 * src/Components/ListEditors/MangaEditor.js
 * Description: React component for editing details of a manga.
 */

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import editModalStyles from '../../styles/components/EditModal.module.css';

/**
 * Functional component for editing details of a manga.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.manga - Manga object containing details like titles, images, etc.
 * @param {string} props.userId - User ID associated with the manga.
 * @param {function} props.closeModal - Function to close the modal.
 * @param {function} props.onMangaDelete - Function to handle manga deletion.
 * @param {function} props.onMangaUpdate - Function to handle manga updates.
 * @param {function} props.setUserData - Function to update user data context.
 * @returns {JSX.Element} - Rendered manga editor component.
 */
const MangaEditor = ({
  manga,
  userId,
  closeModal,
  onMangaDelete,
  onMangaUpdate,
  setUserData,
}) => {
  const [mangaDetails, setMangaDetails] = useState(null);
  const [userProgress, setUserProgress] = useState({
    status: 'Planning',
    currentChapter: 0,
    currentVolume: 0
  });
  const [isInUserList, setIsInUserList] = useState(false);
  const availableStatus = ['Planning', 'Reading', 'Completed'];

  useEffect(() => {
    const fetchMangaDetails = async () => {
      if (!manga?._id || !userId) return;

      try {
        const mangaResponse = await axiosInstance.get(
          `/mangas/manga/${manga._id}`
        );
        const userResponse = await axiosInstance.get(
          `/users/${userId}/current`
        );
        const currentUser = userResponse.data;

        const existingMangaIndex = currentUser?.mangas?.findIndex(
          (userManga) => userManga.mangaId === manga._id
        );

        setIsInUserList(existingMangaIndex !== -1);
        setMangaDetails(mangaResponse.data);

        if (currentUser && existingMangaIndex !== -1) {
          const userManga = currentUser.mangas[existingMangaIndex];
          setUserProgress({
            status: userManga.status || 'Planning',
            currentChapter: typeof userManga.currentChapter === 'number' ? userManga.currentChapter : 0,
            currentVolume: typeof userManga.currentVolume === 'number' ? userManga.currentVolume : 0
          });
        }
      } catch (error) {
        console.error('Error fetching manga details:', error);
      }
    };

    fetchMangaDetails();
  }, [manga?._id, userId]);

  if (!manga) {
    return null;
  }

  const handleStatusChange = (e) => {
    setUserProgress((prev) => ({
      ...prev,
      status: e.target.value,
    }));
  };

  const handleChapterChange = (e) => {
    setUserProgress((prev) => ({
      ...prev,
      currentChapter: parseInt(e.target.value) || 0,
    }));
  };

  const handleVolumeChange = (e) => {
    setUserProgress((prev) => ({
      ...prev,
      currentVolume: parseInt(e.target.value) || 0,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isInUserList ? 'updateManga' : 'addManga';
      const payload = {
        mangaId: manga._id,
        anilistId: manga.anilistId,
        status: userProgress.status || 'Planning',
        currentChapter: userProgress.currentChapter || 0,
        currentVolume: userProgress.currentVolume || 0
      };

      const response = await axiosInstance.post(
        `users/${userId}/${endpoint}`,
        payload
      );

      if (response.data) {
        const userResponse = await axiosInstance.get(
          `/users/${userId}/current`
        );
        setUserData(userResponse.data);
        // Notify the parent component about the update
        if (onMangaUpdate) {
          // Create an updated manga entry object for the parent
          const updatedMangaEntry = {
            mangaId: manga._id,
            status: userProgress.status || 'Planning',
            currentChapter: userProgress.currentChapter || 0,
            currentVolume: userProgress.currentVolume || 0
          };
          onMangaUpdate(updatedMangaEntry);
          closeModal();
        } else {
          // If onMangaUpdate is not provided, just close the modal
          closeModal();
        }
        setIsInUserList(true);
      }
    } catch (error) {
      console.error('Error updating user progress:', error);;
    }
  };

  const handleDelete = async () => {
    try {
      console.log('Starting delete process...');

      const response = await axiosInstance.post(
        `/users/${userId}/removeManga`,
        {
          mangaId: manga._id
        }
      );

      console.log('API response:', response);

      if (response.data && response.data.user) {
        setUserData(response.data.user);
        onMangaDelete(manga._id);
      }
    } catch (error) {
      console.error('Error Details:', {
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
        <img src={manga?.images?.border || manga?.images?.image} alt={manga?.titles?.english} />
        <h2>{mangaDetails?.titles?.english || mangaDetails?.titles?.romaji}</h2>
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
            <label htmlFor="currentChapter">Current Chapter:</label>
            <input
              type="number"
              id="currentChapter"
              value={userProgress.currentChapter}
              onChange={handleChapterChange}
              min="0"
              max={mangaDetails?.lengths?.chapters || 9999}
              className={editModalStyles.input}
            />
          </div>
          <div className={editModalStyles.grid}>
            <label htmlFor="currentVolume">Current Volume:</label>
            <input
              type="number"
              id="currentVolume"
              value={userProgress.currentVolume}
              onChange={handleVolumeChange}
              min="0"
              max={mangaDetails?.lengths?.volumes || 9999}
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

export default MangaEditor;
