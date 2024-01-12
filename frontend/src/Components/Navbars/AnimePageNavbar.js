// /Components/Navbars/AnimeNavbar.js

import React from 'react';

const AnimeNavbar = ({ showRelations, showCharacters }) => {
  const handleRelationsClick = () => {
    console.log("Relations button clicked");
    showRelations();
  };

  const handleCharactersClick = () => {
    console.log("Characters button clicked");
    showCharacters();
  };

  return (
    <div className="anime-navbar">
      <button onClick={handleRelationsClick} className="nav-link" id="relations-link" type="button">
        Relations
      </button>
      <button onClick={handleCharactersClick} className="nav-link" id="characters-link" type="button">
        Characters
      </button>
    </div>
  );
};

export default AnimeNavbar;