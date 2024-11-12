// src/components/Update/UpdateManga.js

// #region Importing React and other dependencies --------------------------
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosInstance from '../../utils/axiosConfig';
import CreateCharacter from '../CreateCharacter';
import CharacterSearch from '../Searches/CharacterSearch';
import RelationSearch from '../Searches/RelationSearch';
import addPageStyles from '../../styles/pages/add_page.module.css';
// #endregion --------------------------------------------------------------

// #region Constants -------------------------------------------------------
const AVAILABLE_GENRES = [
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

const AVAILABLE_STATUS = [
  'Finished Releasing',
  'Currently Releasing',
  'Not Yet Released',
  'Cancelled',
  'Hiatus',
];

const AVAILABLE_FORMATS = [
  'Manga',
  'Light Novel',
  'One Shot',
];

const AVAILABLE_SOURCE = [
  'Original',
  'Manga',
  'Anime',
  'Light Novel',
  'Web Novel',
  'Novel',
  'Doujinshi',
  'Video Game',
  'Visual Novel',
  'Comic',
  'Game',
  'Live Action',
  'Multimedia Project',
  'Picture Book',
  'Other',
];

const AVAILABLE_COUNTRY = [
  'China',
  'Japan',
  'South Korea',
  'Taiwan',
];

const AVAILABLE_ROLE = [
  'Main',
  'Supporting',
  'Background',
];

const AVAILABLE_RELATION = [
  'Adaptation',
  'Source',
  'Prequel',
  'Sequel',
  'Side Story',
  'Character',
  'Summary',
  'Alternative',
  'Spin Off',
  'Other',
  'Compilations',
  'Contains',
];
// #endregion --------------------------------------------------------------

// #region Initial Form State ----------------------------------------------
const INITIAL_FORM_STATE = {
  titles: {
    romaji: '',
    english: '',
    Native: '',
  },
  releaseData: {
    releaseStatus: '',
    startDate: {
      year: '',
      month: '',
      day: '',
    },
    endDate: {
      year: '',
      month: '',
      day: '',
    },
  },
  typings: {
    Format: '',
    Source: '',
    CountryOfOrigin: '',
  },
  lengths: {
    chapters: '',
    volumes: '',
  },
  genres: [],
  description: '',
  images: {
    image: '',
    border: '',
  },
  characters: [],
  mangaRelations: [],
  animeRelations: [],
  activityTimestamp: 0,
};
// #endregion --------------------------------------------------------------

export const UpdateManga = ({ match }) => {
  // #region State Management ----------------------------------------------
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState('general');
  const [formErrors, setFormErrors] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  // #endregion ------------------------------------------------------------

  // #region Retrieve information ------------------------------------------
  useEffect(() => {
    const fetchData = async () => {
      try {
        const mangaResponse = await axiosInstance.get(
          `/mangas/manga/${id}`
        );
        const { genres, ...mangaData } = mangaResponse.data;

        // Extract genre values from the genres array
        const genreValues = Array.isArray(genres)
          ? genres.map((genre) =>
              typeof genre === 'object' ? genre.genre : genre
            )
          : [];

        setFormData((prevData) => ({
          ...prevData,
          ...mangaData,
          genres: genreValues,
        }));
        setSelectedGenres(genreValues);

        const charactersWithDetails = await Promise.all(
          mangaData?.characters.map(async (character) => {
            try {
              const characterResponse = await axiosInstance.get(
                `http://localhost:8080/characters/character/${character.characterId}`
              );
              return {
                ...character,
                ...characterResponse.data, // Merge character details here
              };
            } catch (error) {
              console.error(
                `Error fetching details for character ${character.characterId}:`,
                error
              );
              return character; // Return the character without details in case of an error
            }
          }) || []
        );

        const animeRelationsWithDetails = await Promise.all(
          mangaData?.animeRelations.map(async (relation) => {
            try {
              const referenceResponse = await axiosInstance.get(
                `http://localhost:8080/animes/anime/${relation.relationId}`
              );
              return {
                ...relation,
                ...referenceResponse.data,
              };
            } catch (error) {
              console.error(
                `Error fetching details for reference ${relation.relationId}:`,
                error
              );
              return relation;
            }
          }) || []
        );

        const mangaRelationsWithDetails = await Promise.all(
          mangaData?.mangaRelations.map(async (relation) => {
            try {
              const referenceResponse = await axiosInstance.get(
                `http://localhost:8080/mangas/manga/${relation.relationId}`
              );
              return {
                ...relation,
                ...referenceResponse.data,
              };
            } catch (error) {
              console.error(
                `Error fetching details for reference ${relation.relationId}:`,
                error
              );
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
  // #endregion ------------------------------------------------------------

  // #region Modal Handlers ------------------------------------------------
  const handleModalClose = () => {
    setActiveModal(null);
  };
  // #endregion ------------------------------------------------------------

  // #region Relation Handlers ---------------------------------------------
  const handleAddRelation = (type) => {
    setActiveModal(`${type}RelationSearch`);
  };

  const handleSelectRelation = (type, selectedRelations) => {
    const relationsWithDefaultRelation = selectedRelations.map((relation) => ({
      ...relation,
      typeofRelation: '',
    }));
    setFormData((prevFormData) => ({
      ...prevFormData,
      [`${type}Relations`]: [
        ...prevFormData[`${type}Relations`],
        ...relationsWithDefaultRelation,
      ],
    }));
  };

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
  // #endregion ------------------------------------------------------------

  // #region Form Change Handlers ------------------------------------------
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    const updateNestedProperty = (prev, keys, newValue) => {
      const [currentKey, ...restKeys] = keys;

      if (!restKeys.length) {
        // If no more keys left, update the value directly
        return {
          ...prev,
          [currentKey]: type === 'select-multiple' ? [newValue] : newValue,
        };
      }

      // Continue updating nested properties
      return {
        ...prev,
        [currentKey]: updateNestedProperty(
          prev[currentKey] || {},
          restKeys,
          newValue
        ),
      };
    };

    const updatedFormData = updateNestedProperty(
      formData,
      name.split('.'),
      value
    );

    setFormData(updatedFormData);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  // #endregion ------------------------------------------------------------

  // #region Character Handlers --------------------------------------------
  const handleAddExistingCharacter = () => {
    setActiveModal('characterSearch');
  };

  const handleSelectExistingCharacter = (selectedCharacters) => {
    const charactersWithDefaultRole = selectedCharacters.map((character) => ({
      ...character,
      role: '', // Set the default role to an empty string
    }));
    setFormData((prevFormData) => ({
      ...prevFormData,
      characters: [...prevFormData.characters, ...charactersWithDefaultRole],
    }));
  };

  const handleCharacterTypeChange = (e, index) => {
    const newType = e.target.value;
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

  const handleAddCharacter = () => {
    setActiveModal('createCharacter');
  };

  const handleAddingCharacter = (selectedCharacter) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      characters: [
        ...prevFormData.characters,
        { ...selectedCharacter, role: '' },
      ],
    }));
  };
  // #endregion ------------------------------------------------------------

  // #region Genre Related -------------------------------------------------
  const handleGenreChange = (selectedGenre) => {
    setSelectedGenres((prevGenres) => {
      let updatedGenres;
      if (prevGenres.includes(selectedGenre)) {
        // If genre is already selected, remove it
        updatedGenres = prevGenres.filter((genre) => genre !== selectedGenre);
      } else {
        // If genre is not selected, add it 
        updatedGenres = [...prevGenres, selectedGenre];
      }

      // Update genres in formData
      setFormData((prevData) => ({
        ...prevData,
        genres: updatedGenres,
      }));

      return updatedGenres;
    });
  };
  // #endregion ------------------------------------------------------------

  // #region Form Submission -----------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    setFormErrors(errors);

    if (Object.keys(formErrors).length > 0) {
      alert(formErrors.data.message);
      return;
    }

    const charactersArray = formData.characters.map((character) => ({
      characterId: character._id,
      role: character.role,
    }));

    const animeRelationsArray = formData.animeRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    const mangaRelationsArray = formData.mangaRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    const updatedFormData = {
      ...formData,
      characters: charactersArray,
      animeRelations: animeRelationsArray,
      mangaRelations: mangaRelationsArray,
    };

    try {
      console.log('Current formData:', updatedFormData);

      const res = await axiosInstance.put(
        `/mangas/manga/${id}`,
        updatedFormData
      );

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
  // #endregion ------------------------------------------------------------

  //--------------------------- Data Fields --------------------------------

  // #region General Section -----------------------------------------------
  const renderGeneralSection = () => (
    <>
      <div className={addPageStyles.section}>
        <h2>Titles</h2>
        <div className={addPageStyles.grid}>
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

      <div className={addPageStyles.section}>
        <h2>Release Data</h2>
        <div className={addPageStyles.grid}>
          <div>
            <label htmlFor="releaseData.releaseStatus">Release Status</label>
            <select
              id="releaseData.releaseStatus"
              name="releaseData.releaseStatus"
              value={formData.releaseData.releaseStatus}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Status
              </option>
              {AVAILABLE_STATUS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={addPageStyles.grid}>
          <div>
            <label>Start Date</label>
            <div className={addPageStyles.dateGrid}>
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
            <div className={addPageStyles.dateGrid}>
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

      <div className={addPageStyles.section}>
        <h2>Typing</h2>
        <div className={addPageStyles.grid}>
          <div>
            <label htmlFor="typings.Format">Format:</label>
            <div></div>
            <select
              type="typings.Format"
              id="typings.Format"
              name="typings.Format"
              value={formData.typings.Format}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Format
              </option>
              {AVAILABLE_FORMATS.map((format) => (
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
              <option value="" disabled>
                Select Source
              </option>
              {AVAILABLE_SOURCE.map((source) => (
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
              onChange={handleChange}
            >
              <option value="" disabled>
                Select Country
              </option>
              {AVAILABLE_COUNTRY.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className={addPageStyles.section}>
        <h2>Lengths</h2>
        <div className={addPageStyles.grid}>
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

      <div className={addPageStyles.section}>
        <h2>Genres</h2>
        <div className={addPageStyles.genreContainer}>
          <div className={addPageStyles.genreSelection}>
            {AVAILABLE_GENRES.map((genre) => (
              <div
                key={genre}
                className={`${addPageStyles.genreOption} ${
                  selectedGenres.includes(genre) ? addPageStyles.selected : ''
                }`}
                onClick={() => handleGenreChange(genre)}
              >
                {genre}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={addPageStyles.section}>
        <h2>Description</h2>
        <textarea
          type="text"
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={4}
          cols={80}
        ></textarea>
      </div>
    </>
  );
  // #endregion ------------------------------------------------------------

  // #region Images Section ------------------------------------------------
  const renderImagesSection = () => (
    <>
      <div className={addPageStyles.section}>
        <h2>Image</h2>
        <div className={addPageStyles.images}>
          <label htmlFor="images.image">Image URL:</label>
          <input
            type="text"
            id="images.image"
            name="images.image"
            value={formData.images.image}
            onChange={handleChange}
          />
          {formData.images.image && (
            <div className={addPageStyles.imagePreview}>
              <img src={formData.images.image} alt="Anime Preview" />
            </div>
          )}
        </div>
      </div>

      <div className={addPageStyles.section}>
        <h2>Border</h2>
        <div className={addPageStyles.border}>
          <label htmlFor="images.border">Border URL: </label>
          <input
            type="text"
            id="images.border"
            name="images.border"
            value={formData.images.border}
            onChange={handleChange}
          />
          {formData.images.border && (
            <div className={addPageStyles.borderPreview}>
              <img src={formData.images.border} alt="Anime Preview" />
            </div>
          )}
        </div>
      </div>
    </>
  );
  // #endregion ------------------------------------------------------------

  // #region Characters Section --------------------------------------------
  const renderCharactersSection = () => (
    <>
      <div className={addPageStyles.section}>
        <h2>Characters</h2>
        <div className={addPageStyles.characterButton}>
          <button type="button" onClick={() => handleAddExistingCharacter()}>
            Add Existing Character
          </button>
          <button type="button" onClick={() => handleAddCharacter()}>
            Create Character
          </button>
        </div>
        <div className={addPageStyles.characters}>
          {formData.characters.map((character, index) => (
            <div key={index} className={addPageStyles.selectedCharacter}>
              <img
                src={character.characterImage}
                alt={`Character ${index + 1}`}
                className={addPageStyles.selectedCharacterImage}
              />
              <div className={addPageStyles.selectedCharacterInfo}>
                <p>
                  {character.names &&
                    `${character.names.givenName || ''} ${character.names.middleName || ''} ${character.names.surName || ''}`}
                </p>
                <select
                  className={addPageStyles.selectedCharacterRole}
                  value={character.role}
                  onChange={(e) => handleCharacterTypeChange(e, index)}
                >
                  <option value="" disabled>
                    Select Role
                  </option>
                  {AVAILABLE_ROLE.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              {/* Add a button to remove the character */}
              <button
                type="button"
                onClick={() => handleRemoveCharacter(index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  // #endregion ------------------------------------------------------------

  // #region Relations Section ---------------------------------------------
  const renderRelationsSection = () => (
    <>
      <div className={addPageStyles.section}>
        <h2>Relations</h2>
        <div className={addPageStyles.characterButton}>
          <button type="button" onClick={() => handleAddRelation('anime')}>
            Add Anime Relation
          </button>
          <button type="button" onClick={() => handleAddRelation('manga')}>
            Add Manga Relation
          </button>
        </div>
        <div className={addPageStyles.characters}>
          {formData.animeRelations.map((relation, index) => (
            <div key={index} className={addPageStyles.selectedCharacter}>
              <img
                src={relation.images.image}
                alt={`Anime Relation ${index + 1}`}
                className={addPageStyles.selectedCharacterImage}
              />
              <div className={addPageStyles.selectedCharacterInfo}>
                <p className={addPageStyles.selectedCharacterName}>
                  {relation.titles.english || relation.titles.romaji || ''}
                </p>
                <select
                  className={addPageStyles.selectedCharacterRole}
                  value={relation.typeofRelation}
                  onChange={(e) => handleRelationTypeChange(e, 'anime', index)}
                >
                  <option value="" disabled>
                    Select Relation
                  </option>
                  {AVAILABLE_RELATION.map((relationType) => (
                    <option key={relationType} value={relationType}>
                      {relationType}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRelation('anime', index)}
              >
                Remove
              </button>
            </div>
          ))}

          {formData.mangaRelations.map((relation, index) => (
            <div key={index} className={addPageStyles.selectedCharacter}>
              <img
                src={relation.images.image}
                alt={`Manga Relation ${index + 1}`}
                className={addPageStyles.selectedCharacterImage}
              />
              <div className={addPageStyles.selectedCharacterInfo}>
                <p className={addPageStyles.selectedCharacterName}>
                  {relation.titles.english || relation.titles.romaji || ''}
                </p>
                <select
                  className={addPageStyles.selectedCharacterRole}
                  value={relation.typeofRelation}
                  onChange={(e) => handleRelationTypeChange(e, 'manga', index)}
                >
                  <option value="" disabled>
                    Select Relation
                  </option>
                  {AVAILABLE_RELATION.map((relationType) => (
                    <option key={relationType} value={relationType}>
                      {relationType}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRelation('manga', index)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
  // #endregion ------------------------------------------------------------

  console.log('form data: ', formData);

  // #region Submit Section -------------------------------------------------
  return (
    <div className={addPageStyles.addContainer}>
      <div className={addPageStyles.leftSideContainer}>
        <div className={addPageStyles.submitSection}>
          <button
            className={addPageStyles.submitButton}
            form="submitManga"
            type="submit"
          >
            Submit
          </button>
        </div>

        <div className={addPageStyles.addAnimeContainerTabs}>
          <button
            className={activeTab === 'general' ? addPageStyles.active : ''}
            onClick={() => handleTabChange('general')}
          >
            General
          </button>
          <button
            className={activeTab === 'images' ? addPageStyles.active : ''}
            onClick={() => handleTabChange('images')}
          >
            Images
          </button>
          <button
            className={activeTab === 'characters' ? addPageStyles.active : ''}
            onClick={() => handleTabChange('characters')}
          >
            Characters
          </button>
          <button
            className={activeTab === 'relations' ? addPageStyles.active : ''}
            onClick={() => handleTabChange('relations')}
          >
            Relations
          </button>
        </div>
      </div>

      <form
        className={addPageStyles.formContainer}
        id="submitManga"
        onSubmit={handleSubmit}
      >
        {activeTab === 'general' && renderGeneralSection()}
        {activeTab === 'images' && renderImagesSection()}
        {activeTab === 'characters' && renderCharactersSection()}
        {activeTab === 'relations' && renderRelationsSection()}
      </form>

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
  );
  // #endregion ------------------------------------------------------------
};
