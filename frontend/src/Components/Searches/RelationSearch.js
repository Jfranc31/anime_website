// src/Components/Searches/CharacterSearch.js

import React, { useState } from "react";
import axios from 'axios';

/**
 * Functional component for relation search.
 * @param {Object} props - Props passed to the component.
 * @param {function} props.onRelationSelected - Func handle relation selection.
 * @param {string} props.searchType - Type of relation being searched.
 * @param {function} props.onClose - Function to close the relation search.
 * @returns {JSX.Element} - Rendered relation search component.
*/
export default function RelationSearch(
    { onRelationSelected, searchType, onClose }
) {
    const [relations, setRelations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRelations, setSelectedRelations] = useState([]);

    const handleSearch = async (contentType) => {
        try {    
            const response = await searchRelations(searchQuery, contentType);
    
            const relationsArray = response.data.relations;
    
            if (Array.isArray(relationsArray)) {
                setRelations(relationsArray);
            } else {
                console.error('Invalid response data:', response.data);
            }
        } catch (error) {
            console.error('Error fetching relations:', error.message);
        }
    };
    
    const searchRelations = async (query, contentType) => {
        return axios.get(
            `http://localhost:8080/searchrelations?query=
            ${query}&contentType=${contentType}`
        );
    };
    

    const handleRelationClick = (relation) => {
        setSelectedRelations((prevSelected) => {
            if (prevSelected.includes(relation)) {
                return prevSelected.filter((selected) => 
                    selected !== relation);
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
        <div className="character-search">
            <div>
                <input
                    type="text"
                    placeholder="Search relations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button onClick={handleSearch.bind(null, searchType)}>
                    Search
                </button>
            </div>
            <div className="character-cards">
                {relations.map((relation) => (
                    <li
                        key={relation._id}
                        className={
                            `character-card 
                            ${selectedRelations.includes(relation) ? 
                                'selected' : 
                                ''}`}
                        onClick={() => handleRelationClick(relation)}
                    >
                        <div className="img-container">
                            <img 
                                src={relation.images.image} 
                                alt={relation.images.image} 
                            />
                            <div className="character-name">
                                {relation.titles.english}
                            </div>
                        </div>
                    </li>
                ))}
            </div>
            <button onClick={handleConfirmSelection}>
                Confirm Selection
            </button>
        </div>
    );
}