import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import styles from '../../styles/components/compareAnime.module.css';

export const CompareAnimeData = ({ animeId }) => {
  const [differences, setDifferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedFields, setSelectedFields] = useState([]);

  useEffect(() => {
    const fetchDifferences = async () => {
      try {
        const response = await axiosInstance.get(`/animes/compare/${animeId}`);
        setDifferences(response.data);
      } catch (error) {
        console.error('Error fetching differences:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDifferences();
  }, [animeId]);

  const handleFieldSelection = (field) => {
    setSelectedFields(prev => 
      prev.includes(field) 
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  const handleUpdate = async () => {
    try {
      await axiosInstance.post(`/animes/update-selective/${animeId}`, {
        fieldsToUpdate: selectedFields
      });
      // Refresh differences after update
      const response = await axiosInstance.get(`/animes/compare/${animeId}`);
      setDifferences(response.data);
      setSelectedFields([]);
    } catch (error) {
      console.error('Error updating anime:', error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!differences) return <div>No differences found</div>;

  return (
    <div className={styles['comparison-container']}>
      <h3>Compare with AniList Data</h3>
      
      {/* Release Data Comparison */}
      <div className={styles['comparison-section']}>
        <h4>Release Data</h4>
        {differences.releaseData.isDifferent && (
          <>
            <div className="current-data">
              Current: {JSON.stringify(differences.releaseData.current)}
            </div>
            <div className="anilist-data">
              AniList: {JSON.stringify(differences.releaseData.anilist)}
            </div>
            <label>
              <input
                type="checkbox"
                checked={selectedFields.includes('releaseData')}
                onChange={() => handleFieldSelection('releaseData')}
              />
              Update to AniList version
            </label>
          </>
        )}
      </div>

      {/* Lengths Comparison */}
      <div className={styles['comparison-section']}>
        <h4>Lengths</h4>
        {differences.lengths.isDifferent && (
          <>
            <div className="current-data">
              Current: {JSON.stringify(differences.lengths.current)}
            </div>
            <div className="anilist-data">
              AniList: {JSON.stringify(differences.lengths.anilist)}
            </div>
            <label>
              <input
                type="checkbox"
                checked={selectedFields.includes('lengths')}
                onChange={() => handleFieldSelection('lengths')}
              />
              Update to AniList version
            </label>
          </>
        )}
      </div>

      {/* Genres Comparison */}
      <div className={styles['comparison-section']}>
        <h4>Genres</h4>
        {differences.genres.isDifferent && (
          <>
            <div className="current-data">
              Current: {differences.genres.current.join(', ')}
            </div>
            <div className="anilist-data">
              AniList: {differences.genres.anilist.join(', ')}
            </div>
            <label>
              <input
                type="checkbox"
                checked={selectedFields.includes('genres')}
                onChange={() => handleFieldSelection('genres')}
              />
              Update to AniList version
            </label>
          </>
        )}
      </div>

      {selectedFields.length > 0 && (
        <button onClick={handleUpdate}>
          Update Selected Fields
        </button>
      )}
    </div>
  );
}; 