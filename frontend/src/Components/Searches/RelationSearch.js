// src/Components/Searches/CharacterSearch.js

import React, { useState, useEffect } from "react";
import axios from 'axios';
import styles from '../../styles/components/RelationSearch.module.css';
/**
 * Functional component for relation search.
 * @param {Object} props - Props passed to the component.
 * @param {function} props.onRelationSelected - Function to handle relation selection.
 * @param {string} props.searchType - Type of relation being searched (e.g., 'anime', 'manga').
 * @param {function} props.onClose - Function to close the relation search.
 * @returns {JSX.Element} - Rendered relation search component.
*/
export default function RelationSearch({ onRelationSelected, searchType, onClose }) {
    const [relations, setRelations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRelations, setSelectedRelations] = useState([]);
    const [loading, setLoading] = useState(false);

    // Add debounce effect for auto-search
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery) {
                handleSearch(searchType);
            } else {
                setRelations([]); // Clear results if search is empty
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery, searchType]);

    const handleSearch = async (contentType) => {
        try {    
            setLoading(true);
            const response = await searchRelations(searchQuery, contentType);
            const relationsArray = response.data.relations;
    
            if (Array.isArray(relationsArray)) {
                setRelations(relationsArray);
            }
        } catch (error) {
            console.error('Error fetching relations:', error.message);
            setRelations([]);
        } finally {
            setLoading(false);
        }
    };
    
    const searchRelations = async (query, contentType) => {
        return axios.get(`http://localhost:8080/searchrelations?query=${query}&contentType=${contentType}`);
    };
    

    const handleRelationClick = (relation) => {
        setSelectedRelations((prevSelected) => {
            if (prevSelected.includes(relation)) {
                return prevSelected.filter((selected) => selected !== relation);
            } else {
                return [...prevSelected, relation];
            }
        });
    };

    const handleConfirmSelection = () => {
        onRelationSelected(searchType ,selectedRelations);
        onClose();
    };

    return (
        <div className={styles.relationSearchContainer}>
            <div className={styles.searchBox}>
                <input
                    type="text"
                    placeholder={`Search ${searchType}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading ? (
                <div className={styles.loading}>Searching...</div>
            ) : (
                <div className={styles.relationsGrid}>
                    {relations.length === 0 ? (
                        <div className={styles.noResults}>
                            {searchQuery ? 'No relations found' : 'Start typing to search relations'}
                        </div>
                    ) : (
                        relations.map((relation) => (
                            <div 
                                key={relation._id} 
                                className={`${styles.relationCard} ${selectedRelations.includes(relation) ? styles.selected : ''}`}
                                onClick={() => handleRelationClick(relation)}
                            >
                                <div className={styles.relationImageContainer}>
                                    <img 
                                        src={relation.images.image} 
                                        alt={relation.titles.english}
                                        className={styles.relationImage} 
                                    />
                                    {selectedRelations.includes(relation) && (
                                        <div className={styles.selectedOverlay}>
                                            <span className={styles.checkmark}>✓</span>
                                        </div>
                                    )}
                                </div>
                                <div className={styles.relationInfo}>
                                    <p className={styles.relationName}>
                                        {relation.titles.english}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            <div className={styles.actionButtons}>
                <button 
                    className={styles.selectButton}
                    onClick={handleConfirmSelection}
                    disabled={selectedRelations.length === 0}
                >
                    Add Selected ({selectedRelations.length})
                </button>
                <button 
                    className={styles.cancelButton}
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}