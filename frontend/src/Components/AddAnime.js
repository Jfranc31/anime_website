// src/components/AddAnime.js

import React, { useState } from "react";
import axios from 'axios';

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
    characters: {
        name: "",
        typeofCharacter: "",
        about: "",
        gender: "",
        age: 0,
        DOB: {
          year: 0,
          month: 0,
          day: 0
        },
        characterImage: ""
      },
    relations: {
      typeofRelation: ""
    },
    currentEpisode: 0,
    status: "Planning",
    activityTimestamp: 0,
    notes: ""
  });

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const [activeTab, setActiveTab] = useState("general");
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [selectedGenres, setSelectedGenres] = useState([]);
  
  const availableGenres = ["Action", "Adventure", "Comedy", "Drama", "Ecchi", "Fantasy", "Horror", "Hentai", "Mahou Shoujo", "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"];
  const availableFormats = ['TV', "TV Short", "Movie", "Special", "OVA", "ONA", "Music"];
  const availableSource = ["Original", "Manga", "Anime", "Light Novel", "Web Novel", "Novel", "Doujinshi", "Video Game", "Visula Novel", "Comic", "Game", "Live Action"];
  const availableCountry = ["China", "Japan", "South Korea", "Taiwan"];

  const handleChange = (e) => {
    const { name, value, type } = e.target;
  
    // Check if the changed field is part of the nested structure
    if (name.startsWith("titles.") || name.startsWith("typings.") || name.startsWith("lengths.") || name.startsWith("images.") || name.startsWith("characters.") || name.startsWith("relations.") || name.startsWith("DOB.")) {
      const [mainField, subField] = name.split(".");
  
      setFormData((prev) => ({
        ...prev,
        [mainField]: Array.isArray(prev[mainField])
          ? prev[mainField].map((item, index) => (index.toString() === subField ? { ...item, [subField]: type === 'select-multiple' ? [...item[subField], value] : value } : item))
          : { ...prev[mainField], [subField]: type === 'select-multiple' ? [value] : value },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'select-multiple' ? [value] : value,
      }));
    }
  };
  

  const handleStatusChange = (status) => {
    setFormData((prevData) => ({
      ...prevData,
      status,
    }));
  };

  const handleGenreChange = (selectedGenre) => {
    setSelectedGenres((prevGenres) => {
      if (!prevGenres.includes(selectedGenre)) {
        return [...prevGenres, selectedGenre];
      }
      return prevGenres;
    });

    // Set the selected genres directly in the formData
    setFormData((prevData) => ({
      ...prevData,
      genres: [...prevData.genres, selectedGenre],
    }));
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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic form validation
    const errors = {};
    if (!formData.titles.english.trim()) {
      errors.title = "Title is required";
    }
    if (formData.genres.length === 0) {
      errors.genres = "At least one genre is required";
    }

    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      alert(errors.data.message);
      return;
    }

    try {
      setIsLoading(true);
      console.log('Current formData:', formData);

      const res = await axios.post('http://localhost:8080/addanime', formData);

      if (res.status === 201) {
        // Redirect or perform additional actions on success
        console.log('Anime added successfully!');
        // Clear the form after successful submission
        setFormData({
          titles: {
            romaji: "",
            english: "",
            Native: ""
          },
          typings: [
            {
              Format: "",
              Source: "",
              CountryOfOrigin: ""
            }
          ],
          lengths: [
            {
              Episodes: 0,
              EpisodeDuration: 0
            }
          ],
          genres: [],
          description: "",
          images: [
            {
              image: "",
              border: ""
            }
          ],
          characters: [
            {
              name: "",
              typeofCharacter: "",
              about: "",
              gender: "",
              age: 0,
              DOB: {
                year: 0,
                month: 0,
                day: 0
              },
              characterImage: ""
            }
          ],
          relations: {
            typeofRelation: ""
          },
          currentEpisode: 0,
          status: "Planning",
          activityTimestamp: 0,
          notes: ""
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

  console.log("FormData: ", formData);
  
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
              required
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
              required
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
              required
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
              type="typingd.Source"
              id="typings.Source"
              name="typings.Source"
              value={formData.typings.Source}
              onChange={handleChange}
              required
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
              onChange={handleChange}
              required
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
              required
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
              required
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
              required
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

  return (
    <div className="add-anime-container">
      <div className="add-anime-container-tabs">
        <button className="add-anime-btn" type="submit">
          Submit
        </button>
        <button onClick={() => handleTabChange("general")}>General</button>
        <button onClick={() => handleTabChange("images")}>Images</button>
        {/* Add more buttons for additional tabs */}
      </div>

      <form className="form-container" onSubmit={handleSubmit}>
        {activeTab === "general" && renderGeneralSection()}
        {activeTab === "images" && renderImagesSection()}
      </form>
    </div>
  );
}
