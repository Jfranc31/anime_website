// src/components/AddManga.js

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import CreateCharacter from "../Components/CreateCharacter";
import CharacterSearch from "../Components/Searches/CharacterSearch";
import RelationSearch from "../Components/Searches/RelationSearch";
import styles from '../styles/components/Modal.module.css';
import styles1 from '../styles/pages/add_page.module.css';

export default function AddManga() {
    const [formData, setFormData] = useState({
        titles: {
            romaji: '',
            english: '',
            Native: '',
        },
        releaseData: {
            releaseStatus: "",
            startDate: {
                year: "",
                month:"",
                day: "",
            },
            endDate: {
                year: "",
                month: "",
                day: "",
            }
        },
        typings: {
            Format: '',
            Source: '',
            CountryOfOrigin: '',
        },
        lengths: {
            chapters: "",
            volumes: "",
        },
        genres: [],
        description: '',
        images: {
            image: '',
            border: '',
        },
        characters: [],
        mangaRelations: [],
        animeRelations:[],
        activityTimestamp: 0,
    });

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('general');
    const [formErrors, setFormErrors] = useState({});
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [activeModal, setActiveModal] = useState(null);

    const availableGenres = [
        'Action',
        'Adventure',
        'Comedy',
        'Drama',
        'Ecchi',
        'Fantasy',
        'Horror',
        'Hentai',
        'Mahou Shoujo',
        'Mecha',
        'Music',
        'Mystery',
        'Psychological',
        'Romance',
        'Sci-Fi',
        'Slice of Life',
        'Sports',
        'Supernatural',
        'Thriller',
    ];
    const availableStatus = [
        'Finished Releasing', 
        'Currently Releasing', 
        'Not Yet Released', 
        'Cancelled', 
        'Hiatus'
    ];
    const availableFormats = [
        "Manga", 
        "Light Novel", 
        "One Shot"
    ];
    const availableSource = [
        "Original", 
        "Manga", 
        "Anime", 
        "Light Novel", 
        "Web Novel", 
        "Novel", 
        "Doujinshi", 
        "Video Game", 
        "Visual Novel", 
        "Comic", 
        "Game", 
        "Live Action", 
        "Multimedia Project", 
        "Picture Book", 
        "Other"
    ];
    const availableCountry = [
        'China', 
        'Japan', 
        'South Korea', 
        'Taiwan'
    ];
    const availableRole = [
        "Main", 
        "Supporting", 
        "Background"
    ];
    const availableRelation = [
        "Adaptation", 
        "Source", 
        "Prequel", 
        "Sequel", 
        "Side Story", 
        "Character", 
        "Summary", 
        "Alternative", 
        "Spin Off", 
        "Other", 
        "Compilations", 
        "Contains"
    ];

    const handleModalClose = () => {
        setActiveModal(null);
    };

    // Existing Character --------------------------------------------
    const handleAddExistingCharacter = () => {
        setActiveModal('characterSearch');
    };
    const handleSelectExistingCharacter = (selectedCharacters) => {
        const charactersWithDefaultRole = selectedCharacters.map((character) => ({
        ...character,
        role: "", // Set the default role to an empty string
        }));
        setFormData((prevFormData) => ({
        ...prevFormData,
        characters: [...prevFormData.characters, ...charactersWithDefaultRole],
        }));
    };
    // ---------------------------------------------------------------

    // Handle Character type / Removal -------------------------------
    const handleCharacterTypeChange = (e, index) => {
        const newType = e.target.value;
        updateCharacterType(index, newType);
    };
    const updateCharacterType = (index, newType) => {
        setFormData((prevFormData) => {
        const updatedCharacters = [...prevFormData.characters];
        updatedCharacters[index].role = newType;
        return {
            ...prevFormData,
            characters: updatedCharacters,
        };
        });
    };
    const handleRemoveCharacter = (index) => {
        setFormData((prevData) => {
        const updatedCharacters = [...prevData.characters];
        updatedCharacters.splice(index, 1);
        return {
            ...prevData,
            characters: updatedCharacters,
        };
        });
    };
    // ---------------------------------------------------------------

    // Handle Relation type / Removal --------------------------------
    const handleRelationTypeChange = (e, type, index) => {
        const newType = e.target.value;
        updateRelationType(type, index, newType);
    };
    
    const updateRelationType = (type, index, newType) => {
        setFormData((prevFormData) => {
            const updatedRelations = [...prevFormData[`${type}Relations`]];
            updatedRelations[index].typeofRelation = newType;
            return {
                ...prevFormData,
                [`${type}Relations`]: updatedRelations,
            };
        });
    };
    
    const handleRemoveRelation = (type, index) => {
        setFormData((prevData) => {
            const updatedRelations = [...prevData[`${type}Relations`]];
            updatedRelations.splice(index, 1);
            return {
                ...prevData,
                [`${type}Relations`]: updatedRelations,
            };
        });
    };
    // ---------------------------------------------------------------

    // Relation ------------------------------------------------------
    const handleAddRelation = (type) => {
        setActiveModal(`${type}RelationSearch`);
    };
    const handleSelectRelation = (type, selectedRelations) => {
        const relationsWithDefaultRelation = selectedRelations.map((relation) => ({
            ...relation,
            typeofRelation: "",
        }));
        setFormData((prevFormData) => ({
            ...prevFormData,
            [`${type}Relations`]: [...prevFormData[`${type}Relations`], ...relationsWithDefaultRelation],
        }));
    };
    // ---------------------------------------------------------------

    // Create Character ------------------------------
    const handleAddCharacter = (newCharacter) => {
        setActiveModal('createCharacter');
    };
    const handleAddingCharacter = (selectedCharacter) => {
        // Assuming selectedCharacter is a single character object
        setFormData((prevFormData) => ({
        ...prevFormData,
        characters: [...prevFormData.characters, { ...selectedCharacter, role: "" }],
        }));
    };
    // ----------------------------------------------

    // Genre Related-------------------------------
    const handleGenreChange = (selectedGenre) => {
        setSelectedGenres((prevGenres) => {
            const updatedGenres = [...prevGenres];
            
            if (!updatedGenres.includes(selectedGenre)) {
                updatedGenres.push(selectedGenre);
            }

            // Update genres in formData
            setFormData((prevData) => ({
                ...prevData,
                genres: updatedGenres,
            }));

            return updatedGenres;
        });
    };
    const handleRemoveGenre = (removedGenre) => {
        setSelectedGenres((prevGenres) =>
            prevGenres.filter((genre) => genre !== removedGenre)
        );

        // Update genres in formData
        setFormData((prevData) => ({
            ...prevData,
            genres: prevData.genres.filter((genre) => genre !== removedGenre),
        }));
    };
    // --------------------------------------------

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        const errors = {};

        setFormErrors(errors);

        if (Object.keys(errors).length > 0) {
            alert(errors.data.message);
            return;
        }

        const charactersArray = formData.characters.map((character) => ({
            characterId: character._id,
            role: character.role,
        }));

        const animeRelationsArray = formData.animeRelations.map((relation) => ({
            relationId: relation._id,
            typeofRelation: relation.typeofRelation
          }));
      
          const mangaRelationsArray = formData.mangaRelations.map((relation) => ({
            relationId: relation._id,
            typeofRelation: relation.typeofRelation
          }));

        const updatedFormData = {
            ...formData,
            characters: charactersArray,
            animeRelations: animeRelationsArray,
            mangaRelations: mangaRelationsArray
        };

        try {
            console.log('Current formData:', updatedFormData);

            const res = await axios.post(`http://localhost:8080/mangas/addmanga`, updatedFormData);

            console.log('Response from backend:', res.data);

            if (res.status === 201) {
                console.log('Manga and characters updated successfully!', res.data);
                
                setFormData({
                    titles: {
                        romaji: '',
                        english: '',
                        Native: '',
                    },
                    releaseData: {
                        releaseStatus: "",
                        startDate: {
                            year: "",
                            month:"",
                            day: "",
                        },
                        endDate: {
                            year: "",
                            month: "",
                            day: "",
                        }
                    },
                    typings: {
                        Format: '',
                        Source: '',
                        CountryOfOrigin: '',
                    },
                    lengths: {
                        Episodes: 0,
                        EpisodeDuration: 0,
                    },
                    genres: [],
                    description: '',
                    images: {
                        image: '',
                        border: '',
                    },
                    characters: [],
                    mangaRelations: [],
                    animeRelations:[],
                    activityTimestamp: 0,
                });
                setSelectedGenres([]);
                navigate('/mangas');
            } else {
                console.error('Failed to update manga:', res.data);
            }
        } catch (error) {
            console.error('Error during manga update:', error.message);
        }
    };

    // Handle change in form
    const handleChange = (e) => {
        const { name, value, type } = e.target;
    
        const updateNestedProperty = (prev, keys, newValue) => {
            const [currentKey, ...restKeys] = keys;
    
            if (!restKeys.length) {
                // If no more keys left, update the value directly
                return { ...prev, [currentKey]: type === 'select-multiple' ? [newValue] : newValue };
            }
    
            // Continue updating nested properties
            return {
                ...prev,
                [currentKey]: updateNestedProperty(prev[currentKey] || {}, restKeys, newValue),
            };
        };
    
        const updatedFormData = updateNestedProperty(formData, name.split('.'), value);
    
        setFormData(updatedFormData);
    };
    

    // handle changing threw data fields
    const handleTabChange = (tab) => {
        setActiveTab(tab);
    };

    console.log("FormData: ", formData);

    // Data Fields ------------------------
    const renderGeneralSection = () => (
        <>
        <div className={styles1.section}>
            <h2>Titles</h2>
            <div className={styles1.grid}>
            <div>
                <label htmlFor="titles.romaji">Romaji</label>
                <div></div>
                <input
                type="text"
                id="titles.romaji"
                name="titles.romaji"
                value={formData.titles.romaji}
                onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="titles.english">English</label>
                <div></div>
                <input
                type="text"
                id="titles.english"
                name="titles.english"
                value={formData.titles.english}
                onChange={handleChange}
                required
                />
            </div>
            <div>
                <label htmlFor="titles.Native">Native</label>
                <div></div>
                <input
                type="text"
                id="titles.Native"
                name="titles.Native"
                value={formData.titles.Native}
                onChange={handleChange}
                />
            </div>
            </div>
        </div>

        <div className={styles1.section}>
            <h2>Release Data</h2>
            <div className={styles1.grid}>
                <div>
                    <label htmlFor="releaseData.releaseStatus">Release Status</label>
                    <select
                        id="releaseData.releaseStatus"
                        name="releaseData.releaseStatus"
                        value={formData.releaseData.releaseStatus}
                        onChange={handleChange}
                    >
                        <option value="" disabled>Select Status</option>
                        {availableStatus.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles1.grid} style={{ marginTop: '1rem' }}>
                <div>
                    <label>Start Date</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                        <input
                            type="number"
                            id="releaseData.startDate.year"
                            name="releaseData.startDate.year"
                            placeholder="YYYY"
                            value={formData.releaseData.startDate.year}
                            onChange={handleChange}
                            min="1900"
                            max="2099"
                        />
                        <input
                            type="number"
                            id="releaseData.startDate.month"
                            name="releaseData.startDate.month"
                            placeholder="MM"
                            value={formData.releaseData.startDate.month}
                            onChange={handleChange}
                            min="1"
                            max="12"
                        />
                        <input
                            type="number"
                            id="releaseData.startDate.day"
                            name="releaseData.startDate.day"
                            placeholder="DD"
                            value={formData.releaseData.startDate.day}
                            onChange={handleChange}
                            min="1"
                            max="31"
                        />
                    </div>
                </div>
                <div>
                    <label>End Date</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '8px' }}>
                        <input
                            type="number"
                            id="releaseData.endDate.year"
                            name="releaseData.endDate.year"
                            placeholder="YYYY"
                            value={formData.releaseData.endDate.year}
                            onChange={handleChange}
                            min="1900"
                            max="2099"
                        />
                        <input
                            type="number"
                            id="releaseData.endDate.month"
                            name="releaseData.endDate.month"
                            placeholder="MM"
                            value={formData.releaseData.endDate.month}
                            onChange={handleChange}
                            min="1"
                            max="12"
                        />
                        <input
                            type="number"
                            id="releaseData.endDate.day"
                            name="releaseData.endDate.day"
                            placeholder="DD"
                            value={formData.releaseData.endDate.day}
                            onChange={handleChange}
                            min="1"
                            max="31"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className={styles1.section}>
            <h2>Typing</h2>
            <div className={styles1.grid}>
            <div>
                <label htmlFor="typings.Format">Format:</label>
                <div></div>
                <select
                type="typings.Format"
                id="typings.Format"
                name="typings.Format"
                value={formData.typings.Format}
                onChange={(handleChange)}
                >
                <option value="" disabled>Select Format</option>
                {availableFormats.map((format) => (
                    <option key={format} value={format}>
                    {format}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="typings.Source">Source:</label>
                <div></div>
                <select
                type="typings.Source"
                id="typings.Source"
                name="typings.Source"
                value={formData.typings.Source}
                onChange={handleChange}
                >
                <option value="" disabled>Select Source</option>
                {availableSource.map((source) => (
                    <option key={source} value={source}>
                    {source}
                    </option>
                ))}
                </select>
            </div>
            <div>
                <label htmlFor="typings.CountryOfOrigin">Country of Origin:</label>
                <div></div>
                <select
                type="typings.CountryOfOrigin"
                id="typings.CountryOfOrigin"
                name="typings.CountryOfOrigin"
                value={formData.typings.CountryOfOrigin}
                onChange={(handleChange)}
                >
                <option value="" disabled>Select Country</option>
                {availableCountry.map((country) => (
                    <option key={country} value={country}>
                    {country}
                    </option>
                ))}
                </select>
            </div>
            </div>
        </div>

        <div className={styles1.section}>   
            <h2>Lengths</h2>
            <div className={styles1.grid}>
            <div>
                <label htmlFor="lengths.chapters">Chapters:</label>
                <div></div>
                <input
                type="number"
                id="lengths.chapters"
                name="lengths.chapters"
                value={formData.lengths.chapters}
                onChange={handleChange}
                />
            </div>
            <div>
                <label htmlFor="lengths.volumes">Volumes:</label>
                <div></div>
                <input
                type="number"
                id="lengths.volumes"
                name="lengths.volumes"
                value={formData.lengths.volumes}
                onChange={handleChange}
                />
            </div>
            </div>
        </div>

        <div className={styles1.section}>
            <h2>Genres</h2>
            <div className={styles1.grid}>
                <div>
                    <label htmlFor="genres">Genres:</label>
                    <div></div>
                    <select
                        id="genres"
                        name="genres"
                        multiple
                        value={selectedGenres}
                        onChange={(e) => handleGenreChange(e.target.value)}
                    >
                        {availableGenres.map((genre) => (
                            <option key={genre} value={genre}>
                                {genre}
                            </option>
                        ))}
                    </select>
                    <div className={styles1.selectedGenres}>
                        {selectedGenres.map((genre) => (
                            <div key={genre} className={styles1.selectedGenre}>
                                {genre}
                                <button onClick={() => handleRemoveGenre(genre)}>x</button>
                            </div>
                        ))}
                    </div>
                    {formErrors.genres && <div className={styles1.errorMessage}>{formErrors.genres}</div>}
                </div>
            </div>
        </div>

        <div className={styles1.section}>
            <h2>Description</h2>
            <textarea 
            type="text"
            id="description"
            name="description"
            value={formData.description} 
            onChange={handleChange} 
            rows={4} 
            cols={80}></textarea>
        </div>
        </>
    );
    const renderImagesSection = () => (
        <>
        <div className={styles1.section}>
            <h2>Image</h2>
            <div className={styles1.images}>
            <label htmlFor="images.image">Image URL:</label>
            <input
                type="text"
                id="images.image"
                name="images.image"
                value={formData.images.image}
                onChange={handleChange}
            />
            {formData.images.image && (
                <div className={styles1.imagePreview}>
                <img src={formData.images.image} alt="Anime Preview" />
                </div>
            )}
            </div>
        </div>
        <div className={styles1.section}>
            <h2>Border</h2>
            <div className={styles1.border}>
            <label htmlFor="images.border">Border URL: </label>
            <input
                type="text"
                id="images.border"
                name="images.border"
                value={formData.images.border}
                onChange={handleChange}
            />
            {formData.images.border && (
                <div className={styles1.borderPreview}>
                <img src={formData.images.border} alt="Anime Preview" />
                </div>
            )}
            </div>
        </div>
        </>
    );
    const renderCharactersSection = () => (
        <>
        <div className={styles1.section}>
            <h2>Characters</h2>
            <div className={styles1.characterButton}>
                <button type="button" onClick={() => handleAddExistingCharacter()}>
                Add Existing Character
                </button>
                <button type="button" onClick={() => handleAddCharacter()}>
                Create Character
                </button>
            </div>
            <div className={styles1.characters}>
            {formData.characters.map((character, index) => (
                <div key={index} className={styles1.selectedCharacter}>
                    <img
                        src={character.characterImage}
                        alt={`Character ${index + 1}`}
                        className={styles1.selectedCharacterImage}
                    />
                    <div className={styles1.selectedCharacterInfo}>
                        <p>
                            {character.names &&
                            `${character.names.givenName || ''} ${character.names.middleName || ''} ${character.names.surName || ''}`}
                        </p>
                        <select
                            className={styles1.selectedCharacterRole}
                        value={character.role}
                        onChange={(e) => handleCharacterTypeChange(e, index)}
                        >
                        <option value="" disabled>Select Role</option>
                        {availableRole.map((role) => (
                        <option key={role} value={role}>
                            {role}
                        </option>
                        ))}
                    </select>
                </div>
                {/* Add a button to remove the character */}
                <button type="button" onClick={() => handleRemoveCharacter(index)}>
                    Remove
                </button>
                </div>
            ))}
            </div>
        </div>
        </>
    );
    const renderRelationsSection = () => (
        <>
            <div className={styles1.section}>
                <h2>Relations</h2>
                <div className={styles1.characterButton}>
                    <button type="button" onClick={() => handleAddRelation('anime')}>
                        Add Anime Relation
                    </button>
                    <button type="button" onClick={() => handleAddRelation('manga')}>
                        Add Manga Relation
                    </button>
                </div>
                <div className={styles1.characters}>
                    {formData.animeRelations.map((relation, index) => (
                        <div key={index} className={styles1.selectedCharacter}>
                            <img
                                src={relation.images.image}
                                alt={`Anime Relation ${index + 1}`}
                                className={styles1.selectedCharacterImage}
                            />
                            <div className={styles1.selectedCharacterInfo}>
                                <p className={styles1.selectedCharacterName}>
                                    {relation.titles.english || relation.titles.romaji || ''}
                                </p>
                                <select
                                    className={styles1.selectedCharacterRole}
                                    value={relation.typeofRelation}
                                    onChange={(e) => handleRelationTypeChange(e, 'anime', index)}
                                >
                                    <option value="" disabled>Select Relation</option>
                                    {availableRelation.map((relationType) => (
                                        <option key={relationType} value={relationType}>
                                            {relationType}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" onClick={() => handleRemoveRelation('anime', index)}>
                                Remove
                            </button>
                        </div>
                    ))}

                    {formData.mangaRelations.map((relation, index) => (
                        <div key={index} className={styles1.selectedCharacter}>
                            <img
                                src={relation.images.image}
                                alt={`Manga Relation ${index + 1}`}
                                className={styles1.selectedCharacterImage}
                            />
                            <div className={styles1.selectedCharacterInfo}>
                                <p className={styles1.selectedCharacterName}>
                                    {relation.titles.english || relation.titles.romaji || ''}
                                </p>
                                <select
                                    className={styles1.selectedCharacterRole}
                                    value={relation.typeofRelation}
                                    onChange={(e) => handleRelationTypeChange(e, 'manga', index)}
                                >
                                    <option value="" disabled>Select Relation</option>
                                    {availableRelation.map((relationType) => (
                                        <option key={relationType} value={relationType}>
                                            {relationType}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button type="button" onClick={() => handleRemoveRelation('manga', index)}>
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
    // ------------------------------------

    return (
        <div className={styles1.addAnimeContainer}>
        <div className={styles1.addAnimeContainerTabs}>
            <button className={styles1.addAnimeBtn} form="submitAnime" type="submit" >
            Submit
            </button>
            <button onClick={() => handleTabChange("general")}>General</button>
            <button onClick={() => handleTabChange("images")}>Images</button>
            <button onClick={() => handleTabChange("characters")}>Characters</button>
            <button onClick={() => handleTabChange("relations")}>Relations</button>
            {/* Add more buttons for additional tabs */}
        </div>

        <form className={styles1.formContainer} id="submitAnime"  onSubmit={handleSubmit}>
            {activeTab === "general" && renderGeneralSection()}
            {activeTab === "images" && renderImagesSection()}
            {activeTab === "characters" && renderCharactersSection()}
            {activeTab === "relations" && renderRelationsSection()}
        </form>

        {activeModal && (
            <div className={styles.characterModalOverlay} onClick={handleModalClose}>
            <div className={styles.characterModal} onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className={styles.characterModalHeader}>
                <h2>{
                    activeModal === 'createCharacter' 
                    ? 'Create Character' 
                    : activeModal === 'characterSearch'
                    ? 'Search Character'
                    : activeModal === 'animeRelationSearch'
                    ? 'Search Anime'
                    : activeModal === 'mangaRelationSearch'
                    ? 'Search Manga'
                    : ''
                    }
                </h2>
                <button className={styles.characterModalClose} onClick={handleModalClose}>
                    &times;
                </button>
                </div>
                {/* Modal Body */}
                <div className={styles.characterModalBody}>
                {/* Render the corresponding modal content based on activeModal state */}
                {activeModal === 'createCharacter' && (
                    <CreateCharacter
                    onCharacterCreated={handleAddingCharacter}
                    onClose={handleModalClose}
                    />
                )}
                {activeModal === 'characterSearch' && (
                    <CharacterSearch
                    onCharacterSelected={handleSelectExistingCharacter}
                    onClose={() => setActiveModal(null)}
                    />
                )}
                {activeModal === 'animeRelationSearch' && (
                    <RelationSearch
                    onRelationSelected={handleSelectRelation}
                    searchType={'anime'}
                    onClose={() => setActiveModal(null)}
                    />
                )}
                {activeModal === 'mangaRelationSearch' && (
                    <RelationSearch
                    onRelationSelected={handleSelectRelation}
                    searchType={'manga'}
                    onClose={() => setActiveModal(null)}
                    />
                )}
                </div>
            </div>
            </div>
        )}
        </div>
    );
};