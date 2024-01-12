// Navbar.js
import React from 'react';

const Navbar = () => {
    return (
      <div className="top">
        <div className="logo">React Anime App</div>
        <div className="Navbar" id="Navbar">
          <a href="/">Home</a>
          <a href="/addanime">Add Anime</a>
          <a href="/addmanga">Add Manga</a>
          <a href="/characters">Characters</a>
          <a href="/animes">Animes</a>
          <a href="/mangas">Mangas</a>
          <a href="/profile">Profile</a>
        </div>
  
        <div className="mobileview">
          <input type="checkbox" id="change" />
        </div>
      </div>
    );
  };
  
  
  export default Navbar;