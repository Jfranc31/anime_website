// src/components/AddManga.js

// #region Importing React and other dependencies --------------------------
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../utils/axiosConfig';
import CreateCharacter from '../Components/CreateCharacter';
import CharacterSearch from '../Components/Searches/CharacterSearch';
import RelationSearch from '../Components/Searches/RelationSearch';
import addPageStyles from '../styles/pages/add_page.module.css';
import { MangaSearch } from '../Components/Searches/MangaSearch';
import { DEFAULT_BORDER } from '../constants/assets';
import Loader from '../constants/Loader.js';
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
  'Parent',
  'Child',
  'Alternative',
  'Compilation',
  'Contains',
  'Other',
  'Character'
];

const RELATION_MAP = {
  "PREQUEL": "Prequel",
  "SEQUEL": "Sequel",
  "ADAPTATION": "Adaptation",
  "SOURCE": "Source",
  "PARENT": "Parent",
  "SIDE_STORY": "Child",
  "SUMMARY": "Child",
  "ALTERNATIVE": "Alternative",
  "SPIN_OFF": "Child",
  "OTHER": "Other",
  "COMPILATION": "Compilation",
  "CONTAINS": "Contains",
  "CHARACTER": "Character"
};
// #endregion --------------------------------------------------------------

// #region Initial Form State ----------------------------------------------
const INITIAL_FORM_STATE = {
  anilistId: '',
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
  activityTimestamp: '',
};
// #endregion --------------------------------------------------------------

