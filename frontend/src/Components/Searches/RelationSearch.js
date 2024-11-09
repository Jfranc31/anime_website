// src/Components/Searches/RelationSearch.js

import React, { useState, useEffect } from "react";
import axios from 'axios';
import searchStyles from '../../styles/components/search.module.css';
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
        <div className={searchStyles.searchModalOverlay}>
            <div className={searchStyles.searchModal}>
                <div className={searchStyles.modalBody}>
                    <div className={searchStyles.searchContainer}>
                        <div className={searchStyles.searchBox}>
                            <input
                                type="text"
                                placeholder={`Search ${searchType}...`}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={searchStyles.searchInput}
                            />
                        </div>

                        {loading ? (
                            <div className={searchStyles.loading}>Searching...</div>
                        ) : (
                            <div className={searchStyles.itemsGrid}>
                                {relations.length === 0 ? (
                                    <div className={searchStyles.noResults}>
                                        {searchQuery ? 'No relations found' : 'Start typing to search relations'}
                                    </div>
                                ) : (
                                    relations.map((relation) => (
                                        <div
                                            key={relation._id}
                                            className={`${searchStyles.itemCard} ${selectedRelations.includes(relation) ? searchStyles.selected : ''}`}
                                            onClick={() => handleRelationClick(relation)}
                                        >
                                            <div className={searchStyles.itemImageContainer}>
                                                <img
                                                    src={relation.images.image}
                                                    alt={relation.titles.english}
                                                    className={searchStyles.itemImage}
                                                />
                                                {selectedRelations.includes(relation) && (
                                                    <div className={searchStyles.selectedOverlay}>
                                                        <span className={searchStyles.checkmark}>✓</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={searchStyles.itemInfo}>
                                                <p className={searchStyles.itemName}>
                                                    {relation.titles.english}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                        <div className={searchStyles.actionButtons}>
                            <button
                                className={searchStyles.selectButton}
                                onClick={handleConfirmSelection}
                                disabled={selectedRelations.length === 0}
                            >
                                Select {searchType}
                            </button>
                            <button className={searchStyles.cancelButton} onClick={onClose}>
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}