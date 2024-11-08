// src/Components/Searches/CharacterSearch.js

import React, { useState, useEffect } from "react";
import axios from 'axios';
import styles from '../../styles/components/CharacterSearch.module.css';
/**
 * Functional component for character search.
 * @param {Object} props - Props passed to the component.
 * @param {function} props.onCharacterSelected - Function to handle character selection.
 * @param {function} props.onClose - Function to close the character search.
 * @returns {JSX.Element} - Rendered character search component.
*/
export default function CharacterSearch({ onCharacterSelected, onClose }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [characters, setCharacters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCharacters, setSelectedCharacters] = useState([]);

    // Add debounce to prevent too many API calls
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchTerm) {
                searchCharacters();
            } else {
                setCharacters([]); // Clear results if search is empty
            }
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const searchCharacters = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`http://localhost:8080/characters/searchcharacters`, {
                params: {
                    query: searchTerm
                }
            });
            const characterData = response.data.characters || [];
            setCharacters(characterData);
        } catch (error) {
            console.error('Error searching characters:', error);
            setCharacters([]);
        } finally {
            setLoading(false);
        }
    };

    const handleCharacterClick = (character) => {
        setSelectedCharacters(prev => {
            const isSelected = prev.some(c => c._id === character._id);
            if (isSelected) {
                return prev.filter(c => c._id !== character._id);
            } else {
                return [...prev, character];
            }
        });
    };

    const handleConfirmSelection = () => {
        onCharacterSelected(selectedCharacters);
        onClose();
    };

    return (
        <div className={styles.characterSearchContainer}>
            <div className={styles.searchBox}>
                <input
                    type="text"
                    placeholder="Search characters..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={styles.searchInput}
                />
            </div>

            {loading ? (
                <div className={styles.loading}>Searching...</div>
            ) : (
                <div className={styles.charactersGrid}>
                    {characters.length === 0 ? (
                        <div className={styles.noResults}>
                            {searchTerm ? 'No characters found' : 'Start typing to search characters'}
                        </div>
                    ) : (
                        characters.map((character) => {
                            const isSelected = selectedCharacters.some(c => c._id === character._id);
                            return (
                                <div 
                                    key={character._id} 
                                    className={`${styles.characterCard} ${isSelected ? styles.selected : ''}`}
                                    onClick={() => handleCharacterClick(character)}
                                >
                                    <div className={styles.characterImageContainer}>
                                        <img 
                                            src={character.characterImage} 
                                            alt={character.names.givenName}
                                            className={styles.characterImage} 
                                        />
                                        {isSelected && (
                                            <div className={styles.selectedOverlay}>
                                                <span className={styles.checkmark}>✓</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.characterInfo}>
                                        <p className={styles.characterName}>
                                            {character.names.givenName} {character.names.surName}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            <div className={styles.actionButtons}>
                <button 
                    className={styles.selectButton}
                    onClick={() => {
                        onCharacterSelected(selectedCharacters);
                        onClose();
                    }}
                    disabled={selectedCharacters.length === 0}
                >
                    Add Selected ({selectedCharacters.length})
                </button>
                <button className={styles.cancelButton} onClick={onClose}>
                    Cancel
                </button>
            </div>
        </div>
    );
}