export default function AddManga() {
  // #region State Management ----------------------------------------------
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [activeTab, setActiveTab] = useState('general');
  const [formErrors, setFormErrors] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [activeModal, setActiveModal] = useState(null);
  const [isLoadingCharacters, setIsLoadingCharacters] = useState(false);
  const [remainingCharacters, setRemainingCharacters] = useState(0);
  const [characterStatus, setCharacterStatus] = useState({
    total: 0,
    existing: 0,
    created: 0,
    failed: 0,
    details: []
  });
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

  // #region Character Handlers --------------------------------------------
  const handleAddExistingCharacter = () => {
    setActiveModal('characterSearch');
  };

  const handleSelectExistingCharacter = (selectedCharacters) => {
    const charactersWithDefaultRole = selectedCharacters.map((character) => ({
      ...character,
      role: character.role || '',
      mangaName: formData.titles
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
          mangaName: selectedCharacter.mangas.map(manga => ({
            romaji: manga.titles.romaji || '',
            english: manga.titles.english || '',
            native: manga.titles.native || '',
          }))
        },
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

  const handleAddingAniListCharacters = async (anilistId) => {
    setIsLoadingCharacters(true);
    let characters = [];
    try {
      const response = await axiosInstance.get(`mangas/searchCharacters/${anilistId}/MANGA`);
      characters = response.data;
      
      // Initialize status at the start
      setCharacterStatus({
        total: characters.length,
        existing: 0,
        created: 0,
        failed: 0,
        details: []
      });
      setRemainingCharacters(characters.length);

      for (const character of characters) {
        try {
          const existingCharacterResponse = await axiosInstance.post(`/characters/check-by-database`, {
            anilistId: character.node.id
          });

          if (existingCharacterResponse.data === true) {
            const characterInfoResponse = await axiosInstance.get(`/characters/find-character/${character.node.id}`);
            const formattedRole = character.role.charAt(0) + character.role.slice(1).toLowerCase();
            const existingCharacter = {
              ...characterInfoResponse.data,
              role: formattedRole,
              mangaName: formData.titles
            };

            handleSelectExistingCharacter([existingCharacter]);

            setCharacterStatus(prev => ({
              ...prev,
              existing: prev.existing + 1,
              details: [...prev.details, {
                id: characterInfoResponse.data._id,
                anilistId: character.node.id,
                name: `${characterInfoResponse.data.names?.givenName || ''} ${characterInfoResponse.data.names?.surName || ''}`,
                status: 'existing',
                role: formattedRole
              }]
            }));
          } else {
            // Character doesn't exist, create new
            await new Promise(resolve => setTimeout(resolve, 5000)); // Rate limiting

            const characterDetailsResponse = await axiosInstance.get(`/characters/search/${character.node.id}`)
              .catch(error => {
                if (error.response?.data?.message === "Character not found") {
                  return null;
                } else {
                  throw error;
                }
              });

            if (!characterDetailsResponse) {
              continue;
            }

            const formattedRole = character.role.charAt(0) + character.role.slice(1).toLowerCase();
            const characterToAdd = {
              ...characterDetailsResponse.data,
              animes: [],
              mangas: []
            };

            const res = await axiosInstance.post('/characters/addcharacter', characterToAdd);
            
            if (res?.data) {
              const addedCharacter = {
                ...res.data,
                role: formattedRole
              };

              handleAddingCharacter(addedCharacter);
              setCharacterStatus(prev => ({
                ...prev,
                created: prev.created + 1,
                details: [...prev.details, {
                  id: res.data._id,
                  anilistId: characterToAdd.anilistId,
                  name: `${characterToAdd.names?.givenName || ''} ${characterToAdd.names?.surName || ''}`,
                  status: 'created',
                  role: formattedRole,
                  timestamp: new Date().toISOString()
                }]
              }));
            }
          }
        } catch (error) {
          console.error('Error processing character:', error);
          setCharacterStatus(prev => ({
            ...prev,
            failed: prev.failed + 1,
            details: [...prev.details, {
              anilistId: character.node.id,
              status: 'failed',
              error: error.message,
              timestamp: new Date().toISOString()
            }]
          }));
        }
        setRemainingCharacters(prev => prev - 1);
      }

    } catch (error) {
      console.error('Error in character processing:', error);
      setCharacterStatus(prev => ({
        ...prev,
        failed: prev.failed + (characters?.length || 0),
        details: [...prev.details, {
          error: 'Batch processing failed: ' + error.message,
          timestamp: new Date().toISOString()
        }]
      }));
    } finally {
      setIsLoadingCharacters(false);
    }
  };

  const handleMangaSelected = async (mangaData) => {
    console.log('AddManga - Received Data:', mangaData);

    // Start fetching characters
    handleAddingAniListCharacters(mangaData.anilistId);

    // Process relations if they exist
    let animeRelations = [];
    let mangaRelations = [];
    let skippedRelations = {
      anime: [],
      manga: []
    };

    // First check if we have relations data
    if (mangaData.animeRelations || mangaData.mangaRelations) {
      console.log("Found relations in mangaData:", mangaData);

      // Process anime relations
      if (mangaData.animeRelations?.length > 0) {
        console.log("Processing anime relations:", mangaData.animeRelations);
        
        for (const relation of mangaData.animeRelations) {
          try {
            console.log("Checking anime relation:", relation);
            const existingAnimeResponse = await axiosInstance.post('/animes/check-by-database', { anilistId: relation.anilistId });
            
            if (existingAnimeResponse.data === true) {
              console.log("Found existing anime in database.");
              const response = await axiosInstance.get(`/animes/find-anime/${relation.anilistId}`);
              animeRelations.push({
                ...response.data,
                typeofRelation: RELATION_MAP[relation.typeofRelation]
              });
            } else {
              console.log("Anime not found in database:", relation);
              skippedRelations.anime.push(relation);
            }
          } catch (error) {
            console.error("Error checking anime relation:", error);
            skippedRelations.anime.push({
              ...relation,
              error: error.message
            });
          }
        }
      }

      // Process manga relations
      if (mangaData.mangaRelations?.length > 0) {
        console.log("Processing manga relations:", mangaData.mangaRelations);
        
        for (const relation of mangaData.mangaRelations) {
          try {
            console.log("Checking manga relation:", relation);
            const existingMangaResponse = await axiosInstance.post('/mangas/check-by-database', { anilistId: relation.anilistId });
            
            if (existingMangaResponse.data === true) {
              console.log("Found existing manga in database.");
              const response = await axiosInstance.get(`/mangas/find-manga/${relation.anilistId}`);
              mangaRelations.push({
                ...response.data,
                typeofRelation: RELATION_MAP[relation.typeofRelation]
              });
            } else {
              console.log("Manga not found in database:", relation);
              skippedRelations.manga.push(relation);
            }
          } catch (error) {
            console.error("Error checking manga relation:", error);
            skippedRelations.manga.push({
              ...relation,
              error: error.message
            });
          }
        }
      }
      
    } else {
      console.log("No relations found in mangaData:", mangaData);
    }

    // Log skipped relations for debugging
    if (skippedRelations.anime.length > 0 || skippedRelations.manga.length > 0) {
      console.log('Skipped Relations:', skippedRelations);
    }

    const updatedFormData = {
      ...formData,
      anilistId: mangaData.anilistId || '',
      titles: {
        romaji: mangaData.titles?.romaji || '',
        english: mangaData.titles?.english || '',
        native: mangaData.titles?.native || '',
      },
      releaseData: {
        releaseStatus: mangaData.releaseData?.releaseStatus || '',
        startDate: {
          year: mangaData.releaseData?.startDate?.year || '',
          month: mangaData.releaseData?.startDate?.month || '',
          day: mangaData.releaseData?.startDate?.day || '',
        },
        endDate: {
          year: mangaData.releaseData?.endDate?.year || '',
          month: mangaData.releaseData?.endDate?.month || '',
          day: mangaData.releaseData?.endDate?.day || '',
        },
      },
      typings: {
        Format: mangaData.typings?.Format || '',
        Source: mangaData.typings?.Source || '',
        CountryOfOrigin: mangaData.typings?.CountryOfOrigin || '',
      },
      lengths: {
        chapters: mangaData.lengths?.Chapters || '',
        volumes: mangaData.lengths?.Volumes || '',
      },
      genres: mangaData.genres || [],
      description: mangaData.description || '',
      images: {
        image: mangaData.images?.image || '',
        border: mangaData.images?.border || DEFAULT_BORDER,
      },
      characters: mangaData.characters || [],
      animeRelations: animeRelations,
      mangaRelations: mangaRelations,
      activityTimestamp: mangaData.activityTimestamp || '',
    };

    setSelectedGenres(mangaData.genres);

    console.log('AddManga - Updated Form Data:', updatedFormData);
    setFormData(updatedFormData);
    setActiveModal(null);
  };

  // #region Form Submission -----------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = {};

    setFormErrors(errors);

    if (Object.keys(formErrors).length > 0) {
      alert(formErrors.data.message);
      return;
    }

    // Create arrays of character and relation objects
    const charactersArray = formData.characters.map((character) => ({
      characterId: character._id,
      role: character.role,
      mangaName: formData.titles
    }));

    const animeRelationsArray = formData.animeRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    const mangaRelationsArray = formData.mangaRelations.map((relation) => ({
      relationId: relation._id,
      typeofRelation: relation.typeofRelation,
    }));

    // Create a new object with character and relation arrays
    const updatedFormData = {
      ...formData,
      anilistId: formData.anilistId,
      characters: charactersArray,
      animeRelations: animeRelationsArray,
      mangaRelations: mangaRelationsArray,
    };

    console.log('Current formData:', updatedFormData);

    try {

      // Use axios.post to send the form data to your backend API endpoint
      const res = await axiosInstance.post(
        `/mangas/addmanga`,
        updatedFormData
      );

      console.log('Response from backend:', res.data);

      if (res.status === 201) {
        // Redirect or perform additional actions on success
        console.log('Manga and characters updated successfully!', res.data);

        const mangaCreatedEvent = new CustomEvent('mangaCreated', {
          detail: res.data
        });
        window.dispatchEvent(mangaCreatedEvent);

        // Clear the form after successful submission
        setFormData(INITIAL_FORM_STATE);
        setSelectedGenres([]);

        // Redirect the user to the new manga page
        setTimeout(() => {
          navigate(`/manga/${res.data._id}`);
        }, 100);
      } else {
        // Handle errors from the backend
        console.error('Failed to update manga:', res.data);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during manga update:', error.message);
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
            <Loader text={`Adding characters... ${remainingCharacters} left to add`} />
          </div>
        )}

        <div className={addPageStyles.characterStatus}>
          <p>Total Characters: {characterStatus.total}</p>
          <p>Existing Characters: {characterStatus.existing}</p>
          <p>Created Characters: {characterStatus.created}</p>
          <p>Failed: {characterStatus.failed}</p>
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
                <p className={addPageStyles.selectedCharacterName}>
                  {character.names &&
                    `${character.names.givenName || ''} ${character.names.middleName || ''} ${character.names.surName || ''}`}
                </p>
                <select
                  id={`characterRole-${index}`} // Add a unique ID
                  name={`characterRole[${index}]`} // Add a name attribute
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
                  {relation.titles.english || relation.titles.romaji}
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
                  {relation.titles.english || relation.titles.romaji}
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

        <button
          type="button"
          className={addPageStyles.anilistButton}
          onClick={() => setActiveModal('mangaSearch')}
        >
          Search on AniList
        </button>
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
      {activeModal === 'mangaSearch' && (
        <MangaSearch
          onMangaSelected={handleMangaSelected}
          onClose={() => setActiveModal(null)}
        />
      )}
    </div>
  );
  // #endregion ------------------------------------------------------------
}
