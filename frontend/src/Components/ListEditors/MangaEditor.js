/**
 * src/Components/ListEditors/MangaEditor.js
 * Description: React component for editing details of a manga.
*/

import React, { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Functional component for editing details of a manga.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.manga - Manga object containing details like titles, images, etc.
 * @param {string} props.userId - User ID associated with the manga.
 * @param {function} props.closeModal - Function to close the modal.
 * @param {function} props.onMangaDelete - Function to handle manga deletion.
 * @returns {JSX.Element} - Rendered manga editor component.
*/
const MangaEditor = ({ manga, userId, closeModal, onMangaDelete }) => {
    const [mangaDetails, setMangaDetails] = useState(null);
    const [userProgress, setUserProgress] = useState({
        status: '',
        currentChapter: 0,
        currentVolume: 0,
    });
    const [isInUserList, setIsInUserList] = useState(false);

    console.log(manga);

    const availableStatus = ["Planning", "Reading", "Completed"];

    useEffect(() => {
        const fetchMangaDetails = async () => {
            console.log("isInUserList:", isInUserList);
            try {
                const mangaResponse = await axios.get(`http://localhost:8080/mangas/manga/${manga._id}`);
                const userResponse = await axios.get(`http://localhost:8080/users/${userId}/current`);
                const currentUser = userResponse.data;
                const existingMangaIndex = currentUser?.mangas?.findIndex((userManga) => userManga.mangaId === manga._id);
                if(existingMangaIndex !== -1) {
                    setIsInUserList(true)
                }
                setMangaDetails(mangaResponse.data);
                if (currentUser) {
                    setUserProgress({
                        status: existingMangaIndex !== -1 ? currentUser.mangas[existingMangaIndex].status : '',
                        currentChapter: existingMangaIndex !== -1 ? currentUser.mangas[existingMangaIndex].currentChapter : 0,
                        currentVolume: existingMangaIndex !== -1 ? currentUser.mangas[existingMangaIndex].currentVolume : 0,
                    });
                }
            } catch (error) {
                console.error('Error fetching manga details:', error);
            }
        };
        fetchMangaDetails();
    }, [manga._id, isInUserList, userId]);

    const handleStatusChange = (e) => {
        setUserProgress({
          ...userProgress,
          status: e.target.value,
        });
    };

    const handleChapterChange = (e) => {
        setUserProgress({
          ...userProgress,
          currentChapter: e.target.value,
        });
    };

    const handleVolumeChange = (e) => {
        setUserProgress({
          ...userProgress,
          currentVolume: e.target.value,
        });
    };

    const handleSave = async () => {
        try {
            var response;
            if(isInUserList){
                response = await axios.post(`http://localhost:8080/users/${userId}/updateManga`, {
                    mangaId: manga._id,
                    status: userProgress.status,
                    currentChapter: userProgress.currentChapter,
                    currentVolume: userProgress.currentVolume,
                });
            } else {
                response = await axios.post(`http://localhost:8080/users/${userId}/addManga`, {
                    mangaId: mangaDetails._id,
                status: userProgress.status || "Planning",
                currentChapter: userProgress.currentChapter || 0,
                currentVolume: userProgress.currentVolume || 0,
                });
            }

            if(response.data.success) {
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
            await axios.post(`http://localhost:8080/users/${userId}/removeManga`, {
            mangaId: manga._id,
            });

            onMangaDelete(manga._id);
            closeModal();
        } catch (error) {
            console.error('Error removing manga from user list:', error);
        }
    };

    return (
        <div className='character-modal' onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className='modal-header'>
                <h2>{mangaDetails?.titles?.english || ''}</h2>
                <img src={manga?.images?.border} alt={manga?.titles?.english} />
                <button className='character-modal-close' onClick={closeModal}>
                    &times;
                </button>
                <button type='submit' className='modal-save-btn' form='submit'>Save</button>
            </div>
            <div className='modal-body'>
                {/* Modal Body */}
                <form onSubmit={handleSave} id='submit'>
                    <div className='grid'>
                        <label htmlFor='userProgress.status'>Status:</label>
                        <select
                            id='userProgress.status'
                            name='userProgress.status'
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
                        <label htmlFor='userProgress.currentChapter'>Current Chapter:</label>
                        <input
                            type='number'
                            id='userProgress.currentChapter'
                            name='userProgress.currentChapter'
                            value={userProgress.currentChapter}
                            onChange={handleChapterChange}
                        />
                    </div>
                    <div className='grid'>
                        <label htmlFor='userProgress.currentVolume'>Current Volume:</label>
                        <input
                            type='number'
                            id='userProgress.currentVolume'
                            name='userProgress.currentVolume'
                            value={userProgress.currentVolume}
                            onChange={handleVolumeChange}
                        />
                    </div>
                    {isInUserList && (
                        <button className='modal-delete-btn' onClick={handleDelete}>Delete</button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default MangaEditor;