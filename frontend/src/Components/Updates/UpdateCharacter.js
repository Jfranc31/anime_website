// src/components/Update/UpdateCharacter.js

import React, { useState, useEffect } from 'react';
import axiosInstance from '../../utils/axiosConfig';
import { useParams, useNavigate } from 'react-router-dom';
import createCharacterStyles from '../CreateCharacter.module.css';

// Define the UpdateCharacter component
export const UpdateCharacter = ({ match }) => {
  // Use useParams to get the characterId from the URL
  const { id } = useParams();
  const navigate = useNavigate();
  // Initialize state for character data
  const genders = ['Female', 'Male', 'Non-binary'];
  const [altNames, setAltNames] = useState(['']);
  const [altSpoilerNames, setAltSpoilerNames] = useState(['']);
  const [characterData, setCharacterData] = useState({
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
  });

  // Use useEffect to fetch character details when the component mounts
  useEffect(() => {
    const fetchCharacterDetails = async () => {
      try {
        const response = await axiosInstance.get(
          `/characters/character/${id}`
        );
        setCharacterData(response.data);
        setAltNames(response.data.names.alterNames.length > 0
          ? [...response.data.names.alterNames, '']
          : ['']);
        setAltSpoilerNames(response.data.names.alterSpoiler.length > 0
          ? [...response.data.names.alterSpoiler, '']
          : ['']
        );
      } catch (error) {
        console.error('Error fetching character details:', error);
      }
    };

    fetchCharacterDetails();
  }, [id]);

  // Define the handleChange function to update state based on user input
  const handleChange = (e) => {
    const { name, value, type } = e.target;

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

    try {
      console.log('Submitting form...', characterData);

      // Make the API call to update character details
      const res = await axiosInstance.put(
        `/characters/character/${id}`,
        characterData
      );

      console.log('Response from server:', res.data);

      if (res.status === 200) {
        console.log('Character updated successfully');
        // Call the callback function passed from the parent component

        navigate(`/characters/${id}`);
      } else {
        // Handle errors from the backend
        console.error('Failed to update character:', res.data);
      }
    } catch (error) {
      // Handle network or other errors
      console.error('Error during character update:', error.message);
    }
  };

  return (
    <div className={createCharacterStyles.updateCharacterPage}>
      <div className={createCharacterStyles.createCharacterContainer}>
        <form className={createCharacterStyles.formContainer} onSubmit={handleSubmit}>
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
            <button
              className={createCharacterStyles.button}
              type="submit"
              >
                Update Character
              </button>
          </div>
        </form>
      </div>
    </div>
  );
};
