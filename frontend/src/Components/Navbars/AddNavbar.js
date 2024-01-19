// /src/Components/Navbars/AddNavbar.js
import React from 'react';
import { NavLink } from 'react-router-dom';

const AddNavbar = () => {
  return (
    <div className="add-navbar">
        <div className='AddNavbar' id='AddNavbar'>
            <NavLink to="/add/anime" activeClassName='active'>Add Anime</NavLink>
            <NavLink to="/add/manga" activeClassName='active'>Add Manga</NavLink>
        </div>
    </div>
  );
};

export default AddNavbar;