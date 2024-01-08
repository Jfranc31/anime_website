// src/Components/Searches/CharacterSearch.js

import React, { useState, useEffect } from "react";
import axios from 'axios';

export default function RelationSearch({ onRelationSelected, onClose }) {
    const [relations, setRelations] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRelations, setSelectedRelations] = useState([]);

    const handleSearch = async () => {
        try {
            const response = await axios.get(`http://localhost:8080/searchrelations?query=${searchQuery}`);
            const relationsArray = response.data.relations;

            if(Array.isArray(relationsArray)) {
                setRelations(relationsArray);
            } else {
                console.error('Invalid response data:', response.data);
            }
        } catch (error) {
            console.error('Error fetching relations:', error.message);
        }
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
        onRelationSelected(selectedRelations);
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
                <button onClick={handleSearch}>Search</button>
            </div>
            <div className="character-cards">
                {relations.map((relation) => (
                    <li
                        key={relation._id}
                        className={`character-card ${selectedRelations.includes(relation) ? 'selected' : ''}`}
                        onClick={() => handleRelationClick(relation)}
                    >
                        <div className="img-container">
                            <img src={relation.images.image} alt={relation.images.image} />
                            <div className="character-name">
                                {relation.titles.english}
                            </div>
                        </div>
                    </li>
                ))}
            </div>
            <button onClick={handleConfirmSelection}>Confirm Selection</button>
        </div>
    );
}