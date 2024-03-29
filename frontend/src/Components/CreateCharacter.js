// src/components/CreateCharacter.js

import React, { useState } from "react";
import axios from 'axios';

export default function CreateCharacter({ onCharacterCreated, onClose }) {
  const genders = ["Female", "Male", "Non-binary"];
  const [characterData, setCharacterData] = useState({
    names: {
      givenName: "",
      middleName: "",
      surName: "",
      alterNames: ""
    },
    about: "",
    gender: "",
    age: "",
    DOB: {
      year: "",
      month: "",
      day: ""
    },
    characterImage: "",
    animes: [],
    mangas: []
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;

    // Check if the changed field is part of the nested structure
    if (name.startsWith("names.") || name.startsWith("DOB.")) {
      const [mainField, subField] = name.split(".");

      setCharacterData((prev) => ({
        ...prev,
        [mainField]: {
          ...prev[mainField],
          [subField]: type === 'number' ? parseInt(value, 10) : value
        }
      }));
    } else {
      setCharacterData((prev) => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value, 10) : value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Make API call to create character
      const res = await axios.post('http://localhost:8080/characters/addcharacter', characterData);

      if (res.status === 201) {
        // Call the callback function passed from the parent component
        onCharacterCreated(res.data);
        // Clear the form after successful submission
        setCharacterData({
          names: {
            givenName: "",
            middleName: "",
            surName: "",
            alterNames: ""
          },
          about: "",
          gender: "",
          age: "",
          DOB: {
            year: "",
            month: "",
            day: ""
          },
          characterImage: "",
          animes: [],
          mangas: []
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
    <div className="create-character-container">
      <form className="form-container" onSubmit={handleSubmit}>
        <div className="section">
          <h3>Names</h3>
          <div className="grid">
            <div>
              <label htmlFor="names.givenName">Given Name:</label>
              <input
                type="text"
                id="names.givenName"
                name="names.givenName"
                value={characterData.names.givenName}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label htmlFor="names.middleName">Middle Name:</label>
              <input
                type="text"
                id="names.middleName"
                name="names.middleName"
                value={characterData.names.middleName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="names.surName">Sur Name:</label>
              <input
                type="text"
                id="names.surName"
                name="names.surName"
                value={characterData.names.surName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="names.alterNames">Alternative Name:</label>
              <input
                type="text"
                id="names.alterNames"
                name="names.alterNames"
                value={characterData.names.alterNames}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="section">
          <h3>About</h3>
            <div>
              <label htmlFor="about">About:</label>
              <textarea
                id="about"
                name="about"
                value={characterData.about}
                onChange={handleChange}
                rows={4}
                cols={80}
              />
            </div>
        </div>

        <div className="section">
          <h3>Gender and Age</h3>
          <div className="grid">
            <div>
              <label htmlFor="gender">Gender:</label>
              <select
                type="gender"
                id="gender"
                name="gender"
                value={characterData.gender}
                onChange={handleChange}
              >
                <option value="" disabled>Select Gender</option>
                {genders.map((gender) => (
                  <option key={gender} value={gender}>
                    {gender}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="age">Age:</label>
              <input
                type="text"
                id="age"
                name="age"
                value={characterData.age}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Date of Birth</h3>
          <div className="grid">
            <div>
              <label htmlFor="DOB.year">Year:</label>
              <input
                type="text"
                id="DOB.year"
                name="DOB.year"
                value={characterData.DOB.year}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="DOB.month">Month:</label>
              <input
                type="text"
                id="DOB.month"
                name="DOB.month"
                value={characterData.DOB.month}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="DOB.day">Day:</label>
              <input
                type="text"
                id="DOB.day"
                name="DOB.day"
                value={characterData.DOB.day}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <div className="section">
          <h3>Image</h3>
          <div className="grid">
            <div>
              <label htmlFor="characterImage">Character Image URL:</label>
              <input
                type="text"
                id="characterImage"
                name="characterImage"
                value={characterData.characterImage}
                onChange={handleChange}
              />
              {characterData.characterImage && (
                <div className="image-preview">
                  <img src={characterData.characterImage} alt="Character Preview" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="button-container">
          <button type="submit">Create Character</button>
        </div>
      </form>
    </div>
  );
}

