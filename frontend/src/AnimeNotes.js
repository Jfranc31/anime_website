import React, { useState, useEffect } from 'react';
import axiosInstance from './utils/axiosConfig';

const AnimeNotes = ({ animeId }) => {
  const [notes, setNotes] = useState('');

  useEffect(() => {
    const fetchNotes = async () => {
      try {
        const response = await axiosInstance.get(
          `/anime/${animeId}/notes`
        );
        setNotes(response.data.notes);
      } catch (error) {
        console.error('Error fetching anime notes:', error);
      }
    };

    fetchNotes();
  }, [animeId]);

  const handleSaveNotes = async () => {
    try {
      await axiosInstance.put(`/anime/${animeId}/notes`, {
        notes,
      });
      console.log('Notes saved successfully');
    } catch (error) {
      console.error('Failed to save notes:', error);
    }
  };

  return (
    <div>
      <h3>Notes</h3>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleSaveNotes}
        rows={4}
        cols={80}
      />
    </div>
  );
};

export default AnimeNotes;
