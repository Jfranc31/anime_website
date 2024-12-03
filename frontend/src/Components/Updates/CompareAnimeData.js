import React, { useEffect, useState } from 'react';
import compareStyles from '../../styles/components/compare_data.module.css';

export const CompareAnimeData = ({ currentData, anilistData, onDataSelect }) => {
  const [showModal, setShowModal] = useState(false);
  const [differences, setDifferences] = useState({});
  const [initialCheckDone, setInitialCheckDone] = useState(false);
  const [selectedFields, setSelectedFields] = useState({});

  useEffect(() => {
    if (!currentData || !anilistData || initialCheckDone) {
      return;
    }

    const findDifferences = () => {
      const diffs = {};

      // Compare titles - only if there are actual differences
      const titlesAreDifferent = Object.entries(currentData.titles).some(
        ([key, value]) => anilistData.titles[key] !== value
      );
      if (titlesAreDifferent) {
        diffs.titles = {
          current: currentData.titles,
          anilist: anilistData.titles
        };
      }

      // Compare simple string fields
      ['releaseStatus', 'description'].forEach(field => {
        if (currentData[field] !== anilistData[field]) {
          diffs[field] = {
            current: currentData[field],
            anilist: anilistData[field]
          };
        }
      });

      // Compare dates with more detailed logging
      ['startDate', 'endDate'].forEach(field => {
        const currentDate = currentData[field];
        const anilistDate = anilistData[field];
        
        console.log(`Comparing ${field}:`, {
          current: currentDate,
          anilist: anilistDate
        });
        
        // Only add to differences if the dates are actually different
        const areDifferent = JSON.stringify(currentDate) !== JSON.stringify(anilistDate);
        if (areDifferent) {
          diffs[field] = {
            current: currentDate,
            anilist: anilistDate
          };
        }
      });

      // Compare typings
      const typingsAreDifferent = Object.entries(currentData.typings).some(
        ([key, value]) => anilistData.typings[key] !== value
      );
      if (typingsAreDifferent) {
        diffs.typings = {
          current: currentData.typings,
          anilist: anilistData.typings
        };
      }

      // Compare genres
      if (JSON.stringify(currentData.genres) !== JSON.stringify(anilistData.genres)) {
        diffs.genres = {
          current: currentData.genres,
          anilist: anilistData.genres
        };
      }

      // Compare lengths
      if (JSON.stringify(currentData.lengths) !== JSON.stringify(anilistData.lengths)) {
        diffs.lengths = {
          current: currentData.lengths,
          anilist: anilistData.lengths
        };
      }

      // Compare images
      if (currentData.images !== anilistData.images) {
        diffs.images = {
          current: currentData.images,
          anilist: anilistData.images
        };
      }

      return diffs;
    };

    const diffs = findDifferences();
    console.log('Found differences:', diffs);
    
    if (Object.keys(diffs).length > 0) {
      setDifferences(diffs);
      setShowModal(true);
    }
    setInitialCheckDone(true);
  }, [currentData, anilistData, initialCheckDone]);

  const formatValue = (value, field) => {
    if (!value) return 'Not set';
    
    switch(field) {
      case 'titles':
        return (
          <div>
            <div>Romaji: {value.romaji || 'Not set'}</div>
            <div>English: {value.english || 'Not set'}</div>
            <div>Native: {value.native || 'Not set'}</div>
          </div>
        );
        
      case 'startDate':
      case 'endDate':
        return (
          <div>
            <div>Year: {value.year || 'Not set'}</div>
            <div>Month: {value.month || 'Not set'}</div>
            <div>Day: {value.day || 'Not set'}</div>
          </div>
        );
        
      case 'typings':
        return (
          <div>
            <div>Format: {value.Format || 'Not set'}</div>
            <div>Source: {value.Source || 'Not set'}</div>
            <div>Country: {value.CountryOfOrigin || 'Not set'}</div>
          </div>
        );
        
      case 'lengths':
        return (
          <div>
            <div>Episodes: {value.Episodes || 'Not set'}</div>
            <div>Duration: {value.EpisodeDuration || 'Not set'} min</div>
          </div>
        );
        
      case 'images':
        const imageUrl = value.image || value;
        return imageUrl ? (
          <img 
            src={imageUrl} 
            alt="Cover" 
            className={compareStyles.coverImage}
          />
        ) : 'No image';
        
      case 'genres':
        return Array.isArray(value) ? (
          <div className={compareStyles.genres}>
            {value.map((genre, index) => (
              <span key={index}>{genre}</span>
            ))}
          </div>
        ) : value.toString();
        
      default:
        return typeof value === 'object' ? JSON.stringify(value) : value.toString();
    }
  };

  const handleOptionClick = (field, data, source) => {
    setSelectedFields(prev => ({
      ...prev,
      [field]: source
    }));
    
    onDataSelect(field, data);
    console.log('Selected:', field, data);
  };

  const handleApplyChanges = () => {
    setShowModal(false);
    setSelectedFields({});
  };

  const renderFieldLabel = (field) => {
    const labels = {
      titles: 'Titles',
      releaseStatus: 'Release Status',
      startDate: 'Start Date',
      endDate: 'End Date',
      typings: 'Type Information',
      lengths: 'Length Details',
      genres: 'Genres',
      description: 'Description',
      images: 'Cover Image'
    };
    return labels[field] || field;
  };

  return (
    showModal && (
      <div className={compareStyles.modal}>
        <div className={compareStyles.modalContent}>
          <div className={compareStyles.modalHeader}>
            <h2>Compare with AniList Data</h2>
            <p className={compareStyles.modalSubtitle}>
              Click on the data you want to use. Selected data will be highlighted.
            </p>
          </div>

          <div className={compareStyles.comparisonContainer}>
            {Object.entries(differences).map(([field, { current, anilist }]) => (
              <div key={field} className={compareStyles.comparisonRow}>
                <div className={compareStyles.fieldLabel}>
                  {renderFieldLabel(field)}
                </div>
                <div className={compareStyles.options}>
                  <div 
                    className={`${compareStyles.option} ${compareStyles.current} ${
                      selectedFields[field] === 'current' ? compareStyles.selected : ''
                    }`}
                    onClick={() => handleOptionClick(field, current, 'current')}
                  >
                    <div className={compareStyles.optionHeader}>
                      <h4>Current Data</h4>
                      {selectedFields[field] === 'current' && (
                        <span className={compareStyles.selectedIndicator}>✓</span>
                      )}
                    </div>
                    <div className={`${compareStyles.value} ${compareStyles[field]}`}>
                      {formatValue(current, field)}
                    </div>
                  </div>

                  <div 
                    className={`${compareStyles.option} ${compareStyles.anilist} ${
                      selectedFields[field] === 'anilist' ? compareStyles.selected : ''
                    }`}
                    onClick={() => handleOptionClick(field, anilist, 'anilist')}
                  >
                    <div className={compareStyles.optionHeader}>
                      <h4>AniList Data</h4>
                      {selectedFields[field] === 'anilist' && (
                        <span className={compareStyles.selectedIndicator}>✓</span>
                      )}
                    </div>
                    <div className={`${compareStyles.value} ${compareStyles[field]}`}>
                      {formatValue(anilist, field)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={compareStyles.modalActions}>
            <button 
              className={compareStyles.applyButton}
              onClick={handleApplyChanges}
            >
              Apply Selected Changes
            </button>
            <button 
              className={compareStyles.cancelButton}
              onClick={() => {
                setShowModal(false);
                setSelectedFields({});
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  );
}; 