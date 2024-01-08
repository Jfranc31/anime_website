// src/components/AddAnime.js

import React, { useState } from "react";
import axios from 'axios';
import CreateCharacter from "../Components/CreateCharacter";
import CharacterSearch from "../Components/Searches/CharacterSearch";
import RelationSearch from "../Components/Searches/RelationSearch";

export default function AddAnime() {
  // Initialize state for form data
  const [formData, setFormData] = useState({
    titles: {
      romaji: "",
      english: "",
      Native: ""
    },
    typings: {
        Format: "",
        Source: "",
        CountryOfOrigin: ""
    },
    lengths: {
        Episodes: 0,
        EpisodeDuration: 0
    },
    genres: [],
    description: "",
    images: {
        image: "",
        border: ""
    },
    characters: [],
    relations: [],
    activityTimestamp: 0,
  });

  

  const [activeTab, setActiveTab] = useState("general");
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [showCharacterSearch, setShowCharacterSearch] = useState();
  
  const availableGenres = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Hentai", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
  const availableFormats = ['TV', "TV Short", "Movie", "Special", "OVA", "ONA", "Music"];
  const availableSource = ["Original", "Manga", "Anime", "Light Novel", "Web Novel", "Novel", "Doujinshi", "Video Game", "Visula Novel", "Comic", "Game", "Live Action"];
  const availableCountry = ["China", "Japan", "South Korea", "Taiwan"];
  const availableRole = ["Main", "Supporting", "Background"];
  const availableRelation = ["Adaptation", "Source", "Prequel", "Sequel", "Side Story", "Character", "Summary", "Alternative", "Spin Off", "Other", "Compilations", "Contains"];

 

  const handleModalClose = () => {
    setActiveModal(null);
    setShowModal(false);
    setShowCharacterSearch(false);
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
    setShowCharacterSearch(false);
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
const handleRelationTypeChange = (e, index) => {
  const newType = e.target.value;
  updateRelationType(index, newType);
};
const updateRelationType = (index, newType) => {
  setFormData((prevFormData) => {
    const updatedRelations = [...prevFormData.relations];
    updatedRelations[index].typeofRelation = newType;
    return {
      ...prevFormData,
      relations: updatedRelations,
    };
  });
};
const handleRemoveRelation = (index) => {};
// ---------------------------------------------------------------
  
// Relation ------------------------------------------------------
const handleAddRelation = () => {
  setActiveModal('relationSearch');
}
const handleSelectRelation = (selectedRelations) => {
  const relationsWithDefaultRelation = selectedRelations.map((relation) => ({
    ...relation,
    typeofRelation: "",
  }));
  setFormData((prevFormData) => ({
    ...prevFormData,
    relations: [...prevFormData.relations, ...relationsWithDefaultRelation],
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
  
    setShowModal(false);
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
  
    // Basic form validation
    const errors = {};
  
    setFormErrors(errors);
  
    if (Object.keys(errors).length > 0) {
      alert(errors.data.message);
      return;
    }
  
    // Create an array of character objects with character and typeofCharacter properties
    const charactersArray = formData.characters.map((character) => ({
      characterId: character._id, // Assuming _id is the character ID
      role: character.role,
    }));

    const relationsArray = formData.relations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation
    }))
  
    // Create a new object with character array
    const updatedFormData = {
      ...formData,
      characters: charactersArray,
      relations: relationsArray
    };
  
    try {
      setIsLoading(true);
      console.log('Current formData:', updatedFormData);
  
      // Use axios.post to send the form data to your backend API endpoint
      const res = await axios.post('http://localhost:8080/addanime', updatedFormData);
  
      console.log('Response from backend:', res.data);
  
      if (res.status === 201) {
        // Redirect or perform additional actions on success
        console.log('Anime and characters added successfully!', res.data);
        // Clear the form after successful submission
        setFormData({
          titles: {
            romaji: "",
            english: "",
            Native: "",
          },
          typings: {
            Format: "",
            Source: "",
            CountryOfOrigin: "",
          },
          lengths: {
            Episodes: 0,
            EpisodeDuration: 0,
          },
          genres: [],
          description: "",
          images: {
            image: "",
            border: "",
          },
          characters: [],
          relations: [],
          activityTimestamp: 0,
          // Add more fields as needed based on the updated AnimeModel schema
        });
        setSelectedGenres([]);
        // You might want to redirect the user to a different page on success
      } else {
        // Handle errors from the backend
        console.error('Failed to add anime:', res.data);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during anime addition:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // handle change in form
  const handleChange = (e) => {
    const { name, value, type } = e.target;
  
    // Check if the changed field is part of the nested structure
    if (name.startsWith("titles.") || name.startsWith("typings.") || name.startsWith("lengths.") || name.startsWith("images.") || name.startsWith("DOB.")) {
      const [mainField, subField] = name.split(".");
  
      // Ensure that typings is an object with nested properties
      setFormData((prev) => ({
        ...prev,
        [mainField]: {
          ...prev[mainField],
          [subField]: type === 'select-multiple' ? [value] : value,
        },
      }));
    } else if (name.startsWith("characters.") || name.startsWith("relations.")) {
      const [mainField, subField] = name.split(".");
  
      setFormData((prev) => ({
        ...prev,
        characters: prev.characters.map((item, index) =>
          index.toString() === subField
            ? { ...item, [mainField]: type === 'select-multiple' ? [...item[mainField], value] : value }
            : item
        ),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'select-multiple' ? [value] : value,
      }));
    }
  };

  // handle changing threw data fields
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  console.log("FormData: ", formData);
  
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
            <label htmlFor="lengths.Episodes">Episodes:</label>
            <div></div>
            <input
              type="number"
              id="lengths.Episodes"
              name="lengths.Episodes"
              value={formData.lengths.Episodes}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="lengths.EpisodeDuration">Episode Duration:</label>
            <div></div>
            <input
              type="number"
              id="lengths.EpisodeDuration"
              name="lengths.EpisodeDuration"
              value={formData.lengths.EpisodeDuration}
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
              onChange={(e) => handleGenreChange((e.target.value))}
            >
              {availableGenres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
            <div className="selected-genres">
              {selectedGenres.map(genre => (
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
        <div className="grid">
          <textarea 
          type="text"
          id="description"
          name="description"
          value={formData.description} 
          onChange={handleChange} 
          rows={4} 
          cols={80}></textarea>
        </div>
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
          <button type="button" onClick={() => handleAddRelation()}>
            Add Relation
          </button>
        </div>
        <div className="characters">
          {formData.relations.map((relation, index) => (
            <div key={index} className="character">
              <div className="character-info">
                <img
                  src={relation.images.image}
                  alt={`Relation ${index + 1}`}
                  className="character-image"
                />
                <div className="character-details">
                  <p>
                    {relation.titles &&
                      `${relation.titles.english || ''}`}
                  </p>
                  <label htmlFor={`relationType-${index}`}>Type:</label>
                  <select
                    id={`relationType-${index}`}
                    name={`relationType-${index}`}
                    value={relation.typeofRelation}
                    onChange={(e) => handleRelationTypeChange(e, index)}
                  >
                    <option value="" disabled>Select Relation</option>
                    {availableRelation.map((relation) => (
                      <option key={relation} value={relation}>
                        {relation}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button type="button" onClick={() => handleRemoveRelation(index)}>
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
              <h1>{activeModal === 'createCharacter' ? 'Create Character' : 'Search Character'}</h1>
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
              {activeModal === 'relationSearch' && (
                <RelationSearch
                  onRelationSelected={handleSelectRelation}
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
