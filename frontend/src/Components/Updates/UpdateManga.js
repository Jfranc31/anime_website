// src/components/Update/UpdateManga.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CreateCharacter from "../CreateCharacter";
import CharacterSearch from '../Searches/CharacterSearch';
import RelationSearch from '../Searches/RelationSearch';
import axios from 'axios';

export const UpdateManga = ({ match }) => {
    const { id } = useParams();
    const navigate = useNavigate();
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

    // Create Charater ------------------------------
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
        if (!selectedGenres.includes(selectedGenre)) {
            setSelectedGenres((prevGenres) => [...prevGenres, selectedGenre]);

            // Set the selected genres directly in the formData
            setFormData((prevData) => ({
                ...prevData,
                genres: [...prevData.genres, selectedGenre],
            }));
        }
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

    // Retrieve information
    useEffect(() => {
        const fetchData = async () => {
            try {
                const mangaResponse = await axios.get(`http://localhost:8080/mangas/manga/${id}`);
                const { genres, ...mangaData } = mangaResponse.data;
    
                // Extract genre values from the genres array
                const genreValues = Array.isArray(genres) ? genres.map(genre => (typeof genre === 'object' ? genre.genre : genre)) : [];
    
                setFormData(prevData => ({
                    ...prevData,
                    ...mangaData,
                    genres: genreValues,
                }));
                setSelectedGenres(genreValues);
    
                const charactersWithDetails = await Promise.all(
                    mangaData?.characters.map(async (character) => {
                        try {
                            const characterResponse = await axios.get(`http://localhost:8080/characters/character/${character.characterId}`);
                            return {
                                ...character,
                                ...characterResponse.data, // Merge character details here
                            };
                        } catch (error) {
                            console.error(`Error fetching details for character ${character.characterId}:`, error);
                            return character; // Return the character without details in case of an error
                        }
                    }) || []
                );

                const animeRelationsWithDetails = await Promise.all(
                    mangaData?.animeRelations.map(async (relation) => {
                        try {
                            const referenceResponse = await axios.get(`http://localhost:8080/animes/anime/${relation.relationId}`);
                            return {
                                ...relation,
                                ...referenceResponse.data,
                            };
                        } catch (error) {
                            console.error(`Error fetching details for reference ${relation.relationId}:`, error);
                            return relation;
                        }
                    }) || []
                );

                const mangaRelationsWithDetails = await Promise.all(
                    mangaData?.mangaRelations.map(async (relation) => {
                        try {
                            const referenceResponse = await axios.get(`http://localhost:8080/mangas/manga/${relation.relationId}`);
                            return {
                                ...relation,
                                ...referenceResponse.data,
                            };
                        } catch (error) {
                            console.error(`Error fetching details for reference ${relation.relationId}:`, error);
                            return relation;
                        }
                    }) || []
                );
    
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    characters: charactersWithDetails,
                    animeRelations: animeRelationsWithDetails,
                    mangaRelations: mangaRelationsWithDetails,
                }));
            } catch (error) {
                console.error('Error fetching anime details:', error);
            }
        };
    
        fetchData();
    }, [id]);

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

            const res = await axios.put(`http://localhost:8080/mangas/manga/${id}`, updatedFormData);

            console.log('Response from backend:', res.data);

            if (res.status === 200) {
                console.log('Manga and characters updated successfully!', res.data);
                
                navigate(`/manga/${id}`);
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

    // Data Fields ------------------------
    const renderGeneralSection = () => (
        <>
        <div className="section">
            <h2>Titles</h2>
            <div className="grid">
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

        <div className='section'>
            <h2>Release Data</h2>
            <div className='grid'>
                <div>
                    <label htmlFor="releaseData.releaseStatus">Release Status:</label>
                    <div></div>
                    <select
                    type="releaseData.releaseStatus"
                    id="releaseData.releaseStatus"
                    name="releaseData.releaseStatus"
                    value={formData.releaseData.releaseStatus}
                    onChange={(handleChange)}
                    >
                    <option value="" disabled>Select Status</option>
                    {availableStatus.map((status) => (
                        <option key={status} value={status}>
                            {status}
                        </option>
                    ))}
                    </select>
                </div>
                <div>
                    <h2>Release Date</h2>
                    <label htmlFor="releaseData.startDate.year">Year:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.startDate.year"
                    name="releaseData.startDate.year"
                    value={formData.releaseData.startDate.year}
                    onChange={handleChange}
                    />
                    <label htmlFor="releaseData.startDate.month">Month:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.startDate.month"
                    name="releaseData.startDate.month"
                    value={formData.releaseData.startDate.month}
                    onChange={handleChange}
                    />
                    <label htmlFor="releaseData.startDate.day">Day:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.startDate.day"
                    name="releaseData.startDate.day"
                    value={formData.releaseData.startDate.day}
                    onChange={handleChange}
                    />
                </div>
                <div>
                    <h2>End Date</h2>
                    <label htmlFor="releaseData.endDate.year">Year:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.endDate.year"
                    name="releaseData.endDate.year"
                    value={formData.releaseData.endDate.year}
                    onChange={handleChange}
                    />
                    <label htmlFor="releaseData.endDate.month">Month:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.endDate.month"
                    name="releaseData.endDate.month"
                    value={formData.releaseData.endDate.month}
                    onChange={handleChange}
                    />
                    <label htmlFor="releaseData.endDate.day">Day:</label>
                    <div></div>
                    <input
                    type="text"
                    id="releaseData.endDate.day"
                    name="releaseData.endDate.day"
                    value={formData.releaseData.endDate.day}
                    onChange={handleChange}
                    />
                </div>
            </div>
        </div>

        <div className="section">
            <h2>Typing</h2>
            <div className="grid">
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

        <div className="section">
            <h2>Lengths</h2>
            <div className="grid">
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

        <div className="section">
            <h2>Genres</h2>
            <div className="grid">
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
                    <div className="selected-genres">
                        {selectedGenres.map((genre) => (
                            <div key={genre} className="selected-genre">
                                {genre}
                                <button onClick={() => handleRemoveGenre(genre)}>x</button>
                            </div>
                        ))}
                    </div>
                    {formErrors.genres && <div className="error-message">{formErrors.genres}</div>}
                </div>
            </div>
        </div>

        <div className="section">
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
        <div className="section">
            <h2>Image</h2>
            <div className="images">
            <label htmlFor="images.image">Image URL:</label>
            <input
                type="text"
                id="images.image"
                name="images.image"
                value={formData.images.image}
                onChange={handleChange}
            />
            {formData.images.image && (
                <div className="image-preview">
                <img src={formData.images.image} alt="Anime Preview" />
                </div>
            )}
            </div>
        </div>
        <div className="section">
            <h2>Border</h2>
            <div className="border">
            <label htmlFor="images.border">Border URL: </label>
            <input
                type="text"
                id="images.border"
                name="images.border"
                value={formData.images.border}
                onChange={handleChange}
            />
            {formData.images.border && (
                <div className="border-preview">
                <img src={formData.images.border} alt="Anime Preview" />
                </div>
            )}
            </div>
        </div>
        </>
    );
    const renderCharactersSection = () => (
        <>
        <div className="section">
            <h2>Characters</h2>
            <div className='character-button'>
                <button type="button" onClick={() => handleAddExistingCharacter()}>
                Add Existing Character
                </button>
                <button type="button" onClick={() => handleAddCharacter()}>
                Create Character
                </button>
            </div>
            <div className="characters">
            {formData.characters.map((character, index) => (
                <div key={index} className="character">
                {/* Display character information here */}
                <div className="character-info">
                    {/* Add a small circular image of the character here */}
                    <img
                    src={character.characterImage}
                    alt={`Character ${index + 1}`}
                    className="character-image"
                    />
                    <div className="character-details">
                    <p>
                        {character.names &&
                        `${character.names.givenName || ''} ${character.names.middleName || ''} ${character.names.surName || ''}`}
                    </p>
                    <label htmlFor={`characterType-${index}`}>Type:</label>
                    <select
                        id={`characterType-${index}`}
                        name={`characterType-${index}`}
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
            <div className="section">
                <h2>Relations</h2>
                <div className="character-button">
                    <button type="button" onClick={() => handleAddRelation('anime')}>
                        Add Anime Relation
                    </button>
                    <button type="button" onClick={() => handleAddRelation('manga')}>
                        Add Manga Relation
                    </button>
                </div>
                <div className="characters">
                    {formData.animeRelations.map((relation, index) => (
                        <div key={index} className="character">
                            <div className="character-info">
                                <img
                                    src={relation.images.image}
                                    alt={`Anime Relation ${index + 1}`}
                                    className="character-image"
                                />
                                <div className="character-details">
                                    <p>
                                        {relation.titles &&
                                            `${relation.titles.english || ''}`}
                                    </p>
                                    <label htmlFor={`animeRelationType-${index}`}>Type:</label>
                                    <select
                                        id={`animeRelationType-${index}`}
                                        name={`animeRelationType-${index}`}
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
                            </div>
                            <button type="button" onClick={() => handleRemoveRelation('anime', index)}>
                                Remove
                            </button>
                        </div>
                    ))}
                    {formData.mangaRelations.map((relation, index) => (
                        <div key={index} className="character">
                            <div className="character-info">
                                <img
                                    src={relation.images.image}
                                    alt={`Manga Relation ${index + 1}`}
                                    className="character-image"
                                />
                                <div className="character-details">
                                    <p>
                                        {relation.titles &&
                                            `${relation.titles.english || ''}`}
                                    </p>
                                    <label htmlFor={`mangaRelationType-${index}`}>Type:</label>
                                    <select
                                        id={`mangaRelationType-${index}`}
                                        name={`mangaRelationType-${index}`}
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

    console.log("form data: ", formData);

    return (
        <div className="add-anime-container">
        <div className="add-anime-container-tabs">
            <button className="add-anime-btn" form="submitAnime" type="submit" >
            Submit
            </button>
            <button onClick={() => handleTabChange("general")}>General</button>
            <button onClick={() => handleTabChange("images")}>Images</button>
            <button onClick={() => handleTabChange("characters")}>Characters</button>
            <button onClick={() => handleTabChange("relations")}>Relations</button>
            {/* Add more buttons for additional tabs */}
        </div>

        <form className="form-container" id="submitAnime"  onSubmit={handleSubmit}>
            {activeTab === "general" && renderGeneralSection()}
            {activeTab === "images" && renderImagesSection()}
            {activeTab === "characters" && renderCharactersSection()}
            {activeTab === "relations" && renderRelationsSection()}
        </form>

        {activeModal && (
            <div className="character-modal-overlay" onClick={handleModalClose}>
            <div className="character-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="character-modal-header">
                <h2>
                    {
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
                <button className="character-modal-close" onClick={handleModalClose}>
                    &times;
                </button>
                </div>
                {/* Modal Body */}
                <div className="character-modal-body">
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
}