// src/pages/AddAnime.js

// #region Importing React and other dependencies --------------------------
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import CreateCharacter from '../Components/CreateCharacter';
import CharacterSearch from '../Components/Searches/CharacterSearch';
import RelationSearch from '../Components/Searches/RelationSearch';
import addPageStyles from '../styles/pages/add_page.module.css';
import { AnimeSearch } from '../Components/Searches/AnimeSearch';
import { DEFAULT_BORDER } from '../constants/assets';
import Loader from '../constants/Loader';
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
  'TV',
  'TV Short',
  'Movie',
  'Special',
  'OVA',
  'ONA',
  'Music',
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
  'Parent',
  'Child',
  'Alternative',
  'Compilations',
  'Contains',
  'Other',
];
// #endregion --------------------------------------------------------------

// #region Initial Form State ----------------------------------------------
const INITIAL_FORM_STATE = {
  anilistId: '',
  nextEpisodeAiringAt: '',
  titles: {
    romaji: '',
    english: '',
    native: '',
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
    Episodes: '',
    EpisodeDuration: '',
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
  nextAiringEpisode: {
    airingAt: '',
    episode: '',
    timeUntilAiring: '',
  },
  activityTimestamp: '',
};
// #endregion --------------------------------------------------------------

let track = 0;

export default function AddAnime() {
  // #region State Management ----------------------------------------------
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState('general');
  const [formErrors, setFormErrors] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
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

  // #region Form Change Handlers -------------------------------------------
  const handleChange = (e) => {
    const { name, value, type } = e.target;

    const updateNestedProperty = (prev, keys, newValue) => {
      const [currentKey, ...restKeys] = keys;
      if (!restKeys.length) {
        return {
          ...prev,
          [currentKey]: type === 'select-multiple' ? [newValue] : newValue,
        };
      }
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

  // #region Character Handlers ---------------------------------------------
  const handleAddExistingCharacter = () => {
    setActiveModal('characterSearch');
  };

  const handleSelectExistingCharacter = (selectedCharacters) => {
    const charactersWithDefaultRole = selectedCharacters.map((character) => ({
      ...character,
      role: character.role || '',
      animeName: formData.titles
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
        {
          ...selectedCharacter,
          role: selectedCharacter.role || '',
          animeName: selectedCharacter.animes.map(anime => ({
            romaji: anime.titles.romaji || '',
            english: anime.titles.english || '',
            native: anime.titles.native || '',
          })),
        },
      ],
    }));
    console.log('selectedCharacter: ', selectedCharacter);
  };
  // #endregion ------------------------------------------------------------

  // #region Genre Related --------------------------------------------------
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

  const handleAddingAniListCharacters = async (anilistId) => {
    setIsLoadingCharacters(true);
    try {
      const response = await axiosInstance.get(`animes/searchCharacters/${anilistId}/ANIME`);

      const characters = response.data;
      const existingCharacters = [];
      const charactersToCreate = [];
      track = characters.length;

      console.log("characters: ", characters);

      // Separate characters into existing and new
      await Promise.all(characters.map(async (character) => {
        const characterId = character.node.id;

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 200)); // 200ms delay

        // Check if character exists in database
        const existingCharacterResponse = await axiosInstance.post('/characters/check-by-database', { anilistId: characterId });

        if (existingCharacterResponse.data === true) {
          // Fetch full character details
          const characterInfoResponse = await axiosInstance.get(`/characters/find-character/${characterId}`);

          // Capitalize first letter of role
          const formattedRole = character.role.charAt(0) + character.role.slice(1).toLowerCase();

          existingCharacters.push({
            ...characterInfoResponse.data,
            role: formattedRole
          });

        } else {
          // Characters not in database will be created
          charactersToCreate.push(character);
        }
      }));

      // Use existing handleSelectExistingCharacter method
      if (existingCharacters.length > 0) {
        handleSelectExistingCharacter(existingCharacters);
        track -= existingCharacters.length;
      }

      // Create new characters
      for (const characterToCreate of charactersToCreate) {

        await new Promise(resolve => setTimeout(resolve, 5000)); // Longer delay for new characters

        // Fetch full character details from AniList
        const characterDetailsResponse = await axiosInstance.get(`/characters/search/${characterToCreate.node.id}`);

        // Capitalize first letter of role
        const formattedRole = characterToCreate.role.charAt(0) + characterToCreate.role.slice(1).toLowerCase();

        const characterToAdd = {
          ...characterDetailsResponse.data,
          animes: [],
          mangas: []
        };

        console.log('Character being added:', characterToAdd);

        const res = await axiosInstance.post('/characters/addcharacter', characterToAdd)
          .catch((error) => {
            if (error.response?.data?.message === "This character is already registered") {
              console.log(`Skipping character ${characterToAdd.names?.givenName} as it is already registered.`);
            } else {
              throw error;
            }
          });

        if (res?.data) {
          const addCharacter = {
            ...res.data,
            role: formattedRole
          };

          // Use handleAddingCharacter for each new character
          handleAddingCharacter(addCharacter);
          track -= 1;
        }

        console.log('Number of characters left to add: ', track);
      }

    } catch (error) {
      console.error('Error adding characters: ', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error status:', error.response?.status);
      if (error.response?.data === "This character is already registered") {
        console.log(`Character with AniList ID ${anilistId} is already registered.`);
      }
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  const handleAnimeSelected = async (animeData) => {
    console.log('AddAnime - Received Data:', animeData);

    handleAddingAniListCharacters(animeData.anilistId);

    const updatedFormData = {
      anilistId: animeData.anilistId || '',
      nextEpisodeAiringAt: animeData.nextEpisodeAiringAt || '',
      titles: {
        romaji: animeData.titles?.romaji || '',
        english: animeData.titles?.english || '',
        native: animeData.titles?.native || ''
      },
      releaseData: {
        releaseStatus: animeData.releaseData?.releaseStatus || '',
        startDate: {
          year: animeData.releaseData?.startDate?.year || '',
          month: animeData.releaseData?.startDate?.month || '',
          day: animeData.releaseData?.startDate?.day || ''
        },
        endDate: {
          year: animeData.releaseData?.endDate?.year || '',
          month: animeData.releaseData?.endDate?.month || '',
          day: animeData.releaseData?.endDate?.day || ''
        }
      },
      typings: {
        Format: animeData.typings?.Format || '',
        Source: animeData.typings?.Source || '',
        CountryOfOrigin: animeData.typings?.CountryOfOrigin || ''
      },
      lengths: {
        Episodes: animeData.lengths?.Episodes || '',
        EpisodeDuration: animeData.lengths?.EpisodeDuration || ''
      },
      genres: animeData.genres || [],
      description: animeData.description || '',
      images: {
        image: animeData.images?.image || '',
        border: animeData.images?.border || DEFAULT_BORDER,
      },
      nextAiringEpisode: {
        airingAt: animeData.nextAiringEpisode?.airingAt || '',
        episode: animeData.nextAiringEpisode?.episode || '',
        timeUntilAiring: animeData.nextAiringEpisode?.timeUntilAiring || '',
      },
      characters: animeData.characters || [],
      animeRelations: animeData.animeRelations || [],
      mangaRelations: animeData.mangaRelations || [],
      activityTimestamp: animeData.activityTimestamp || ''
    };

    setSelectedGenres(updatedFormData.genres);

    console.log('AddAnime - Updated Form Data:', updatedFormData);
    setFormData(updatedFormData);
    setActiveModal(null);
  };

  // #region Form Submission ------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation
    const errors = {};

    setFormErrors(errors);

    if (Object.keys(formErrors).length > 0) {
      alert(formErrors.data.message);
      return;
    }

    // Create an array of character objects with character and typeofCharacter properties
    const charactersArray = formData.characters.map((character) => ({
      characterId: character._id, // Assuming _id is the character ID
      role: character.role,
      animeName: formData.titles
    }));

    const animeRelationsArray = formData.animeRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    const mangaRelationsArray = formData.mangaRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    // Create a new object with character array
    const updatedFormData = {
      ...formData,
      anilistId: formData.anilistId,
      nextEpisodeAiringAt: formData.nextEpisodeAiringAt,
      characters: charactersArray,
      animeRelations: animeRelationsArray,
      mangaRelations: mangaRelationsArray,
    };

    try {
      console.log('Current formData:', updatedFormData);

      // Use axios.post to send the form data to your backend API endpoint
      const res = await axiosInstance.post(
        '/animes/addanime',
        updatedFormData
      );

      console.log('Response from backend:', res.data);

      if (res.status === 201) {
        // Redirect or perform additional actions on success
        console.log('Anime and characters added successfully!', res.data);

        // Clear the form after successful submission
        setFormData(INITIAL_FORM_STATE);
        setSelectedGenres([]);

        // Redirect the user to the new anime page
        navigate(`/anime/${res.data._id}`);
      } else {
        // Handle errors from the backend
        console.error('Failed to add anime:', res.data);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during anime addition:', error.message);
    }
  };
  // #endregion ------------------------------------------------------------

  //---------------------------- Data Fields --------------------------------

  // #region General Section ------------------------------------------------
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
            />
          </div>
          <div>
            <label htmlFor="titles.native">Native</label>
            <div></div>
            <input
              type="text"
              id="titles.native"
              name="titles.native"
              value={formData.titles.native}
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
              placeholder="Select Status"
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
            <label htmlFor="releaseData.startDate.year">Start Date</label>
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
            <label htmlFor="releaseData.endDate.year">End Date</label>
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

      <div className={addPageStyles.section}>
        <h2>AniList ID</h2>
        <div className={addPageStyles.grid}>
          <div>
            <label htmlFor="anilistId">AniList ID:</label>
            <div></div>
            <input
              type="number"
              id="anilistId"
              name="anilistId"
              value={formData.anilistId}
              onChange={(e) => setFormData({ ...formData, anilistId: e.target.value })}
              placeholder="AniList ID"
            />
          </div>
        </div>
      </div>
    </>
  );
  // #endregion ------------------------------------------------------------

  // #region Images Section -------------------------------------------------
  const renderImagesSection = () => (
    <>
      <div className={addPageStyles.section}>
        <h2>Image</h2>
        <div className={addPageStyles.images}>
          <div>
            <label htmlFor="images.image">Image URL:</label>
            <div></div>
            <input
              type="text"
              id="images.image"
              name="images.image"
              value={formData.images.image}
              onChange={handleChange}
            />
          </div>
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

  // #region Characters Section ---------------------------------------------
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

        {/* Add loader here */}
        {isLoadingCharacters && (
          <div>
            <Loader text={`Adding characters... ${track} left to add`} />
          </div>
        )}

        <div className={addPageStyles.characters}>
          {formData.characters.map((character, index) => (
            <div key={index} className={addPageStyles.selectedCharacter}>
              <img
                src={character.characterImage}
                alt={`Character ${index + 1}`}
                className={addPageStyles.selectedCharacterImage}
              />
              <div className={addPageStyles.selectedCharacterInfo}>
                <p className={addPageStyles.selectedCharacterName}>
                  {character.names &&
                    `${character.names.givenName || ''} ${character.names.middleName || ''} ${character.names.surName || ''}`}
                </p>
                <select
                  className={addPageStyles.selectedCharacterRole}
                  id={`characterRole-${index}`} // Add a unique ID
                  name={`characterRole[${index}]`} // Add a name attribute
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

  // #region Relations Section ----------------------------------------------
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
                  {relation.titles.english || ''}
                </p>
                <select
                  id={`animeRole-${index}`}
                  name={`animeRole-${index}`}
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
                  {relation.titles.english || ''}
                </p>
                <select
                  id={`mangaRole-${index}`}
                  name={`mangaRole-${index}`}
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

  // #region Submit Section -------------------------------------------------
  return (
    <div className={addPageStyles.addContainer}>
      <div className={addPageStyles.leftSideContainer}>
        <div className={addPageStyles.submitSection}>
          <button
            className={addPageStyles.submitButton}
            form="submitAnime"
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

        <button
          type="button"
          className={addPageStyles.anilistButton}
          onClick={() => setActiveModal('animeSearch')}
        >
          Search on AniList
        </button>
      </div>

      <form
        className={addPageStyles.formContainer}
        id="submitAnime"
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
      {activeModal === 'animeSearch' && (
        <AnimeSearch
          onAnimeSelected={handleAnimeSelected}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
  // #endregion ------------------------------------------------------------
}
