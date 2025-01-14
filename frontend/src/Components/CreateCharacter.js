// src/components/CreateCharacter.js

import React, { useState } from 'react';
import axios from 'axios';
import createCharacterStyles from './CreateCharacter.module.css';
import { AnilistCharacterSearch } from './Searches/AnilistCharacterSearch';

export default function CreateCharacter({ onCharacterCreated, onClose }) {
  const genders = ['Female', 'Male', 'Non-binary'];
  const [altNames, setAltNames] = useState(['']);
  const [altSpoilerNames, setAltSpoilerNames] = useState(['']);
  const [characterData, setCharacterData] = useState({
    anilistId: '',
    names: {
      givenName: '',
      middleName: '',
      surName: '',
      nativeName: '',
      alterNames: [],
      alterSpoiler: [],
    },
    about: '',
    gender: '',
    age: '',
    DOB: {
      year: '',
      month: '',
      day: '',
    },
    characterImage: '',
    animes: [],
    mangas: [],
  });

  const [showCharacterSearch, setShowCharacterSearch] = useState(false);

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Check if the changed field is part of the nested structure
    if (name.startsWith('names.') || name.startsWith('DOB.')) {
      const [mainField, subField] = name.split('.');

      setCharacterData((prev) => ({
        ...prev,
        [mainField]: {
          ...prev[mainField],
          [subField]: type === 'number' ? parseInt(value, 10) : value,
        },
      }));
    } else {
      setCharacterData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) : value,
      }));
    }
  };

  const handleCharacterSelected = (selectedCharacters) => {
    console.log('Selected Characters:', selectedCharacters);

    const updatedFormData = {
      anilistId: selectedCharacters.anilistId || '',
      names: {
        givenName: selectedCharacters.names?.givenName || '',
        middleName: selectedCharacters.names?.middleName || '',
        surName: selectedCharacters.names?.surName || '',
        nativeName: selectedCharacters.names?.nativeName || '',
        alterNames: selectedCharacters.names?.alterNames || [],
        alterSpoiler: selectedCharacters.names?.alterSpoiler || [],
      },
      about: selectedCharacters.about || '',
      gender: selectedCharacters.gender || '',
      age: selectedCharacters.age || '',
      DOB: {
        year: selectedCharacters.DOB?.year || '',
        month: selectedCharacters.DOB?.month || '',
        day: selectedCharacters.DOB?.day || '',
      },
      characterImage: selectedCharacters.characterImage || ''
    };

    setCharacterData(updatedFormData);
    // Ensure at least one input box, either with selected names or an empty one
    const initialAltNames = updatedFormData.names.alterNames.length > 0
      ? [...updatedFormData.names.alterNames, '']
      : [''];
    setAltNames(initialAltNames);

    const initialAltSpoilerNames = updatedFormData.names.alterSpoiler.length > 0
      ? [...updatedFormData.names.alterSpoiler, '']
      : [''];
    setAltSpoilerNames(initialAltSpoilerNames);
    console.log('createCharacter - Updated Form Data:', updatedFormData);

  };

  const handleAltNameChange = (value, index) => {
    const newAltNames = [...altNames];
    newAltNames[index] = value;

    // Automatically add a new empty input if the last one is filled
    if (index === newAltNames.length - 1 && value.trim() !== '') {
      newAltNames.push('');
    }

    // Remove empty inputs except the last one
    const filteredAltNames = newAltNames.filter((name, i) =>
      name.trim() !== '' || i === newAltNames.length - 1
    );

    setAltNames(filteredAltNames);

    // Update the characterData state to reflect alternative names
    setCharacterData(prev => ({
      ...prev,
      names: {
        ...prev.names,
        alterNames: filteredAltNames.filter(name => name.trim() !== '')
      }
    }));
  };

  const handleAltSpoilerNameChange = (value, index) => {
    const newAltSpoilerNames = [...altSpoilerNames];
    newAltSpoilerNames[index] = value;

    // Automatically add a new empty input if the last one is filled
    if (index === newAltSpoilerNames.length - 1 && value.trim() !== '') {
      newAltSpoilerNames.push('');
    }

    // Remove empty inputs except the last one
    const filteredAltSpoilerNames = newAltSpoilerNames.filter((name, i) =>
      name.trim() !== '' || i === newAltSpoilerNames.length - 1
    );

    setAltSpoilerNames(filteredAltSpoilerNames);

    // Update the characterData state to reflect alternative names
    setCharacterData(prev => ({
      ...prev,
      names: {
        ...prev.names,
        alterSpoiler: filteredAltSpoilerNames.filter(name => name.trim() !== '')
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log('createCharacter - Character Data:', characterData);


    try {
      // Make API call to create character
      const res = await axios.post(
        'http://localhost:8080/characters/addcharacter',
        characterData
      );

      if (res.status === 201) {
        // Call the callback function passed from the parent component
        onCharacterCreated(res.data);
        // Clear the form after successful submission
        setCharacterData({
          anilistId: '',
          names: {
            givenName: '',
            middleName: '',
            surName: '',
            nativeName: '',
            alterNames: [],
            alterSpoiler: [],
          },
          about: '',
          gender: '',
          age: '',
          DOB: {
            year: '',
            month: '',
            day: '',
          },
          characterImage: '',
          animes: [],
          mangas: [],
        });
        onClose();
      } else {
        // Handle errors from the backend
        console.error('Failed to create character:', res.data);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during character creation:', error.message);
    }
  };

  return (
    <div className={createCharacterStyles.modalOverlay}>
      <div className={createCharacterStyles.createCharacterContainer}>
        <button
          className={createCharacterStyles.closeButton}
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <form
          className={createCharacterStyles.formContainer}
          onSubmit={handleSubmit}
        >
          <div className={createCharacterStyles.section}>
            <h3>Names</h3>
            <div className={createCharacterStyles.grid}>
              <div className={createCharacterStyles.gridItem}>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="names.givenName"
                  name="names.givenName"
                  placeholder={`Given Name...`}
                  value={characterData.names.givenName}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="names.middleName"
                  name="names.middleName"
                  placeholder={`Middle Name...`}
                  value={characterData.names.middleName}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="names.surName"
                  name="names.surName"
                  placeholder={`Sur Name...`}
                  value={characterData.names.surName}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="names.nativeName"
                  name="names.nativeName"
                  placeholder={`Native Name...`}
                  value={characterData.names.nativeName}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <div className={createCharacterStyles.gridItem}>
                  {altNames.map((altName, index) => (
                    <div key={index}>
                    <input
                      className={createCharacterStyles.input}
                      key={index}
                      type="text"
                      id={`names.alterNames-${index}`}
                      name={`names.alterNames[${index}]`}
                      value={altName}
                      onChange={(e) => handleAltNameChange(e.target.value, index)}
                      placeholder={`Alternative Name...`}
                    />
                    </div>
                  ))}
                </div>
              </div>
              <div className={createCharacterStyles.gridItem}>
                <div className={createCharacterStyles.gridItem}>
                  {altSpoilerNames.map((altSpoilerName, index) => (
                    <div key={index}>
                      <input
                        className={createCharacterStyles.input}
                        type="text"
                        id={`alterSpoilerName-${index}`}
                        name={`names.alterSpoiler[${index}]`}
                        value={altSpoilerName}
                        onChange={(e) => handleAltSpoilerNameChange(e.target.value, index)}
                        placeholder={`Alternative Spoiler Name...`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className={createCharacterStyles.section}>
            <h3>About</h3>
            <div className={createCharacterStyles.gridItem}>
              <label className={createCharacterStyles.label} htmlFor="about">
                About:
              </label>
              <textarea
                className={createCharacterStyles.textarea}
                id="about"
                name="about"
                value={characterData.about}
                onChange={handleChange}
                rows={4}
                cols={80}
              />
            </div>
          </div>

          <div className={createCharacterStyles.section}>
            <h3>Gender and Age</h3>
            <div className={createCharacterStyles.grid}>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="gender"
                >
                  Gender:
                </label>
                <select
                  className={createCharacterStyles.select}
                  type="gender"
                  id="gender"
                  name="gender"
                  value={characterData.gender}
                  onChange={handleChange}
                >
                  <option value="" disabled>
                    Select Gender
                  </option>
                  {genders.map((gender) => (
                    <option key={gender} value={gender}>
                      {gender}
                    </option>
                  ))}
                </select>
              </div>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="age"
                >
                  Age:
                </label>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="age"
                  name="age"
                  value={characterData.age}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className={createCharacterStyles.section}>
            <h3>Date of Birth</h3>
            <div className={createCharacterStyles.grid}>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="DOB.year"
                >
                  Year:
                </label>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="DOB.year"
                  name="DOB.year"
                  value={characterData.DOB.year}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="DOB.month"
                >
                  Month:
                </label>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="DOB.month"
                  name="DOB.month"
                  value={characterData.DOB.month}
                  onChange={handleChange}
                />
              </div>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="DOB.day"
                >
                  Day:
                </label>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="DOB.day"
                  name="DOB.day"
                  value={characterData.DOB.day}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className={createCharacterStyles.section}>
            <h3>Image</h3>
            <div className={createCharacterStyles.grid}>
              <div className={createCharacterStyles.gridItem}>
                <label
                  className={createCharacterStyles.label}
                  htmlFor="characterImage"
                >
                  Character Image URL:
                </label>
                <input
                  className={createCharacterStyles.input}
                  type="text"
                  id="characterImage"
                  name="characterImage"
                  value={characterData.characterImage}
                  onChange={handleChange}
                />
                {characterData.characterImage && (
                  <div className={createCharacterStyles.imagePreview}>
                    <img
                      src={characterData.characterImage}
                      alt="Character Preview"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={createCharacterStyles.buttonContainer}>
            <button className={createCharacterStyles.button} type="button" onClick={() => setShowCharacterSearch(true)}>
              Search Anilist Characters
            </button>
            <button
              className={createCharacterStyles.button}
              type="submit"
            >
              Create Character
            </button>
          </div>
        </form>
          {showCharacterSearch && (
            <AnilistCharacterSearch
              onCharacterSelected={handleCharacterSelected}
              onClose={() => setShowCharacterSearch(false)}
            />
          )}
      </div>
    </div>
  );
}
