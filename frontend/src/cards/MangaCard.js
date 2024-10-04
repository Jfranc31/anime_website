/**
 * src/cards/MangaCard.js
 * Description: React component for rendering a manga card.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Functional component representing a manga card.
 * @param {Object} props - Props passed to the component.
 * @param {Object} props.manga - Manga object containing details name etc.
 * @param {Function} props.onTopRightButtonClick - top-right button click func.
 * @returns {JSX.Element} - Rendered manga card component.
 */
function MangaCard({ manga, onTopRightButtonClick }) {
    // State to track hover state
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`anime-card ${isHovered ? 'hovered' : ''}`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className='img-container'>
                {/* Manga image */}
                <img src={manga.images.image} alt={manga.titles.english} />
                <div className='title-and-progress'>
                    {/* Link to manga details page */}
                    <Link to={`/manga/${manga._id}`}>
                        {/* Manga title */}
                        <div className='anime-title'>{manga.titles.english}</div>
                    </Link>
                </div>
            </div>
            {/* Conditional rendering when hovered */}
            {isHovered && (
                <button 
                    className='top-right-button' 
                    onClick={() => onTopRightButtonClick(manga)}
                >
                    Edit
                </button>
            )}
        </div>
    );
}

// Exporting the MangaCard component as the default export
export default MangaCard;
